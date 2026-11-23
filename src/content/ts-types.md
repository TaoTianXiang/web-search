TypeScript 的核心价值不是"给 JS 加类型"，而是**把契约写进代码**。面试中级以上，考点通常落在"你能否设计出既安全又不啰嗦的类型"。

## 结构类型：鸭子类型的静态版本

TS 是结构类型系统（structural typing）：只要形状兼容，就认为类型兼容。

```ts
interface Point { x: number; y: number }

const p = { x: 1, y: 2, z: 3 }
const q: Point = p // ✅ 多余的 z 不报错（对象字面量除外）
```

但**对象字面量赋值**会触发多余属性检查：

```ts
const r: Point = { x: 1, y: 2, z: 3 } // ❌ 对象字面量不能有未知属性
```

这是"精确性"与"灵活性"的折中。

### 协变与逆变

```ts
interface Animal { name: string }
interface Dog extends Animal { bark(): void }

let a: Animal
let d: Dog
a = d // ✅ 协变：子类型可赋给父类型
```

函数参数是**逆变**（strictFunctionTypes 下），返回值是**协变**：

```ts
type Handler = (e: Animal) => void
const h: Handler = (e: Dog) => {} // ❌ 参数逆变，不能更窄
```

实际开发中，这条规则解释了为什么回调参数往往需要写成更宽的类型。

## 泛型：从使用到设计

### 基础形态

```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0]
}

const n = first([1, 2, 3])    // number | undefined
const s = first(['a', 'b'])   // string | undefined
```

### 约束

```ts
function pluck<T, K extends keyof T>(list: T[], key: K): T[K][] {
  return list.map((item) => item[key])
}

pluck([{ id: 1, name: 'a' }], 'name') // string[]
```

`K extends keyof T` 是最常用的约束模式：保证 key 一定存在，返回值类型自动推导。

### 默认值

```ts
interface ApiResponse<T = unknown> {
  code: number
  data: T
  message?: string
}
```

### 泛型与重载

```ts
function createEl(tag: 'div'): HTMLDivElement
function createEl(tag: 'canvas'): HTMLCanvasElement
function createEl(tag: string): HTMLElement
function createEl(tag: string): HTMLElement {
  return document.createElement(tag)
}
```

重载签名对调用方可见，实现签名不可见。更现代的写法是用条件类型映射：

```ts
interface TagMap {
  div: HTMLDivElement
  canvas: HTMLCanvasElement
  span: HTMLSpanElement
}

function createEl<K extends keyof TagMap>(tag: K): TagMap[K] {
  return document.createElement(tag) as TagMap[K]
}
```

## 条件类型与分布式

```ts
type IsArray<T> = T extends any[] ? true : false

type A = IsArray<string[]> // true
type B = IsArray<number>   // false
```

**裸类型参数**参与判断时会分发：

```ts
type ToArray<T> = T extends any ? T[] : never
type R = ToArray<string | number> // string[] | number[]，不是 (string|number)[]
```

阻止分布用元组包裹：

```ts
type ToArrayNoDist<T> = [T] extends [any] ? T[] : never
```

### infer

```ts
type Unwrap<T> = T extends Promise<infer U> ? U : T
type A = Unwrap<Promise<number>> // number

type First<T> = T extends [infer F, ...any[]] ? F : never
type B = First<[1, 2, 3]> // 1

type FnArgs<T> = T extends (...args: infer P) => any ? P : never
```

`infer` 可以出现多次并组成新类型：

```ts
type Swap<T> = T extends [infer A, infer B] ? [B, A] : never
```

## 映射类型

```ts
type MyPartial<T> = { [K in keyof T]?: T[K] }
type MyReadonly<T> = { readonly [K in keyof T]: T[K] }
type Nullable<T> = { [K in keyof T]: T[K] | null }

// 移除修饰符用 -?
type MyRequired<T> = { [K in keyof T]-?: T[K] }
// 移除 readonly 用 -readonly
type Mutable<T> = { -readonly [K in keyof T]: T[K] }
```

键重映射：

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K]
}

interface User { name: string; age: number }
type UserGetters = Getters<User>
// { getName: () => string; getAge: () => number }
```

## 内置工具类型

| 类型 | 定义 |
| --- | --- |
| `Partial<T>` | 全部可选 |
| `Required<T>` | 全部必填 |
| `Readonly<T>` | 全部只读（浅） |
| `Pick<T, K>` | 选取子集 |
| `Omit<T, K>` | `Pick<T, Exclude<keyof T, K>>` |
| `Record<K, V>` | 键值映射 |
| `Exclude<T, U>` | `T extends U ? never : T` |
| `Extract<T, U>` | `T extends U ? T : never` |
| `NonNullable<T>` | `T & {}` / `Exclude<T, null \| undefined>` |
| `ReturnType<T>` | `T extends (...args: any) => infer R ? R : any` |
| `Parameters<T>` | `T extends (...args: infer P) => any ? P : never` |
| `Awaited<T>` | 递归展开 Promise |

## 类型体操的边界

类型体操（type gymnastics）能写出很炫的类型，但工程上应有克制：

::: warn 过度设计的代价
1. 编译变慢：复杂条件类型会显著拉长 tsc 时间
2. 报错不可读：一个红波浪线可能对应三层嵌套的 `never`
3. 接手成本高：团队里只有你能改

判断标准：**这个类型是否阻止了真实发生过的 bug**。如果只是"更精确"，多半不值得。
:::

## 面试答题框架

被问"手写 Omit"，不要只背实现，要说明：

1. 为什么是 `Pick<T, Exclude<keyof T, K>>` —— 先排除键再挑选
2. `K` 为什么约束为 `keyof any` 而不是 `keyof T` —— 允许排除不存在的键
3. 与 `Omit` 在联合类型上的坑 —— `Omit` 不分发，对联合类型会丢失分支

```ts
type A = { a: 1; b: 2 }
type B = { a: 1; c: 3 }
type AB = A | B

type OmitA = Omit<AB, 'a'>
// { b: 2 } | { c: 3 }？不是，实际是 {} —— keyof (A|B) 只保留公共键
```

这个坑是高级面试的常见追问点。

::: interview 面试视角
"我能手写 20 个工具类型"不如"我知道哪些类型值得写、哪些不值得"。面试官更想听**取舍依据**。
:::