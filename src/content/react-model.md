React 的更新模型与 Vue 有本质差异：Vue 是"响应式驱动"，React 是"状态驱动 + 重新渲染"。理解 Fiber，才能理解为什么 Hooks 有那么多规则。

## 从 Stack Reconciler 说起

React 15 的协调器是**递归**的：

```js
function reconcile(element) {
  const children = element.children
  children.forEach(reconcile) // 一旦开始就无法中断
}
```

组件树很大时，一次更新可能占用主线程几百毫秒，造成输入卡顿、动画掉帧。

## Fiber 的设计

Fiber 把递归改成**可中断的链表遍历**，每个节点是一个工作单元：

```js
{
  type: 'div',
  key: null,
  stateNode: domNode,     // 宿主实例
  child: fiber | null,    // 第一个子节点
  sibling: fiber | null,  // 下一个兄弟
  return: fiber | null,   // 父节点
  alternate: fiber,       // 双缓存：另一棵树上的对应节点
  flags: Update | Placement | Deletion,
  lanes: Lane,            // 优先级
  memoizedState: hooks,   // Hooks 链表
  memoizedProps: props,
  updateQueue: updates
}
```

遍历顺序：`child` → `sibling` → `return`（回溯），可以随时暂停并保存当前位置。

### 双缓存树

```
current 树（屏幕上显示的）
      ▲
      │ alternate 互相指向
      ▼
workInProgress 树（正在构建的）
```

render 阶段在 `workInProgress` 上完成所有计算，commit 阶段一次性切换 `current` 指针。这样用户永远看不到"构建了一半"的 UI。

## 两个阶段

| 阶段 | 函数 | 特点 |
| --- | --- | --- |
| Render | `beginWork` / `completeWork` | 可中断、可重放、**不可有副作用** |
| Commit | `commitMutationEffects` 等 | 同步、不可中断、执行 DOM 变更与副作用 |

### Render 阶段

- 计算新 fiber
- 对比新旧 props / state，标记 `flags`
- 调度副作用（`useEffect` 放入队列，不执行）
- 可能被打断重来（并发模式下）

因为可能重放，所以**在 render 中不能有副作用**：

```jsx
function Bad() {
  // ❌ render 阶段执行，可能被执行多次
  fetch('/api')
  document.title = 'x'
  return <div />
}
```

### Commit 阶段的三次遍历

1. `before mutation`：读取 DOM 快照（`getSnapshotBeforeUpdate`）
2. `mutation`：执行 DOM 增删改
3. `layout`：执行 `useLayoutEffect`、`componentDidMount`

`useEffect` 在 commit 之后**异步**调度，避免阻塞绘制。

## 优先级：Lane 模型

React 16 用 `expirationTime`（基于时间戳，难以表达"批"）。React 18 改为 `lanes`（31 位位掩码）：

```js
export const SyncLane = 0b0001
export const InputContinuousLane = 0b0100
export const DefaultLane = 0b01000
export const TransitionLanes = 0b... 
export const IdleLane = 0b...
```

位运算快速判断"是否包含某个优先级"，并能表达"一组优先级"。

```js
// 高优先级可以打断低优先级
function getNextLanes(root, wipLanes) {
  // 取最高优先级的 lane
}
```

### 时间切片

```js
// Scheduler 用 MessageChannel 实现 5ms 时间片
const channel = new MessageChannel()
channel.port1.onmessage = performWorkUntilDeadline

function workLoop(deadline) {
  while (workInProgress && shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress)
  }
}
```

`shouldYield()` 判断是否超过 5ms 预算。超过就让出主线程，让浏览器处理输入与绘制。

::: warn 并发渲染不是多线程
依然是单线程。所谓"并发"是**任务可中断 + 优先级调度**，让紧急任务（输入）插队，牺牲非紧急任务（列表渲染）的及时性。

渲染过程本身是同步的（render 阶段的工作），只是可以分多次完成。
:::

## 并发特性

```jsx
// 1. startTransition：标记非紧急更新
const [isPending, startTransition] = useTransition()

function onChange(e) {
  setInput(e.target.value)          // 紧急：输入框必须立刻响应
  startTransition(() => {
    setResults(filter(e.target.value)) // 非紧急：可以被打断
  })
}

// 2. useDeferredValue：延迟派生值
const deferred = useDeferredValue(query)
const list = useMemo(() => expensiveFilter(deferred), [deferred])

// 3. Suspense：等待数据/代码
<Suspense fallback={<Spinner />}>
  <Profile />
</Suspense>
```

## Hooks 的实现

每个函数组件对应的 Fiber 有一个 `memoizedState` 链表：

```js
// 简化结构
fiber.memoizedState = {
  memoizedState: stateValue,   // useState 的值 / useEffect 的 effect 对象
  queue: { pending: null },    // 更新队列（环状链表）
  next: nextHook               // 指向下一个 Hook
}
```

```js
let currentHook = null

function useState(initial) {
  const hook = mountWorkInProgressHook()
  if (isMount) {
    hook.memoizedState = typeof initial === 'function' ? initial() : initial
    hook.queue = { pending: null }
  }

  const dispatch = (action) => {
    const update = { action, next: null }
    enqueueUpdate(hook.queue, update)
    scheduleUpdate()
  }

  return [hook.memoizedState, dispatch]
}
```

因为依赖链表顺序，**条件调用会让顺序错位**：

```jsx
// ❌ 第一次渲染 hook1 = useState，第二次渲染可能 hook1 = useEffect
if (cond) {
  const [a] = useState(0)
}
const [b] = useState(1)
```

React 不知道 Hook 的名字，只能靠位置匹配。这是规则的本质。

::: tip 为什么 React 不改成按名字匹配
按名字做 map 查找比重排链表慢，且无法省略 Hook（每次渲染必须保证相同的调用序列）。React 选择了"更快的运行时 + 更强的约束"。
:::

## useEffect 的时序

```
render 阶段（可中断）
    ↓
commit: mutation（DOM 变更）
    ↓
commit: layout（useLayoutEffect 同步执行）
    ↓
浏览器绘制
    ↓
useEffect 异步执行（在下一帧或空闲时）
```

| Hook | 执行时机 | 是否阻塞绘制 |
| --- | --- | --- |
| `useLayoutEffect` | DOM 变更后、绘制前同步 | ✅ 阻塞 |
| `useEffect` | 绘制后异步 | ❌ 不阻塞 |

### 什么时候必须用 useLayoutEffect

```jsx
function Tooltip() {
  const ref = useRef()
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    const rect = ref.current.getBoundingClientRect()
    // 必须在绘制前测量并重设，避免闪烁
    setPos(calcPosition(rect))
  }, [])

  return <div ref={ref} style={{ left: pos.x, top: pos.y }} />
}
```

用 `useEffect` 会导致"先看到错误位置，再跳到正确位置"的闪烁。

::: warn SSR 中的 useLayoutEffect
服务端渲染时 `useLayoutEffect` 会产生警告（没有 DOM）。需要条件使用：

```js
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect
```
:::

## 自动批处理

React 18 之前，只有 React 事件处理器内会批量合并更新；`setTimeout`、`Promise.then` 中不会。

```jsx
// React 17
setTimeout(() => {
  setA(1)   // 触发一次渲染
  setB(2)   // 再触发一次
}, 0)

// React 18
setTimeout(() => {
  setA(1)
  setB(2)   // 合并为一次渲染
}, 0)
```

要强制同步刷新可以用 `flushSync`（慎用）：

```jsx
flushSync(() => setA(1))
// 此处 DOM 已更新
```

## 常见性能陷阱

```jsx
// 1. 内联对象导致 memo 失效
<Child style={{ color: 'red' }} />        // 每次新对象
<Child style={styles.red} />              // 引用稳定

// 2. 内联函数导致子组件重渲染
<List onSelect={(id) => ...} />           // 每次新函数
<List onSelect={handleSelect} />          // useCallback 包裹

// 3. Context 变化导致所有消费者重渲染
const ThemeCtx = createContext()
<ThemeCtx.Provider value={{ theme, setTheme }}>  // 每次新对象
```

修复 Context：

```jsx
// 拆分 Context 或用 useMemo
const value = useMemo(() => ({ theme, setTheme }), [theme])
<ThemeCtx.Provider value={value} />
```

::: interview 面试视角
"React 渲染慢用 memo"是表层答案。要能说清**重渲染的触发链**：state 变化 → 组件重渲染 → 子组件默认也重渲染（除非 memo）→ Context 消费者全部重渲染。
:::

## 与 Vue 的本质差异

| 维度 | React | Vue |
| --- | --- | --- |
| 更新触发 | setState 显式触发 | 依赖自动追踪 |
| 优化粒度 | 组件级（需手动 memo） | 组件级 + 编译期靶向 |
| 心智模型 | 状态 → 视图（重新计算） | 状态 → 依赖 → 局部更新 |
| 优化成本 | 需要理解引用相等 | 框架默认优化 |
| 可预测性 | 高（纯函数 + 不可变） | 中（响应式副作用） |

::: tip 选型思路
React 适合"大型团队 + 强约束 + 需要灵活抽象"；Vue 适合"快速交付 + 心智负担低"。这不是对错，是取舍。
:::