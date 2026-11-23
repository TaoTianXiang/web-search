## 一句话区分

| | Server Component（RSC） | Client Component |
| --- | --- | --- |
| 运行环境 | 只在服务端/构建时 | 服务端（SSR 预渲染）+ 浏览器 |
| 产物 | **序列化的 UI 描述**（不是 HTML，也不是 JS bundle） | JavaScript bundle |
| 能否用 state / 事件 | ❌ | ✅ |
| 能否访问数据库 / 文件系统 | ✅ | ❌ |
| 是否发送到浏览器 | 组件代码**不发送** | 代码会打包发送 |
| 体积影响 | 零 bundle 体积 | 计入 bundle |

## RSC 的本质

RSC 不是"在服务端渲染 HTML"，而是**在服务端执行组件，产出一种可序列化的组件树描述**（Flight 协议格式）：

```
// 服务端产物（简化）
0: ["$","div",null,{"children":[["$","h1",null,{"children":"标题"}],["$","$L1",null,{}]]}]
1: {"id":"...","chunks":["client-counter.js"]}
```

浏览器收到后，用这份描述构建 React 树；遇到 `"use client"` 的组件时，才去加载对应的 JS chunk。

所以 RSC 的真正价值不是首屏更快（那是 SSR 的功劳），而是：

1. **零客户端体积**：依赖库（如 markdown 解析器、日期库）只在服务端跑，不进 bundle
2. **直接访问数据源**：可以在组件里 `await db.query()`，无需 API 层
3. **静态可分析**：构建期就能确定哪些组件是服务端的

## 与 SSR 的差异

| 维度 | SSR | RSC |
| --- | --- | --- |
| 产物 | HTML 字符串 | 序列化的组件树（Flight） |
| 客户端 JS | 全量 hydrate | 只有 Client Component 需要 hydrate |
| 数据访问 | 通过 props 或 API | 组件内直接访问 |
| 交互能力 | 与 CSR 相同（全量 hydrate） | 只有标记为 client 的部分可交互 |
| 状态 | 正常使用 | Server Component 不能用 state |

SSR 只是"先在服务端渲染出 HTML"，之后仍然要下载全量 JS 并 hydrate。RSC 则是"部分组件根本不需要客户端 JS"。

## 何时用哪种

```jsx
// app/page.tsx —— 默认是 Server Component
import { db } from '@/lib/db'
import Counter from './Counter'      // Client Component

export default async function Page() {
  const posts = await db.post.findMany()   // 直接查库
  return (
    <main>
      <h1>文章列表</h1>
      {posts.map((p) => <article key={p.id}>{p.title}</article>)}
      <Counter />                       {/* 只有这个进入客户端 */}
    </main>
  )
}
```

```jsx
// app/Counter.tsx
'use client'                            // 从这里开始，下面整棵子树都是客户端

import { useState } from 'react'

export default function Counter() {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n + 1)}>{n}</button>
}
```

判断原则：

| 需求 | 选择 |
| --- | --- |
| 需要 useState / useEffect / 事件 | Client |
| 需要访问数据库、密钥、文件系统 | Server |
| 纯展示、无交互 | Server（默认） |
| 引入大依赖（图表、编辑器） | 尽量 Server，或动态 import |
| 使用浏览器 API（window、localStorage） | Client |

## 三个常见限制

1. **Server Component 不能传给 Client Component 函数**
```jsx
   <Client onClick={() => {}} />  // ❌ 函数不可序列化
```
   解决：把交互逻辑整体放进 Client Component，只传可序列化的数据。

2. **Client 组件不能 import Server 组件**
   只能通过 `children` 或 props 以"已渲染的 React 元素"形式传入。

3. **Context 只能在 Client 侧提供**
   Provider 必须是 Client Component，Server Component 不能消费它。

## 边界设计的实践

```jsx
// ❌ 整页标记为 client，失去 RSC 收益
'use client'
export default function Page() { /* 大量静态内容 */ }

// ✅ 只把交互岛标记为 client
export default function Page() {
  return (
    <>
      <StaticContent />      {/* Server */}
      <InteractiveIsland />  {/* Client，边界尽量小 */}
      <Footer />             {/* Server */}
    </>
  )
}
```

"把 client 边界往下推"是 RSC 最重要的设计原则。

::: interview 面试视角
能说清"RSC 产物是序列化的组件树而非 HTML"、"与 SSR 的本质差异是是否需要全量 hydrate"、"server 不能传函数给 client"，就超过了大多数只背概念的回答。
:::
