JavaScript 没有类，只有对象和原型链。`class` 是语法糖，理解它编译后长什么样，才能解释"为什么 class 和构造函数行为不同"。

## 三条关系必须分清

```js
function Foo() {}
const f = new Foo()

Foo.prototype        // 函数的原型对象
f.__proto__          // 实例的原型，等于 Foo.prototype
Foo.__proto__        // 函数自身的原型，等于 Function.prototype
```

```
f ──[[Prototype]]──> Foo.prototype ──[[Prototype]]──> Object.prototype ──> null
                              ▲
                              │ constructor
                             Foo
Foo ──[[Prototype]]──> Function.prototype ──> Object.prototype ──> null
```

- `prototype` 是**函数**的属性，指向它创建实例时使用的原型对象
- `__proto__`（规范名 `[[Prototype]]`）是**所有对象**都有的内部槽
- `Object.getPrototypeOf(obj)` 是读取 `[[Prototype]]` 的标准方法

```js
Foo.prototype.constructor === Foo         // true
f.constructor === Foo                     // true（沿原型链找到）
Object.getPrototypeOf(f) === Foo.prototype // true
```

::: warn 不要用 __proto__ 写业务代码
`__proto__` 是历史遗留访问器，性能差且可被覆盖。用 `Object.getPrototypeOf` / `Object.setPrototypeOf` / `Object.create`。
:::

## new 做了什么

```js
function myNew(Ctor, ...args) {
  if (typeof Ctor !== 'function') throw new TypeError('not a constructor')
  const obj = Object.create(Ctor.prototype)
  const result = Ctor.apply(obj, args)
  return result !== null && (typeof result === 'object' || typeof result === 'function') ? result : obj
}
```

四步：**创建对象 → 链接原型 → 绑定 this 执行 → 返回**。最后一步的特例很重要：

```js
function Weird() {
  this.a = 1
  return { b: 2 }   // 返回对象，覆盖默认行为
}
new Weird() // { b: 2 }，不是 { a: 1 }

function Normal() {
  this.a = 1
  return 42         // 返回原始值，被忽略
}
new Normal() // { a: 1 }
```

## 继承的五种写法与各自缺陷

### 1. 原型链继承

```js
function Parent() { this.colors = ['red'] }
Parent.prototype.say = function () { return this.name }

function Child() { this.name = 'c' }
Child.prototype = new Parent()

const a = new Child()
const b = new Child()
a.colors.push('blue')
console.log(b.colors) // ['red', 'blue'] —— 共享引用属性
```

问题：引用属性共享、无法向父构造函数传参、父构造函数被提前调用一次。

### 2. 借用构造函数

```js
function Child(...args) {
  Parent.call(this, ...args)
}
```

解决了传参和引用共享，但方法必须在构造函数里定义，无法复用。

### 3. 组合继承

```js
function Child(...args) {
  Parent.call(this, ...args)
}
Child.prototype = new Parent()
Child.prototype.constructor = Child
```

父构造函数被调用两次，`prototype` 上残留一份无用属性。

### 4. 原型式继承

```js
function createObj(o) {
  function F() {}
  F.prototype = o
  return new F()
}
// 等价于 Object.create(o)
```

### 5. 寄生组合继承（ES5 最优解）

```js
function inherit(Child, Parent) {
  Child.prototype = Object.create(Parent.prototype)
  Object.defineProperty(Child.prototype, 'constructor', {
    value: Child,
    enumerable: false,
    writable: true,
    configurable: true
  })
  Object.setPrototypeOf(Child, Parent) // 继承静态方法
}
```

只调用一次父构造函数，原型链干净。`class extends` 的底层就是这个模式。

## class 与构造函数的真实差异

`class` 不是简单语法糖，它有额外语义：

| 差异 | 说明 |
| --- | --- |
| 调用方式 | class 必须 `new`，否则 `TypeError` |
| 严格模式 | class 内部始终严格模式 |
| 提升 | class 有 TDZ，函数声明可提前调用 |
| 方法可枚举性 | class 方法 `enumerable: false` |
| 内部方法 | 有 `constructor`、`super`、`new.target` |
| 不能重定义 | `prototype` 属性不可写、不可枚举 |

```js
class A { m() {} }
Object.keys(A.prototype) // [] —— 方法不可枚举
Object.getOwnPropertyDescriptor(A.prototype, 'm').enumerable // false

function B() {}
B.prototype.m = function () {}
Object.keys(B.prototype) // ['m']
```

## super 与 new.target

```js
class Animal {
  constructor(name) { this.name = name }
  speak() { return `${this.name} makes a sound` }
}

class Dog extends Animal {
  constructor(name) {
    super(name)      // 必须先调用，才能使用 this
    this.type = 'dog'
  }
  speak() {
    return `${super.speak()} (woof)`
  }
}
```

`super()` 会以当前 this 调用父构造器；`super.method()` 在父原型上查找方法，但 this 仍是子实例。

`new.target` 用于检测是否被 `new` 调用，也用于抽象类：

```js
class Base {
  constructor() {
    if (new.target === Base) throw new Error('abstract')
  }
}
```

## 属性描述符与不可变性

```js
const obj = {}
Object.defineProperty(obj, 'x', {
  value: 1,
  writable: false,      // 不可改
  enumerable: false,    // 不参与 for...in / keys
  configurable: false   // 不可删除、不可重定义
})

obj.x = 2
console.log(obj.x) // 1（严格模式抛 TypeError）
```

三个层级的不可变：

```js
Object.preventExtensions(o) // 不能加属性
Object.seal(o)              // 不能加/删，可改值
Object.freeze(o)            // 全冻结（浅冻结）
```

`freeze` 是浅的。深层冻结需要递归或结构化不可变方案（Immer）。

## 原型链上的性能考量

属性查找沿链向上，链越长越慢。把方法放在原型上而不是每实例创建，能显著节省内存：

```js
// 差：每个实例一份函数
function A() { this.fn = function () {} }

// 好：共享一份
function B() {}
B.prototype.fn = function () {}
```

但 V8 有内联缓存（IC），对**稳定形状**的对象访问极快。动态增删属性会破坏隐藏类（hidden class），反而更慢：

```js
const a = { x: 1 }
const b = { x: 1, y: 2 } // 形状不同，IC 需重新学习

// 推荐：构造函数中一次性定义全部字段
class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}
```

## 判空与安全访问

```js
// 只查自身
Object.prototype.hasOwnProperty.call(obj, 'key')

// 查原型链
'key' in obj

// 无原型字典
const dict = Object.create(null)
dict.__proto__ // undefined，安全
```

::: tip 实践
在 `Object.keys` 与 `for...in` 之间，前者只遍历自有可枚举属性，后者还会遍历原型链。处理 `JSON.parse` 结果时通常用 `Object.keys` 更安全。
:::

::: interview 面试视角
能画出原型关系图、说出 `new` 的四步、并解释"class 不是纯语法糖"的三点差异，是这道题的标准答案基线。加分项是提到 `new.target` 与隐藏类。
:::