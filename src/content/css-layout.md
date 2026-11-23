CSS 面试题很少考"某个属性怎么写"，更多考"为什么这样排"。这一章从盒模型出发，把布局的因果关系理清。

## 盒模型

```
┌───────────── margin ─────────────┐
│ ┌─────────── border ───────────┐ │
│ │ ┌──────── padding ─────────┐ │ │
│ │ │ ┌────── content ───────┐ │ │ │
│ │ │ └──────────────────────┘ │ │ │
│ │ └──────────────────────────┘ │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

```css
.box {
  box-sizing: content-box; /* 默认：width 只含内容 */
  box-sizing: border-box;  /* width 含 padding + border */
}
```

工程里通常全局设置：

```css
*, *::before, *::after { box-sizing: border-box; }
```

原因：`border-box` 让"宽度"与人脑直觉一致，加 padding 不会撑破布局。

### inline 元素的宽高

```css
span { width: 100px; height: 100px; } /* 无效 */
```

`display: inline` 的元素**不接受 width/height**，垂直方向的 padding/margin 不影响行盒高度。需要控制尺寸时改为 `inline-block`。

## 外边距折叠

三个条件同时满足才折叠：

1. 都属于**块级**格式化上下文（BFC）
2. 垂直方向相邻
3. 之间没有 border / padding / 行内内容 / 清除浮动

```css
/* 兄弟折叠：取较大者 */
.a { margin-bottom: 20px; }
.b { margin-top: 30px; }
/* 间距是 30px，不是 50px */
```

```css
/* 父子折叠：子元素 margin 会"穿透"到父元素外面 */
.parent { /* 无 border/padding */ }
.child { margin-top: 40px; } /* 父元素也被推下来 40px */
```

阻止折叠的手段：

| 方式 | 说明 |
| --- | --- |
| 父元素加 `padding-top` | 最直观 |
| 父元素加 `border` | 同上，但影响视觉 |
| 父元素 `overflow: hidden` | 触发 BFC，但有滚动副作用 |
| 父元素 `display: flow-root` | **现代推荐**，无副作用 |
| 改为 flex / grid 布局 | 子项不参与外边距折叠 |

::: tip 为什么推荐 flow-root
`flow-root` 专门为"创建 BFC 但不改变其他行为"而设计。它不会产生滚动条，不影响 sticky 定位。
:::

## BFC：面试必考

BFC 是独立的渲染区域，内部布局与外部互不影响。

### 触发条件

- 根元素
- `float` 不为 `none`
- `overflow` 不为 `visible`
- `display` 为 `flow-root`、`inline-block`、`table-cell`、`table-caption`、`table`
- `position` 为 `absolute` / `fixed`
- `contain` 为 `layout` / `content` / `paint`
- flex / grid 的直接子项

### 三个典型用途

```css
/* 1. 清除浮动：父元素包裹浮动子元素 */
.clearfix { display: flow-root; }

/* 2. 阻止 margin 折叠 */
.no-collapse { display: flow-root; }

/* 3. 避免与浮动元素重叠：实现自适应两栏 */
.media { overflow: hidden; } /* 右侧内容不侵入左侧 float */
```

### BFC ≠ 层叠上下文 ≠ 包含块

| 概念 | 决定 |
| --- | --- |
| BFC | 内部布局隔离、浮动包裹 |
| 层叠上下文 | z 轴绘制顺序 |
| 包含块 | 定位元素的百分比参照 |

三者常被混为一谈，面试时能区分开是加分点。

## Flex：完整计算过程

### 主轴与交叉轴

```css
.row {
  display: flex;
  flex-direction: row;      /* 主轴水平 */
  justify-content: center;  /* 主轴对齐 */
  align-items: center;      /* 交叉轴对齐 */
  flex-wrap: wrap;          /* 是否换行 */
  gap: 12px;                /* 间距，替代 margin */
}
```

### flex 简写展开

| 写法 | 等价 |
| --- | --- |
| `flex: 1` | `1 1 0%` |
| `flex: auto` | `1 1 auto` |
| `flex: none` | `0 0 auto` |
| `flex: 0 1 auto` | 默认值 |
| `flex: 2 3 100px` | grow=2 shrink=3 basis=100px |

`flex-basis` 指定主轴初始尺寸，**优先级高于 `width`**（非 auto 时）。

### 剩余空间分配

```
剩余空间 = 容器主轴尺寸 - 所有项目的 flex-basis 之和
每项增量 = 剩余空间 × (该项 flex-grow / grow 总和)
```

### 空间不足时的收缩

收缩加权：

```
缩放因子 = flex-shrink × flex-basis
每项收缩量 = 溢出量 × (该项缩放因子 / 缩放因子总和)
```

### 为什么 flex: 1 有时不收缩

```css
.item {
  flex: 1;
  /* 默认 min-width: auto，内容宽度是最小尺寸 */
}
```

长文本或长单词无法断行时，项目不会小于内容宽度。修复：

```css
.item {
  flex: 1;
  min-width: 0;    /* 关键 */
  overflow: hidden;
}
```

这是中后台布局最高频的坑，几乎每份真实代码都会遇到。

### 典型布局

```css
/* 左固定右自适应 */
.layout { display: flex; }
.sidebar { width: 240px; flex: 0 0 240px; }
.content { flex: 1; min-width: 0; }

/* 水平垂直居中 */
.center { display: flex; place-items: center; }

/* 等高卡片 + 底部对齐 */
.cards { display: flex; gap: 16px; align-items: stretch; }
.card { display: flex; flex-direction: column; }
.card .footer { margin-top: auto; }

/* 输入框与按钮同行，输入框自适应 */
.row { display: flex; gap: 8px; }
.row input { flex: 1; min-width: 0; }
```

## Grid：二维布局

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
```

这行代码是"自适应卡片列表"的标准答案：每列最小 280px，剩余空间均分。

### 常用能力

```css
/* 命名区域 */
.layout {
  grid-template-areas:
    'header header'
    'sidebar main';
}
.header { grid-area: header; }

/* 跨行跨列 */
.wide { grid-column: 1 / -1; }

/* 内容驱动的隐式轨道 */
.grid { grid-auto-rows: minmax(100px, auto); }
```

### Grid 的经典溢出问题

```css
/* 差：内容宽度会把 1fr 撑开 */
.grid { grid-template-columns: 1fr 1fr; }

/* 好：限制最小值 */
.grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
```

`1fr` 的隐含最小值是 `auto`（即内容最小尺寸），长内容会突破。`minmax(0, 1fr)` 强制允许收缩。

## Flex vs Grid 的选择

| 场景 | 推荐 |
| --- | --- |
| 一维排列（导航、按钮组） | Flex |
| 内容驱动尺寸 | Flex |
| 二维对齐（卡片网格、后台布局） | Grid |
| 需要行列同时对齐 | Grid |
| 要实现"最后一行左对齐" | Flex + wrap（Grid 会保持列宽） |

## 定位与层叠

```css
/* 定位基准 */
.relative { position: relative; }        /* 自身原位置 */
.absolute { position: absolute; }        /* 最近的非 static 祖先 */
.fixed { position: fixed; }              /* 视口（transform 祖先除外） */
.sticky { position: sticky; top: 10px; } /* 滚动阈值内相对，超出后固定 */
```

::: warn sticky 失效的四种原因
1. 没有设置 `top/bottom/left/right` 阈值
2. 祖先有 `overflow: hidden/auto/scroll`（滚动容器变了）
3. 祖先有 `transform/filter/perspective`（创建了新的包含块）
4. 父元素高度不足以产生滚动
:::

层叠上下文的触发：

- 根元素
- `position` 非 static 且 `z-index` 非 auto
- `opacity < 1`
- `transform`、`filter`、`perspective`、`backdrop-filter` 非 none
- `will-change` 指定上述属性
- `isolation: isolate`
- `contain: layout/paint`

层叠上下文一旦创建，内部的 `z-index` 只在内部比较。这是"z-index 设了 9999 还是被盖住"的根本原因。

## 居中方案速查

```css
/* 1. Flex */
.center { display: flex; align-items: center; justify-content: center; }

/* 2. Grid */
.center { display: grid; place-items: center; }

/* 3. absolute + transform */
.center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }

/* 4. absolute + inset + margin auto */
.center { position: absolute; inset: 0; margin: auto; width: max-content; height: max-content; }
```

现代项目首选 1 或 2；3 适合脱离文档流的场景（如模态框）；4 适合需要固定尺寸的居中。

::: interview 面试视角
被问"如何实现垂直居中"，只说 `flex` 会显得单薄。能说明各方案**适用条件与副作用**（如 transform 影响 fixed 定位的包含块），才体现深度。
:::