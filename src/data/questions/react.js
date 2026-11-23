/* eslint-disable */
/** React：第 25–35 题 */

export const reactQuestions = [
  {
    id: 'react-01',
    code: 25,
    title: 'React Fiber 架构与时间切片',
    categoryId: 'react',
    level: '高级',
    freq: '极高',
    trend: '字节/滴滴等大厂必考。2026 常见问法：Fiber 节点的数据结构是什么，和 Stack Reconciler 有什么区别',
    tags: ['Fiber', '时间切片', '并发'],
    question:
      'React Fiber 架构的工作原理是什么？为什么引入时间切片？请描述 Fiber 节点的数据结构、render 与 commit 两个阶段，以及并发模式下为什么可以中断。',
    answerId: 'react-01',
    followups: ['lane 模型如何实现优先级排序与饥饿问题处理', '为什么 render 阶段不能执行副作用，StrictMode 如何暴露问题']
  },
  {
    id: 'react-02',
    code: 26,
    title: 'React Server Components 与 Client Components',
    categoryId: 'react',
    level: '高级',
    freq: '极高',
    trend: '2026 新晋必考。几乎所有使用 React 的大厂都会问',
    tags: ['RSC', 'Next.js', '渲染模式'],
    question:
      'React Server Components（RSC）和 Client Components 有什么区别？什么场景用哪种？RSC 的产物是什么，与 SSR 有什么本质差异？',
    answerId: 'react-02',
    followups: ['Flight 协议如何序列化组件树', 'RSC 下如何处理第三方库的 "use client" 边界']
  },
  {
    id: 'react-03',
    code: 27,
    title: 'useState 与 useReducer 的区别与选型',
    categoryId: 'react',
    level: '中级',
    freq: '高',
    tags: ['Hooks', '状态管理'],
    question:
      'useState 和 useReducer 有什么区别？什么时候应该用 useReducer？两者在更新语义上有什么共性？',
    answerId: 'react-03',
    followups: ['useReducer 如何配合 Context 实现轻量全局状态', 'React 18 下 dispatch 的批处理行为']
  },
  {
    id: 'react-04',
    code: 28,
    title: 'useEffect 依赖数组原理与闭包陷阱',
    categoryId: 'react',
    level: '高级',
    freq: '高',
    trend: '2026 真实面试常以"你在 React 项目中如何发现和定位性能问题"的方式展开',
    tags: ['useEffect', '闭包', '性能'],
    question:
      'useEffect 的依赖数组是如何比较的？闭包陷阱（stale closure）是怎么产生的？如何系统性地避免？你在项目中如何定位这类问题？',
    answerId: 'react-04',
    followups: ['useEffect 与 useLayoutEffect 在 SSR 中的差异', '如何用 React 19 的 use() 与 Suspense 替代部分 useEffect 数据请求']
  },
  {
    id: 'react-05',
    code: 29,
    title: 'memo / useMemo / useCallback 的区别与适用场景',
    categoryId: 'react',
    level: '高级',
    freq: '高',
    tags: ['性能优化', 'memo'],
    question:
      'React.memo、useMemo、useCallback 有什么区别？分别什么场景用？为什么说"不要过早优化"？如何判断优化是否有效？',
    answerId: 'react-05',
    followups: ['React Compiler 自动 memo 后，手动 useMemo 还需要吗', '浅比较的成本如何评估（依赖数组多长时得不偿失）']
  },
  {
    id: 'react-06',
    code: 30,
    title: 'React 18 并发特性：startTransition 与 useTransition',
    categoryId: 'react',
    level: '高级',
    freq: '高',
    trend: '2026 新趋势。常追问"useTransition 和 setTimeout 有什么区别"',
    tags: ['并发', 'startTransition', '优先级'],
    question:
      'React 18 的并发特性有哪些？startTransition 和 useTransition 怎么用？useTransition 和 setTimeout 有什么区别？',
    answerId: 'react-06',
    followups: ['useDeferredValue 与 useTransition 的底层是否共用同一套 lane', 'transition 中的更新被丢弃后，副作用函数会被执行吗']
  },
  {
    id: 'react-07',
    code: 31,
    title: '虚拟 DOM 与 diff 算法的核心策略',
    categoryId: 'react',
    level: '中级',
    freq: '高',
    tags: ['虚拟DOM', 'diff'],
    question:
      '虚拟 DOM 的原理是什么？它真的比直接操作 DOM 快吗？React 的 diff 算法有哪三个核心策略？',
    answerId: 'react-07',
    followups: ['Vue 3 的双端对比与 LIS 具体如何减少移动', '为什么 React 不用 LIS 优化列表移动']
  },
  {
    id: 'react-08',
    code: 32,
    title: '列表渲染为什么需要 key',
    categoryId: 'react',
    level: '中级',
    freq: '高',
    trend: '大厂高频 100 题第 1 题',
    tags: ['key', 'diff', '状态错位'],
    question:
      '为什么列表渲染要写 key？key 的作用是什么？用 index 作为 key 会有什么问题？请举一个真实会出 bug 的例子。',
    answerId: 'react-08',
    followups: ['key 变化时 React 会做什么（完整卸载重建）', '如何在虚拟列表里处理 key 与滚动位置的关系']
  },
  {
    id: 'react-09',
    code: 33,
    title: '状态管理选型：Redux / Zustand / Jotai',
    categoryId: 'react',
    level: '高级',
    freq: '中高',
    tags: ['状态管理', '选型'],
    question:
      'React 的状态管理方案有哪些？Redux、Zustand、Jotai 的核心差异是什么？你会如何为一个中后台项目选型？',
    answerId: 'react-09',
    followups: ['Zustand 的 subscribeWithSelector 与 transient update', 'Jotai 与 Recoil 的差异与现状']
  },
  {
    id: 'react-10',
    code: 34,
    title: '如何避免全局状态更新导致所有列表项重渲染',
    categoryId: 'react',
    level: '高级',
    freq: '中高',
    tags: ['性能', 'Context', '订阅粒度'],
    question:
      '全局状态更新时，如何避免整个列表重新渲染？请对比 Context、selector 订阅、原子化三种思路。',
    answerId: 'react-10',
    followups: ['虚拟滚动的实现原理与动态行高处理', 'React 19 的 use(Context) 是否改变了订阅粒度']
  },
  {
    id: 'react-11',
    code: 35,
    title: 'React 合成事件机制',
    categoryId: 'react',
    level: '高级',
    freq: '中高',
    tags: ['合成事件', '事件委托'],
    question:
      'React 的合成事件（SyntheticEvent）是什么？与原生事件有什么区别？React 17 前后的事件委托挂载点发生了什么变化？',
    answerId: 'react-11',
    followups: ['React 事件与原生事件的执行顺序如何验证', 'portals 中的事件如何冒泡到 React 父组件']
  }
]