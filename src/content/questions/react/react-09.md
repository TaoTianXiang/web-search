## 三个方案的模型差异

| | Redux Toolkit | Zustand | Jotai |
| --- | --- | --- | --- |
| 状态模型 | 单一 store + reducer | 单一 store + 可选 selector | 原子（atom）组合 |
| 更新方式 | dispatch(action) | `set`（直接改） | `set(atom, v)` |
| 心智负担 | 高（action/type/reducer） | 低 | 低（但需理解原子） |
| DevTools | 时间旅行、完整日志 | 支持 | 支持 |
| 中间件生态 | 极丰富 | 有 | 较少 |
| 适合 | 复杂业务、需审计 | 中小型、追求简单 | 细粒度订阅、派生密集 |

## Redux Toolkit

```js
const slice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    add(state, action) { state.items.push(action.payload) },   // Immer 让她可以"直接改"
    remove(state, action) { state.items = state.items.filter(i => i.id !== action.payload) }
  }
})

const { add, remove } = slice.actions
```

优势：

- 强制把状态变更收敛到 reducer（可审计、可回溯）
- 中间件生态（持久化、日志、异步）
- DevTools 时间旅行调试

代价：样板代码多，即使 RTK 简化了，仍需维护 slice/selector。

## Zustand

```js
const useCart = create((set, get) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  total: () => get().items.reduce((sum, i) => sum + i.price, 0)
}))

// 组件内：只订阅需要的字段，避免无关重渲染
const items = useCart((s) => s.items)
const add = useCart((s) => s.add)
```

优势：

- 极简，无需 Provider
- selector 天然支持细粒度订阅
- 可在 React 之外使用（`useCart.getState()`）

注意点：selector 返回**新对象**会导致每次重渲染，需要 `useShallow`：

```js
// ❌ 每次返回新对象 → 永远重渲染
const { a, b } = useCart((s) => ({ a: s.a, b: s.b }))

// ✅ 浅比较
import { useShallow } from 'zustand/shallow'
const { a, b } = useCart(useShallow((s) => ({ a: s.a, b: s.b })))
```

## Jotai

```js
const countAtom = atom(0)
const doubleAtom = atom((get) => get(countAtom) * 2)   // 派生原子

function Counter() {
  const [count, setCount] = useAtom(countAtom)   // 只订阅 countAtom
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

function Display() {
  const [doubled] = useAtom(doubleAtom)   // 只在 count 变化时更新
  return <span>{doubled}</span>
}
```

优势：

- 天然细粒度：组件只订阅自己用到的原子
- 派生值自动缓存
- 无需手动写 selector

代价：原子数量多时管理成本上升，跨模块组合需要设计原子边界。

## 中后台项目的选型建议

```
需求：多页面、表单多、权限控制、表格筛选、需可回溯
```

| 维度 | 判断 |
| --- | --- |
| 团队技术背景 | 已有 Redux 经验 → 用 RTK，避免迁移成本 |
| 状态复杂度 | 领域模型复杂、需要严格变更记录 → Redux |
| 页面数量 | 大量独立页面 → Zustand（无需 Provider，接入成本低） |
| 派生计算多 | 大量 computed 类逻辑 → Jotai |
| 服务端数据 | **不要**放进全局 store → TanStack Query |

::: warn 最常见的架构错误
把"服务端数据"塞进全局 store，然后手动实现缓存失效、加载态、竞态、轮询。这些正是数据请求库已经解决的事。
:::

## 分层建议

```
UI 本地状态        → useState / useReducer
跨组件 UI 状态     → Zustand / Jotai / Context
服务端数据         → TanStack Query / SWR
表单状态           → react-hook-form
URL 状态（可分享） → 路由 query
```

::: interview 面试视角
能说出"服务端数据不该进全局 store"、"Zustand 的 selector 返回新对象会导致重渲染"这类具体坑，比列一堆库名有价值得多。
:::
