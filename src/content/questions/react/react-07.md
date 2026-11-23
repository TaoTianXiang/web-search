## 虚拟 DOM 是什么

用普通 JS 对象描述 UI 结构：

```js
const vnode = {
  type: 'div',
  props: { className: 'box', children: 'hello' },
  key: null
}
```

渲染时比较新旧 vnode，把差异应用到真实 DOM。这一层抽象的价值：

1. **声明式编程**：你描述"应该是什么"，框架负责"怎么变"
2. **跨平台**：同一套描述可以渲染到 DOM、Native、Canvas、SSR 字符串
3. **批量与可预测**：所有变更集中计算，能优化合并

## 它真的更快吗

**不一定**。第一次渲染时虚拟 DOM 更慢（多了一层创建 vnode + diff 的开销）。优势在于：

- 频繁更新时，diff 能找出最小变更集
- 避免手工操作 DOM 时常见的"多余读写"
- 让性能优化可以集中在框架层做（如 batching、优先级）

```js
// 手写 DOM 也能很快，只是容易出错
el.textContent = newValue  // 一次赋值，比 diff 更快

// 但下面这种就会拖垮性能
for (let i = 0; i < 1000; i++) {
  el.style.width = el.offsetWidth + 1 + 'px'  // 强制同步布局
}
```

结论：虚拟 DOM 带来的是**开发效率与可维护性**，性能是次要收益。

## 三个核心策略

React（以及大多数框架）的 diff 基于三个假设来把 O(n³) 降到 O(n)：

### 1. 同层比较，不跨层级移动

```jsx
<div>
  <A />        // 位置 1
  <B />        // 位置 2
</div>
// 变成
<div>
  <B />        // 位置 2 上出现了 A 的替代
</div>
```

只有同层节点互相比对，不会把 `<A />` 从位置 1 移动到位置 2 复用。代价是"跨层移动会重建"，收益是复杂度从三次方降到线性。

### 2. 类型不同直接替换

```jsx
<div>hello</div>
<span>hello</span>   // type 不同 → 卸载整个子树，重建
```

### 3. 用 key 标识同层兄弟的稳定性

```jsx
// ✅ key 稳定 → 能复用节点
items.map((it) => <Row key={it.id} data={it} />)

// ❌ key 用 index → 删除/排序时全部错位
items.map((it, i) => <Row key={i} data={it} />)
```

## React 的列表 diff

由于 key 的存在，React 用 Map 建立 `key → oldFiber` 的索引，然后按新列表顺序逐个查找：

```js
// 简化逻辑
const existingChildren = new Map()
oldChildren.forEach((child) => existingChildren.set(child.key, child))

newChildren.forEach((child, i) => {
  const matched = existingChildren.get(child.key)
  if (matched) {
    existingChildren.delete(child.key)   // 标记已复用
    // 复用 matched，更新 props
  } else {
    // 新建
  }
})
// 剩余的 existingChildren 全部删除
```

**缺点**：只做单向查找，乱序时需要大量移动。Vue 3 用「双端对比 + 最长递增子序列」优化了移动次数。

## 与 Vue 3 的差异

| 维度 | React | Vue 3 |
| --- | --- | --- |
| 动态信息 | 运行时对比 | 编译期打 PatchFlag |
| diff 范围 | 组件树 | 只遍历 dynamicChildren（Block Tree） |
| 列表移动 | 单向 key 查找 | 双端 + LIS 最少移动 |
| 是否需要手动 memo | 需要 | 默认组件级响应式 |

::: interview 面试视角
能主动说"虚拟 DOM 不是更快，而是更可维护"，以及"key 用 index 会导致状态错位"，说明你理解取舍而非只背概念。
:::
