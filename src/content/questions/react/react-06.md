## 并发能力清单

| 能力 | API |
| --- | --- |
| 标记非紧急更新 | `startTransition` / `useTransition` |
| 延迟派生值 | `useDeferredValue` |
| 可中断渲染 | 自动（Fiber + lane） |
| 挂起等待 | `Suspense` |
| 数据获取 | `use`（React 19） |

## startTransition

```jsx
import { startTransition, useState } from 'react'

function Search() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState([])

  function onChange(e) {
    const value = e.target.value
    setInput(value)               // 紧急：输入框必须立即响应

    startTransition(() => {
      setResults(filterAll(value)) // 非紧急：可以被打断
    })
  }

  return <input value={input} onChange={onChange} />
}
```

内部机制：`startTransition` 把更新标记为 `TransitionLane`，优先级低于 `InputContinuousLane`。当新的输入到来时，正在进行的低优先级渲染会被丢弃并重做。

## useTransition

```jsx
const [isPending, startTransition] = useTransition()

function Tab() {
  const [tab, setTab] = useState('home')

  function select(next) {
    startTransition(() => setTab(next))  // 切换大页面用 transition
  }

  return (
    <>
      <Tabs onSelect={select} />
      {isPending && <Spinner />}   {/* 过渡渲染进行中 */}
      <Content tab={tab} />
    </>
  )
}
```

`isPending` 用于展示"过渡尚未完成"的加载态，比整体 loading 更细腻。

## 与 setTimeout 的三点区别

| 维度 | useTransition | setTimeout |
| --- | --- | --- |
| 调度机制 | React 调度器 + 优先级 | 浏览器任务队列 |
| 可中断 | ✅ 新输入可以打断旧渲染 | ❌ 一旦开始就跑完 |
| 与渲染协同 | 知道渲染阶段，可复用部分结果 | 完全不知道 React 在做什么 |
| 是否阻塞输入 | 不会（低优先级） | 会（在同一帧内执行） |

```jsx
// ❌ setTimeout 无法被新输入打断，且仍占用主线程
setTimeout(() => setResults(filterAll(v)), 0)

// ✅ transition 可以在用户继续输入时被丢弃重做
startTransition(() => setResults(filterAll(v)))
```

## useDeferredValue

不需要自己触发更新时，用它"延迟"一个值：

```jsx
const deferred = useDeferredValue(query)
const list = useMemo(() => filter(deferred), [deferred])

// deferred 会滞后于 query，但不会造成输入卡顿
```

区别：`useDeferredValue` 是"值滞后"，`useTransition` 是"更新滞后"。前者适用于派生值，后者适用于状态更新。

## 实践判断

| 场景 | 用法 |
| --- | --- |
| 搜索输入 + 大结果列表 | `useDeferredValue` 或 `useTransition` |
| Tab 切换大页面 | `useTransition` + `isPending` |
| 路由跳转 | 框架通常已内置 transition |
| 首屏必须快的内容 | **不要**用 transition（会被降级） |

::: warn transition 不是万能的
1. 它不会让计算变快，只是让紧急任务优先
2. 如果过渡渲染本身很慢（如一次渲染 1 万条），仍然会卡
3. 受控输入必须保持在 transition 之外，否则输入会卡顿
:::

::: interview 面试视角
能说清"transition 可以被丢弃重做，setTimeout 不能"这一点，就区分开了真正理解调度机制的回答与表面回答。
:::
