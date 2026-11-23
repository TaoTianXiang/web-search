## 浮动的工作方式

```css
.float { float: left; /* 或 right */ }
```

三个关键行为：

1. **脱离普通流**（但仍占据空间，与 absolute 不同）
2. **向左/右移动**，直到碰到容器边缘或其他浮动元素
3. **行盒（文字）会环绕浮动元素**，这是最初的用途（文字环绕图片）

```html
<img class="float-left" src="a.jpg">
<p>文字会环绕图片排列...</p>
```

## 父元素高度塌陷

```html
<div class="parent">
  <div class="float">浮动内容</div>
</div>
```

```css
.parent { background: #eee; }   /* 高度为 0，背景看不到 */
```

浮动元素脱离普通流，父元素计算高度时不计入它们，于是高度塌陷。

## 五种清除方式

### 1. 触发 BFC（推荐）

```css
.parent { display: flow-root; }
```

### 2. 伪元素 clearfix

```css
.clearfix::after {
  content: '';
  display: table;
  clear: both;
}
```

`display: table` 而非 `block` 是为了兼容旧版浏览器的 margin 折叠问题。

### 3. 给下一个元素加 clear

```css
.next { clear: both; }
```

缺点：需要额外元素，且会推低后续元素。

### 4. 父元素设 overflow: hidden

```css
.parent { overflow: hidden; }
```

副作用：产生滚动容器、内部 sticky 失效、内容可能被裁剪。

### 5. 直接用 flex / grid

```css
.parent { display: flex; }
```

现代布局下根本不需要 float，也就没有清除问题。

## float 在现代布局中的用途

| 场景 | 是否还用 float |
| --- | --- |
| 多列布局 | ❌ 用 Flex/Grid |
| 左固定右自适应 | ❌ 用 Flex |
| 文字环绕图片 | ✅ 仍是最佳方案 |
| 导航项横排 | ❌ 用 Flex |
| 清除浮动 | ❌ 用 flow-root 或不用浮动 |

```css
/* 唯一仍推荐的用途：文字环绕 */
.article img { float: left; margin: 0 12px 8px 0; }
```

## float 与 inline-block 的区别

| | float | inline-block |
| --- | --- | --- |
| 文档流 | 脱离 | 保持在流中 |
| 换行 | 空间不足时换行 | 同 |
| 垂直对齐 | 顶部对齐 | 受 `vertical-align` 影响 |
| 需清除 | ✅ | ❌ |
| 间隙 | 无 | 有空白字符间隙（需处理） |

```css
/* inline-block 的空白间隙修复 */
.parent { font-size: 0; }
.child { font-size: 14px; }
/* 或 */
.parent { display: flex; }   /* 最省事 */
```

::: warn float 与 margin 折叠
浮动元素**不参与** margin 折叠，所以浮动布局中的间距计算与普通流不同。这是从 float 迁移到 flex 时容易出错的地方。
:::

::: interview 面试视角
能说清"浮动最初是为文字环绕设计"、"flow-root 是最干净的清除方式"、"现代布局中 float 只用于文字环绕"，比背五种清除方式更有洞察。
:::
