## 回答结构

不要一上来就列手段。正确顺序是：

```
1. 定义指标（LCP / TTFB / 资源体积）
2. 定位瓶颈（拆解 LCP 四段）
3. 针对性优化
4. 验证与守住（RUM + 性能预算）
```

## 第一步：LCP 四段拆解

```
LCP = TTFB + 资源加载延迟 + 资源加载时长 + 元素渲染延迟
```

| 段 | 典型问题 | 优化手段 |
| --- | --- | --- |
| TTFB | 服务端慢、无 CDN | CDN、服务端缓存、边缘渲染、流式 SSR |
| 加载延迟 | 图片在 JS 里动态插入 | HTML 中直接写 img、`preload`、`fetchpriority="high"` |
| 加载时长 | 图片过大、未用现代格式 | AVIF/WebP、`srcset`、压缩 |
| 渲染延迟 | 主线程被长任务占用 | 拆分长任务、`defer`、代码分割 |

## 第二步：分层的优化手段

### 网络层

```html
<!-- 关键资源预连接 -->
<link rel="preconnect" href="https://api.example.com" crossorigin>
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- 首屏主图预加载 -->
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high">

<!-- 首屏关键 CSS 内联，非关键异步 -->
<style>/* critical */</style>
<link rel="preload" href="/app.css" as="style" onload="this.rel='stylesheet'">
```

- 开启 HTTP/2 或 HTTP/3
- 开启 Brotli 压缩（比 gzip 小 15–20%）
- 静态资源长效缓存（hash + immutable）
- HTML 设为 `no-cache`

### 资源层

```html
<img
  src="hero.jpg"
  srcset="hero-480.avif 480w, hero-960.avif 960w, hero-1440.avif 1440w"
  sizes="(max-width: 600px) 100vw, 50vw"
  width="1200" height="600"
  fetchpriority="high"
  alt="..."
>
```

- 图片用 AVIF/WebP（比 JPEG 小 30–50%）
- 字体：`font-display: swap` + `preload` + 子集化
- 图标改用 SVG sprite 或内联 SVG（替代图标字体）

### 代码层

```js
// 路由级代码分割
const Admin = () => import('./views/Admin.vue')

// 大依赖按需加载
const chart = await import('echarts')

// 第三方库用现代构建，减少 polyfill
```

- Tree Shaking（确保 ESM + sideEffects）
- 移除未使用的 polyfill（`@babel/preset-env` 的 `useBuiltIns: usage`）
- 动态 import 首屏之外的模块

### 渲染层

```css
/* 首屏不需要的区块跳过渲染 */
.below-fold {
  content-visibility: auto;
  contain-intrinsic-size: 0 400px;
}
```

- 减少阻塞渲染的 CSS 与 JS
- 关键 CSS 内联
- 避免强制同步布局

### 服务端

```js
// 流式 SSR：先发送 HTML 头部，数据到了再补
res.write(headHtml)
res.write(bodyHtml)
res.end()
```

- SSR / SSG（内容型站点）
- 接口聚合（减少请求瀑布）
- 边缘计算（把渲染放到离用户近的节点）

## 第三步：验证

```js
import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals'

onLCP((m) => report('lcp', m))
```

| 层级 | 工具 | 用途 |
| --- | --- | --- |
| 实验室 | Lighthouse、Performance 面板 | 开发期定位 |
| 现场 | web-vitals + RUM | 真实用户体验，按 p75 看 |
| 回归 | CI 性能预算 | 防止退步 |

```js
// CI 中的预算检查
const budgets = { 'main.js': 180 * 1024, 'total.css': 60 * 1024 }
```

## 一个真实案例

> 后台首页 LCP 4.2s
>
> **拆解**：TTFB 1.8s（服务端聚合接口串行）、主图 1.2s（未压缩 PNG 2.4MB）、渲染延迟 0.9s（首屏 JS 阻塞）
>
> **优化**：
> 1. 接口并行 + Redis 缓存 → TTFB 1.8s → 0.4s
> 2. 主图转 AVIF + preload + 正确尺寸 → 1.2s → 0.25s
> 3. 首屏 JS 拆分 + defer → 渲染延迟 0.9s → 0.2s
>
> **结果**：LCP 4.2s → 1.1s，p75 从 5.8s → 1.9s

::: warn 不要迷信"合并请求"
HTTP/2 下合并 CSS/JS 会破坏缓存粒度。应按"变更频率"拆分，而不是按"请求数量"合并。
:::

::: interview 面试视角
面试官想听的是"你怎么知道该优化哪一段"。先拆指标、再定位、再动手、最后用数据验证的闭环，才是高级工程师的答法。
:::
