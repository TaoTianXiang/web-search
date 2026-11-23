## 定义

BFC（Block Formatting Context）是一块**独立的渲染区域**，内部元素的布局不会影响外部，外部也不会影响内部。

## 触发条件

| 触发方式 | 说明 |
| --- | --- |
| 根元素 | html |
| `float` 非 none | 浮动元素 |
| `overflow` 非 visible | hidden / auto / scroll |
| `display: flow-root` | **现代推荐** |
| `display: inline-block` / `table-cell` / `table-caption` | |
| `position: absolute` / `fixed` | |
| flex / grid 的直接子项 | |
| `contain: layout` / `content` / `paint` | |

## 三个典型作用

### 1. 清除浮动（父元素包裹浮动子元素）

```html
<div class="parent">
  <div class="float-left">浮动</div>
</div>
```

```css
/* 父元素高度塌陷 */
.parent { background: #eee; }

/* 触发 BFC 后包裹 */
.parent { display: flow-root; }
```

### 2. 阻止 margin 折叠

```css
/* 子元素 margin-top 会"穿透"父元素 */
.parent { display: flow-root; }   /* 阻止 */
```

### 3. 避免与浮动元素重叠（实现自适应两栏）

```html
<div class="sidebar">固定宽</div>
<div class="content">自适应</div>
```

```css
.sidebar { float: left; width: 200px; }
.content { overflow: hidden; }   /* BFC：不侵入浮动区域 */
```

这是"左侧固定、右侧自适应"在不使用 flex 时的经典实现。

## 三个易混概念

| 概念 | 触发 | 决定 |
| --- | --- | --- |
| **BFC** | 见上表 | 内部布局隔离、浮动包裹 |
| **层叠上下文** | `z-index` + position、`transform`、`opacity<1`、`filter`、`isolation: isolate` | z 轴绘制顺序 |
| **包含块** | `position: relative/absolute/fixed`、`transform` 等 | 定位元素的百分比参照 |

一个元素可以同时是三者，但它们是**不同的机制**。

```css
.card {
  transform: translateZ(0);   /* 创建包含块 + 层叠上下文 */
  overflow: hidden;            /* 创建 BFC */
}
```

## 为什么推荐 flow-root

```css
/* 旧写法：副作用是产生滚动容器，sticky 会失效 */
.clearfix { overflow: hidden; }

/* 新写法：只创建 BFC，无其他副作用 */
.clearfix { display: flow-root; }
```

::: warn overflow: hidden 的连带影响
1. 内部 `position: sticky` 会失效（滚动容器变了）
2. 内容溢出会被裁剪（可能切掉弹窗、tooltip）
3. 可能产生隐藏的滚动条问题

能用 `flow-root` 就别用 `overflow: hidden` 来触发 BFC。
:::

::: interview 面试视角
能区分"BFC / 层叠上下文 / 包含块"三者，并说明"flow-root 替代 overflow: hidden"的原因，就超过了背触发条件的层次。
:::
