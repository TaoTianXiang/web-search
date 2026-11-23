性能问题的答案几乎都藏在浏览器的渲染流水线里。理解每个阶段做什么、什么会触发，才能判断"改这个属性会付出什么代价"。

## 完整流水线

```
HTML ──解析──> DOM
CSS  ──解析──> CSSOM
                │
        ┌───────┴────────┐
        │  Render Tree    │  （只含可见节点）
        └───────┬────────┘
                ▼
            Layout          计算几何位置（重排）
                ▼
             Paint          生成绘制指令（重绘）
                ▼
        Layerize / Tiling   分层与栅格化
                ▼
            Composite       合成上屏
```

关键点：**Layout 与 Paint 在主线程，Composite 在合成线程**。

## 重排、重绘、合成

| 改动 | 触发 |
| --- | --- |
| `width`/`height`/`top`/`left`/`font-size` | Layout → Paint → Composite |
| `color`/`background-color`/`box-shadow` | Paint → Composite |
| `transform`/`opacity` | Composite（被提升为层时） |
| `filter`/`backdrop-filter` | Paint（现代浏览器部分可合成） |

```js
// 高成本：连续触发重排
for (let i = 0; i < 1000; i++) {
  el.style.width = el.offsetWidth + 1 + 'px'
}
```

### 强制同步布局（layout thrashing）

读写交替时，浏览器为了返回正确的 `offsetWidth`，必须立即完成布局：

```js
// 差：每次循环都强制布局
for (const item of items) {
  const h = item.offsetHeight   // 读 → 强制布局
  item.style.height = h * 2 + 'px' // 写 → 使布局失效
}

// 好：批量读、批量写
const heights = items.map((i) => i.offsetHeight)
items.forEach((i, idx) => { i.style.height = heights[idx] * 2 + 'px' })
```

Chrome DevTools Performance 面板会明确标注 `Forced reflow`，这是最常见的性能问题之一。

## 合成层与 will-change

被提升为合成层的元素可以独立变换，不触发主线程布局与绘制。

```css
.animated {
  will-change: transform;
  transform: translateZ(0); /* 强制提升（旧写法） */
}
```

::: warn 层的代价
每个合成层都占用显存（GPU 纹理）。移动端层过多会导致内存暴涨甚至崩溃。经验值：单页不超过 20-30 个独立合成层。

用完要移除 `will-change`，否则浏览器会一直保留该层：

```js
el.style.willChange = 'transform'
// 动画结束后
el.style.willChange = 'auto'
```
:::

## requestAnimationFrame 与帧对齐

```js
function animate() {
  // 在下一帧绘制前执行
  el.style.transform = `translateX(${x}px)`
  x += 1
  if (x < 500) requestAnimationFrame(animate)
}
requestAnimationFrame(animate)
```

`rAF` 保证回调在**渲染前**执行，避免"改了样式但要等下一帧才生效"的丢帧。`setTimeout(16)` 做不到这一点。

### 帧预算

60fps 意味着每帧 16.7ms。预算分配大致：

```
输入处理     1-2ms
JS 执行      8-10ms
样式 + 布局   2-3ms
绘制 + 合成   2-3ms
```

任何一项超预算都会掉帧。

## requestIdleCallback 与时间切片

```js
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && queue.length) {
    process(queue.shift())
  }
})
```

但 `rIC` 在低优先级场景下可能长时间不执行（有任务时最长 50ms 才触发一次）。React 的调度器最终选择了 `MessageChannel` + 5ms 时间片。

现代替代方案：

```js
// 1. scheduler API（Chrome 优先）
await scheduler.yield()

// 2. 手动切片
async function chunked(list, fn) {
  for (let i = 0; i < list.length; i += 100) {
    list.slice(i, i + 100).forEach(fn)
    await new Promise((r) => setTimeout(r))
  }
}
```

## 长任务与 INP

超过 50ms 的任务就是"长任务"，会阻塞输入响应。Performance 面板中的红色三角就是标记。

```js
// 差：一次性渲染 1 万条
list.innerHTML = data.map(renderRow).join('')

// 好：虚拟列表或分批
```

拆解手段：

| 手段 | 适用 |
| --- | --- |
| 虚拟列表 | 大列表 |
| 时间切片 | 计算密集任务 |
| Web Worker | 纯数据计算（不可操作 DOM） |
| `scheduler.yield()` | 可中断的异步流程 |
| 减少渲染工作量 | memo / 虚拟化 / 懒加载 |

## 关键渲染路径优化

### 1. 消除阻塞资源

```html
<!-- CSS 阻塞渲染：非关键样式异步加载 -->
<link rel="stylesheet" href="critical.css">
<link rel="preload" href="non-critical.css" as="style" onload="this.rel='stylesheet'">

<!-- JS：defer 保证顺序，async 不保证 -->
<script src="app.js" defer></script>
<script src="analytics.js" async></script>
```

### 2. 资源优先级

```html
<!-- 首屏主图：高优先级预加载 -->
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">

<!-- 下一跳域名的连接预热 -->
<link rel="preconnect" href="https://api.example.com">

<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- 未来可能用到的资源：空闲时下载 -->
<link rel="prefetch" href="/next-page.js">
```

| 指令 | 优先级 | 说明 |
| --- | --- | --- |
| `preload` | 高 | 当前页需要，提前下载 |
| `prefetch` | 低 | 下一跳可能用，空闲下载 |
| `preconnect` | - | 提前建 TCP/TLS |
| `dns-prefetch` | - | 只做 DNS |
| `modulepreload` | 高 | 预加载 ESM 模块并解析依赖 |

### 3. 图片

```html
<img
  src="small.jpg"
  srcset="small.jpg 480w, medium.jpg 960w, large.jpg 1440w"
  sizes="(max-width: 600px) 100vw, 50vw"
  loading="lazy"
  decoding="async"
  width="800"
  height="600"
  alt="..."
>
```

- `srcset` + `sizes` 让浏览器按 DPR 与视口选择
- `loading="lazy"` 用于首屏外图片
- 首屏主图**不要** lazy，会拖慢 LCP
- 显式宽高避免 CLS

### 4. 字体

```css
@font-face {
  font-family: 'Inter';
  src: url('/inter.woff2') format('woff2');
  font-display: swap;
  size-adjust: 96%;         /* 匹配回退字体的尺寸，减少 CLS */
  unicode-range: U+0000-00FF;
}
```

`font-display: swap` 先显示回退字体避免 FOIT，但会带来 FOUT 与 CLS。`optional` 更激进（弱网直接用回退字体）。

## 渲染层面的优化

```css
/* 1. 长列表跳过屏幕外渲染 */
.row {
  content-visibility: auto;
  contain-intrinsic-size: 0 60px;
}

/* 2. 隔离布局计算 */
.card { contain: layout paint; }

/* 3. 减少绘制区域 */
.layer { will-change: transform; }

/* 4. 避免大范围阴影与模糊 */
/* box-shadow 与大半径 blur 的绘制成本很高 */
```

## 度量方法

只用 Lighthouse 不够，因为那是实验室数据。线上要采集真实用户指标（RUM）：

```js
import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals'

const report = (name, metric) => {
  navigator.sendBeacon('/rum', JSON.stringify({
    name,
    value: metric.value,
    route: location.pathname,
    ...metric.attribution
  }))
}

onLCP(report)
onINP(report)
onCLS(report)
onTTFB(report)
```

::: tip p75 而非均值
性能数据是长尾分布。用平均值会掩盖最差的那批用户体验。行业标准是看 **p75**：75% 的用户体验都不差于这个值。
:::

## 一个真实的排查流程

1. **确认现象**：哪个页面、哪个指标、哪个分位数
2. **定位阶段**：LCP 拆成 TTFB / 资源延迟 / 资源时长 / 渲染延迟
3. **抓取证据**：Performance 面板录屏 + 火焰图，找长任务与强制同步布局
4. **假设与验证**：每次只改一处，A/B 对比
5. **回归防护**：加入 CI 性能预算（bundle 体积、Lighthouse score）

::: interview 面试视角
能完整说出"我会先把 LCP 拆成四段再定位"的人，一定做过真实优化。只说"用 CDN、压缩图片"的，多半是看来的。
:::