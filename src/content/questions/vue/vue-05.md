## 核心原因：实例之间不能共享同一份数据

```js
// ❌ 如果是对象
const data = { count: 0 }
const a = new Vue({ data })
const b = new Vue({ data })
a.count++
console.log(b.count) // 1 —— 两个实例共享同一对象
```

组件会被复用（列表里渲染多次、`v-for`、动态组件），如果 `data` 是对象，所有实例会指向同一份数据，改一个就全改。

```js
// ✅ 函数：每次创建实例时调用，返回全新对象
data() {
  return { count: 0 }
}
```

## 根实例为什么可以是对象

`new Vue({ data: { count: 0 } })` 在 Vue 2 中是合法的，因为**根实例只会创建一次**，不存在复用问题。Vue 3 的 `createApp` 也允许根组件用对象，但组件定义（`defineComponent`）严格要求函数。

## 实际报错

```js
// Vue 3
export default {
  data: { count: 0 }   // ⚠️ 警告：data 必须是一个函数
}
```

运行时会在控制台输出：
`[Vue warn]: data property "count" is already defined...`
或者直接抛错 `"data" must be a function`。

## 更深入的机制

Vue 在 `createData` 时会：

```js
function createData(vm, dataFn) {
  const data = dataFn.call(vm, vm)
  // 对每个属性做响应式处理（Vue 2 用 defineProperty，Vue 3 用 reactive）
  return data
}
```

函数形式让"数据创建"与"实例创建"绑定，保证每个实例有独立的响应式代理。

## Composition API 下的等价问题

```js
// ❌ 模块级共享状态，所有使用该 composable 的组件共享
const count = ref(0)
export function useCounter() {
  return { count }
}

// ✅ 每次调用创建新状态
export function useCounter() {
  const count = ref(0)
  return { count }
}
```

这是 Vue 3 中最容易犯的同类错误：把 `ref` 写在模块顶层，就变成了单例。反过来，**如果想故意做成单例（全局共享），这正是正确写法**。

## 同一个组件多次渲染的验证

```vue
<Counter />   <!-- 实例 1 -->
<Counter />   <!-- 实例 2 -->
```

两个实例各自调用一次 data 函数，得到两份独立对象。如果改成对象形式，第二个实例会复用第一个的引用。

::: interview 面试视角
能说清"组件会被复用所以必须隔离数据"这一根本原因，并延伸出"Vue 3 中模块顶层 ref 就是单例"的对应关系，说明你理解机制而不是只背结论。
:::
