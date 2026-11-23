## 问题来源

React 15 的 Stack Reconciler 是**递归**的：一旦开始协调，就必须走完整棵组件树。树大时一次更新会占用主线程几百毫秒，造成输入卡顿与动画掉帧。

Fiber 的核心改动是：把递归改成**可中断的链表遍历**，每个节点是一个可以单独完成的工作单元。

## Fiber 节点的数据结构

```js
{
  // 身份
  tag: FunctionComponent,   // 组件类型标记
  key: null,
  type: MyComp,             // 函数/类/字符串标签
  elementType: MyComp,

  // 实例
  stateNode: instanceOrDom,
  memoizedState: hooksList,  // Hooks 链表头
  memoizedProps: props,
  updateQueue: updates,

  // 链表结构（核心）
  child: fiber | null,       // 第一个子节点
  sibling: fiber | null,     // 下一个兄弟
  return: fiber | null,      // 父节点（回溯用）

  // 双缓存
  alternate: fiber | null,   // 指向另一棵树上的对应节点

  // 优先级与副作用
  lanes: Lane,
  childLanes: Lane,
  flags: Update | Placement | Deletion,
  subtreeFlags: ...
}
```

关键点：**用 child / sibling / return 三个指针把树变成了可双向遍历的链表**，因此可以在任意节点暂停并保存"当前进度"。

## 与 Stack Reconciler 的对照

| 维度 | Stack | Fiber |
| --- | --- | --- |
| 遍历方式 | 递归调用栈 | 链表 + 循环 |
| 可中断 | ❌ | ✅ |
| 优先级 | 无 | lane 位掩码 |
| 复用机制 | 无 | 双缓存树（current / workInProgress） |
| 副作用标记 | 同步执行 | 打 flag，统一在 commit 执行 |

## 双缓存树

```
current 树（屏幕上正在显示的）
      ▲ alternate 互相指向
      ▼
workInProgress 树（正在构建的）
```

render 阶段所有计算都在 `workInProgress` 上完成，commit 阶段一次性把 `root.current` 指针切过去。用户永远看不到"构建了一半"的 UI。

## 两个阶段

| 阶段 | 函数 | 特性 |
| --- | --- | --- |
| Render | `beginWork` / `completeWork` | 可中断、可重放、**不能有副作用** |
| Commit | `commitBeforeMutationEffects` → `mutation` → `layout` | 同步、不可中断、执行 DOM 变更与生命周期 |

render 阶段可能被"丢掉重来"，所以在其中执行副作用会导致不可预期的重复调用。这也是 `StrictMode` 双重调用能暴露问题的原因。

## 时间切片

```js
// Scheduler 的核心循环（简化）
const channel = new MessageChannel()
channel.port1.onmessage = performWorkUntilDeadline

function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress)
  }
}

function shouldYield() {
  return getCurrentTime() - startTime >= 5 // 5ms 预算
}
```

三个设计要点：

1. **5ms 时间片**：在 60fps（16.7ms/帧）下留出足够时间给浏览器渲染与响应输入
2. **MessageChannel 而非 setTimeout**：`setTimeout` 有 4ms 最小延迟且会被节流，`MessageChannel` 是宏任务中最快的调度手段
3. **让出后恢复**：`workInProgress` 保存在全局，下次继续

## 优先级：Lane 模型

```js
export const SyncLane = 0b0001
export const InputContinuousLane = 0b0100
export const DefaultLane = 0b01000
export const TransitionLanes = ...
export const IdleLane = ...
```

用 31 位位掩码表达优先级，好处是：

- 位运算 O(1) 判断"是否包含某优先级"
- 一个数字能表达"一组优先级"
- 便于合并与过滤（`lanes & ~SyncLane`）

高优先级任务（输入）可以打断低优先级任务（列表渲染），被打断的低优先级任务会在之后重做。

::: warn "并发"不是多线程
React 并发渲染仍然是**单线程**。所谓并发是"任务可中断 + 优先级调度"：让紧急工作插队，牺牲非紧急工作的及时性。渲染本身仍在主线程执行。
:::

::: interview 面试视角
能画出 child/sibling/return 三个指针，说明"双缓存解决撕裂"、"5ms 时间片用 MessageChannel 而非 setTimeout"，就是完整的 Fiber 回答。能进一步说出 lane 位掩码的设计动机，是加分项。
:::
