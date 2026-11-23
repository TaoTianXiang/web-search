## 原生方案（推荐）

```html
<img src="a.jpg" loading="lazy" width="800" height="600" alt="...">
```

`loading` 的三个值：

| 值 | 行为 |
| --- | --- |
| `eager` | 立即加载（默认） |
| `lazy` | 接近视口时才加载 |
| `auto` | 浏览器自行决定 |

浏览器会根据网络状况与滚动位置动态调整"接近视口"的距离（快速滑动时提前更多）。

**必须同时设置宽高**（或用 `aspect-ratio`），否则占位为 0，元素永远到不了视口，图片永远不会加载，且会导致 CLS。

```html
<!-- 无宽高：懒加载可能完全不触发 -->
<img src="a.jpg" loading="lazy">

<!-- 正确 -->
<img src="a.jpg" loading="lazy" width="800" height="600">
```

::: warn 首屏图片不要用 lazy
```html
<!-- ❌ 拖慢 LCP -->
<img src="hero.jpg" loading="lazy">

<!-- ✅ 首屏主图要高优先级 -->
<img src="hero.jpg" fetchpriority="high">
```
lazy 会推迟首屏主图的下载，直接恶化 LCP。
:::

## IntersectionObserver 方案

需要更细粒度控制时（自定义提前量、加载动画、统计曝光）：

```html
<img data-src="a.jpg" alt="...">
```

```js
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const img = entry.target
      img.src = img.dataset.src
      img.removeAttribute('data-src')
      io.unobserve(img)   // 加载后停止观察
    })
  },
  {
    rootMargin: '200px 0px',   // 提前 200px 开始加载
    threshold: 0.01            // 露出 1% 即触发
  }
)

document.querySelectorAll('img[data-src]').forEach((img) => io.observe(img))
```

### 配合 srcset 的完整版

```html
<img
  data-src="small.jpg"
  data-srcset="small.jpg 480w, medium.jpg 960w, large.jpg 1440w"
  sizes="(max-width: 600px) 100vw, 50vw"
  width="800" height="600"
  alt="..."
>
```

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return
    target.src = target.dataset.src
    if (target.dataset.srcset) target.srcset = target.dataset.srcset
    io.unobserve(target)
  })
}, { rootMargin: '300px' })
```

### 加载完成动画

```js
img.addEventListener('load', () => img.classList.add('loaded'))
```

```css
img { opacity: 0; transition: opacity 0.3s; background: #f0f2f5; }
img.loaded { opacity: 1; }
```

## 三种方案对比

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| `loading="lazy"` | 零代码、浏览器优化 | 无法自定义提前量、不支持旧浏览器 |
| IntersectionObserver | 可控、支持曝光统计 | 需手写、需处理占位 |
| scroll + getBoundingClientRect | 兼容性最好 | 高频计算，性能差（需节流） |

## 背景图懒加载

```html
<div class="lazy-bg" data-bg="/a.jpg"></div>
```

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return
    target.style.backgroundImage = `url(${target.dataset.bg})`
    io.unobserve(target)
  })
})
```

或预加载后判断：

```js
const img = new Image()
img.onload = () => { el.style.backgroundImage = `url(${url})` }
img.src = url
```

## 与虚拟滚动的配合

虚拟列表中，DOM 节点会被复用，要**重置状态**：

```js
// 复用的节点需要重新设置 data-src 并重新 observe
function reuseNode(node, newSrc) {
  node.classList.remove('loaded')
  node.src = ''
  node.dataset.src = newSrc
  io.observe(node)
}
```

::: interview 面试视角
能指出"lazy 必须配合宽高，否则永远不触发"、"首屏主图不能 lazy"，说明你实际配置过并观察过 LCP 数据。
:::
