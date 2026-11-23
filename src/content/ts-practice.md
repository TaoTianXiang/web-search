类型写得好，代码会"自己解释自己"。这一章讲的是把类型当作**设计工具**，而不是事后补注释。

## 判别联合：把状态机写进类型

业务代码里大量状态用布尔组合表达，最终产生非法状态：

```ts
// 差：4 种组合，其中 2 种非法
interface State {
  loading: boolean
  data?: User
  error?: Error
}
```

改用判别联合：

```ts
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error }
```

配合穷尽检查，新增状态时编译器会强制你处理：

```ts
function assertNever(x: never): never {
  throw new Error(`Unexpected: ${JSON.stringify(x)}`)
}

function render(s: State) {
  switch (s.status) {
    case 'idle': return null
    case 'loading': return spinner
    case 'success': return view(s.data)   // s.data 已收窄
    case 'error': return errorView(s.error)
    default: return assertNever(s)
  }
}
```

::: tip 价值
"不可能状态不可表示"（make illegal states unrepresentable）是类型驱动设计的核心。它把运行时 bug 转成编译期错误。
:::

## 收窄（narrowing）的全部手段

| 手段 | 示例 | 适用 |
| --- | --- | --- |
| `typeof` | `typeof x === 'string'` | 原始类型 |
| 真值判断 | `if (x)` | 排除 null/undefined/'' |
| `in` | `'data' in res` | 区分对象形状 |
| `instanceof` | `err instanceof Error` | 类实例 |
| 字面量比较 | `s.status === 'ok'` | 判别联合 |
| 自定义 guard | `isUser(x)` | 复杂结构 |
| 断言函数 | `asserts x is T` | 校验后收窄 |

### 类型守卫

```ts
function isUser(v: unknown): v is User {
  return typeof v === 'object' && v !== null && 'id' in v && typeof (v as User).id === 'string'
}

function assertUser(v: unknown): asserts v is User {
  if (!isUser(v)) throw new TypeError('not a user')
}
```

断言函数（`asserts`）在测试与边界校验中非常有用：调用后整个作用域都收窄了。

### 收窄的边界

```ts
function f(x: string | number) {
  if (typeof x === 'string') {
    setTimeout(() => x.toUpperCase()) // ✅ 闭包中仍收窄（const 语义）
  }
  if (typeof x === 'number') {
    x = 'now string' // 重新赋值后收窄失效
  }
}
```

## satisfies：校验但不放宽

`as` 会放弃检查，`satisfies` 会检查并保留精确类型。

```ts
const routes = {
  home: '/',
  user: '/user/:id'
} satisfies Record<string, `/${string}`>

// routes.home 的类型是 '/'（字面量），而不是 string
type HomePath = typeof routes.home // '/'
```

用 `as` 写：

```ts
const routes2 = {
  home: '/',
  user: '/user/:id'
} as Record<string, `/${string}`>

type Home2 = typeof routes2.home // string —— 精确性丢了
```

### 经典场景：配置对象

```ts
const handler = {
  get: (req) => req.query,
  post: (req) => req.body
} satisfies Record<HTTPMethod, (req: Request) => unknown>
```

如果少写一个方法会立即报错，同时每个 handler 的参数类型仍能被正确推断。

## 泛型 API 的设计原则

### 1. 让调用方少写泛型

```ts
// 差：调用方要写两次
function wrap<T>(value: T): Box<T>

// 好：从参数推断
function wrap<T>(value: T): Box<T>  // 调用时自动推断，无需显式传
```

### 2. 用约束表达前置条件

```ts
function merge<T extends object, U extends object>(a: T, b: U): T & U
```

### 3. 用重载表达不同输入 → 不同输出

```ts
function parse(input: string): JSONValue
function parse(input: Buffer): JSONValue
```

### 4. 避免 `any`，用 `unknown` + 收窄

```ts
function handle(payload: unknown) {
  if (!isPayload(payload)) throw new TypeError()
  // 此处 payload 已是 Payload
}
```

## 类型测试：让类型也有单元测试

用 `expect-type` 或手写断言：

```ts
type Expect<T extends true> = T
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false

type Case1 = Expect<Equal<MyOmit<A, 'a'>, { b: 2 }>>
```

这类测试在工具库中最有价值：类型一旦回归，CI 直接失败。

## 渐进式迁移策略

从 JS 迁移到 TS，不要一次全改：

1. **开启 `allowJs` + `checkJs: false`**：先让 `.ts` 与 `.js` 共存
2. **从叶子模块开始加类型**：工具函数 → 数据层 → 组件
3. **对第三方库缺类型用 `declare module`** 补最小声明
4. **逐步打开 strict 子开关**：`noImplicitAny` → `strictNullChecks` → 全 `strict`
5. **禁止新代码用 `any`**：用 ESLint `@typescript-eslint/no-explicit-any` 守护

::: warn 常见反模式
- `// @ts-ignore` 满天飞，比不迁移更糟
- 把所有接口字段写成可选，丢失约束价值
- 用 `as any` 掩盖三方库类型问题，应当写 `d.ts` 或提 issue
:::

## 编译期配置建议

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

`noUncheckedIndexedAccess` 会让 `arr[0]` 变为 `T | undefined`，初期报错很多，但能消除一类真实 bug。

::: interview 面试视角
被问"你怎么用 TS"，回答"我开了 strict"很平庸。更好的答案是：**我用类型把哪些运行时错误变成了编译错误**，并给出具体例子（如判别联合消除非法状态、satisfies 校验配置完整性）。
:::