架构题考察的不是"你知道多少方案"，而是"你能否在约束下做出可解释的取舍"。这一章给出常见场景的判断框架。

## 分层与依赖方向

```
pages / routes      页面编排、权限、布局
      │
      ▼
features            业务模块：领域逻辑 + 状态 + 用例
      │
      ▼
components          通用组件：无业务语义
      │
      ▼
services / api      数据访问：请求、DTO 转换、错误映射
      │
      ▼
utils / hooks       基础设施：纯函数、通用 hook
```

**依赖只能自上而下**。反向依赖是最常见的架构腐化：

```js
// ❌ utils 里 import 业务模块
import { UserRole } from '@/features/user/types'

// ✅ 把共享类型下沉到 shared/types
import { UserRole } from '@/shared/types'
```

### 用工具守住边界

```js
// eslint-plugin-boundaries
{
  settings: {
    'boundaries/elements': [
      { type: 'pages', pattern: 'src/pages/*' },
      { type: 'features', pattern: 'src/features/*' },
      { type: 'components', pattern: 'src/components/*' }
    ]
  },
  rules: {
    'boundaries/element-types': ['error', {
      default: 'disallow',
      rules: [
        { from: 'pages', allow: ['features', 'components'] },
        { from: 'features', allow: ['components', 'services'] },
        { from: 'components', allow: [] }
      ]
    }]
  }
}
```

约束必须是**自动化的**，靠 code review 记住规则不可持续。

## DTO 与 ViewModel

```ts
// 接口返回（DTO）
interface UserDTO {
  user_id: string
  user_name: string
  created_at: number
}

// 组件使用（ViewModel）
interface User {
  id: string
  name: string
  createdAt: Date
}

// 转换层在 services
export function toUser(dto: UserDTO): User {
  return {
    id: dto.user_id,
    name: dto.user_name,
    createdAt: new Date(dto.created_at * 1000)
  }
}
```

价值：后端字段改名只影响一个函数，不会扩散到几十个组件。

### 更彻底的做法：契约生成

```bash
npx openapi-typescript ./api.yaml -o ./src/types/api.d.ts
```

类型由后端契约生成，杜绝手写漂移。前端再基于生成类型写适配层。

## 状态管理的边界

| 状态类型 | 归属 | 例子 |
| --- | --- | --- |
| 组件内部状态 | 组件自身 | 展开/折叠、输入框内容 |
| 跨组件共享 | 提升到最近公共祖先或 Context/Provide | 表单校验状态 |
| 全局应用状态 | store（Pinia/Zustand/Redux） | 用户信息、主题、权限 |
| 服务端状态 | 数据请求库（TanStack Query/SWR） | 列表数据、详情 |

::: warn 最常见的设计错误
把**服务端数据**塞进全局 store。结果是要手动处理缓存失效、加载态、竞态、轮询，实际上重新实现了一个数据请求库。

服务端状态应该交给专门工具：它天然提供缓存、去重、重试、失效策略。
:::

```ts
// TanStack Query 的典型用法
const { data, isLoading } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id),
  staleTime: 60_000
})
```

## SSR / SSG / CSR 的取舍

| 方案 | 首屏 | SEO | 成本 |
| --- | --- | --- | --- |
| CSR | 差（等 JS） | 差 | 低 |
| SSR | 好 | 好 | 高（服务端算力、流式、缓存） |
| SSG | 最好 | 最好 | 内容需可预生成 |
| ISR | 好 | 好 | 需要增量再生成机制 |

### SSR 的真实成本

1. **服务端算力**：每个请求都要渲染，高峰需要扩容
2. **一致性**：服务端与客户端渲染结果必须一致，否则 hydration mismatch
3. **环境差异**：`window`、`localStorage` 在服务端不存在，需要条件判断
4. **缓存策略**：页面级、组件级、数据级三层缓存都要设计
5. **降级方案**：渲染失败要有 CSR 兜底

```js
// hydration mismatch 的典型来源
const theme = localStorage.getItem('theme') // 服务端为 null，客户端有值
```

解法：首屏用服务端可确定的值，客户端挂载后再切换。

::: tip 决策建议
内容型站点（文档、博客、电商详情）→ SSG/ISR 优先，SSR 次之。
强交互应用（后台、工具）→ CSR 即可，SSR 收益低而成本高。
混合场景 → 同一应用内按路由选择渲染模式（Next.js / Nuxt 支持）。
:::

## 微前端：一句话结论

微前端是**组织问题的技术解法**，不是性能方案。判断标准只有一条：**是否有多个团队需要独立部署**。

- 单个团队 → 不要上，用 Monorepo 领域分包即可
- 多团队 + 发版互相阻塞 → 才值得
- 存量系统需逐页迁移 → 最合理的场景

完整讲解（五种流派对比、JS/样式隔离细节、通信设计、选型决策树、替代方案）见专题：[微前端：从概念到选型](/learn/micro-frontend)。

::: warn 最常见的误用
把"单页太大、加载慢"当成微前端的适用场景。这类问题的解法是代码分割、懒加载、Tree Shaking，微前端只会让它更慢。
:::

## 中后台架构的具体设计

### 权限模型

```
路由级：这个页面能不能进
按钮级：这个操作能不能点
数据级：这条数据能不能看
```

```ts
// 统一在一个地方判定
const can = (action: string, resource?: Resource) => {
  const perms = usePermissionStore().codes
  if (perms.includes('*')) return true
  if (resource) return perms.includes(`${action}:${resource.type}:${resource.ownerId}`)
  return perms.includes(action)
}
```

三层权限必须在**同一处**判定，分散在各组件里必然失控。

### 表格页的标准结构

```
TablePage
├── SearchForm        查询条件（受控 + 缓存）
├── Toolbar           批量操作 + 列设置
├── DataTable         虚拟滚动 + 列冻结
│   └── CellRenderers 按列类型渲染
└── Pagination        分页 / 无限滚动
```

关键抽象：**列配置驱动**。

```ts
interface ColumnDef<T> {
  key: keyof T
  title: string
  width?: number
  render?: (row: T) => VNode
  sortable?: boolean
  filterable?: boolean
}
```

一处的列定义同时驱动表头、筛选器、列设置面板、导出。这是中后台复用度最高的抽象。

### 表单的复杂度治理

复杂表单（几十个字段、联动、动态增删）的三种方案：

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| 手写受控组件 | 完全可控 | 样板代码多 |
| Schema 驱动（JSON Schema） | 可配置、可后台下发 | 复杂联动表达力弱 |
| 表单引擎（Formily / vee-validate） | 兼顾两者 | 学习成本、调试困难 |

判断标准：**字段数 × 联动复杂度 × 表单数量**。只做两三个表单就手写；几十个表单且结构相似才值得上引擎。

::: interview 面试视角
架构题的高分回答结构是：**约束 → 备选 → 取舍 → 验证**。例如"因为团队 5 人、只有一个应用，所以没上微前端，而是用领域分包 + 独立 CI 达到同样的发布解耦效果"。这体现了判断力。
:::