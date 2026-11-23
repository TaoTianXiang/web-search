性能优化如果不知道"当前的瓶颈在哪一段"，都是在盲猜。这一章讲清楚三个核心指标各自测什么、为什么慢、怎么定位。

## 三个核心指标

| 指标 | 含义 | 良好 | 差 |
| --- | --- | --- | --- |
| **LCP** | 最大内容元素的渲染时间 | ≤ 2.5s | > 4s |
| **INP** | 交互到下一帧绘制的延迟 | ≤ 200ms | > 500ms |
| **CLS** | 意外布局偏移累积 | ≤ 0.1 | > 0.25 |

::: warn INP 已取代 FID
FID 只测"首次交互的输入延迟"，INP 测**整个页面生命周期内**所有交互的响应性，更能反映真实体验。2024 年起 FID 已从核心指标中移除。
:::

## LCP：拆成四段才可优化

LCP 报告的是"最大元素完成渲染的时间点"。它的构成可以精确拆解：

```
TTFB  +  资源加载延迟  +  资源加载时长  +  元素渲染延迟
```

| 段 | 含义 | 典型问题 |
| --- | --- | --- |
| TTFB | 首字节时间 | 服务端慢、无 CDN、重定向链 |
| 资源加载延迟 | 发现资源到开始下载 | 图片在 JS 里动态插入、无预加载 |
| 资源加载时长 | 下载耗时 | 图片过大、未用现代格式 |
| 元素渲染延迟 | 下载完成到绘制 | 主线程被长任务占用 |

### 定位方法

```js
import { onLCP } from 'web-vitals'

onLCP((metric) => {
  console.log(metric.value)
  console.log(metric.attribution) // 包含 element、url、timeToFirstByte 等
})
```

Chrome DevTools → Performance 面板，LCP 标记上会显示具体是哪个元素、四段各占多少。

### 优化手段与对应段

| 手段 | 影响段 |
| --- | --- |
| CDN、边缘渲染、服务端缓存 | TTFB |
| 在 HTML 中直接写 `<img src>` | 资源加载延迟 |
| `<link rel="preload" as="image">` | 资源加载延迟 |
| `fetchpriority="high"` | 资源加载延迟 |
| WebP / AVIF、`srcset` | 资源加载时长 |
| 减少阻塞脚本、拆分长任务 | 元素渲染延迟 |
| SSR / 流式渲染 | TTFB + 渲染延迟 |

```html
<!-- 首屏主图的标准写法 -->
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high" type="image/avif">

<img src="/hero.avif" width="1200" height="600" fetchpriority="high" alt="...">
```

::: warn 不要给首屏主图加 lazy
`loading="lazy"` 会推迟图片下载，直接恶化 LCP。lazy 只用于首屏外的图片。
:::

## INP：主线程繁忙程度

INP 取的是页面生命周期内（去掉最高 1% 异常值后）最差的交互延迟。

一次交互的耗时拆解：

```
输入延迟（等待主线程空闲） + 处理时长（事件回调） + 呈现延迟（渲染下一帧）
```

大部分时间浪费在**等待主线程空闲**，也就是被长任务占着。

### 长任务（> 50ms）

```js
// 监测长任务
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('Long task:', entry.duration, entry.attribution)
    }
  }
}).observe({ entryTypes: ['longtask'] })
```

### 优化手段

| 手段 | 适用 |
| --- | --- |
| 拆分长任务（`scheduler.yield`） | 计算密集流程 |
| Web Worker | 纯数据计算 |
| 虚拟列表 | 大列表渲染 |
| `useDeferredValue` / `startTransition` | React 派生渲染 |
| 减少同步布局 | 避免 layout thrashing |
| 事件委托 + 节流 | 高频事件 |
| 乐观更新 | 网络等待 |
| CSS 动画替代 JS 动画 | 动画场景 |

```js
// 分片处理，每片结束后让出主线程
async function processInChunks(items, fn, size = 100) {
  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size)
    slice.forEach(fn)
    await scheduler.yield?.() ?? new Promise((r) => setTimeout(r, 0))
  }
}
```

### 一个真实的 INP 案例

> 搜索框输入卡顿 400ms
>
> 1. Performance 面板显示：每次输入触发一次 350ms 的同步渲染
> 2. 原因：输入即过滤 2 万条数据并重建整个列表
> 3. 修复：
>    - 输入与过滤解耦（`useDeferredValue`）
>    - 虚拟列表只渲染可见 20 条
>    - 预建索引，避免每次线性扫描
> 4. 结果：INP 从 380ms → 45ms

## CLS：布局稳定性

CLS 计算的是"每次意外偏移的 影响分数 × 距离分数"，按会话窗口累加。

### 三个主要成因

```html
<!-- 1. 图片无尺寸 -->
<img src="photo.jpg">                     <!-- ❌ -->
<img src="photo.jpg" width="800" height="600"> <!-- ✅ -->
<img src="photo.jpg" style="aspect-ratio: 4/3"> <!-- ✅ -->

<!-- 2. 广告/嵌入内容未预留空间 -->
<div class="ad-slot" style="min-height: 250px"></div>

<!-- 3. 动态插入的内容在可视区上方 -->
<div v-if="alert" class="alert">...</div> <!-- 会把下方内容顶下去 -->
```

### 字体的 CLS

```css
@font-face {
  font-family: 'Inter';
  src: url('/inter.woff2');
  font-display: swap;
  size-adjust: 96%;        /* 让回退字体的度量接近 */
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

或者用 `font-display: optional`，弱网直接不加载自定义字体（无偏移，但可能看到回退字体）。

### 定位方法

```js
import { onCLS } from 'web-vitals'
onCLS((m) => console.log(m.attribution)) // 包含最大的偏移来源
```

DevTools → Performance → 勾选 "Layout Shift"，能看到每次偏移的元素与影响分数。

## 资源优先级

浏览器有自己的优先级算法，但我们能覆盖：

| 指令 | 效果 |
| --- | --- |
| `fetchpriority="high"` | 提升到高优先级 |
| `fetchpriority="low"` | 降到低优先级 |
| `<link rel="preload">` | 提前发现并下载 |
| `loading="lazy"` | 视口外才加载 |

```html
<!-- 首屏关键资源 -->
<link rel="preload" as="style" href="/critical.css">
<link rel="preload" as="font" type="font/woff2" href="/inter.woff2" crossorigin>
<link rel="modulepreload" href="/src/main.ts">

<!-- 下一跳预热 -->
<link rel="preconnect" href="https://api.example.com" crossorigin>
<link rel="dns-prefetch" href="https://cdn.example.com">
<link rel="prefetch" href="/next-route.js">
```

::: tip preconnect vs preload
- `preconnect`：只建立连接（DNS + TCP + TLS），不下载内容
- `preload`：下载内容并放入缓存，必须声明 `as`，否则可能重复下载

两者常配合使用：`preconnect` 第三方域名 + `preload` 自己的关键资源。
:::

## 度量体系

### 实验室数据 vs 现场数据

| 类型 | 工具 | 用途 |
| --- | --- | --- |
| 实验室 | Lighthouse、Performance 面板 | 开发期诊断、CI 回归 |
| 现场 | web-vitals + RUM | 真实用户体验、按版本/设备分群 |

### 上报设计

```js
import { onLCP, onINP, onCLS, onTTFB, onFCP } from 'web-vitals'

const queue = []
const flush = () => {
  if (!queue.length) return
  navigator.sendBeacon('/rum', JSON.stringify(queue.splice(0)))
}

;[onLCP, onINP, onCLS, onTTFB, onFCP].forEach((fn) =>
  fn((metric) => {
    queue.push({
      name: metric.name,
      value: Math.round(metric.value),
      id: metric.id,
      route: location.pathname,
      conn: navigator.connection?.effectiveType,
      dpr: window.devicePixelRatio,
      version: __APP_VERSION__
    })
    flush()
  })
)
```

### 分位数而非均值

```
p50 = 1.2s   → 一半用户还行
p75 = 2.9s   → 核心指标评估用这个
p95 = 6.1s   → 长尾用户
mean = 1.9s  → 被长尾拉高，无参考价值
```

## 性能预算

```js
// 在 CI 中做回归检测
const budgets = {
  'main.js': 180 * 1024,
  'vendor.js': 350 * 1024,
  'total.css': 60 * 1024,
  lcp: 2500,
  cls: 0.1
}
```

超过预算时 CI 失败。这是防止性能"每次发版退一点"的唯一可靠手段。

::: interview 面试视角
被问"如何优化首屏"，正确开场不是"压缩图片"，而是**"先拆 LCP 的四段，看瓶颈在哪"**。用数据定位、用手段验证、用预算守住的闭环，才是高级工程师的答法。
:::