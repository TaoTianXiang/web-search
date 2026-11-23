## 三者对比

| API | 缓存对象 | 比较方式 | 作用范围 |
| --- | --- | --- | --- |
| `React.memo` | **组件渲染结果** | props 浅比较 | 组件 |
| `useMemo` | **计算结果** | 依赖数组 | 值 |
| `useCallback` | **函数引用** | 依赖数组 | 引用 |

```js
// 等价关系：useCallback(fn, deps) === useMemo(() => fn, deps)
```

## 各自的实际作用

### React.memo

```jsx
const Row = React.memo(function Row({ item, onSelect }) {
  return <div onClick={() => onSelect(item.id)}>{item.name}</div>
})
```

阻止"父组件重渲染导致的子组件重渲染"。但只有 props 真的没变时才有效：

```jsx
// ❌ 每次都是新对象/新函数，memo 失效
<Row item={item} onSelect={(id) => select(id)} />

// ✅ 引用稳定
<Row item={item} onSelect={handleSelect} />
```

### useMemo

```jsx
// 昂贵计算只依赖 list 时复用
const sorted = useMemo(() => heavySort(list), [list])

// Context value 引用稳定，避免所有消费者重渲染
const ctx = useMemo(() => ({ theme, setTheme }), [theme])
```

### useCallback

```jsx
const handleSelect = useCallback((id) => {
  setSelected(id)
}, [])   // setSelected 稳定，所以依赖为空

// 给 memo 子组件传递稳定的回调
<List onSelect={handleSelect} />
```

## 为什么"不要过早优化"

三个成本：

1. **内存**：缓存本身占内存（依赖数组 + 缓存结果）
2. **比较开销**：每次渲染都要做依赖比较，依赖多时反而更慢
3. **可读性**：大量 useMemo/useCallback 让代码难以理解

经验判断：

| 场景 | 是否值得 |
| --- | --- |
| 计算 < 1ms | 不值得 |
| 渲染大列表 / 大量子组件 | 值得 |
| 依赖是每次新建的对象 | 无意义（缓存永远失效） |
| 传给 memo 子组件 | 值得（否则 memo 白做） |
| Context Provider value | **必须**（否则所有消费者重渲染） |

## 判断优化是否真的有效

1. **React DevTools Profiler**：录制一次交互，看"哪些组件渲染了、耗时多少"
2. **Highlight updates**：开启后能在页面上看到重渲染区域闪烁
3. 对比优化前后的 commit 时间与渲染次数

```jsx
// 也可以用一个简易的渲染计数器
function useRenderCount(name) {
  const count = useRef(0)
  count.current++
  console.log(name, count.current)
}
```

::: warn 常见反模式
```jsx
// 1. memo 了但 props 每次都是新对象 → 完全无效
const Child = memo(({ config }) => ...)
<Child config={{ size: 'lg' }} />

// 2. 依赖里放每次新建的对象
useMemo(() => compute(options), [options])   // options 每次都是新对象

// 3. 用 useMemo 包住一个常量
const x = useMemo(() => 1, [])   // 毫无意义
```
:::

::: interview 面试视角
能说清"memo 对 props 做浅比较，所以内联对象/函数会让它失效"、"Context value 必须 memo"、"用 Profiler 验证收益"，就超过了"知道三个 API"的层次。
:::
