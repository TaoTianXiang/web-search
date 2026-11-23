## 依赖比较规则

React 用 `Object.is` **逐项比较**上一次与这一次的依赖数组：

- 长度不同 → 重新执行
- 任一元素 `Object.is` 不等 → 重新执行
- 空数组 → 只在挂载时执行一次

```js
useEffect(() => { /* ... */ }, [a, b])
// a 或 b 变化（Object.is）即重新执行
```

注意 `Object.is` 对对象是**引用比较**：

```js
useEffect(() => {}, [{}])        // 每次渲染都是新对象 → 无限循环
useEffect(() => {}, [{ a: 1 }])  // 同上
```

## 闭包陷阱的成因

effect 回调捕获的是**创建时那次渲染的变量快照**：

```jsx
function Timer() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      console.log(count)   // 永远打印 0
      setCount(count + 1)  // 永远设为 1
    }, 1000)
    return () => clearInterval(id)
  }, [])   // 空依赖 → 只创建一次，闭包住了 count = 0

  return <div>{count}</div>
}
```

## 四种修法

### 1. 函数式更新（最推荐）

```js
setCount(c => c + 1)  // 不依赖外部 count
```

### 2. 补全依赖 + 清理

```js
useEffect(() => {
  const id = setInterval(() => setCount(c => c + 1), 1000)
  return () => clearInterval(id)
}, [])   // 用函数式更新后确实不需要 count
```

### 3. useRef 保存可变值

```js
const countRef = useRef(count)
useEffect(() => { countRef.current = count }, [count])

useEffect(() => {
  const id = setInterval(() => {
    console.log(countRef.current) // 始终是最新值
  }, 1000)
  return () => clearInterval(id)
}, [])
```

### 4. useEffectEvent（React 19）

```js
const onTick = useEffectEvent(() => {
  console.log(count)         // 总是最新的 count
  setCount(count + 1)
})

useEffect(() => {
  const id = setInterval(onTick, 1000)
  return () => clearInterval(id)
}, [])   // onTick 不需要进依赖
```

这解决了"逻辑需要最新值，但不想因此重建订阅"的矛盾。

## 在项目中定位这类问题

症状清单：

| 症状 | 可能原因 |
| --- | --- |
| 定时器 / 订阅数据不更新 | 空依赖 + 闭包捕获旧值 |
| 组件卸载后仍执行 setState | 缺少清理函数 |
| effect 无限重复执行 | 依赖里有每次新建的对象 / 函数 |
| 旧请求覆盖新结果 | 竞态，缺少取消逻辑 |

定位手段：

```js
// 1. React DevTools Profiler：看哪个组件在无意义地重复渲染
// 2. 自定义 hook 打印 effect 执行原因
useEffect(() => {
  console.log('effect ran because deps changed')
}, deps)

// 3. 用 why-did-you-render 库定位无意义重渲染
```

## 竞态处理

```js
useEffect(() => {
  let cancelled = false
  const controller = new AbortController()

  fetch(`/api/user/${id}`, { signal: controller.signal })
    .then((r) => r.json())
    .then((data) => {
      if (!cancelled) setUser(data)   // 避免旧请求覆盖新结果
    })
    .catch((e) => {
      if (e.name !== 'AbortError') setError(e)
    })

  return () => {
    cancelled = true
    controller.abort()
  }
}, [id])
```

::: warn 不要用 eslint-disable 掩盖依赖问题
`// eslint-disable-next-line react-hooks/exhaustive-deps` 是把 bug 藏起来。正确做法是：要么补齐依赖，要么用函数式更新 / ref / useEffectEvent 消除依赖。
:::

::: interview 面试视角
能说出"effect 捕获的是渲染快照"、"useEffectEvent 解决的是什么矛盾"、"竞态需要 AbortController + cancelled 标记"，说明你在真实项目里调过这些 bug。
:::
