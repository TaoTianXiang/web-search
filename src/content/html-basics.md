HTML 常被当成"最简单的部分"，但语义化与原生能力恰恰是区分"会写页面"与"会做产品"的地方。

## 一、语义化标签的实际用法

| 标签 | 语义 | 使用位置 |
| --- | --- | --- |
| `<header>` | 页头 / 区块头 | 站点头部、文章头部 |
| `<nav>` | 导航链接集合 | 主菜单、面包屑 |
| `<main>` | **页面唯一**主内容 | 每页只能有一个 |
| `<aside>` | 侧边补充内容 | 侧栏、相关推荐 |
| `<footer>` | 页脚 | 版权、备案 |
| `<section>` | 有主题的分组 | 需自带标题 |
| `<article>` | 独立可分发内容 | 文章、帖子、商品卡 |
| `<figure>` / `<figcaption>` | 插图与说明 | 图片 + 图注 |

```html
<body>
  <a href="#main" class="skip-link">跳到主内容</a>
  <header>
    <nav aria-label="主导航"><a href="/">首页</a></nav>
  </header>
  <main id="main">
    <article>
      <h1>标题</h1>
      <figure>
        <img src="chart.png" alt="性能对比图">
        <figcaption>图 1：优化前后对比</figcaption>
      </figure>
    </article>
    <aside aria-label="相关阅读">...</aside>
  </main>
  <footer>© 2026</footer>
</body>
```

### 语义化的四层价值

| 价值 | 说明 |
| --- | --- |
| **无障碍** | 屏幕阅读器识别地标（landmark），可快速跳转 |
| **可维护性** | 结构可读，新人能快速理解骨架 |
| **SEO** | 搜索引擎能判断哪部分是主内容 |
| **工具生态** | 阅读模式、翻译、广告屏蔽都依赖结构 |

::: warn 不要滥用 section
```html
<section>  <!-- 没有标题的 section 形同虚设 -->
  <div>内容</div>
</section>
```
规范建议 `<section>` 应有可访问名称（标题或 `aria-label`），否则用 `<div>`。
:::

## 二、原生交互能力（最容易被忽略）

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
dlg.showModal()
dlg.addEventListener('close', () => console.log(dlg.returnValue))
```

```css
dialog::backdrop { background: rgba(0, 0, 0, 0.4); }
```

免费获得五件事：

| 能力 | 手写 Modal 需要自己做 |
| --- | --- |
| 遮罩层 | 自己写 `::backdrop` 等价物 |
| **焦点锁定** | 自己实现 focus trap |
| ESC 关闭 | 自己监听 keydown |
| 无障碍语义 | 自己加 `role="dialog"` `aria-modal` |
| **top layer** | 自己处理 z-index 层级 |

最后一项尤其重要：`showModal()` 的元素会被提升到 **top layer**，不受任何父级层叠上下文影响，彻底解决"弹窗被盖住"的问题。

### details / summary

```html
<details name="faq">
  <summary>常见问题</summary>
  <p>回答内容</p>
</details>
```

免费获得：键盘可访问、展开/折叠状态、`open` 属性。`name` 相同可做互斥手风琴。

```js
const el = document.querySelector('details')
el.open = true
el.addEventListener('toggle', () => console.log(el.open))
```

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
<button popovertarget="menu">打开菜单</button>
<div id="menu" popover>菜单内容</div>
```

原生浮层，自动处理顶层层叠、点击外部关闭、ESC 关闭。

### 表单增强

```html
<input type="email" required>
<input type="url" placeholder="https://">
<input type="number" min="1" max="10" step="1">
<input type="date">
<input type="color">
<input type="range" min="0" max="100">
<input type="tel" inputmode="numeric">
<input type="search">
```

`inputmode` 能在移动端唤起数字键盘而不改变输入框类型。

::: tip 优先用原生能力
判断标准：**如果原生能覆盖 80% 的需求，就不要自己写组件**。手写 Modal 最容易出的四个 bug（焦点逃逸、滚动穿透、层叠被盖、ESC 未处理）原生全都免费解决。
:::

## 三、行内 / 块级 / 行内块

| 维度 | inline | block | inline-block |
| --- | --- | --- | --- |
| 换行 | 不换行 | 独占一行 | 不换行 |
| width / height | ❌ 无效 | ✅ | ✅ |
| 垂直 padding | **显示但不撑开父元素** | ✅ | ✅ |
| 垂直 margin | **不生效** | ✅ | ✅ |
| 默认宽度 | 内容宽度 | 撑满父容器 | 内容宽度 |

```css
/* 垂直 padding 会"画出来"但不占位 */
span {
  padding: 20px 0;
  background: yellow;   /* 背景延伸，但不会把父元素撑高 */
}
```

### inline-block 的空白间隙

```html
<div class="wrapper">
  <span class="item">A</span>
  <span class="item">B</span>
</div>
```

HTML 中的换行符被解析为一个空格（约 4px）。

三种修复：

```css
/* 1. 父元素 font-size: 0 */
.wrapper { font-size: 0; }
.item { font-size: 14px; }

/* 2. 负 margin */
.item { margin-right: -4px; }

/* 3. 用 flex（最省事） */
.wrapper { display: flex; gap: 8px; }
```

### 替换元素

| 类型 | 例子 | 宽高 |
| --- | --- | --- |
| 替换元素 | `img` `input` `video` `iframe` | 有 intrinsic 尺寸，可设宽高 |
| 非替换元素 | `span` `div` `p` | 由内容决定 |

```css
img { width: 100px; }   /* ✅ 即使 display: inline 也生效 */
```

### 常用 display 值

| 值 | 行为 |
| --- | --- |
| `flow-root` | 块级 + 创建 BFC（无副作用） |
| `contents` | 自身不生成盒子，子元素"上提" |
| `inline-flex` / `inline-grid` | 行内的弹性/网格容器 |
| `table-cell` | 表格布局 |

## 四、DOCTYPE 与渲染模式

```html
<!DOCTYPE html>
```

| 模式 | 触发 | 行为 |
| --- | --- | --- |
| 标准模式 | 完整现代 DOCTYPE | 遵循规范 |
| **怪异模式** | 无 DOCTYPE | 兼容 IE5 的历史行为 |
| 几乎标准 | 特定过渡 DTD | 标准 + 旧的图片行盒行为 |

```js
document.compatMode
// 'CSS1Compat'  → 标准模式
// 'BackCompat'  → 怪异模式
```

### 关键差异

| 行为 | 标准 | 怪异 |
| --- | --- | --- |
| **盒模型** | content-box | **border-box** |
| inline 元素间距 | 按规范 | 旧式 |
| 百分比高度 | 需父元素有高度 | 可相对视口 |
| img 底部空隙 | 有 | 无 |

最致命的差异是盒模型：同一份 CSS 在两种模式下布局完全不同。

```js
if (document.compatMode === 'BackCompat') {
  console.warn('页面处于怪异模式，请检查 DOCTYPE')
}
```

为什么会有怪异模式：1990 年代末浏览器实现各有偏差，W3C 引入 DOCTYPE 切换机制保证老页面不崩。

## 五、src 与 href

| 属性 | 含义 | 关系 |
| --- | --- | --- |
| `src` | source | **替换**当前元素内容（嵌入） |
| `href` | hypertext reference | **引用**一个资源（建立关系） |

```html
<script src="app.js"></script>            <!-- 用 JS 替换内容 -->
<img src="a.png">                         <!-- 用图片替换 -->
<link href="style.css" rel="stylesheet">  <!-- 引用样式表，不替换 -->
<a href="/page">链接</a>                    <!-- 引用目标 -->
```

### 对解析的影响

| 标签 | 行为 |
| --- | --- |
| `<script src>` | **阻塞解析**（且等待前面的 CSS 下载完成） |
| `<img src>` | 不阻塞解析，异步加载 |
| `<link href>` | **阻塞渲染**（不阻塞解析） |
| `<a href>` | 完全不影响加载 |

::: tip 一个常被忽略的细节
同步 `<script src>` 会**等待前面的 CSS 下载完成**才执行，因为脚本可能读取样式（`getComputedStyle`）。这就是"内联关键 CSS"能加速首屏渲染的原因之一。
:::

### 预加载提示

```html
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>
<link rel="prefetch" href="/next-page.js">
<link rel="dns-prefetch" href="https://cdn.example.com">
<link rel="preconnect" href="https://api.example.com" crossorigin>
```

| 指令 | 优先级 | 作用 |
| --- | --- | --- |
| `preload` | 高 | 当前页需要，提前下载（必须声明 `as`） |
| `prefetch` | 低 | 下一跳可能用，空闲下载 |
| `preconnect` | — | 提前建 TCP/TLS |
| `dns-prefetch` | — | 只做 DNS |

## 六、图片懒加载

```html
<img src="a.jpg" loading="lazy" width="800" height="600" alt="...">
```

::: warn 两个必须注意的点
1. **必须设宽高**（或用 `aspect-ratio`），否则占位为 0，元素永远到不了视口 → 图片永远不加载
2. **首屏主图不要 lazy**，会直接恶化 LCP；应设 `fetchpriority="high"`
:::

需要自定义提前量时用 IntersectionObserver：

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach(({ isIntersecting, target }) => {
    if (!isIntersecting) return
    target.src = target.dataset.src
    io.unobserve(target)
  })
}, { rootMargin: '300px' })
```

## 七、Worker 体系

| 类型 | 定位 | 生命周期 |
| --- | --- | --- |
| Web Worker | 后台线程计算 | 与文档绑定 |
| Service Worker | 网络代理 + 离线缓存 | **独立**，可被唤醒 |
| Shared Worker | 跨标签共享 | 所有连接关闭后销毁 |

Web Worker 不能访问 DOM / `window` / `localStorage`，可用 `fetch`、`IndexedDB`、`WebSocket`、`OffscreenCanvas`。

Service Worker 需要 HTTPS（localhost 例外），文件本身会被浏览器缓存最长 24 小时——这是更新陷阱的根源。

::: interview 面试视角
HTML 题的区分点在"你是否真的用了原生能力"。能说清"dialog 免费获得焦点锁定与 top layer"、"lazy 必须配合宽高否则永不触发"、"同步脚本会等待 CSS"，就说明你写过真实页面而不是只搭过架子。
:::