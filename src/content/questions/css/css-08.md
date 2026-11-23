## 层叠上下文是什么

一个独立的**三维（z 轴）绘制区域**。内部元素的 z-index 只在同一上下文内比较，不同上下文之间按"父上下文的层级"整体排序。

```
根层叠上下文
├── 上下文 A（z-index: 1）
│   └── 内部 z-index: 9999  ← 也只在这个上下文内最高
└── 上下文 B（z-index: 2）   ← 整体盖住 A 的所有内部元素
```

## 创建层叠上下文的属性

| 属性 | 条件 |
| --- | --- |
| `position` | 非 static 且 `z-index` 非 auto |
| `opacity` | < 1 |
| `transform` / `scale` / `rotate` | 非 none |
| `filter` / `backdrop-filter` | 非 none |
| `perspective` | 非 none |
| `isolation` | `isolate` |
| `will-change` | 指定上述属性 |
| `contain` | `layout` / `paint` |
| `mix-blend-mode` | 非 normal |
| flex / grid item | 且 `z-index` 非 auto |

## 为什么 z-index: 9999 被盖住

```html
<div class="modal" style="transform: translateZ(0)">
  <!-- 内部 z-index: 9999 -->
  <div class="tooltip" style="z-index: 9999">提示</div>
</div>
<div class="other" style="z-index: 10">其他内容</div>
```

问题：`.modal` 因为 `transform` 创建了层叠上下文，但没有设置 z-index（等价于 auto/0）。所以整个 modal 的层级低于 `.other` 的 10。内部 tooltip 的 9999 只在 modal 内部有效。

**修复**：给 modal 本身设置更高的 z-index。

```css
.modal { transform: translateZ(0); z-index: 100; }
```

## 排查流程

1. 从被盖住的元素向上遍历祖先，找出第一个创建层叠上下文的元素
2. 检查该元素的 z-index（或等价层级）
3. 与遮挡元素的上下文比较
4. 修复方式：调整祖先的 z-index，或把弹层移到 body 下（Portal）

```js
// 快速检查某元素是否创建了层叠上下文
const hasContext = (el) => {
  const s = getComputedStyle(el)
  return (
    (s.position !== 'static' && s.zIndex !== 'auto') ||
    s.opacity !== '1' ||
    s.transform !== 'none' ||
    s.filter !== 'none' ||
    s.isolation === 'isolate'
  )
}
```

## 规范中的层叠顺序（同一上下文内）

从低到高：

1. 背景与边框
2. 负 z-index 的子元素
3. 块级盒（普通流）
4. 浮动元素
5. 行内盒
6. z-index: 0 / auto 的定位元素
7. 正 z-index 的定位元素

## 工程实践

```css
/* 用统一的分层常量，避免 z-index 战争 */
:root {
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-modal: 1050;
  --z-toast: 1080;
  --z-tooltip: 1090;
}
```

弹层组件（Modal、Dropdown、Tooltip）通常用 **Portal 挂到 body**，彻底绕开父级层叠上下文：

```js
// React
createPortal(<Tooltip />, document.body)

// Vue
<Teleport to="body"><Tooltip /></Teleport>
```

::: warn transform 的连锁影响
`transform` 不仅创建层叠上下文，还创建**包含块**，导致内部 `position: fixed` 相对它定位。这是"弹窗里 fixed 定位失效"的根本原因。
:::

::: interview 面试视角
能解释"z-index 只在同一层叠上下文内比较"，并给出"用 Portal 绕开"的方案，就是从"调数字"到"理解机制"的跨越。
:::
