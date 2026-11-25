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

// 反过来：实例自己身上没有 constructor
Object.prototype.hasOwnProperty.call(f, 'constructor') // false
```

::: tip 为什么 f.constructor 能拿到 Foo
`f` 自身没有 `constructor` 属性，访问时沿**原型链**向上找，在 `Foo.prototype` 上命中。所以改 `Foo.prototype.constructor` 会同时影响所有实例的 `f.constructor`。
:::

::: warn 不要用 __proto__ 写业务代码
`__proto__` 是历史遗留访问器，性能差且可被覆盖。用 `Object.getPrototypeOf` / `Object.setPrototypeOf` / `Object.create`。
:::

## new 做了什么

```js
function myNew(Ctor, ...args) {
  if (typeof Ctor !== 'function') throw new TypeError('not a constructor')
  const obj = Object.create(Ctor.prototype)
  const result = Ctor.apply(obj, args)
  // 构造函数返回「对象」时以它为准，返回原始值时忽略
  return result !== null && (typeof result === 'object' || typeof result === 'function') ? result : obj
}

// 和原生 new 对比
function Person(name) { this.name = name }
Person.prototype.say = function () { return `I am ${this.name}` }

const b = myNew(Person, 'b')
console.log(b.say())             // → "I am b"
console.log(b instanceof Person) // → true
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
Parent.prototype.say = function () { return `I am ${this.name}` }

function Child() { this.name = 'c' }
Child.prototype = new Parent()          // 直接把父实例当原型
Child.prototype.constructor = Child     // 修正 constructor 指向

const a = new Child()
const b = new Child()
a.colors.push('blue')
console.log(b.colors) // → ['red', 'blue'] —— 子实例共享了同一个数组
```

三个问题：引用属性共享、无法向父构造函数传参（`new Parent()` 是零参调用）、父构造函数被提前执行一次，其副作用无法避免。

### 2. 借用构造函数

```js
function Parent(name) {
  this.name = name
  this.colors = ['red']
}

function Child(name) {
  Parent.call(this, name)   // 在子实例上执行父构造逻辑
}

const a = new Child('a')
const b = new Child('b')
a.colors.push('blue')

console.log(b.colors) // → ['red'] —— 引用属性不再共享
console.log(a.name)   // → "a"     —— 可以传参了
```

解决了传参与引用共享，代价是**方法必须写在构造函数里**，每个实例一份，且无法继承父类原型上的方法。

### 3. 组合继承

```js
function Parent(name) {
  this.name = name
  this.colors = ['red']
}
Parent.prototype.say = function () { return `I am ${this.name}` }

function Child(name) {
  Parent.call(this, name)      // 第二次调用父构造器
}
Child.prototype = new Parent() // 第一次调用父构造器
Child.prototype.constructor = Child

const c = new Child('c')
console.log(c.say())                // → "I am c"
console.log(Child.prototype.colors) // → ['red']，原型上残留的无用副本
```

父构造函数被调用两次，`prototype` 上多出一份实例属性副本——这是它输给寄生组合的原因。

### 4. 原型式继承

```js
function createObj(o) {
  function F() {}
  F.prototype = o
  return new F()
}

const base = { greet() { return `hi, ${this.name}` } }
const obj = createObj(base)
obj.name = 'o'

console.log(obj.greet()) // → "hi, o"
// 等价于 Object.create(o)
```

### 5. 寄生组合继承（ES5 最优解）

```js
function inherit(Child, Parent) {
  Child.prototype = Object.create(Parent.prototype)  // 不执行父构造器
  Object.defineProperty(Child.prototype, 'constructor', {
    value: Child,
    enumerable: false,
    writable: true,
    configurable: true
  })
  Object.setPrototypeOf(Child, Parent)   // 让 Child 继承父的静态方法
}

function Parent(name) { this.name = name }
Parent.prototype.say = function () { return `I am ${this.name}` }
Parent.create = function (n) { return new Parent(n) }   // 静态方法

function Child(name) {
  Parent.call(this, name)
}
inherit(Child, Parent)

const c = new Child('c')
console.log(c.say())                // → "I am c"
console.log(Child.create('x').name) // → "x"，静态方法也继承了
console.log(Child.prototype.colors) // → undefined，原型干净
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

// 延伸：class 不能当普通函数调用
A() // ❌ TypeError: Class constructor A cannot be invoked without 'new'
```

## super 与 new.target

`super` 有两个用途：`super()` 调用父构造器，`super.method()` 在父原型上查找方法。关键是 **`this` 始终是子实例**。

```js
class Animal {
  constructor(name) {
    this.name = name
  }
  speak() {
    return `${this.name} makes a sound`
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name)          // 必须先调用 super()，之后才能访问 this
    this.breed = breed   // 若把这行放到 super() 之前，会抛 ReferenceError
  }
  speak() {
    // super.speak() 在 Animal.prototype 上找方法，但 this 仍是 dog 实例
    return `${super.speak()} (woof)`
  }
}

const dog = new Dog('dog', 'corgi')
console.log(dog.speak())           // "dog makes a sound (woof)"
console.log(dog instanceof Animal) // true —— 原型链连到了 Animal.prototype
```

为什么 `super()` 必须在 `this` 之前？因为 ES6 的 `class` 里 `this` 是由**父构造器创建**的：`super()` 内部执行 `[[Construct]]`，返回到子构造器时 `this` 才被绑定。这也是 `class` 与函数式继承的一个实质差异——函数式继承里 `this` 在进入函数时就已经存在。

::: warn 只写 super.method() 不写 super()
子类如果**没有** `constructor`，会自动继承父构造器的调用；一旦写了 `constructor`，就必须自己调用 `super()`，否则 `this` 未初始化。
:::

`new.target` 用于检测是否被 `new` 调用，也用于做抽象类：

```js
class Base {
  constructor() {
    if (new.target === Base) throw new Error('Base 是抽象类，不能直接实例化')
  }
}

// new Base()  // ❌ Error: Base 是抽象类，不能直接实例化
class Impl extends Base {}
new Impl()      // ✅ new.target 是 Impl，放行
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
console.log(obj.x)            // → 1（非严格模式下静默失败）
console.log(Object.keys(obj)) // → []，因为 enumerable 为 false
console.log(delete obj.x)     // → false，configurable 为 false
```

三个层级的不可变，按需选择最小强度：

```js
const o = { a: 1 }

Object.preventExtensions(o)   // 不能加属性，可删可改
Object.seal(o)                // 不能加/删，可改值（configurable 全部变 false）
Object.freeze(o)              // 全冻结（浅冻结，writable/configurable 全 false）

o.b = 2
console.log(o.b)                // → undefined（非严格模式静默失败）
console.log(Object.isFrozen(o)) // → true
```

`freeze` 是**浅**的，嵌套对象仍可修改：

```js
const cfg = Object.freeze({ nested: { n: 1 } })
cfg.nested.n = 2
console.log(cfg.nested.n)     // → 2，内层没被冻结

// 深冻结需要递归（或用 Immer / structuredClone + 逐层冻结）
function deepFreeze(target) {
  Object.values(target).forEach((v) => {
    if (v && typeof v === 'object') deepFreeze(v)
  })
  return Object.freeze(target)
}
```

## 原型链上的性能考量

属性查找沿链向上，链越长越慢。把方法放在原型上而不是每实例创建，能显著节省内存：

```js
// ❌ 差：每个实例各自一份函数对象
function A(name) {
  this.name = name
  this.fn = function () { return this.name }
}

// ✅ 好：所有实例共享原型上的一份
function B(name) {
  this.name = name
}
B.prototype.fn = function () { return this.name }

const b1 = new B('x')
const b2 = new B('y')
console.log(b1.fn === b2.fn) // → true，同一份函数
```

但「越少创建」不代表「访问越快」。真正决定属性访问速度的是引擎的{{内联缓存}}（IC）与{{隐藏类}}：

```js
// 同一个函数，两种调用形状
function getName(o) { return o.name }

const p = { name: 'a' }              // 形状 A
const q = { name: 'b', age: 1 }      // 形状 B（多一个属性）
getName(p)   // IC 记录「形状 A → name 的偏移」
getName(q)   // 形状 B 未命中，IC 从单态退化为多态

// ❌ 最伤性能：同一行代码反复见到不同形状
const list = [{ name: 'a' }, { name: 'b', age: 1 }, { name: 'c', id: 2 }]
list.map(getName)   // IC 退化为 megamorphic，只能查表
```

推荐的写法是**让同族对象的形状一致**：构造函数里一次性赋全字段。

```js
// ✅ 所有实例形状一致，IC 保持单态
class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}

// ✅ 可选字段也要先声明，保持顺序稳定
class User {
  constructor(id, name) {
    this.id = id
    this.name = name
    this.avatar = undefined   // 预留字段，避免后续「加属性」导致形状迁移
  }
}
```

::: warn 这两个操作会让性能明显变差
- **`delete obj.key`**：删除属性会在隐藏类上留下空洞，后续访问退化为字典模式。改为 `obj.key = null`。
- **给已创建的对象追加属性**：每追加一个就迁移一次隐藏类；对象一旦「形状爆炸」（V8 上限约 1020 个），会永久落入字典模式。
:::

顺带说明一个常见误解：「把方法放到原型上」省的是**内存**（避免 N 份函数），并不直接提升属性访问速度。反过来，如果一个对象只在单态调用点被访问，即使方法写在实例上也很快。面试答这一题，讲清这两条是分开的，比笼统说「原型更快」更可信。

## 判空与安全访问

```js
const obj = Object.create({ inherited: 1 })
obj.own = 2

// 只查自身
console.log(Object.prototype.hasOwnProperty.call(obj, 'own'))       // → true
console.log(Object.prototype.hasOwnProperty.call(obj, 'inherited')) // → false

// 查原型链
console.log('inherited' in obj)   // → true

// 无原型字典：不怕 __proto__ 污染
const dict = Object.create(null)
console.log(dict.__proto__)       // → undefined，安全
dict.__proto__ = 'x'              // 只是普通属性，不会改原型
console.log(Object.getPrototypeOf(dict)) // → null
```

::: tip 实践
在 `Object.keys` 与 `for...in` 之间，前者只遍历自有可枚举属性，后者还会遍历原型链。处理 `JSON.parse` 结果时通常用 `Object.keys` 更安全。

另外，`Object.hasOwn(obj, key)`（ES2022）是 `hasOwnProperty.call` 的现代替代写法，不需要再借 `Object.prototype`。
:::

::: interview 面试视角
能画出原型关系图、说出 `new` 的四步、并解释"class 不是纯语法糖"的三点差异，是这道题的标准答案基线。加分项是能讲清{{内联缓存}}与{{隐藏类}}，以及"方法放原型省的是内存、不是访问速度"这个区别。
:::