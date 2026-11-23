## 三方对比

| 维度 | inline | block | inline-block |
| --- | --- | --- | --- |
| 换行 | 不换行 | 独占一行 | 不换行 |
| width / height | ❌ 无效 | ✅ | ✅ |
| 垂直 padding | 显示但不撑开父元素 | ✅ | ✅ |
| 垂直 margin | 不生效 | ✅ | ✅ |
| 水平 margin / padding | ✅ | ✅ | ✅ |
| 默认宽度 | 内容宽度 | 撑满父容器 | 内容宽度 |
| 典型元素 | `span` `a` `strong` `em` | `div` `p` `h1` `ul` | `img` `input` `button` |

## 关键细节：inline 的垂直 padding

```css
span {
  padding: 20px 0;
  background: yellow;
}
```

padding 会"画出来"（背景延伸），但**不会把父元素撑高**，也不会推动相邻行。因为行内盒的高度由 `line-height` 决定，与 padding 无关。

同样地，垂直 `margin` 对 inline 元素**完全无效**。

## 常见误用

```html
<!-- ❌ 给 span 设宽高无效 -->
<span style="width: 100px; height: 100px">按钮</span>

<!-- ✅ 改为 inline-block 或 block -->
<span style="display: inline-block; width: 100px">按钮</span>
```

```js
// ❌ 也读不到有效尺寸
el.offsetWidth   // 对 inline 元素仍是内容宽度，忽略 width
```

## inline-block 的空白间隙

```html
<div class="wrapper">
  <span class="item">A</span>
  <span class="item">B</span>
</div>
```

HTML 中的换行符会被解析为一个空格（约 4px），导致两个 inline-block 之间有间隙。

三种修复：

```css
/* 1. 父元素 font-size: 0，子元素恢复 */
.wrapper { font-size: 0; }
.item { font-size: 14px; }

/* 2. 负 margin */
.item { margin-right: -4px; }

/* 3. 用 flex 或 grid */
.wrapper { display: flex; gap: 8px; }
```

方案 3 最省事，也最不容易出问题。

## 完整 display 值

| 值 | 行为 |
| --- | --- |
| `block` | 块级 |
| `inline` | 行内 |
| `inline-block` | 行内块 |
| `flex` | 弹性容器（块级） |
| `inline-flex` | 弹性容器（行内） |
| `grid` | 网格容器（块级） |
| `inline-grid` | 网格容器（行内） |
| `flow-root` | 块级 + 创建 BFC |
| `contents` | 自身不生成盒子，子元素"上提" |
| `none` | 不渲染 |
| `table` / `table-cell` | 表格布局 |

```css
/* contents：消掉一层 div，让子元素直接参与父布局 */
.wrapper { display: contents; }

/* flow-root：创建 BFC 且不影响其他行为 */
.clearfix { display: flow-root; }
```

## 替换元素与非替换元素

| 类型 | 例子 | 宽高 |
| --- | --- | --- |
| 替换元素 | `img` `input` `video` `iframe` | 有 intrinsic 尺寸，可设宽高 |
| 非替换元素 | `span` `div` `p` | 无 intrinsic 尺寸，由内容决定 |

替换元素即使在 `display: inline` 下也接受宽高：

```css
img { width: 100px; }   /* ✅ 即使 inline 也生效 */
```

## 与 vertical-align 的关系

```css
/* inline-block 的基线对齐会导致"底部空隙" */
img { display: inline-block; vertical-align: bottom; }

/* 或改变父元素的 line-height */
.wrapper { line-height: 0; }
```

行内与行内块元素按基线（baseline）对齐，而基线下方有 descender 空间，所以图片底部会有几像素空隙。

::: interview 面试视角
能说清"inline 的垂直 padding 会画出来但不撑开父元素"、"inline-block 的空白间隙来源是 HTML 换行"，说明你调过真实的像素问题。
:::
