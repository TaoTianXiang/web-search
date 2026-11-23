## 四种手段

| 手段 | 依据 | 粒度 |
| --- | --- | --- |
| 媒体查询 | 视口尺寸 | 页面级 |
| 容器查询 | 父容器尺寸 | 组件级 |
| 流体排版（clamp / min / max） | 视口比例 | 连续变化 |
| 弹性布局（flex / grid） | 可用空间 | 自动适应 |

## 媒体查询

```css
/* 移动优先：从小到大写 */
.card { padding: 12px; }

@media (min-width: 768px) {
  .card { padding: 20px; }
}

@media (min-width: 1200px) {
  .card { padding: 28px; max-width: 480px; }
}
```

常用断点（非固定标准）：

```css
/* 手机  < 640 */
/* 平板  640 – 1024 */
/* 桌面  1024 – 1440 */
/* 大屏  > 1440 */
```

## 移动优先 vs 桌面优先

| | 移动优先 | 桌面优先 |
| --- | --- | --- |
| 写法 | 默认小屏，`min-width` 递增 | 默认大屏，`max-width` 递减 |
| 优点 | 增量增强，性能更友好 | 适合从设计稿开始 |
| 缺点 | 需要先想清最小可用形态 | 容易加载多余样式 |

移动优先更主流，因为移动流量占比高、渐进增强更符合 Web 原则。

```css
/* 移动优先示例 */
.grid { grid-template-columns: 1fr; }

@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

## 容器查询（组件级）

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* 当卡片容器宽度 ≥ 400px 时改变布局 */
@container card (min-width: 400px) {
  .card { grid-template-columns: 120px 1fr; }
}
```

价值：组件不再依赖"页面在哪个断点"，而是"我有多宽的空间"。这让组件真正可以复用在不同侧边栏、弹窗里。

```css
/* 查询单位 */
.title { font-size: clamp(1rem, 4cqi, 1.8rem); }
```

## 流体排版

```css
/* 字号随视口连续变化 */
h1 { font-size: clamp(1.5rem, 1rem + 2vw, 2.5rem); }

/* 容器宽度：不超过 1200，两侧留白 */
.wrap { width: min(100% - 2rem, 1200px); margin-inline: auto; }
```

优势：没有断点的"跳变"，视觉更平滑。适合排版与间距。

## 响应式图片

```html
<img
  src="small.jpg"
  srcset="small.jpg 480w, medium.jpg 960w, large.jpg 1440w"
  sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
  alt="..."
>
```

`<picture>` 用于"不同格式/不同裁切"：

```html
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="...">
</picture>
```

## 组合策略

```
页面骨架    → 媒体查询（确定整体分栏）
组件内部    → 容器查询（根据可用空间调整）
字号与间距  → clamp（连续流体变化）
列表与卡片  → grid + auto-fill（自动换行）
图片       → srcset + sizes
```

## 常见误区

```css
/* ❌ 用设备类型（已过时） */
@media (max-device-width: 480px) { }

/* ✅ 用视口宽度 */
@media (max-width: 480px) { }

/* ❌ 只考虑宽度，忽略横屏与高 DPR */
@media (orientation: landscape) { }
@media (-webkit-min-device-pixel-ratio: 2) { }
```

::: interview 面试视角
能说清"容器查询解决的是组件在不同容器中的自适应，是媒体查询无法做到的"，并给出"骨架用媒体查询、组件用容器查询"的分工，就是有实践经验的回答。
:::
