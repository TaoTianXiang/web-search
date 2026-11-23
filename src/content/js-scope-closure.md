作用域回答的是"这个变量在哪里能被找到"，闭包回答的是"函数返回之后变量为什么还活着"，`this` 回答的是"函数执行时它的上下文是谁"。三者合起来构成了 JavaScript 最核心的执行模型。

## 词法作用域 vs 动态作用域

JavaScript 使用**词法作用域**（静态作用域）：函数的作用域在**定义时**就确定了，与调用位置无关。

```js
let value = 'global'

function outer() {
  let value = 'outer'
  function inner() {
    console.log(value)
  }
  return inner
}

const fn = outer()
let value2 = 'changed'
fn() // 'outer'，与调用位置无关
```

动态作用域（如 Bash、部分 Lisp）则按调用链查找。理解这个差异，才能解释为什么"把函数传给别人调用，它看到的变量不变"。

## 作用域链与变量对象

每个执行上下文有一个 `LexicalEnvironment`，其中包含：

- 当前作用域的绑定（let/const/class）
- 指向外层环境的引用（`outer`）
- 变量环境（var/function 声明）

查找变量时沿 `outer` 链向上，直到全局环境。这条链就是**作用域链**。

```js
function a() {
  var x = 1
  function b() {
    console.log(x) // 沿作用域链找到 a 的 x
  }
  b()
}
```

### 提升的真实含义

"提升"不是把代码搬到顶部，而是**在进入执行上下文时先创建绑定**：

| 声明 | 绑定创建时机 | 初始化时机 | 访问未初始化 |
| --- | --- | --- | --- |
| `var` | 进入作用域 | 立即初始化为 `undefined` | `undefined` |
| `function` | 进入作用域 | 立即初始化为函数对象 | 可调用 |
| `let` / `const` | 进入作用域 | 执行到声明语句 | `ReferenceError`（TDZ） |
| `class` | 进入作用域 | 执行到声明语句 | `ReferenceError`（TDZ） |

```js
console.log(fn) // 可调用，函数声明整体提升
function fn() {}

console.log(a)  // undefined
var a = 1

console.log(b)  // ReferenceError
let b = 1
```

函数声明与 `var` 同名时，函数声明优先；多个同名函数声明，后者覆盖前者。

::: warn TDZ 的隐蔽性
TDZ 在块级作用域中是**整块**生效的。即使声明在后面，块开始到声明之间的区域都不能访问：

```js
{
  console.log(x) // ReferenceError
  let x = 1
}
```
:::

## 闭包：保留的是什么

闭包 = 函数 + 其定义时的词法环境。当内部函数引用了外部变量，且内部函数存活，该变量就不会被回收。

```js
function createCounter() {
  let count = 0
  return {
    inc() { return ++count },
    get() { return count }
  }
}
const c = createCounter()
c.inc(); c.inc()
console.log(c.get()) // 2
```

### 保留粒度：变量级而非作用域级

V8 会做**上下文分配优化**：只有被内部函数引用的变量才进入 `Context` 对象，未被引用的变量随栈帧销毁。

```js
function make() {
  const huge = new Array(1e6).fill(0)
  const small = 1
  return () => small // huge 不会被保留
}
```

但如果出现 `eval`、`with`，或变量被以无法静态分析的方式访问，优化会退化为"整个作用域保留"。

### 经典循环问题

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)) // 3 3 3
}
```

三个回调共享同一个函数作用域的 `i`。三种修法：

```js
// 1. let：每轮新建绑定（推荐）
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i))

// 2. IIFE：手动创建新作用域
for (var i = 0; i < 3; i++) {
  (function (j) { setTimeout(() => console.log(j)) })(i)
}

// 3. 定时器第三参数传值
for (var i = 0; i < 3; i++) {
  setTimeout((j) => console.log(j), 0, i)
}
```

### 闭包导致的内存问题

```js
// 1. 定时器持有大对象
function start() {
  const data = loadHugeData()
  const id = setInterval(() => render(data), 1000)
  return () => clearInterval(id) // 必须暴露清理入口
}

// 2. 事件监听未解绑
useEffect(() => {
  const onResize = () => chart.resize()
  window.addEventListener('resize', onResize)
  return () => window.removeEventListener('resize', onResize)
}, [])

// 3. 无限增长的缓存
const cache = new Map() // 应改为 LRU 或 WeakMap
```

::: tip 定位方法
Chrome DevTools → Memory → 拍三次堆快照（操作前、操作后、再操作一次）。若某类对象数量持续增长，用 Retainers 面板看是谁持有引用，能直接定位到闭包捕获的变量。
:::

## this：四种绑定与优先级

`this` 在**函数被调用时**确定（箭头函数除外）。

### 1. 默认绑定

```js
function fn() { console.log(this) }
fn() // 非严格：window/globalThis；严格：undefined
```

### 2. 隐式绑定

```js
const obj = { name: 'obj', fn() { console.log(this.name) } }
obj.fn() // 'obj'

const detached = obj.fn
detached() // undefined（默认绑定）
```

"方法被单独取出"是隐式绑定丢失的典型场景，也是 React 类组件时代 `bind` 存在的根本原因。

### 3. 显式绑定

```js
fn.call(ctx, a, b)
fn.apply(ctx, [a, b])
const bound = fn.bind(ctx, a) // 返回新函数，this 永久固定
```

`bind` 的 this 不能被后续 `call/apply` 覆盖，但可以被 `new` 覆盖（见下）。

### 4. new 绑定

`new` 的四个步骤：创建对象 → 链接原型 → 以该对象为 this 执行 → 返回对象（若构造函数返回对象则以其为准）。

```js
function Foo() {
  console.log(this instanceof Foo) // true
}
const f = new Foo()
```

### 优先级实测

```js
function F() { console.log(this.tag) }

const bound = F.bind({ tag: 'bind' })
new bound() // undefined —— new 优先于 bind，this 是新对象

const obj = { tag: 'obj', F }
obj.F.call({ tag: 'call' }) // 'call' —— 显式优先于隐式
```

优先级：`new` > 显式 > 隐式 > 默认。

### 箭头函数

```js
const obj = {
  name: 'obj',
  arrow: () => this.name,  // 捕获定义时外层的 this
  regular() { return this.name }
}
```

箭头函数的特点：

- 没有自己的 `this`、`arguments`、`super`、`new.target`
- 不能被 `new`
- 没有 `prototype` 属性
- `bind` 对它无效（因为 this 已固定）

::: warn 常见错误
不要在对象字面量里用箭头函数当方法。那里没有"外层函数"，箭头函数会捕获模块或全局的 this。

```js
const api = {
  base: '/api',
  get: (url) => fetch(this.base + url) // this 不是 api
}
```
:::

## 手写 bind

```js
Function.prototype.myBind = function (context, ...args) {
  const fn = this
  const noop = function () {}
  const bound = function (...rest) {
    // 用 new 调用时，this 指向新对象
    const isNew = this instanceof bound
    return fn.apply(isNew ? this : context, [...args, ...rest])
  }
  if (fn.prototype) {
    noop.prototype = fn.prototype
    bound.prototype = new noop()
  }
  return bound
}
```

考察点：参数预置、`new` 兼容、原型链继承。

## 内存视角：执行上下文与调用栈

```
调用栈
┌──────────────┐
│ inner()      │  ← 栈帧：局部变量、this、参数
├──────────────┤
│ outer()      │  ← 被闭包引用的变量被复制到 Context（堆）
├──────────────┤
│ (anonymous)  │
└──────────────┘
```

被闭包捕获的变量会从栈帧"逃逸"到堆上的 `Context` 对象，生命周期由可达性决定，而非函数返回。

::: interview 面试视角
被问"闭包是什么"，先给一句话定义，再讲**保留粒度**，最后举例说明**如何排查泄漏**。这种回答传达了"我不仅知道概念，还在生产环境处理过"。
:::