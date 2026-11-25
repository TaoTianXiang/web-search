Vue 3 的性能优势有一半来自**编译期**。理解编译器做了什么，才能解释"为什么同样的模板，Vue 运行时比手写 DOM 操作还快"。

## 编译流程三步

```
template 字符串
      │
      ▼ parse
   AST（抽象语法树）
      │
      ▼ transform
   优化后的 AST（打上 PatchFlag、标记静态节点）
      │
      ▼ generate
  render 函数（或编译为 vnode）
```

### parse 阶段

```html
<div id="app">
  <span>{{ msg }}</span>
</div>
```

得到 AST：

```js
{
  type: 'Element',
  tag: 'div',
  props: [{ name: 'id', value: { content: 'app' } }],
  children: [
    { type: 'Element', tag: 'span', children: [{ type: 'Interpolation', content: 'msg' }] }
  ]
}
```

### transform 阶段

这一步做核心优化：

1. **静态节点提升**（hoistStatic）
2. **静态属性提升**
3. **缓存事件处理函数**（cacheHandlers）
4. **生成 {{PatchFlag}}**
5. **构建 {{Block Tree}}**

### generate 阶段

把 AST 转成可执行的渲染代码（字符串形式，运行时用 `new Function` 编译，或构建时预编译）。

## 静态提升（hoistStatic）

```html
<div>
  <p>这段文字永远不会变</p>
  <span>{{ dynamic }}</span>
</div>
```

编译前，每次渲染都会重新创建 `<p>` 的 vnode。提升后：

```js
// 提到模块作用域，只创建一次
const _hoisted_1 = createElementVNode('p', null, '这段文字永远不会变', -1 /* HOISTED */)

function render(_ctx) {
  return createElementVNode('div', null, [
    _hoisted_1, // 复用同一个 vnode 对象
    createElementVNode('span', null, toDisplayString(_ctx.dynamic), 1 /* TEXT */)
  ])
}
```

### 预字符串化（静态节点过多时）

连续 20 个以上静态节点会被合并为一段 HTML 字符串：

```js
const _hoisted_2 = createStaticVNode('<div class="a">...</div><div class="b">...</div>', 20)
```

减少 vnode 创建数量，直接用 `innerHTML` 挂载。

## PatchFlags：靶向更新的核心

```js
export const enum PatchFlags {
  TEXT = 1,               // 动态文本
  CLASS = 1 << 1,         // 动态 class
  STYLE = 1 << 2,         // 动态 style
  PROPS = 1 << 3,         // 动态属性（含 class/style 外的）
  FULL_PROPS = 1 << 4,    // 属性 key 会变化
  HYDRATE_EVENTS = 1 << 5,
  STABLE_FRAGMENT = 1 << 6,
  KEYED_FRAGMENT = 1 << 7,
  UNKEYED_FRAGMENT = 1 << 8,
  NEED_PATCH = 1 << 9,    // ref 或指令
  DYNAMIC_SLOTS = 1 << 10,
  DEV_ROOT_FRAGMENT = 1 << 11,
  HOISTED = -1,           // 静态，永不 diff
  BAIL = -2               // 不做优化（如 v-for 中动态 key）
}
```

```html
<div :class="cls" :id="id">{{ msg }}</div>
```

编译产物：

```js
createElementVNode('div', { class: _ctx.cls, id: _ctx.id }, toDisplayString(_ctx.msg), 7 /* TEXT | CLASS | PROPS */)
```

运行时 diff 看到 `7`，就知道只需要比对 `class`、属性与文本，**不必遍历全部属性**。

用位运算判断标记，是理解这套机制的关键：

```js
const PatchFlags = { TEXT: 1, CLASS: 2, STYLE: 4, PROPS: 8 }

const flag = 7 // TEXT | CLASS | PROPS
flag & PatchFlags.STYLE // 0 → 无需比对 style
```

一个标记位同时表达多个维度，diff 时用 `&` 逐项判断，避免字符串比较与数组遍历。

::: warn 编译优化的前提
优化依赖"模板是静态可分析的"。以下情况会退化：
- 在 `<template>` 中使用复杂 JS 表达式
- 大量 `v-html`（内容不可分析）
- 运行时动态生成的渲染函数

所以不要轻易把模板改写为 `h()` 手写渲染函数。
:::

## Block Tree：把 diff 从树变成列表

**Block** 是带有结构指令（`v-if`、`v-for`、`v-else-if`）或组件边界的节点。Block 内部会被"压平"成动态子节点数组：

```html
<div>              <!-- Block（根） -->
  <p>静态</p>
  <span>{{ a }}</span>   <!-- 动态，进入 block 的 dynamicChildren -->
  <section>              <!-- 结构指令 → 新的 Block -->
    <span>{{ b }}</span>
  </section>
</div>
```

Block 的 `dynamicChildren` 只包含 `span[a]`，`section` 作为嵌套 block 整体记录。

```js
const _block = createElementBlock('div', null, [
  _hoisted_1,
  createElementVNode('span', null, toDisplayString(_ctx.a), 1),
  createElementBlock('section', null, [...])
], 0 /* 无 patchFlag */)

_block.dynamicChildren = [spanVNode, sectionBlock]
```

diff 时只遍历 `dynamicChildren`，**不管静态内容有多少**。这把 diff 复杂度从"与模板大小相关"变成"与动态节点数相关"。

### 为什么要"压平"

嵌套越深，传统 vnode 树越大。Block 让 diff 只需要"一个平铺的动态节点列表"，配合 PatchFlags 就完成了靶向更新。

## 双端对比与 LIS

列表 diff 是最高频的面试题。

### 双端对比

同时从新旧列表的两端向内比较：

```
oldStart, oldEnd
newStart, newEnd
```

四个匹配分支：

1. `oldStart` vs `newStart`
2. `oldEnd` vs `newEnd`
3. `oldStart` vs `newEnd`（右侧复用左侧）
4. `oldEnd` vs `newStart`（左侧复用右侧）

任一命中就"原地复用 + 移动指针"。四个都不命中时，用 `key` 在 `oldKeyToIndex` 中查找。

```js
// 简化
while (i <= e1 && i <= e2) {
  const prev = c1[i]
  const next = c2[i]
  if (isSameVNodeType(prev, next)) {
    patch(prev, next)
  } else {
    break
  }
  i++
}
```

### 最长递增子序列（LIS）

双端对比后，中间剩下的乱序部分需要移动。朴素做法是逐个移动，最坏 O(n²)。

Vue 的做法：

1. 为新列表中的每个节点建立"旧索引"映射
2. 对旧索引序列求**{{最长递增子序列}}**（这些节点相对顺序不变，不需要移动）
3. 从后向前遍历，只移动不在 LIS 中的节点

先单独把 LIS 算法跑通，再看它在 diff 里的用法：

```js
// 返回 LIS 的下标数组，O(n log n)
function getSequence(arr) {
  const p = arr.slice()          // 前驱索引
  const result = [0]
  let i, j, u, v, c
  const len = arr.length

  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {            // 0 表示新增节点，不参与
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {            // 二分查找插入位置
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) u = c + 1
        else v = c
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) p[i] = result[u - 1]
        result[u] = i
      }
    }
  }

  // 回溯前驱，还原真实下标
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}

// 验证：旧列表 a b c d e，新列表 a c d b e
// 新节点在旧列表中的索引序列
const oldIndexes = [0, 2, 3, 1, 4]
console.log(getSequence(oldIndexes))  // → [0, 1, 2, 4]
// 对应索引 0,2,3,4 的节点（a c d e）保持不动，只需移动 b
```

```js
// getSequence 返回 LIS 的索引数组，O(n log n)
const increasingNewIndexSequence = getSequence(newIndexToOldIndexMap)
let j = increasingNewIndexSequence.length - 1

for (let i = toBePatched - 1; i >= 0; i--) {
  const nextIndex = s2 + i
  const nextChild = c2[nextIndex]
  const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor

  if (newIndexToOldIndexMap[i] === 0) {
    patch(null, nextChild, container, anchor) // 新增
  } else if (j < 0 || i !== increasingNewIndexSequence[j]) {
    move(nextChild, container, anchor) // 需要移动
  } else {
    j-- // LIS 中，保持不动
  }
}
```

**从后向前**遍历是关键：这样 `anchor`（插入参照）一定是已经处理过的节点。

### key 的作用

```html
<!-- 差：用 index 做 key -->
<li v-for="(item, index) in list" :key="index">

<!-- 好：用稳定 id -->
<li v-for="item in list" :key="item.id">
```

用 index 做 key，删除第一项时：

- 新列表的 index 0 对应旧列表的 index 0，但内容是第二项
- Vue 会复用 DOM 并更新内容
- 结果：所有节点的状态（输入框内容、动画、组件内部状态）都串位了

::: warn 什么时候可以用 index 做 key
只有当列表**只追加、不删除、不排序**时才安全。实际业务中很难保证。
:::

## 编译产物示例

```html
<template>
  <div :class="{ active: isActive }">
    <h1>{{ title }}</h1>
    <p v-if="show">可见</p>
    <ul>
      <li v-for="item in list" :key="item.id">{{ item.name }}</li>
    </ul>
  </div>
</template>
```

大致编译为：

```js
const _hoisted_1 = { class: 'title' }

export function render(_ctx, _cache) {
  return createElementBlock('div', {
    class: normalizeClass({ active: _ctx.isActive })
  }, [
    createElementVNode('h1', null, toDisplayString(_ctx.title), 1 /* TEXT */),
    _ctx.show
      ? (openBlock(), createElementBlock('p', { key: 0 }, '可见'))
      : createCommentVNode('v-if', true),
    createElementVNode('ul', null, [
      (openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.list, (item) => {
        return (openBlock(), createElementBlock('li', { key: item.id },
          toDisplayString(item.name), 1 /* TEXT */
        ))
      }), 128 /* KEYED_FRAGMENT */))
    ])
  ])
}
```

注意 `openBlock`：它开启一个新的 Block 收集动态子节点，`createElementBlock` 结束时关闭并记录。

## 与 Vue 2 的 diff 对照

| 维度 | Vue 2 | Vue 3 |
| --- | --- | --- |
| 动态信息 | 运行时全量对比 | 编译期 PatchFlag 标记 |
| 静态节点 | 每次重建 | 提升复用 |
| diff 范围 | 整棵树 | 只遍历 dynamicChildren |
| 列表移动 | 双端对比 + 逐个移动 | 双端 + LIS 最少移动 |
| 复杂度 | O(n) 但常数大 | O(n) 且常数小，n 为动态节点数 |

::: interview 面试视角
"Vue 3 更快"要被拆成三层回答：**编译期减少运行时工作**（静态提升、PatchFlag）、**运行时缩小 diff 范围**（Block Tree）、**算法层减少 DOM 移动**（LIS）。三层都说清，就是高级水平。
:::

## 常见追问

**Q：PatchFlags 是数字位运算，为什么不直接用对象？**

位运算比对象属性查找快，且一个数字能表达多个标记，内存占用小。这是典型的"运行时性能优先"设计。

**Q：什么情况下 Block Tree 无法优化？**

动态 key 的 v-for（`BAIL`）、`v-html`、手写渲染函数、`<slot>` 的复杂用法。

**Q：LIS 为什么是 O(n log n)？**

用二分查找维护"长度为 L 的递增子序列的最小末尾值"，每个元素处理一次。