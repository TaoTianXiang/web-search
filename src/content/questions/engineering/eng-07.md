## 判断标准

先区分两类：

| 类型 | 特征 | 处理 |
| --- | --- | --- |
| **必要的分支** | 真实业务规则，互斥且不可合并 | 保留，但可结构化 |
| **可消除的分支** | 重复判断、可数据化、可用多态 | 重构 |

不要为了"消除 if"而引入过度抽象。

## 四种重构思路

### 1. 提前返回（卫语句）

```js
// ❌ 嵌套地狱
function process(user) {
  if (user) {
    if (user.active) {
      if (user.role === 'admin') {
        return doAdmin()
      } else {
        return doUser()
      }
    } else {
      throw new Error('inactive')
    }
  } else {
    throw new Error('no user')
  }
}

// ✅ 卫语句
function process(user) {
  if (!user) throw new Error('no user')
  if (!user.active) throw new Error('inactive')
  return user.role === 'admin' ? doAdmin() : doUser()
}
```

适用：错误处理、前置校验。代价：几乎为零，应当优先做。

### 2. 策略表（数据化）

```js
// ❌
function getPrice(type, qty) {
  if (type === 'normal') return qty * 10
  else if (type === 'vip') return qty * 8
  else if (type === 'svip') return qty * 6
  else throw new Error('unknown')
}

// ✅
const PRICE = { normal: 10, vip: 8, svip: 6 }

function getPrice(type, qty) {
  const unit = PRICE[type]
  if (unit === undefined) throw new Error(`unknown type: ${type}`)
  return qty * unit
}
```

适用：条件 → 结果的映射。代价：需要处理"未知键"。

### 3. 策略对象（行为化）

```js
// ❌
function format(value, type) {
  if (type === 'date') return formatDate(value)
  else if (type === 'money') return formatMoney(value)
  else if (type === 'percent') return formatPercent(value)
}

// ✅
const formatters = {
  date: formatDate,
  money: formatMoney,
  percent: formatPercent
}

function format(value, type) {
  const fn = formatters[type]
  if (!fn) throw new Error(`unknown formatter: ${type}`)
  return fn(value)
}
```

适用：分支内是**不同的行为**（不只是不同取值）。代价：行为难以内联优化。

### 4. 多态（面向对象）

```js
// ❌
class Shape {
  area() {
    if (this.type === 'circle') return Math.PI * this.r ** 2
    if (this.type === 'rect') return this.w * this.h
  }
}

// ✅
class Circle { area() { return Math.PI * this.r ** 2 } }
class Rect { area() { return this.w * this.h } }
```

适用：类型固定、行为差异大、需要扩展。代价：类数量增加。

## 其他手段

### 5. 空对象模式

```js
// ❌
let logger
if (debug) logger = console
if (logger) logger.log('x')

// ✅
const noopLogger = { log: () => {} }
const logger = debug ? console : noopLogger
logger.log('x')
```

### 6. 组合条件

```js
// ❌
if (a && b && c) {}
if (a && b && !c) {}

// ✅
const base = a && b
if (base && c) {}
if (base && !c) {}
```

### 7. 可选链与空值合并

```js
// ❌
const name = user && user.profile && user.profile.name || 'anon'

// ✅
const name = user?.profile?.name ?? 'anon'
```

## 常见反模式

| 反模式 | 问题 |
| --- | --- |
| 为消除 if 引入 8 层抽象 | 可读性更差 |
| 表达式里塞复杂条件 | 无法调试、难测试 |
| 用 `switch` 替代 3 个 if | 没有收益 |
| 用正则替代条件判断 | 更难维护 |

::: tip 判断要不要重构
问三个问题：

1. 新增一个分支需要改几处？（> 1 处就该数据化）
2. 这段逻辑能否独立单测？（不能说明耦合过重）
3. 新人能否在 30 秒内看懂？（不能说明需要结构化）
:::

::: interview 面试视角
"用策略模式"只是手段名。能说清"先区分必要分支与可消除分支"，并给出"策略表的未知键处理"，才说明你有重构判断力。
:::
