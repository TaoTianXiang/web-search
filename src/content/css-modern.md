近五年 CSS 的变化比之前十年都大。这些能力不只是"写法更短"，而是解决了很多必须靠 JS 或构建工具才能处理的问题。

## 级联层（@layer）

问题是：第三方样式、设计系统、业务样式混在一起，只能靠选择器权重和 `!important` 硬拼。

```css
/* 先声明层的顺序 */
@layer reset, base, components, utilities;

@layer reset {
  * { margin: 0; }
}

@layer components {
  .btn { padding: 8px 16px; }
}

@layer utilities {
  .m-0 { margin: 0; }  /* 权重只有 0,1,0，但能覆盖 components */
}
```

**层的顺序优先于选择器权重**。后声明的层覆盖先声明的层，无论选择器权重高低。

```css
/* 未分层样式 > 所有分层样式 */
.card { color: red; }        /* 不在任何 layer 中 */
@layer base {
  #main .card { color: blue; } /* 权重更高，但仍然输 */
}
```

### 实践建议

```css
@layer reset, vendor, base, layout, components, utilities, overrides;

@import url('third-party.css') layer(vendor);
```

把第三方样式放进 `vendor` 层，业务代码永远能覆盖它，不需要 `!important`。

::: tip 与 !important 的关系
分层中的 `!important` 会**反转**层顺序：先声明的层中的 `!important` 优先级更高。这个设计让"重置样式"可以强制覆盖一切。
:::

## 容器查询

媒体查询看视口，容器查询看**父容器**尺寸。这让组件真正可以"一次编写，处处适配"。

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

.card { display: grid; grid-template-columns: 1fr; }

@container card (min-width: 480px) {
  .card { grid-template-columns: 120px 1fr; }
}
```

### container-type 的三个值

| 值 | 建立 | 用途 |
| --- | --- | --- |
| `size` | 尺寸容器（宽高都可查询） | 需要查高度时 |
| `inline-size` | 行内尺寸容器（仅宽度） | 大多数场景 |
| `normal` | 不建立容器 | 仅做 `container-name` 标记 |

::: warn 注意
`container-type: size` 会让元素的高度**脱离内容**（成为独立格式化上下文），可能引发布局问题。默认用 `inline-size` 更安全。
:::

### 容器查询单位

```css
.title { font-size: clamp(1rem, 4cqi, 2rem); }
```

`cqw` / `cqh` / `cqi` / `cqb` / `cqmin` / `cqmax` 分别对应容器宽、高、行内、块、最小、最大。

## :has()：父选择器终于来了

```css
/* 有图片的卡片用不同布局 */
.card:has(img) { padding: 0; }

/* 表单有错误时高亮整个字段组 */
.field:has(input:invalid) { border-color: red; }

/* 数量不同时的布局 */
.list:has(> :nth-child(4)) { grid-template-columns: repeat(4, 1fr); }
```

`：has()` 的能力等价于"根据后代状态反向选择祖先"，过去只能靠 JS 监听实现。

### 性能注意

`:has()` 的选择器匹配代价较高，浏览器会做优化（如只看可能的候选）。避免在超长列表上使用复杂 `:has()`：

```css
/* 避免 */
li:has(> .icon):has(> .badge):has(> .time) { ... }

/* 更好：用一个状态类 */
li.is-active { ... }
```

## 逻辑属性

物理属性（`margin-left`）在多语言场景下会错位。逻辑属性按**书写方向**定义：

```css
/* 物理 */
.box { margin-left: 16px; padding-top: 8px; border-right: 1px solid; }

/* 逻辑 */
.box {
  margin-inline-start: 16px;
  padding-block-start: 8px;
  border-inline-end: 1px solid;
}
```

| 逻辑 | LTR 对应 | RTL 对应 |
| --- | --- | --- |
| `inline-start` | left | right |
| `inline-end` | right | left |
| `block-start` | top | top |
| `block-end` | bottom | bottom |

配合 `direction: rtl` 或 `dir="rtl"`，整套布局自动镜像。

## 颜色空间

```css
/* sRGB */
.a { color: rgb(255 0 0 / 0.5); }

/* HSL —— 直观但不均匀 */
.b { color: hsl(210 100% 50%); }

/* OKLCH —— 感知均匀，适合生成调色板 */
.c { color: oklch(0.7 0.15 250); }

/* 颜色混合 */
.d { color: color-mix(in oklch, red 30%, blue); }
```

为什么 OKLCH 更好：在 HSL 中，相同亮度差在不同色相下视觉差异很大；OKLCH 的 L（亮度）与人类感知一致，生成阶梯色不会出现"黄色刺眼、蓝色发灰"。

```css
/* 自动生成深浅色阶 */
:root {
  --brand-500: oklch(0.62 0.18 255);
  --brand-300: oklch(from var(--brand-500) calc(l + 0.15) c h);
  --brand-700: oklch(from var(--brand-500) calc(l - 0.15) c h);
}
```

## @property：让自定义属性可被动画

普通自定义属性是"字符串替换"，无法做类型校验与过渡动画。

```css
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.gradient {
  background: conic-gradient(from var(--angle), #3355ff, #7c4dff);
  transition: --angle 0.6s ease;
}

.gradient:hover {
  --angle: 180deg;
}
```

没有 `@property` 时，`transition: --angle` 是无效的，因为浏览器不知道它是角度还是字符串。

::: tip 用武之地
- 渐变角度动画
- 进度条自定义属性过渡
- 数字计数器（配合 `counter-reset`）
:::

## 其他值得掌握的能力

```css
/* 1. aspect-ratio：替代 padding-top hack */
.thumb { aspect-ratio: 16 / 9; }

/* 2. gap 在 flex 中可用（现代浏览器） */
.row { display: flex; gap: 12px; }

/* 3. subgrid：让子元素对齐到父网格 */
.parent { display: grid; grid-template-columns: 1fr 1fr; }
.child { display: grid; grid-template-columns: subgrid; grid-column: 1 / -1; }

/* 4. text-wrap: balance：标题断行更均衡 */
h1 { text-wrap: balance; }

/* 5. scroll-snap：滚动吸附 */
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}
.carousel > * { scroll-snap-align: start; }

/* 6. content-visibility：跳过长列表的渲染 */
.row { content-visibility: auto; contain-intrinsic-size: 0 60px; }

/* 7. 全新选择器 */
:is(h1, h2, h3) { line-height: 1.3; }
:where(.reset *) { margin: 0; }       /* 权重为 0 */
:not(:last-child) { margin-bottom: 8px; }
```

## 兼容性策略

| 能力 | 兼容 |
| --- | --- |
| `@layer` | Chrome 99+、Safari 15.4+ |
| 容器查询 | Chrome 105+、Safari 16+ |
| `:has()` | Chrome 105+、Safari 15.4+ |
| `@property` | Chrome 85+、Safari 16.4+ |
| `oklch` | Chrome 111+、Safari 15.4+ |
| `subgrid` | Chrome 117+、Safari 16+ |

用 `@supports` 做渐进增强：

```css
.sticky-header { position: relative; }

@supports (position: sticky) {
  .sticky-header { position: sticky; top: 0; }
}
```

::: interview 面试视角
被问"你了解哪些新 CSS 特性"，只说名字没有意义。要说清 **它解决了什么过去必须靠 JS/构建解决的问题**，以及你的项目**是否已经用上、为什么用或不用**。
:::