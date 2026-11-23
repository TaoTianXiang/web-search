## 三方对比

| 维度 | display: none | visibility: hidden | opacity: 0 |
| --- | --- | --- | --- |
| 占据空间 | ❌ 不占位 | ✅ 占位 | ✅ 占位 |
| 触发重排 | ✅ | ❌（仅重绘） | ❌（仅合成） |
| 可被点击 | ❌ | ❌ | ✅ **可以** |
| 可被 Tab 聚焦 | ❌ | ❌ | ✅ **可以** |
| 子元素可覆盖 | ❌ | ✅（`visibility: visible`） | ❌ |
| 屏幕阅读器 | 不读 | 不读 | **会读** |
| 支持过渡动画 | ❌（无法过渡 display，除非用 `@starting-style`） | ✅ | ✅ |

## 事件与焦点的陷阱

```css
/* 常见错误：用 opacity 做"视觉隐藏"，但元素仍可交互 */
.hidden { opacity: 0; }
```

```js
// 用户看不到，但能点到、能 Tab 到
document.querySelector('.hidden').click()   // 有效
```

正确做法是**组合使用**：

```css
/* 视觉隐藏 + 不可交互 */
.hidden {
  opacity: 0;
  pointer-events: none;
  /* 如需彻底移出无障碍树 */
  /* visibility: hidden; */
}
```

## 子元素覆盖 visibility

```css
.parent { visibility: hidden; }
.child { visibility: visible; }   /* ✅ 子元素可以重新显示 */
```

这是 `visibility` 独有能力。`display: none` 一旦生效，子元素完全不存在，无法覆盖。

## 动画差异

```css
/* display 无法过渡，会瞬间切换 */
.menu { display: none; transition: opacity 0.3s; }
.menu.open { display: block; }   /* 没有淡入效果 */

/* visibility 可以延迟切换 */
.menu { visibility: hidden; opacity: 0; transition: opacity 0.3s, visibility 0.3s; }
.menu.open { visibility: visible; opacity: 1; }
```

CSS 2024 的 `@starting-style` 与 `transition-behavior: allow-discrete` 让 display 也能参与过渡：

```css
.dialog {
  display: none;
  opacity: 0;
  transition: opacity 0.3s, display 0.3s allow-discrete;
}
.dialog.open { display: block; opacity: 1; }
```

## 无障碍注意

```html
<!-- opacity: 0 的元素仍会被屏幕阅读器读到 -->
<div style="opacity: 0">重要提示</div>
```

如果只是"视觉隐藏但需要被读屏访问"，可以用 visually-hidden 技巧：

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

## 性能权衡

| 属性 | 代价 |
| --- | --- |
| `display: none` | 重排（布局树变化） |
| `visibility: hidden` | 重绘 |
| `opacity: 0` | 合成（最便宜） |

所以高频切换的场景（如 hover 效果）优先用 opacity/transform。

::: warn display: none 不会停止 CSS 动画
`display: none` 的元素上的 CSS 动画会**暂停**；恢复显示时会从头开始（取决于 `animation-play-state`）。
但 `setInterval` 等 JS 逻辑仍在运行，需要手动清理。
:::

::: interview 面试视角
能指出"opacity: 0 仍可点击、仍被读屏访问"是最有区分度的回答，因为这是真实的无障碍与交互 bug 来源。
:::
