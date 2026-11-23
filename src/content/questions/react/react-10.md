## 问题复现

```jsx
const StoreCtx = createContext()

function App() {
  const [state, setState] = useState({ items: [], filter: '' })
  // ❌ value 每次都是新对象 → 所有消费者重渲染
  return <StoreCtx.Provider value={{ state, setState }}>...</StoreCtx.Provider>
}

function Item({ id }) {
  const { state } = useContext(StoreCtx)   // 任一字段变化都重渲染
  return <div>{state.items.find(i => i.id === id).name}</div>
}
```

三个叠加问题：

1. Provider 的 value 是新对象 → 所有消费者都失效
2. Context 无法"只订阅某一部分"
3. Item 依赖整个 state，无法只关心自己的数据

## 方案一：拆分 Context + memo

```jsx
const ItemsCtx = createContext()
const FilterCtx = createContext()

function App() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('')

  return (
    <ItemsCtx.Provider value={items}>
      <FilterCtx.Provider value={filter}>
        <List />
      </FilterCtx.Provider>
    </ItemsCtx.Provider>
  )
}

const Item = memo(function Item({ item }) {
  return <div>{item.name}</div>
})
```

要点：

- 按**更新频率**拆分 Context
- `items` 引用不变时，ItemsCtx 的消费者不重渲染
- 列表项用 `memo`，只有 item 引用变化的行才更新

局限：拆分粒度靠人工设计，容易拆错。

## 方案二：外部 store + selector 订阅

```js
const useStore = create((set) => ({
  items: [],
  filter: '',
  setName: (id, name) => set((s) => ({
    items: s.items.map(i => i.id === id ? { ...i, name } : i)
  }))
}))

// 每一行只订阅自己的 item
function Row({ id }) {
  const item = useStore((s) => s.items.find(i => i.id === id))  // 引用稳定则不重渲染
  return <div>{item.name}</div>
}
```

关键：selector 返回的引用在无关更新时保持不变，Zustand 用 `Object.is` 比较后跳过渲染。

但注意 `find` 每次都返回同一对象引用（数组元素未被替换时），所以是安全的；如果 selector 里做 `map/filter` 创建新数组，就必须用 `useShallow`。

## 方案三：原子化

```js
const itemAtomFamily = atomFamily((id) => atom({ id, name: '' }))

function Row({ id }) {
  const [item] = useAtom(itemAtomFamily(id))   // 只订阅这一个原子
  return <div>{item.name}</div>
}
```

每个 item 是独立原子，更新 A 不会通知 B 的订阅者。这是最细的粒度。

## 方案四：虚拟列表

如果列表本身有上千行，上面的优化仍然不够——因为 diff 本身也需要遍历。此时用虚拟滚动，只渲染可见的 20 行：

```jsx
<VirtualList items={items} itemHeight={40} renderItem={(it) => <Row item={it} />} />
```

## 选择建议

| 场景 | 方案 |
| --- | --- |
| 少量共享状态 | Context + memo |
| 中等规模、需要细粒度 | Zustand selector |
| 派生关系复杂 | Jotai 原子 |
| 上千行列表 | 虚拟滚动（优先） |

::: warn Context 的性能陷阱
```jsx
// 即使只用了 setState，也会因为 value 变化而重渲染
const { setState } = useContext(StoreCtx)
```
把"稳定的 dispatch"与"易变的数据"拆到两个 Context，是简单有效的做法。
:::

::: interview 面试视角
能指出"Context 无法局部订阅"这一根本限制，并给出"拆分 / selector / 原子 / 虚拟列表"四层递进方案，说明你有系统性的性能治理思路。
:::
