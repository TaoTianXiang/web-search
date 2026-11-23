## 两种盒模型

```
标准（content-box）:
  width = content 宽度
  实际占位 = width + padding + border

怪异（border-box）:
  width = content + padding + border
  实际占位 = width
```

```css
.a {
  box-sizing: content-box;
  width: 100px;
  padding: 10px;
  border: 2px solid;
}
/* 实际占位宽 = 100 + 20 + 4 = 124px */

.b {
  box-sizing: border-box;
  width: 100px;
  padding: 10px;
  border: 2px solid;
}
/* 实际占位宽 = 100px，内容区宽 = 76px */
```

## 为什么默认是 content-box

历史原因：CSS 1 规范定义了 content-box。IE 的怪异模式（quirks mode）则使用 border-box，导致早期页面在不同浏览器下表现不一致。

## 为什么工程中用 border-box

```css
*, *::before, *::after { box-sizing: border-box; }
```

三个实际原因：

### 1. 宽高与直觉一致

```css
/* border-box：设置 100px 就真的是 100px 占位 */
.col { width: 25%; padding: 12px; }
/* 4 列正好铺满，不会因为 padding 溢出 */
```

content-box 下，`width: 25%` 加 padding 会超过 100%，导致换行或横向滚动。

### 2. 百分比布局可靠

```css
/* ❌ content-box：25% × 4 加上 padding 后超过 100% */
.col { width: 25%; padding: 10px; }

/* ✅ border-box：正好 100% */
.col { box-sizing: border-box; width: 25%; padding: 10px; }
```

### 3. 组件样式可预测

```css
.btn {
  box-sizing: border-box;
  padding: 8px 16px;
  border: 1px solid;
  /* 修改 padding 不会改变按钮总宽度 */
}
```

## 特殊情况

```css
/* 内联元素不接受 width/height，box-sizing 无意义 */
span { display: inline; width: 100px; }   /* 无效 */

/* 需要显式改为 inline-block */
span { display: inline-block; width: 100px; }
```

```css
/* 替换元素（img/input）的 intrinsic 尺寸仍按内容计算 */
img { box-sizing: border-box; width: 200px; height: 150px; }
/* 若设置 object-fit，图片内容会按内容区缩放 */
```

## 与 margin 的关系

`margin` **不参与** `box-sizing` 的计算，始终在盒模型外部：

```
┌──── margin ────┐
│ ┌─ border ───┐ │
│ │ ┌ padding ┐│ │
│ │ │ content ││ │
│ │ └─────────┘│ │
│ └────────────┘ │
└────────────────┘
```

所以 `width: 25%` + `margin` 仍会溢出，需要用 `gap` 或 `calc()`。

::: interview 面试视角
不要只背定义。能说出"百分比布局下 content-box 会溢出"和"margin 不参与 box-sizing"，就是真实踩过坑的回答。
:::
