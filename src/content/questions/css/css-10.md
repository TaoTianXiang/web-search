## 三角形

原理：当元素的宽高为 0 时，border 会呈现为三角形拼接。

```css
/* 朝上的三角形 */
.triangle-up {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 16px solid #3355ff;
}
```

```
      ╱╲
     ╱  ╲
    ╱____╲
  
  四个 border 都是三角形，把不需要的设为 transparent
```

其他方向只需调整哪个 border 有颜色：

```css
/* 朝下 */
.triangle-down { border-top-color: #3355ff; }

/* 朝右 */
.triangle-right {
  border-top: 10px solid transparent;
  border-bottom: 10px solid transparent;
  border-left: 16px solid #3355ff;
}
```

### 现代写法：clip-path

```css
.triangle {
  width: 20px;
  height: 16px;
  background: #3355ff;
  clip-path: polygon(50% 0, 0 100%, 100% 100%);
}
```

更灵活：可以做任意多边形。

## 圆角梯形

```css
.trapezoid {
  width: 120px;
  height: 60px;
  background: #3355ff;
  clip-path: polygon(20% 0, 80% 0, 100% 100%, 0 100%);
  border-radius: 8px;   /* 注意：clip-path 后 border-radius 无效 */
}
```

需要圆角时用 `mask` 或 SVG。

## 翻牌效果

```css
.flip-card {
  perspective: 1000px;
}
.flip-inner {
  position: relative;
  width: 200px;
  height: 260px;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.flip-card:hover .flip-inner {
  transform: rotateY(180deg);
}
.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}
.back {
  transform: rotateY(180deg);
}
```

```html
<div class="flip-card">
  <div class="flip-inner">
    <div class="face front">正面</div>
    <div class="face back">背面</div>
  </div>
</div>
```

三个关键属性：

| 属性 | 作用 |
| --- | --- |
| `perspective` | 设置 3D 透视距离（在父元素上） |
| `transform-style: preserve-3d` | 让子元素保持 3D 空间 |
| `backface-visibility: hidden` | 背面不可见，避免透出镜像内容 |

## 其他常见图形

```css
/* 圆 */
.circle { border-radius: 50%; }

/* 椭圆 */
.ellipse { border-radius: 50% / 30%; }

/* 半圆 */
.half-circle {
  width: 60px;
  height: 30px;
  border-radius: 60px 60px 0 0;
}

/* 五角星 */
.star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}

/* 气泡（带小三角） */
.bubble {
  position: relative;
  background: #eee;
  padding: 8px 12px;
  border-radius: 6px;
}
.bubble::after {
  content: '';
  position: absolute;
  left: -6px;
  top: 50%;
  margin-top: -6px;
  border: 6px solid transparent;
  border-right-color: #eee;
}
```

## 性能注意

```css
/* clip-path 与 mask 会触发额外的合成层与重绘 */
/* 大量使用可能影响性能，静态装饰无碍 */
```

::: tip 什么时候该用 SVG
1. 形状复杂（超过 10 个顶点）
2. 需要描边（border 无法随 clip-path 变化）
3. 需要动画 morph（过渡不同形状）

clip-path 的强项是"简单几何 + 可动画"，复杂图形交给 SVG 更合适。
:::

::: interview 面试视角
三角形题的重点是"border 在宽高为 0 时是三角形"这个原理，而不是背代码。能补上 clip-path 的现代写法与适用边界，会更完整。
:::
