## 结构类标签

| 标签 | 语义 | 使用位置 |
| --- | --- | --- |
| `<header>` | 页头 / 区块头 | 站点头部、文章头部 |
| `<nav>` | 导航链接集合 | 主菜单、面包屑 |
| `<main>` | 页面唯一主内容 | 每页只能有一个 |
| `<aside>` | 侧边补充内容 | 侧栏、相关推荐 |
| `<footer>` | 页脚 | 版权、备案 |
| `<section>` | 有主题的分组 | 需自带标题 |
| `<article>` | 独立可分发内容 | 文章、帖子、商品卡 |
| `<figure>` / `<figcaption>` | 插图与说明 | 图片 + 图注 |

```html
<body>
  <header>
    <nav aria-label="主导航">
      <a href="/">首页</a>
      <a href="/docs">文档</a>
    </nav>
  </header>

  <main>
    <article>
      <h1>文章标题</h1>
      <p>正文...</p>
      <figure>
        <img src="chart.png" alt="性能对比图">
        <figcaption>图 1：优化前后的 LCP 对比</figcaption>
      </figure>
    </article>

    <aside aria-label="相关阅读">
      <h2>相关推荐</h2>
      <ul><li><a href="/a">另一篇文章</a></li></ul>
    </aside>
  </main>

  <footer>© 2026</footer>
</body>
```

## 交互类标签

### `<dialog>` —— 原生弹窗

```html
<dialog id="confirm">
  <form method="dialog">
    <h2>确认删除？</h2>
    <button value="cancel">取消</button>
    <button value="ok">确定</button>
  </form>
</dialog>

<script>
  const dlg = document.getElementById('confirm')
  dlg.showModal()   // 打开（带遮罩 + 焦点锁定 + ESC 关闭）

  dlg.addEventListener('close', () => {
    console.log(dlg.returnValue)   // 'ok' 或 'cancel'
  })
</script>
```

原生 `<dialog>` 免费获得：

- 遮罩层（`::backdrop`）
- **焦点锁定**（Tab 不会跑到背景）
- ESC 关闭
- 无障碍语义（自动标记为模态对话框）
- 顶层层叠（top layer，不受父级 z-index 影响）

```css
dialog::backdrop {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}
```

这比手写 Modal 组件（需要自己处理焦点陷阱、滚动锁定、z-index）省很多事。

### `<search>` —— 搜索区域

```html
<search>
  <form action="/search">
    <label for="q">搜索文档</label>
    <input id="q" name="q" type="search">
    <button>搜索</button>
  </form>
</search>
```

`<search>` 是 2023 年新增的元素，语义是"包含搜索或筛选控件的区域"。相比 `<div role="search">` 更简洁。

### `<details>` / `<summary>` —— 折叠面板

```html
<details>
  <summary>常见问题</summary>
  <p>回答内容...</p>
</details>
```

免费获得键盘可访问、展开/折叠状态、`open` 属性。适合 FAQ、文档目录。

```html
<!-- 手风琴：用 name 属性实现互斥 -->
<details name="faq"><summary>问题 1</summary>...</details>
<details name="faq"><summary>问题 2</summary>...</details>
```

### `<progress>` / `<meter>`

```html
<progress value="70" max="100">70%</progress>   <!-- 任务进度 -->
<meter value="0.8" min="0" max="1" low="0.3" high="0.7">80%</meter>  <!-- 静态测量 -->
```

## 表单类增强

```html
<input type="email" required>
<input type="url" placeholder="https://">
<input type="number" min="1" max="10" step="1">
<input type="date">
<input type="color">
<input type="range" min="0" max="100">
<input type="search">
<input type="tel" inputmode="numeric">

<!-- 原生校验提示 -->
<form>
  <input type="email" required>
  <button>提交</button>
</form>
```

```js
// 自定义校验提示
input.addEventListener('invalid', (e) => {
  e.target.setCustomValidity('请输入公司邮箱')
})
```

## 语义化的四层价值

| 价值 | 说明 |
| --- | --- |
| **无障碍** | 屏幕阅读器可识别地标（landmark），快速跳转 |
| **可维护性** | 结构可读，新人能快速理解页面骨架 |
| **SEO** | 搜索引擎能判断哪部分是主内容 |
| **工具生态** | 浏览器阅读模式、翻译、广告屏蔽都依赖结构 |

```html
<!-- 屏幕阅读器可以直接跳到 main -->
<a href="#main" class="skip-link">跳到主内容</a>
```

## 常见的"伪语义化"

```html
<!-- ❌ 用 div 堆出结构 -->
<div class="header">
  <div class="nav">
    <div class="nav-item" onclick="...">首页</div>
  </div>
</div>

<!-- ✅ -->
<header>
  <nav><a href="/">首页</a></nav>
</header>
```

关键差别：`<a href>` 天然支持右键新窗口、键盘 Enter、屏幕阅读器播报链接，而 `<div onclick>` 全部需要手动补。

::: warn 不要滥用 section
```html
<section>  <!-- 没有标题的 section 形同虚设 -->
  <div>内容</div>
</section>
```
规范建议 `<section>` 应有可访问名称（标题或 aria-label），否则用 `<div>`。
:::

::: interview 面试视角
能说出"用 `<dialog>` 免费获得焦点锁定与 top layer"、"用 `<details>` 免费获得键盘可访问"，说明你把语义化当工程手段而非 SEO 口号。
:::
