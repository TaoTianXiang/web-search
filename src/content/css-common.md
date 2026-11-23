这一章把 CSS 面试中最高频的"细节题"集中处理：它们看似简单，但真正区分水平的是**副作用**与**排查思路**。

## 一、居中的五种方案

```css
/* 1. Flex（现代首选） */
.center-flex { display: flex; align-items: center; justify-content: center; }

/* 2. Grid（更短） */
.center-grid { display: grid; place-items: center; }

/* 3. absolute + transform */
.center-transform {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}

/* 4. absolute + inset + margin auto（需确定尺寸） */
.center-margin {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 200px; height: 100px;
}

/* 5. table-cell（旧方案） */
.center-table {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
}
```

| 方式 | 需要已知尺寸 | 副作用 |
| --- | --- | --- |
| Flex | ❌ | 父元素成为 flex 容器，子元素变成 flex item |
| Grid | ❌ | 同上 |
| transform | ❌ | **创建包含块**，内部 fixed 定位基准改变 |
| margin auto | ✅ | 脱离文档流 |
| table-cell | ❌ | 语义混乱，影响其他布局 |

::: warn transform 的隐藏副作用
```css
.modal { transform: translate(-50%, -50%); }
```
`transform` 会让 `.modal` 成为**包含块**，其内部 `position: fixed` 的下拉框、tooltip 会相对 modal 定位，而不是视口。这是"弹窗里下拉框位置错乱"的最常见原因。
:::

## 二、display: none / visibility: hidden / opacity: 0

| 维度 | display: none | visibility: hidden | opacity: 0 |
| --- | --- | --- | --- |
| 占据空间 | ❌ | ✅ | ✅ |
| 触发重排 | ✅ | ❌ | ❌ |
| **可被点击** | ❌ | ❌ | ✅ |
| **可被 Tab 聚焦** | ❌ | ❌ | ✅ |
| 子元素可覆盖 | ❌ | ✅ | ❌ |
| **屏幕阅读器** | 不读 | 不读 | **会读** |
| 支持过渡 | ❌（需 allow-discrete） | ✅ | ✅ |

```css
/* opacity: 0 是最危险的"隐藏"——元素仍可交互 */
.hidden { opacity: 0; }

/* 正确做法：明确不可交互 */
.hidden {
  opacity: 0;
  pointer-events: none;
}
```

### 视觉隐藏但可被读屏访问

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

### 性能差异

| 属性 | 代价 |
| --- | --- |
| display: none | 重排（布局树变化） |
| visibility: hidden | 重绘 |
| opacity: 0 | 合成（最便宜） |

高频切换的场景（hover、折叠动画）优先用 opacity + transform。

## 三、层叠上下文与 z-index

### 创建层叠上下文的属性

| 属性 | 条件 |
| --- | --- |
| `position` | 非 static 且 z-index 非 auto |
| `opacity` | < 1 |
| `transform` / `filter` / `perspective` | 非 none |
| `isolation` | `isolate` |
| `will-change` | 指定上述属性 |
| `contain` | layout / paint |
| `mix-blend-mode` | 非 normal |
| flex / grid item | 且 z-index 非 auto |

### 为什么 9999 被盖住

```html
<div class="modal" style="transform: translateZ(0)">
  <div class="tooltip" style="z-index: 9999">提示</div>
</div>
<div class="toast" style="z-index: 10">其他</div>
```

`.modal` 因 transform 创建了层叠上下文（z-index 等价于 0），整体层级低于 `.toast` 的 10。内部 9999 只在 modal 内部有效。

**修复**：给 `.modal` 本身设置更高的 z-index，或用 Portal 把 tooltip 挂到 body。

```css
:root {
  --z-dropdown: 1000;
  --z-modal: 1050;
  --z-toast: 1080;
  --z-tooltip: 1090;
}
```

### 排查脚本

```js
function stackingAncestor(el) {
  const hasContext = (node) => {
    const s = getComputedStyle(node)
    return (
      (s.position !== 'static' && s.zIndex !== 'auto') ||
      s.opacity !== '1' ||
      s.transform !== 'none' ||
      s.filter !== 'none' ||
      s.isolation === 'isolate'
    )
  }
  let node = el.parentElement
  while (node) {
    if (hasContext(node)) return node
    node = node.parentElement
  }
  return document.documentElement
}
```

## 四、单位和移动端适配

| 单位 | 参照 | 注意 |
| --- | --- | --- |
| `px` | 设备无关像素 | 不随用户字号缩放 |
| `em` | 当前元素 font-size | **逐层累积** |
| `rem` | 根元素 font-size | 适合整体缩放 |
| `vw/vh` | 视口 1% | 移动端 vh 会跳动 |
| `dvh/svh/lvh` | 动态/小/大视口 | 解决地址栏问题 |
| `%` | 包含块 | 高度百分比需父元素有确定高度 |

### em 的累积

```css
.parent { font-size: 16px; }
.child { font-size: 1.2em; padding: 1em; }        /* padding = 19.2px */
.grandchild { padding: 1em; }                     /* 基于 child 的 19.2px */
```

这是 em 难用的根本原因：同一个 `1em` 在不同层级含义不同。

### 移动端 100vh 问题

```css
/* 地址栏收起/展开时 vh 变化，导致布局跳动 */
.hero { height: 100vh; }

/* 现代方案 */
.hero { height: 100dvh; }

/* 兼容写法 */
.hero { height: 100vh; height: 100dvh; }
```

### 1px 边框

高 DPR 下 CSS 1px 会渲染成 3 个物理像素，看起来偏粗。

```css
/* 方案 1：伪元素 + 缩放 */
.hairline { position: relative; }
.hairline::after {
  content: '';
  position: absolute;
  left: 0; bottom: 0;
  width: 100%; height: 1px;
  background: #ddd;
  transform: scaleY(0.5);
  transform-origin: bottom;
}

/* 方案 2：直接 0.5px（部分浏览器支持） */
.border { border-bottom: 0.5px solid #ddd; }
```

### 无障碍视角

```css
/* ❌ 用户调大字号时完全无效 */
.text { font-size: 14px; }

/* ✅ 随根字号缩放 */
.text { font-size: 0.875rem; }
```

## 五、CSS 图形

### 三角形

```css
.triangle-up {
  width: 0; height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 16px solid #3355ff;
}
```

原理：宽高为 0 时，border 呈现为四个三角形拼接。

现代写法：

```css
.triangle {
  width: 20px; height: 16px;
  background: #3355ff;
  clip-path: polygon(50% 0, 0 100%, 100% 100%);
}
```

### 翻牌

```css
.flip-card { perspective: 1000px; }
.flip-inner {
  position: relative;
  width: 200px; height: 260px;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}
.flip-card:hover .flip-inner { transform: rotateY(180deg); }
.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}
.back { transform: rotateY(180deg); }
```

三个关键属性：

| 属性 | 作用 |
| --- | --- |
| `perspective` | 在父元素上设置 3D 透视距离 |
| `transform-style: preserve-3d` | 让子元素保持 3D 空间 |
| `backface-visibility: hidden` | 背面不可见，避免透出镜像 |

## 六、响应式手段的分工

```
页面骨架    → 媒体查询（决定整体分栏）
组件内部    → 容器查询（根据可用空间）
字号与间距  → clamp（连续流体变化）
列表与卡片  → grid + auto-fill
图片       → srcset + sizes
```

```css
/* 容器查询：组件级响应式 */
.card-wrapper { container-type: inline-size; }
@container (min-width: 480px) {
  .card { grid-template-columns: 120px 1fr; }
}
```

::: tip 媒体查询与容器查询的本质区别
媒体查询回答"**页面**有多宽"，容器查询回答"**这块区域**有多宽"。组件复用在不同侧栏、弹窗中时，只有容器查询能正确适配。
:::

::: interview 面试视角
CSS 题的区分度不在"你会不会写"，而在"你知道什么情况下它会坏"。主动说出 transform 影响 fixed、opacity: 0 仍可点击、100vh 在移动端会跳动，就是真实经验。
:::