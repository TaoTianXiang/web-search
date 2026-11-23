## 简写展开

| 简写 | 展开 |
| --- | --- |
| `flex: 1` | `1 1 0%` |
| `flex: auto` | `1 1 auto` |
| `flex: none` | `0 0 auto` |
| `flex: 0 1 auto` | 默认值 |
| `flex: 2 3 100px` | grow=2 shrink=3 basis=100px |

`flex-basis` 指定主轴初始尺寸，**优先级高于 width**（非 auto 时）。

## 剩余空间分配

```
剩余空间 = 容器主轴尺寸 − 各项 flex-basis 之和
每项增量 = 剩余空间 × (该项 grow / grow 总和)
```

```css
.container { display: flex; width: 600px; }
.a { flex: 1; }       /* 1fr */
.b { flex: 2; }       /* 2fr */
/* a = 200px, b = 400px */
```

## 空间不足时的收缩

```
缩放因子 = flex-shrink × flex-basis
每项收缩 = 溢出量 × (该项因子 / 因子总和)
```

这是"按比例收缩，而不是平均收缩"的原因。

## 为什么 flex: 1 有时不收缩

```css
.item {
  flex: 1;
  /* 默认 min-width: auto */
}
```

`min-width: auto` 对 flex item 意味着"最小尺寸 = 内容尺寸"。长文本或长单词无法断行时，item 不会小于内容宽度。

```css
/* 修复 */
.item {
  flex: 1;
  min-width: 0;      /* 允许收缩到内容以下 */
  overflow: hidden;
}
```

这是中后台布局最高频的坑。

## 主轴与交叉轴对齐

```css
.container {
  display: flex;
  flex-direction: row;        /* 主轴水平 */
  justify-content: space-between;  /* 主轴对齐 */
  align-items: center;             /* 交叉轴对齐 */
  align-content: flex-start;       /* 多行时行间对齐（需 wrap） */
  flex-wrap: wrap;
  gap: 12px;
}
```

| 属性 | 轴 | 常用值 |
| --- | --- | --- |
| `justify-content` | 主轴 | flex-start / center / space-between / space-around / space-evenly |
| `align-items` | 交叉轴（单行） | stretch / center / flex-start / baseline |
| `align-content` | 交叉轴（多行） | 同 justify-content |
| `align-self` | 单个 item | 覆盖 align-items |

`flex-direction: column` 时主轴变成垂直，`justify-content` 与 `align-items` 的作用方向互换。

## 常见布局模板

```css
/* 左固定右自适应 */
.row { display: flex; }
.aside { flex: 0 0 240px; }
.main { flex: 1; min-width: 0; }

/* 等高卡片 + 底部对齐 */
.cards { display: flex; gap: 16px; align-items: stretch; }
.card { display: flex; flex-direction: column; }
.card-footer { margin-top: auto; }

/* 输入框自适应 + 按钮固定 */
.form-row { display: flex; gap: 8px; }
.form-row input { flex: 1; min-width: 0; }
```

## Flex 与 Grid 的选择

| 场景 | 选择 |
| --- | --- |
| 一维排列 | Flex |
| 内容驱动尺寸 | Flex |
| 二维网格 | Grid |
| 最后一行左对齐 | Flex + wrap（Grid 会保持列宽） |

::: warn 绝对定位子元素的包含块
flex 容器内的 `position: absolute` 子元素，其包含块是**最近的定位祖先**，而不是 flex 容器（除非 flex 容器本身有 position）。这与"flex 容器是包含块"的直觉不同。
:::

::: interview 面试视角
能说出 `min-width: 0` 的原因（min-width: auto 是内容最小尺寸），以及"shrink 按 basis 加权收缩"，说明你调过真实布局。
:::
