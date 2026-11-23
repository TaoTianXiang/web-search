## 单位对照

| 单位 | 参照 | 特点 |
| --- | --- | --- |
| `px` | 设备无关像素 | 固定，不随用户字号变化 |
| `em` | 当前元素（或父元素）的 font-size | **会累积**，嵌套层级下难预测 |
| `rem` | 根元素（html）的 font-size | 统一基准，适合整体缩放 |
| `vw` / `vh` | 视口宽 / 高 的 1% | 与视口绑定 |
| `vmin` / `vmax` | 视口宽高中较小 / 较大者 | 适合正方形元素 |
| `%` | 包含块对应尺寸 | 高度百分比需父元素有确定高度 |
| `ch` | 字符 "0" 的宽度 | 适合文本宽度限制 |
| `dvh` / `svh` / `lvh` | 动态/小/大视口高度 | 解决移动端地址栏收缩问题 |

## em 的累积问题

```css
.parent { font-size: 16px; }
.child { padding: 1em; }        /* 16px */
.grandchild { padding: 1em; }   /* 仍基于 child 的 font-size */
```

如果 child 自己也设了 `font-size: 1.2em`，grandchild 的 em 就是 16 × 1.2 × ... —— 层层放大。这是 em 难用的原因。

## rem 的典型用法

```js
// 动态设置根字号（1rem = 视口宽 / 10）
function setRem() {
  document.documentElement.style.fontSize = (document.documentElement.clientWidth / 10) + 'px'
}
setRem()
window.addEventListener('resize', setRem)
```

```css
.card { width: 3rem; }   /* 设计稿 750px 下 30vw = 3rem */
```

但现在更推荐用 `vw` 直接实现，或用 `clamp()` 做流体排版。

## 现代适配方案

### 1. 视口单位 + clamp

```css
/* 字号随视口流体变化，但有上下限 */
h1 { font-size: clamp(1.25rem, 4vw, 2.5rem); }

/* 容器宽度 */
.container { width: min(100% - 32px, 1200px); }
```

### 2. 媒体查询断点

```css
@media (min-width: 768px) { /* 平板 */ }
@media (min-width: 1200px) { /* 桌面 */ }
```

### 3. 容器查询（组件级响应式）

```css
.card-wrapper { container-type: inline-size; }
@container (min-width: 480px) {
  .card { grid-template-columns: 120px 1fr; }
}
```

### 4. 安全区域

```css
padding-bottom: env(safe-area-inset-bottom);
```

## 1px 边框问题

高 DPR（如 3）设备上，CSS 的 1px 会渲染成 3 个物理像素，看起来"偏粗"。

```css
/* 方案 1：transform 缩放伪元素 */
.hairline::after {
  content: '';
  position: absolute;
  left: 0; bottom: 0;
  width: 100%;
  height: 1px;
  background: #ddd;
  transform: scaleY(0.5);
  transform-origin: bottom;
}

/* 方案 2：直接设 0.5px（部分浏览器支持） */
.border { border-bottom: 0.5px solid #ddd; }

/* 方案 3：box-shadow */
.border { box-shadow: inset 0 -1px 0 #ddd; }
```

## 移动端 100vh 问题

```css
/* 地址栏收起/展开时 vh 会变化，导致布局跳动 */
.hero { height: 100vh; }

/* 现代方案：动态视口单位 */
.hero { height: 100dvh; }   /* 动态：随地址栏变化 */

/* 兼容方案 */
.hero { height: 100vh; height: 100dvh; }
```

| 单位 | 含义 |
| --- | --- |
| `vh` | 大视口（地址栏隐藏时） |
| `svh` | 小视口（地址栏显示时） |
| `lvh` | 大视口 |
| `dvh` | 动态，随状态变化 |

## 用户字号与无障碍

```css
/* ❌ 用 px 会让用户调大字号时无效 */
.text { font-size: 14px; }

/* ✅ rem 随根字号缩放 */
.text { font-size: 0.875rem; }
```

浏览器设置中调大默认字号时，rem 会跟随变化，而 px 不会。这是无障碍的重要考量。

::: interview 面试视角
能说清"em 会逐层累积"、"100vh 在移动端的跳动问题以及 dvh 的解决"、"1px 边框用 transform 缩放"，说明你做过真实的移动端适配。
:::
