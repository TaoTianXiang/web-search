JavaScript 的类型系统是"弱类型 + 动态"，这意味着几乎所有类型错误都在运行时才暴露。面试官问类型问题，真正想考察的是：你是否理解**值在转换时的每一步发生了什么**。

## 先建立一张类型地图

语言规范里，值首先被划为两大阵营：

| 阵营 | 内容 | 存储 |
| --- | --- | --- |
| 原始类型 | `undefined`、`null`、`boolean`、`number`、`string`、`bigint`、`symbol` | 值本身 |
| 对象类型 | 普通对象、数组、函数、Date、Map、Set 等 | 引用 |

```js
let a = { x: 1 }
let b = a
b.x = 2
console.log(a.x) // 2，两个变量指向同一个对象

let s1 = 'abc'
let s2 = s1
s2 += 'd'
console.log(s1) // 'abc'，原始类型按值复制
```

"原始类型存在栈、对象存在堆"是引擎实现层面的说法，**不是语言语义**。语义上只管一件事：原始类型是值语义，对象是引用语义。引擎为了优化，很多原始值也会被放进堆里的小对象（如字符串）。

::: warn 常见误区
`typeof null === 'object'` 是历史遗留 bug，源于早期用低位标记表示类型，`null` 全 0 被识别为对象。不要用它来论证"null 是对象"。
:::

## ToPrimitive：所有转换的起点

当对象需要参与运算或比较时，JavaScript 会调用内部的 `ToPrimitive(input, hint)`，其中 hint 有三种：`default`、`number`、`string`。

执行顺序：

1. 若对象有 `Symbol.toPrimitive` 方法，调用它并直接用返回值（必须返回原始值，否则抛错）
2. hint 为 `number`：先试 `valueOf`，再试 `toString`
3. hint 为 `string`：先试 `toString`，再试 `valueOf`
4. hint 为 `default`：除 `Date` 外都按 `number` 处理

```js
const obj = {
  valueOf() { return 42 },
  toString() { return 'str' }
}
console.log(obj + 1)   // 43，default hint 走 valueOf
console.log(`${obj}`)  // 'str'，模板字符串是 string hint
console.log(String(obj)) // 'str'
console.log(Number(obj)) // 42
```

`Date` 是唯一特例：`date + 1` 会按 string hint 处理，得到日期字符串拼接。

### 用 Symbol.toPrimitive 精确控制

```js
class Money {
  constructor(cents) { this.cents = cents }
  [Symbol.toPrimitive](hint) {
    if (hint === 'string') return `¥${(this.cents / 100).toFixed(2)}`
    return this.cents // number / default
  }
}

const m = new Money(12345)
console.log(`${m}`)   // ¥123.45
console.log(m * 2)    // 24690
```

这个能力在需要"既是数值又能被格式化输出"的领域对象上很好用。

## 显式转换与隐式转换

隐式转换只发生在运算符和内置函数的内部步骤中。掌握下面这张表，绝大多数题目都能手推：

| 表达式 | 结果 | 原因 |
| --- | --- | --- |
| `1 + '2'` | `'12'` | 一侧是字符串 → 拼接 |
| `1 + true` | `2` | `true` → 1 |
| `[] + []` | `''` | 两侧都变 `''` |
| `[] + {}` | `'[object Object]'` | `'' + '[object Object]'` |
| `{} + []` | `0` | 语句块的 `{}` 被当作空块，只剩 `+[]` |
| `1 - '1'` | `0` | `-` 只做数值运算 |
| `'3' * '4'` | `12` | 同上 |
| `null + 1` | `1` | `null` → 0 |
| `undefined + 1` | `NaN` | `undefined` → NaN |
| `true + true` | `2` | |
| `'b' + 'a' + +'a'` | `'baNaN'` | `+'a'` 为 NaN，再转字符串 |

显式转换优先用明确 API：

```js
Number('12px')   // NaN —— 整体解析失败
parseInt('12px') // 12 —— 逐字符解析
Boolean('0')     // true —— 非空字符串都为真
!!'0'            // true
```

::: tip 实践
`parseInt` 一定要传第二个参数（进制），否则 `parseInt('08')` 在旧环境会被当八进制。现代规范已强制十进制，但显式传参仍是好习惯。
:::

## 相等性：`==` 的完整判定流程

规范中的 `IsLooselyEqual` 大致如下：

1. 类型相同 → 直接用 `===` 判定
2. `null == undefined` → `true`（且仅此一对）
3. 一方是 number、一方是 string → string 转 number 再比
4. 一方是 boolean → boolean 转 number 再比
5. 一方是对象、一方是原始值 → 对象先 `ToPrimitive`
6. 其余组合 → `false`

```js
null == 0        // false —— 特例不参与数值转换
null >= 0        // true  —— 关系运算符走 ToNumber，null → 0
undefined == 0   // false
'0' == false     // true
[] == false      // true
[0] == false     // true
[1] == true      // true
[] == ![]        // true
```

最后一条值得单独拆：`![]` 得到 `false`，`false` 转成 `0`；左侧 `[]` 经 ToPrimitive 得到 `''`，再转 number 为 `0`，所以 `0 == 0`。

### 为什么工程里必须禁 `==`

除了 `null == undefined` 这一种"合理用法"，`==` 的隐式转换几乎没有可预测的收益。ESLint 的 `eqeqeq` 规则可以配置 `"smart"` 来只允许这一种：

```js
// 允许
if (value == null) {} // 同时覆盖 null 和 undefined

// 一律用 ===
if (value === 0) {}
```

### `Object.is` 修的两个洞

```js
NaN === NaN        // false
0 === -0           // true（但 1/0 是 Infinity，1/-0 是 -Infinity）

Object.is(NaN, NaN) // true
Object.is(0, -0)    // false
```

`Object.is` 在框架里被大量使用：React 的依赖比较、Vue 的 `hasChanged` 都用它，就是为了正确处理 `NaN` 和 `±0`。

## 数值的坑

```js
0.1 + 0.2 === 0.3          // false
0.1 + 0.2                  // 0.30000000000000004
Number.MAX_SAFE_INTEGER    // 9007199254740991
0.1 + 0.7                  // 0.7999999999999999
```

IEEE 754 双精度浮点用 52 位存有效数字，很多十进制小数无法精确表示。工程处理方式：

```js
// 1. 转整数运算（金额用分）
const total = 1234 + 5678 // 分

// 2. 用容差比较
const eq = Math.abs(a - b) < Number.EPSILON

// 3. 用 decimal 库处理精算场景
```

超过 `MAX_SAFE_INTEGER` 后整数运算会丢精度，此时应改用 `bigint`：

```js
9007199254740993            // 实际是 9007199254740992
9007199254740993n + 1n      // 9007199254740994n
```

注意 `bigint` 与 `number` 不能混算，`1n + 1` 会抛 `TypeError`。

## 装箱与拆箱

原始类型没有方法和属性，但 `'abc'.length` 能工作，因为引擎会临时创建包装对象（装箱），调用完丢弃：

```js
'abc'.toUpperCase() // 内部：new String('abc').toUpperCase()
```

```js
const s = 'abc'
s.custom = 1     // 静默失败（严格模式抛错）
console.log(s.custom) // undefined，包装对象每次都是新的

const o = new String('abc')
o.custom = 1
console.log(o.custom) // 1
```

::: warn 不要用包装对象
`new Boolean(false)` 是对象，`if (new Boolean(false))` 会进入分支，因为对象恒为真。这是新手最常踩的坑之一。
:::

## 判空与类型检测的可靠写法

```js
// 判空（覆盖 null / undefined / 空字符串 / NaN）
const isEmpty = (v) => v == null || v === '' || Number.isNaN(v)

// 安全取类型
const typeOf = (v) => Object.prototype.toString.call(v).slice(8, -1)
typeOf([])        // 'Array'
typeOf(null)      // 'Null'
typeOf(new Map()) // 'Map'

// 判断纯对象
const isPlainObject = (v) =>
  typeOf(v) === 'Object' && (Object.getPrototypeOf(v) === null || Object.getPrototypeOf(v) === Object.prototype)
```

`typeof` 只对原始类型和函数可靠，数组、null、Date 都需要 `toString` 或 `Array.isArray`。

## 面试答题框架

被问到 `[] == ![]` 这类题，不要只报答案。推荐三段式：

1. **拆解表达式**：先算右侧 `![]`，得到 `false`
2. **走规范流程**：`false` 转 number 为 0；左侧对象走 ToPrimitive 得 `''`，再转 number 为 0
3. **给出结论与工程建议**：结果为 `true`，但实际项目应禁用 `==`

能把"为什么"和"所以工程上怎么做"连起来，才是中级到高级的差别。

::: interview 面试视角
高分回答的特征是**主动指出边界**：例如"这个结论在 `null == 0` 的对比中不成立，因为规范对 null/undefined 做了特例"。这说明你查过规范，而不是背题库。
:::