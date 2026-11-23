这一章处理浏览器方向"看起来会、深问就含糊"的一组题：事件模型、加载时序、原生能力。

## 一、事件委托

### 原理

利用事件冒泡：不在每个子元素上绑监听，而在共同祖先上绑一个，通过 `event.target` 判断来源。

```js
// ❌ 1000 个 li 各绑一个
items.forEach((li) => li.addEventListener('click', handler))

// ✅ 委托到父元素
list.addEventListener('click', (e) => {
  const li = e.target.closest('li')
  if (li && list.contains(li)) handler(li)
})
```

### 三个好处

| 好处 | 说明 |
| --- | --- |
| 减少监听器 | 1000 个元素只需 1 个，省内存 |
| 动态元素自动生效 | 新增子元素无需重新绑定 |
| 便于统一销毁 | 卸载时只需移除一个 |

### 不能委托的事件

不冒泡的事件无法委托：

| 事件 | 替代 |
| --- | --- |
| `focus` / `blur` | `focusin` / `focusout`（会冒泡） |
| `mouseenter` / `mouseleave` | `mouseover` / `mouseout` |
| 资源 `load` / `error` | 用捕获阶段监听 |
| 元素上的 `scroll` | — |

```js
// 捕获阶段也能实现"委托"
container.addEventListener('focus', handler, true)
```

### 与框架的关系

| 框架 | 机制 |
| --- | --- |
| React | 合成事件，委托到根容器（17+ 是 root，16 是 document） |
| Vue | 直接绑定到元素（编译时已知） |

::: warn stopPropagation 会破坏委托
子元素里调用 `e.stopPropagation()` 会阻止事件到达委托层。调试"点了没反应"时，先检查是否有中间层阻止了冒泡。
:::

## 二、DOMContentLoaded 与 load

```
HTML 解析完成
  → DOMContentLoaded   （DOM 就绪，不含图片/样式/iframe）
  → 所有资源加载完成
  → load
```

| 事件 | 等待资源 | 典型用途 |
| --- | --- | --- |
| `DOMContentLoaded` | ❌ | 查询元素、绑定事件 |
| `load` | ✅ | 需要图片尺寸、字体已就绪 |
| `beforeunload` | — | 未保存提醒 |
| `visibilitychange` | — | 上报、暂停/恢复 |

```js
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()   // 脚本异步加载时，事件可能已经触发
}
```

这是很多第三方 SDK 的标准写法。

### 首屏指标不是 load

```
用户已看到完整页面（LCP 完成）
  ↓ 20 秒后
load 才触发（某个底部懒加载图片很慢）
```

所以不要把 "load 时间" 当首屏指标。首屏看 LCP / FCP。

### beforeunload 的局限

1. 现代浏览器只在用户**有交互**后显示确认框
2. 文案不可自定义
3. 移动端多数浏览器忽略

可靠上报用 `visibilitychange` + `sendBeacon`：

```js
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    navigator.sendBeacon('/collect', JSON.stringify(payload))
  }
})
```

## 三、defer 与 async

| 属性 | 下载 | 执行时机 | 顺序保证 |
| --- | --- | --- | --- |
| 无 | 阻塞解析 | 下载完立即 | ✅ |
| `async` | 并行 | 下载完立即（可能打断解析） | ❌ |
| `defer` | 并行 | 解析完成后、DOMContentLoaded 前 | ✅ |

```html
<!-- 有依赖关系必须用 defer -->
<script defer src="jquery.js"></script>
<script defer src="plugin-needs-jquery.js"></script>

<!-- 独立统计可用 async -->
<script async src="analytics.js"></script>
```

### module 默认 defer

```html
<script type="module" src="main.js"></script>
```

- 并行下载
- 解析完成后执行
- 保证顺序
- 自动严格模式

加 `async` 则变为"下载完立即执行"。

### 行内脚本的 defer 无效

```html
<script defer>console.log('x')</script>   <!-- defer 被忽略 -->
```

需要自己等待 DOM：

```js
document.addEventListener('DOMContentLoaded', () => { /* ... */ })
```

## 四、图片懒加载

### 原生方案

```html
<img src="a.jpg" loading="lazy" width="800" height="600" alt="...">
```

**必须设宽高**（或用 `aspect-ratio`）。否则占位为 0，元素永远到不了视口，图片永远不加载，且会造成 CLS。

::: warn 首屏主图不要 lazy
```html
<!-- ❌ 拖慢 LCP -->
<img src="hero.jpg" loading="lazy">

<!-- ✅ -->
<img src="hero.jpg" fetchpriority="high">
```
:::

### IntersectionObserver 方案

需要自定义提前量或统计曝光时：

```js
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const img = entry.target
      img.src = img.dataset.src
      if (img.dataset.srcset) img.srcset = img.dataset.srcset
      io.unobserve(img)
    })
  },
  { rootMargin: '300px', threshold: 0.01 }
)

document.querySelectorAll('img[data-src]').forEach((img) => io.observe(img))
```

### 三种方案对比

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| `loading="lazy"` | 零代码 | 无法自定义提前量 |
| IntersectionObserver | 可控、可统计 | 需手写、需占位 |
| scroll + getBoundingClientRect | 兼容性最好 | 高频计算，性能差 |

## 五、Worker 体系

| 类型 | 定位 | 生命周期 |
| --- | --- | --- |
| Web Worker | 后台线程计算 | 与创建它的文档绑定 |
| Service Worker | 网络代理 + 离线缓存 | **独立于页面**，可被唤醒 |
| Shared Worker | 跨标签共享的 Worker | 所有连接关闭后销毁 |

### Web Worker

```js
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })
worker.postMessage({ cmd: 'sort', data: bigArray })
worker.onmessage = (e) => console.log(e.data)

// worker.js
self.onmessage = (e) => {
  self.postMessage(heavyCompute(e.data))
}
```

限制：不能访问 `window` / `document` / `localStorage`。可用 `fetch`、`IndexedDB`、`WebSocket`、`OffscreenCanvas`。

零拷贝转移：

```js
const buffer = new ArrayBuffer(1024 * 1024)
worker.postMessage(buffer, [buffer])   // 转移所有权
```

### Service Worker

```js
navigator.serviceWorker.register('/sw.js', { scope: '/' })

// sw.js
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('v1').then((c) => c.addAll(['/', '/app.js'])))
})

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)))
})
```

::: warn SW 的更新陷阱
Service Worker 文件本身会被浏览器缓存最长 24 小时。更新流程：

1. 用户访问 → 旧 SW 仍在控制页面
2. 新 SW 后台安装，进入 waiting
3. **必须关闭所有标签页**（或调用 `skipWaiting`）才激活

常见做法是提示用户"有新版本，点击刷新"。
:::

### 何时用哪个

| 需求 | 选择 |
| --- | --- |
| 大数组排序、图像处理 | Web Worker |
| 离线访问、PWA | Service Worker |
| 跨标签共享 WebSocket | Shared Worker / BroadcastChannel |
| 主线程长任务拆分 | Web Worker（> 50ms 才值得） |

## 六、原生 HTML 能力

### dialog

```html
<dialog id="confirm">
  <form method="dialog">
    <h2>确认删除？</h2>
    <button value="cancel">取消</button>
    <button value="ok">确定</button>
  </form>
</dialog>
```

```js
const dlg = document.getElementById('confirm')
dlg.showModal()   // 遮罩 + 焦点锁定 + ESC 关闭 + top layer
dlg.addEventListener('close', () => console.log(dlg.returnValue))
```

免费获得：`::backdrop`、焦点陷阱、ESC 关闭、无障碍语义、不受父级 z-index 影响。

手写 Modal 需要自己实现这四项，容易出 bug。

### details / summary

```html
<details name="faq">
  <summary>常见问题</summary>
  <p>回答...</p>
</details>
```

免费获得键盘可访问、展开状态、`open` 属性。`name` 相同可做互斥手风琴。

### search

```html
<search>
  <form action="/search">
    <input name="q" type="search" aria-label="搜索">
    <button>搜索</button>
  </form>
</search>
```

语义化替代 `<div role="search">`。

### popover

```html
<button popovertarget="menu">打开</button>
<div id="menu" popover>菜单内容</div>
```

原生浮层，自动处理顶层层叠、点击外部关闭、ESC 关闭。

::: tip 优先用原生能力
`<dialog>`、`<details>`、`popover` 能省下大量手写组件的复杂度（焦点管理、无障碍、层叠），且更不容易出 bug。判断标准：**如果原生能覆盖 80% 的需求，就不要自己写组件**。
:::

::: interview 面试视角
能说清"dialog 免费获得焦点锁定与 top layer"、"SW 文件本身有 24 小时缓存"、"lazy 必须配合宽高"，说明你真正用过这些原生能力并踩过坑。
:::