## 五种方式

### 1. Flex（现代首选）

```css
.parent {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

优点：代码短，子元素尺寸任意。缺点：父元素变成 flex 容器，可能影响其他子元素的布局。

### 2. Grid（更简洁）

```css
.parent { display: grid; place-items: center; }
```

`place-items: center` 等价于 `align-items: center; justify-items: center`。

### 3. absolute + transform

```css
.parent { position: relative; }
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
```

优点：脱离文档流，不影响其他元素。缺点：子元素尺寸需已知（或由内容决定），且 `transform` 会创建包含块，影响内部的 `fixed` 定位。

### 4. absolute + inset + margin auto

```css
.parent { position: relative; }
.child {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 200px;
  height: 100px;
}
```

要求子元素有**确定尺寸**，但不需要知道具体数值（用 margin auto 自动分配）。

### 5. table-cell（旧方案）

```css
.parent {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
}
```

可用但已被 Flex/Grid 取代，仅在需要兼容极老浏览器时使用。

## 对照表

| 方式 | 需要已知尺寸 | 影响文档流 | 副作用 |
| --- | --- | --- | --- |
| Flex | ❌ | 父元素成为 flex 容器 | 子元素变为 flex item |
| Grid | ❌ | 同上 | 同 |
| absolute + transform | ❌（内容决定） | ✅ 脱离 | 创建包含块，影响 fixed |
| absolute + margin auto | ✅ | ✅ 脱离 | 需要显式尺寸 |
| table-cell | ❌ | ❌ | 语义不清晰 |

## 文字居中 vs 块居中

```css
/* 单行文字水平居中 */
.text { text-align: center; }

/* 单行文字垂直居中（已知行高） */
.line { height: 40px; line-height: 40px; }

/* 多行文字垂直居中 */
.box { display: flex; align-items: center; }
```

`line-height` 只适合单行；多行必须用 flex/grid。

## 响应式居中

```css
/* 居中的同时限制最大宽度 */
.dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(90vw, 480px);
  height: fit-content;
  max-height: 80vh;
  overflow: auto;
}
```

::: warn transform 的隐藏副作用
```css
.modal { transform: translate(-50%, -50%); }
```
`transform` 会创建新的**包含块**，其内部 `position: fixed` 的元素会相对这个 modal 定位，而不是视口。这是"弹窗里的下拉框位置错乱"的常见原因。
:::

::: interview 面试视角
能说出"transform 会创建包含块影响 fixed 定位"，比列出五种方式更有价值。这是真实项目中最容易踩的坑。
:::
