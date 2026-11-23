## 合成事件是什么

React 不直接把事件监听绑到每个元素上，而是：

1. 在根容器上挂**一个**委托监听
2. 事件触发时，构造一个 `SyntheticEvent` 对象
3. 沿 React 树模拟捕获与冒泡，依次调用收集到的 listener

```jsx
<button onClick={(e) => {
  console.log(e.nativeEvent)   // 原生事件对象
  console.log(e.currentTarget) // 事件处理器绑定的元素
}}>
```

## 与原生事件的差异

| 维度 | 合成事件 | 原生事件 |
| --- | --- | --- |
| 挂载位置 | 统一在根容器（委托） | 各自的元素 |
| 事件对象 | 池化（React 17 前）/ 复用 | 每次新建 |
| 跨浏览器一致性 | 抹平差异 | 需自行处理 |
| 阻止默认 | `e.preventDefault()` | 同 |
| 与原生混用 | 需注意执行顺序 | — |

## React 16 vs 17 的挂载点变化

```
React 16：委托到 document
React 17+：委托到 root 容器（createRoot 的节点）
```

原因（多版本共存与渐进升级）：

1. **微前端 / 多 React 版本**：都挂在 document 时，事件会互相干扰（`stopPropagation` 会打断另一个版本的处理）
2. **渐进升级**：可以让新旧版本各自管理自己的根容器
3. **与原生事件顺序更可预测**：document 上的原生监听现在会比 React 的处理**先**执行

::: warn 这个变化会引发真实 bug
```js
// React 16：这个 document 上的监听会在 React onClick 之后执行
document.addEventListener('click', handler)
```
```
React 17+：如果 React 的根在 #app 内部，document 监听会在 React 处理**之后**执行
```
依赖"先 React 后 document"的代码在升级时会失效。
:::

## 事件池（React 16）

```jsx
function App() {
  const [text, setText] = useState('')

  function onChange(e) {
    setText(e.target.value)
    setTimeout(() => {
      console.log(e.target.value)   // React 16：报错或为 null（事件对象已回收）
    })
  }
}
```

React 17 起取消了事件池，事件对象不再被回收，可以安全地异步访问。这是升级时的一个体验改善。

## 捕获与冒泡的模拟

React 支持 `onClickCapture`：

```jsx
<div onClickCapture={...} onClick={...}>
  <button onClick={...} />
</div>
```

React 会按"外层 capture → 内层 capture → 内层 bubble → 外层 bubble"的顺序调用，与 DOM 标准一致。

## 什么时候需要用原生事件

```js
useEffect(() => {
  // 1. 需要监听 document / window（React 只能绑到 React 树内的元素）
  window.addEventListener('resize', onResize)

  // 2. 需要 passive 优化滚动性能
  window.addEventListener('scroll', onScroll, { passive: true })

  // 3. 与第三方库（图表、编辑器）集成
  return () => {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('scroll', onScroll)
  }
}, [])
```

::: tip 性能取舍
合成事件的委托模型减少了监听器数量，对大列表很友好。但它也带来一层调用开销，极端高频场景（如 mousemove）可以改用原生 + passive。
:::

::: interview 面试视角
能说清"React 17 改为委托到 root 而非 document，是为了多版本共存"，以及"事件池已取消"，说明你经历过版本升级而不是只读过文档。
:::
