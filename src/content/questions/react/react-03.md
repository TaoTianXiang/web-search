## 对照表

| 维度 | useState | useReducer |
| --- | --- | --- |
| 状态形态 | 单个值 | 多个相关字段 |
| 更新方式 | `setState(next)` | `dispatch({ type, payload })` |
| 更新逻辑位置 | 调用处 | reducer 函数，集中管理 |
| 可测试性 | 需测组件 | reducer 是纯函数，可直接单测 |
| 适合复杂度 | 简单 | 多字段联动、状态机 |
| 代码量 | 少 | 多（要写 action / reducer） |

## 共性与关键差异

两者底层是同一个 Hook（`useState` 本质是 `useReducer` 的特例）。重要共性：

```js
// 1. 函数式更新：依赖前值时必须用函数形式
setCount(c => c + 1)
dispatch({ type: 'inc' })  // reducer 天然拿到前值

// 2. 都是异步批处理，连续调用会合并
setA(1); setB(2)   // 只触发一次渲染

// 3. 相同值会 bail out（用 Object.is 比较）
setCount(1); setCount(1)  // 第二次不触发渲染
```

但有一个重要区别：**useReducer 的 dispatch 引用永远稳定**，而 useState 的 setter 也稳定，但 reducer 里的逻辑可以更复杂。

```js
// useReducer 的 dispatch 是稳定引用，可安全放进依赖数组
useEffect(() => {
  const id = setInterval(() => dispatch({ type: 'tick' }), 1000)
  return () => clearInterval(id)
}, [])  // dispatch 不进依赖也没问题
```

## 什么时候用 useReducer

### 1. 多个字段联动

```js
const initial = { loading: false, data: null, error: null }

function reducer(state, action) {
  switch (action.type) {
    case 'start':  return { ...state, loading: true, error: null }
    case 'ok':     return { loading: false, data: action.payload, error: null }
    case 'fail':   return { loading: false, data: null, error: action.payload }
    default:       return state
  }
}
```

用 useState 要维护三个独立状态，忘记重置其中一个是常见 bug。

### 2. 下一个状态依赖复杂的上一个状态

```js
// useState 写法容易出错
setItems(items.filter(i => i.id !== id))
setItems(items.map(...))     // 用了旧的 items！

// useReducer 天然安全
dispatch({ type: 'remove', id })
dispatch({ type: 'rename', id, name })
```

### 3. 状态机语义

```js
// 明确的合法状态与转移
const states = ['idle', 'loading', 'success', 'error']
```

reducer 里用 `assertNever` 可以保证所有 action 都被处理。

### 4. 更新逻辑需要复用或测试

```js
// reducer.js
export function cartReducer(state, action) { /* ... */ }

// cartReducer.test.js —— 纯函数直接测
expect(cartReducer([], { type: 'add', item })).toEqual([item])
```

::: warn useState 的一个隐蔽陷阱
```js
setCount(count + 1)
setCount(count + 1)   // 两次都用同一个旧 count，只加 1
```
应改为 `setCount(c => c + 1)`。这个 bug 在高频点击或异步回调中很常见。
:::

## 与外部状态库的选择

| 场景 | 方案 |
| --- | --- |
| 组件内部简单状态 | useState |
| 组件内部复杂状态机 | useReducer |
| 跨组件共享、少量 | Context + useReducer |
| 跨组件共享、大量、需性能优化 | Zustand / Jotai / Redux Toolkit |
| 服务端数据 | TanStack Query / SWR |

::: interview 面试视角
"复杂就用 useReducer"太笼统。能说出"dispatch 引用稳定所以适合放进 effect"、"reducer 是纯函数所以可单测"，说明你实际用它在解决具体问题。
:::
