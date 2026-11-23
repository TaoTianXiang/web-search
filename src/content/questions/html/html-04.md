## 语义差异

| 属性 | 含义 | 关系 |
| --- | --- | --- |
| `src` | **source**，替换当前元素的内容 | 嵌入（embed） |
| `href` | **hypertext reference**，指向一个资源 | 引用（reference） |

```html
<script src="app.js"></script>       <!-- 用 JS 替换 script 元素的内容 -->
<img src="a.png">                    <!-- 用图片替换 img 元素 -->
<link href="style.css" rel="stylesheet">  <!-- 引用样式表，不替换 link -->
<a href="/page">链接</a>              <!-- 引用目标地址 -->
```

## 对解析的影响

| 标签 | 属性 | 行为 |
| --- | --- | --- |
| `<script src>` | src | **阻塞** HTML 解析，直到下载并执行完毕 |
| `<img src>` | src | 不阻塞解析（异步加载），但会占用连接 |
| `<iframe src>` | src | 不阻塞父页面解析 |
| `<link href>` | href | **阻塞渲染**（CSSOM 未就绪无法构建渲染树） |
| `<a href>` | href | 完全不影响加载 |

```html
<!-- 阻塞解析 -->
<script src="a.js"></script>

<!-- 不阻塞渲染（媒体不匹配时不阻塞） -->
<link href="print.css" rel="stylesheet" media="print">
```

## 为什么不能用 href 加载脚本

```html
<!-- ❌ 无效：script 不认识 href -->
<script href="a.js"></script>
```

因为 `src` 的语义是"用这个资源的内容**替换**元素本身"，而 `href` 只是"引用"，浏览器不会去执行它。

## 为什么 link 用 href 而不是 src

```html
<link rel="stylesheet" href="a.css">
```

`<link>` 是**空元素**（void element），没有内容可"替换"。它表达的是"当前文档与另一个资源的关系"，所以用 `href`。

```html
<!-- 各种 link 关系 -->
<link rel="stylesheet" href="a.css">
<link rel="icon" href="favicon.ico">
<link rel="preload" href="font.woff2" as="font">
<link rel="canonical" href="https://example.com/page">
```

## 加载时机与顺序

```
HTML 解析：
  ├─ <script src>   阻塞解析 → 下载 → 执行 → 继续
  ├─ <link href>    并行下载，阻塞渲染（不阻塞解析）
  ├─ <img src>      并行下载，不阻塞
  └─ <iframe src>   并行加载子文档
```

细节：同步 `<script src>` 会**等待前面的 CSS 下载完成**再执行（因为脚本可能读取样式），这是很多人不知道的。

## 常见问答

**Q：`<a href>` 会不会预加载目标页面？**

不会。但可以用 `rel="prefetch"` 提示浏览器空闲时预取：

```html
<a href="/next" rel="prefetch">下一页</a>
```

**Q：`<img src>` 失败会怎样？**

触发 `error` 事件，可用 `onerror` 兜底：

```html
<img src="a.jpg" onerror="this.src='/fallback.png'">
```

**Q：`<script src>` 与 `import()` 的区别？**

前者是传统脚本加载（全局作用域或模块作用域），后者是动态导入模块，返回 Promise。

## 同一元素同时有 src 与 href

只有 `<link>`（用 href）与嵌入类元素（用 src）是分开的。没有一个元素同时需要两者表示不同含义。

例外：`<base href>` 用 href 改变所有相对 URL 的解析基准。

```html
<base href="https://cdn.example.com/assets/">
<img src="logo.png">   <!-- 实际请求 https://cdn.example.com/assets/logo.png -->
```

::: interview 面试视角
"src 是替换元素内容，href 是建立引用"是核心。能补上"同步 script 会等待 CSS"与"link 阻塞渲染不阻塞解析"，就是完整回答。
:::
