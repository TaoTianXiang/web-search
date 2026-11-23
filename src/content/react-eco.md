React 的题集中在三处：Fiber 与并发（原理层）、Hooks（使用层）、性能与状态（工程层）。这一章补上 RSC 与生态选型这两块 2026 的新高频。

## 一、React Server Components

### 与 Client Components 的区别

| | Server Component | Client Component |
| --- | --- | --- |
| 运行环境 | 只在服务端/构建时 | 服务端预渲染 + 浏览器 |
| 产物 | **序列化的 UI 描述**（Flight 协议） | JavaScript bundle |
| 能否用 state / 事件 | ❌ | ✅ |
| 能否访问数据库 / 文件系统 | ✅ | ❌ |
| 组件代码是否发到浏览器 | ❌ | ✅ |
| 体积影响 | 零 bundle 体积 | 计入 bundle |

### 与 SSR 的本质差异

| 维度 | SSR | RSC |
| --- | --- | --- |
| 产物 | HTML 字符串 | 序列化的组件树 |
| 客户端 JS | 全量 hydrate | 只有 Client Component 需要 hydrate |
| 数据访问 | 通过 props 或 API | 组件内直接访问 |
| 交互能力 | 与 CSR 相同（全量 hydrate） | 只有标记 client 的部分可交互 |

SSR 只是"先在服务端渲染 HTML"，之后仍要下载全量 JS 并 hydrate。RSC 是"部分组件根本不需要客户端 JS"。

### 边界设计

```jsx
// app/page.tsx —— 默认 Server Component
import { db } from '@/lib/db'
import Counter from './Counter'

export default async function Page() {
  const posts = await db.post.findMany()   // 直接查库
  return (
    <main>
      <h1>文章列表</h1>
      {posts.map((p) => <article key={p.id}>{p.title}</article>)}
      <Counter />   {/* 只有这个进入客户端 */}
    </main>
  )
}
```

```jsx
// app/Counter.tsx
'use client'

export default function Counter() {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n + 1)}>{n}</button>
}
```

**核心原则：把 client 边界尽量往下推。** 页面骨架保持 server，只有交互岛是 client。

### 三个常见限制

1. **Server 不能把函数传给 Client**

```jsx
<Client onClick={() => {}} />   // ❌ 函数不可序列化
```

解决：交互逻辑整体放进 Client，只传可序列化数据。

2. **Client 不能 import Server**

只能通过 `children` 或 props 以"已渲染元素"形式传入。

3. **Context 只能在 Client 侧提供**

## 二、useState vs useReducer

| 维度 | useState | useReducer |
| --- | --- | --- |
| 状态形态 | 单个值 | 多个相关字段 |
| 更新逻辑 | 在调用处 | 集中在 reducer |
| 可测试性 | 需测组件 | reducer 是纯函数可直接测 |
| dispatch 引用 | setter 也稳定 | **永远稳定** |

### 什么时候用 useReducer

```js
// 1. 多字段联动（避免忘记重置某个字段）
const initial = { loading: false, data: null, error: null }
function reducer(state, action) {
  switch (action.type) {
    case 'start': return { ...state, loading: true, error: null }
    case 'ok':    return { loading: false, data: action.payload, error: null }
    case 'fail':  return { loading: false, data: null, error: action.payload }
    default:      return state
  }
}
```

```js
// 2. 下一个状态依赖复杂的上一个状态
dispatch({ type: 'remove', id })   // 天然拿到最新 state
```

```js
// 3. 需要单测
expect(cartReducer([], { type: 'add', item })).toEqual([item])
```

::: warn useState 的隐蔽陷阱
```js
setCount(count + 1)
setCount(count + 1)   // 两次都用同一个旧 count，只加 1
```
应改为 `setCount(c => c + 1)`。
:::

## 三、memo / useMemo / useCallback

| API | 缓存对象 | 比较方式 |
| --- | --- | --- |
| `React.memo` | 组件渲染结果 | props 浅比较 |
| `useMemo` | 计算结果 | 依赖数组 |
| `useCallback` | 函数引用 | 依赖数组 |

```js
// 等价：useCallback(fn, deps) === useMemo(() => fn, deps)
```

### memo 失效的三种情况

```jsx
// ❌ 每次都是新对象/新函数
<Row item={item} onSelect={(id) => select(id)} />

// ✅ 引用稳定
<Row item={item} onSelect={handleSelect} />
```

```jsx
// ❌ Context value 每次都是新对象 → 所有消费者重渲染
<Ctx.Provider value={{ theme, setTheme }}>

// ✅ 必须 memo
const value = useMemo(() => ({ theme, setTheme }), [theme])
```

### 判断是否值得优化

| 场景 | 是否值得 |
| --- | --- |
| 计算 < 1ms | 不值得 |
| 渲染大列表 / 大量子组件 | 值得 |
| 依赖是每次新建的对象 | 无意义（缓存永远失效） |
| 传给 memo 子组件 | 值得（否则 memo 白做） |
| Context Provider value | **必须** |

验证方式：React DevTools Profiler 录制交互，看"哪些组件渲染了、耗时多少"。

## 四、并发特性

| 能力 | API |
| --- | --- |
| 标记非紧急更新 | `startTransition` / `useTransition` |
| 延迟派生值 | `useDeferredValue` |
| 挂起等待 | `Suspense` |

```jsx
function Search() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState([])

  function onChange(e) {
    const v = e.target.value
    setInput(v)                        // 紧急：输入必须立刻响应
    startTransition(() => {
      setResults(filterAll(v))         // 非紧急：可被打断
    })
  }
}
```

### 与 setTimeout 的三点区别

| 维度 | useTransition | setTimeout |
| --- | --- | --- |
| 调度机制 | React 调度器 + 优先级 | 浏览器任务队列 |
| 可中断 | ✅ 新输入可打断旧渲染 | ❌ |
| 是否知道 React 状态 | ✅ | ❌ |

::: warn transition 不是万能的
1. 它不会让计算变快，只是让紧急任务优先
2. 过渡渲染本身很慢（如一次渲染 1 万条）仍会卡
3. 受控输入必须保持在 transition 之外
:::

## 五、状态管理选型

| | Redux Toolkit | Zustand | Jotai |
| --- | --- | --- | --- |
| 模型 | 单 store + reducer | 单 store + selector | 原子组合 |
| 心智负担 | 高 | 低 | 低 |
| DevTools | 时间旅行 | 支持 | 支持 |
| 适合 | 复杂业务、需审计 | 中小型 | 细粒度订阅 |

```js
// Zustand：只订阅需要的字段
const items = useCart((s) => s.items)

// ❌ selector 返回新对象 → 永远重渲染
const { a, b } = useCart((s) => ({ a: s.a, b: s.b }))

// ✅ 用 useShallow
import { useShallow } from 'zustand/shallow'
const { a, b } = useCart(useShallow((s) => ({ a: s.a, b: s.b })))
```

```js
// Jotai：每个 item 独立原子，更新互不影响
const itemAtom = atomFamily((id) => atom({ id, name: '' }))
const [item] = useAtom(itemAtom(id))
```

### 分层建议

```
UI 本地状态         → useState / useReducer
跨组件 UI 状态      → Zustand / Jotai / Context
服务端数据          → TanStack Query / SWR
表单状态            → react-hook-form
URL 状态（可分享）  → 路由 query
```

::: warn 最常见的架构错误
把**服务端数据**塞进全局 store，然后手动实现缓存失效、加载态、竞态、轮询。这些正是数据请求库已解决的事。
:::

## 六、避免全局状态导致全列表重渲染

### 问题

```jsx
// ❌ value 每次都是新对象 → 所有消费者重渲染
<StoreCtx.Provider value={{ state, setState }}>
```

三个叠加问题：

1. value 是每次新对象
2. Context 无法"只订阅某一部分"
3. 列表项依赖整个 state

### 四层递进方案

| 层次 | 方案 |
| --- | --- |
| 1 | 按更新频率拆分 Context + 子组件 memo |
| 2 | 外部 store + selector 订阅（Zustand） |
| 3 | 原子化（Jotai，每项独立原子） |
| 4 | 虚拟滚动（只渲染可见行） |

```jsx
// 拆分 Context：稳定的 dispatch 与易变的数据分开
<DispatchCtx.Provider value={dispatch}>
  <StateCtx.Provider value={state}>
    <List />
  </StateCtx.Provider>
</DispatchCtx.Provider>
```

```js
// selector 订阅：每行只关心自己的数据
function Row({ id }) {
  const item = useStore((s) => s.items.find((i) => i.id === id))
  return <div>{item.name}</div>
}
```

## 七、合成事件

### 机制

React 不把监听绑到每个元素，而是：

1. 在根容器挂**一个**委托监听
2. 事件触发时构造 `SyntheticEvent`
3. 沿 React 树模拟捕获/冒泡

### React 16 vs 17 的变化

```
React 16：委托到 document
React 17+：委托到 root 容器
```

原因：

1. **多版本共存**（微前端）：都挂 document 时事件互相干扰
2. **渐进升级**：新旧版本各自管理根容器
3. **与原生事件顺序更可预测**

::: warn 这个变化会引发真实 bug
```js
// React 16：document 上的监听在 React onClick 之后执行
// React 17+：如果 root 在 #app 内，document 监听在之后执行
document.addEventListener('click', handler)
```
依赖"先 React 后 document"的代码在升级时会失效。
:::

### 事件池已取消

React 17 起事件对象不再被回收，可以安全地异步访问：

```jsx
function onChange(e) {
  setText(e.target.value)
  setTimeout(() => {
    console.log(e.target.value)   // React 17+ 正常；16 会报错或为 null
  })
}
```

### 什么时候用原生事件

| 场景 | 原因 |
| --- | --- |
| 监听 document / window | React 只能绑到 React 树内的元素 |
| 需要 `passive` 优化滚动 | 原生支持 |
| 与第三方库集成 | 图表、编辑器 |

::: interview 面试视角
React 方向的区分点在于"你知道哪些行为是版本相关的"。能说清"RSC 产物是序列化组件树而非 HTML"、"Context value 必须 memo"、"React 17 事件委托位置变了"，就超过了只背 API 的层次。
:::