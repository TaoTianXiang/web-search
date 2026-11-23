## key 的作用

key 是 React 用来**在同层兄弟节点之间建立身份映射**的标识。有了 key，diff 才能判断"这个节点是移动了、还是被替换了"。

```jsx
{items.map((it) => <Row key={it.id} data={it} />)}
```

没有 key 时，React 退化为"按位置比对"，只要顺序变化就视为内容替换。

## 用 index 做 key 的真实 bug

```jsx
function TodoList() {
  const [items, setItems] = useState(['a', 'b', 'c'])

  return (
    <ul>
      {items.map((it, i) => (
        <li key={i}>
          {it}
          <input placeholder="备注" />   {/* 非受控输入 */}
        </li>
      ))}
    </ul>
  )
}
```

删除第一项后：

| 位置 | 旧内容 | 新内容 |
| --- | --- | --- |
| 0 | a | b |
| 1 | b | c |

React 认为"位置 0 还是位置 0"，于是**复用同一个 DOM 节点**，只更新文本。结果：

- 第一个输入框里原本属于 a 的备注，现在显示在 b 那行
- 如果组件内部有 `useState`，状态也会串位

这就是"状态错位"的典型表现。

## 另一类 bug：动画与焦点

```jsx
{tabs.map((t, i) => (
  <Tab key={i} active={t === current}>{t}</Tab>
))}
```

在中间插入一个 Tab 时，后面的 Tab 组件会**复用旧实例**，导致：

- CSS transition 从错误的起始状态开始
- 输入框焦点跳到了错误的行
- 组件内部滚动位置错乱

## 什么时候 index 是安全的

只有当列表满足**全部**条件时：

1. 只追加，从不删除
2. 从不排序
3. 从不在中间插入
4. 列表项无内部状态、无动画、无焦点

实际业务中几乎无法保证，所以团队规范通常直接禁止。

## key 的正确选择

| 优先级 | 选择 |
| --- | --- |
| 1 | 数据自带唯一 id（推荐） |
| 2 | 稳定业务键组合（`orgId + role`） |
| 3 | 内容哈希（`hash(JSON.stringify(item))`，谨慎） |
| ❌ | 数组 index |
| ❌ | `Math.random()`（每次渲染都变，等于全部重建） |

::: warn key 不影响子组件内部
key 只影响 React 如何看待"这个节点是谁"。它不能替代 props 更新，也不能阻止子组件重渲染（那是 memo 的职责）。
:::

## 与 Vue 的差异

Vue 同样需要 key，原因完全一致（列表 diff 依赖身份标识）。Vue 3 的编译器还能在静态列表上做优化，但动态列表仍必须写 key。

::: interview 面试视角
不要只说"提升 diff 效率"。要给出"删除首项导致输入框内容串位"的具体例子，以及"随机 key 等于全部重建"的反例，才能证明你真的踩过坑。
:::
