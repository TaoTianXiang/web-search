手写题是面试里性价比最高的一块：既能验证基本功，又能追问边界。但**背代码拿不到分**，面试官会问"为什么要这么写""这个边界处理了吗"。

这一章把高频手写题归纳为六类，每题都给出「核心思路 → 完整实现 → 边界与陷阱 → 追问方向」。

## 一、防抖与节流

### 语义对比

| | 防抖 | 节流 |
| --- | --- | --- |
| 行为 | 停止触发后等 wait 再执行一次 | 每 wait 最多执行一次 |
| 感受 | "等你不闹了再说" | "匀速响应" |
| 场景 | 搜索输入、表单校验、窗口 resize 后重排 | 滚动监听、拖拽、鼠标移动、上报埋点 |

### 防抖完整实现

```js
function debounce(fn, wait = 300, immediate = false) {
  let timer = null
  let lastArgs = null
  let lastThis = null

  function invoke() {
    timer = null
    if (!immediate && lastArgs) {
      fn.apply(lastThis, lastArgs)
      lastArgs = lastThis = null
    }
  }

  function debounced(...args) {
    const callNow = immediate && !timer
    if (timer) clearTimeout(timer)
    lastArgs = args
    lastThis = this
    timer = setTimeout(invoke, wait)
    if (callNow) {
      fn.apply(this, args)
      lastArgs = lastThis = null
    }
  }

  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = lastArgs = lastThis = null
  }

  return debounced
}
```

三个必须处理的点：

1. **this 与参数**：用 `lastThis / lastArgs` 保存最后一次调用，否则回调拿不到上下文
2. **immediate**：首次立即执行，之后必须等停止触发
3. **cancel**：组件卸载时能取消挂起调用，否则会向已销毁的组件写状态

### 节流完整实现（含 leading / trailing）

```js
function throttle(fn, wait = 300, { leading = true, trailing = true } = {}) {
  let timer = null
  let lastTime = 0
  let lastArgs = null
  let lastThis = null

  function invoke(time) {
    lastTime = leading === false ? 0 : time
    timer = null
    if (lastArgs) {
      fn.apply(lastThis, lastArgs)
      lastArgs = lastThis = null
    }
  }

  function throttled(...args) {
    const now = Date.now()
    if (!lastTime && leading === false) lastTime = now

    const remaining = wait - (now - lastTime)
    lastArgs = args
    lastThis = this

    if (remaining <= 0 || remaining > wait) {
      if (timer) { clearTimeout(timer); timer = null }
      invoke(now)
    } else if (!timer && trailing) {
      timer = setTimeout(() => invoke(Date.now()), remaining)
    }
  }

  throttled.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastTime = 0
    lastArgs = lastThis = null
  }

  return throttled
}
```

`remaining > wait` 这个判断是为了处理**系统时间被回拨**：若 `now < lastTime`，`remaining` 会变成一个很大的数，不加判断会导致长时间不执行。

### 用 rAF 的变体

滚动与动画场景时，与帧对齐更合适：

```js
function rafThrottle(fn) {
  let ticking = false
  return (...args) => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      fn(...args)
      ticking = false
    })
  }
}
```

### 常见追问

> **Q：防抖和节流能否互相实现？**
>
> 可以。节流的 trailing 本质是"带最大等待时间的防抖"；防抖可以理解为"traling-only 且会重置计时的节流"。但语义不同，不要互相替代。

> **Q：debounce 里为什么要保存 lastThis？**
>
> 因为 setTimeout 的回调中 `this` 是 `window/undefined`（严格模式），不是调用时的上下文。

## 二、深拷贝

### 必须处理的六类值

| 类型 | 处理方式 |
| --- | --- |
| 原始值 / 函数 | 直接返回 |
| Date | `new Date(v.getTime())` |
| RegExp | `new RegExp(source, flags)` + 复制 `lastIndex` |
| Map / Set | 新建并递归复制元素 |
| ArrayBuffer / TypedArray | `slice()` 或 `new Ctor(v)` |
| 循环引用 | WeakMap 缓存 |

```js
function deepClone(value, cache = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value
  if (cache.has(value)) return cache.get(value)

  const tag = Object.prototype.toString.call(value)
  let clone

  switch (tag) {
    case '[object Date]':
      clone = new Date(value.getTime())
      break
    case '[object RegExp]':
      clone = new RegExp(value.source, value.flags)
      clone.lastIndex = value.lastIndex
      break
    case '[object Map]': {
      clone = new Map()
      cache.set(value, clone)
      value.forEach((v, k) => clone.set(deepClone(k, cache), deepClone(v, cache)))
      return clone
    }
    case '[object Set]': {
      clone = new Set()
      cache.set(value, clone)
      value.forEach((v) => clone.add(deepClone(v, cache)))
      return clone
    }
    case '[object Array]':
      clone = new Array(value.length)
      break
    case '[object ArrayBuffer]':
      return value.slice(0)
    default:
      clone = Object.create(Object.getPrototypeOf(value))
  }

  cache.set(value, clone)

  // Reflect.ownKeys 能拿到 Symbol 键与不可枚举键
  Reflect.ownKeys(value).forEach((key) => {
    const desc = Object.getOwnPropertyDescriptor(value, key)
    if (!desc) return
    if ('value' in desc) desc.value = deepClone(desc.value, cache)
    Object.defineProperty(clone, key, desc)
  })

  return clone
}
```

### JSON 往返的六种丢失

```js
JSON.parse(JSON.stringify(obj))
```

| 值 | 结果 |
| --- | --- |
| `undefined` / 函数 / Symbol | 属性被删除 |
| `Date` | 变成字符串 |
| `NaN` / `Infinity` | 变成 `null` |
| `Map` / `Set` | 变成 `{}` |
| 循环引用 | 抛 TypeError |
| 自定义原型 | 丢失 |

### structuredClone

```js
const copy = structuredClone(obj)
```

原生支持：循环引用、Map、Set、Date、RegExp、ArrayBuffer、Blob、File。

不支持：函数、Symbol、DOM 节点、class 的原型方法（会退化为普通对象）。

**结论**：普通数据用 `structuredClone`；需要保留原型或自定义逻辑时手写。

## 三、EventEmitter

```js
class EventEmitter {
  constructor() {
    this.events = new Map()
  }

  on(name, fn) {
    if (!this.events.has(name)) this.events.set(name, new Set())
    const entry = { fn, once: false }
    this.events.get(name).add(entry)
    return () => this.off(name, fn)
  }

  once(name, fn) {
    if (!this.events.has(name)) this.events.set(name, new Set())
    this.events.get(name).add({ fn, once: true })
    return () => this.off(name, fn)
  }

  off(name, fn) {
    const set = this.events.get(name)
    if (!set) return
    if (!fn) { this.events.delete(name); return }
    for (const entry of set) {
      if (entry.fn === fn) { set.delete(entry); break }
    }
    if (set.size === 0) this.events.delete(name)
  }

  emit(name, ...args) {
    const set = this.events.get(name)
    if (!set) return false
    // 遍历副本：回调中 off/on 会修改原集合
    for (const entry of [...set]) {
      try {
        entry.fn.apply(this, args)
      } catch (err) {
        console.error('[EventEmitter]', err)  // 异常隔离
      }
      if (entry.once) set.delete(entry)
    }
    return true
  }

  listenerCount(name) {
    return this.events.get(name)?.size ?? 0
  }
}
```

### 五个加分细节

| 细节 | 原因 |
| --- | --- |
| 遍历 `[...set]` 副本 | 回调里 off 会破坏正在遍历的集合 |
| once 在**执行后**删除 | 在执行中删除会导致回调内再次 emit 时重复触发 |
| try/catch 隔离 | 一个订阅者抛错不应影响其他订阅者 |
| off 后清理空 Set | 否则 Map 无限增长 |
| 返回取消函数 | 调用方无需记住 name/fn，减少解绑错误 |

## 四、柯里化与组合

```js
function curry(fn, arity = fn.length) {
  return function curried(...args) {
    if (args.length >= arity) return fn.apply(this, args)
    return curried.bind(this, ...args)
  }
}
```

`fn.length` 是形参个数，**不包含默认值与剩余参数之后的部分**：

```js
function f(a, b = 1, ...rest) {}
f.length // 1
```

所以复杂函数需要显式传 arity。

### 与 compose 配合

```js
const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x)
const add = curry((a, b) => a + b)
const double = (x) => x * 2

compose(double, add(1))(3) // 8
```

这也是 `list.map(add(1))` 能工作的原因：map 只传一个参数，柯里化后的函数正好匹配。

## 五、数组扁平化与去重

### 扁平化：递归 vs 显式栈

```js
// 递归（简单，但深度大会爆栈）
function flatten(arr, depth = Infinity) {
  const out = []
  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) out.push(...flatten(item, depth - 1))
    else out.push(item)
  }
  return out
}

// 显式栈（不受调用栈限制）
function flattenStack(arr, depth = Infinity) {
  const stack = arr.map((v) => ({ v, d: 0 }))
  const out = []
  while (stack.length) {
    const { v, d } = stack.pop()
    if (Array.isArray(v) && d < depth) {
      for (let i = v.length - 1; i >= 0; i--) stack.push({ v: v[i], d: d + 1 })
    } else {
      out.push(v)
    }
  }
  return out.reverse()
}
```

| 方式 | 时间 | 爆栈 |
| --- | --- | --- |
| `flat(Infinity)` | 快（原生） | 无 |
| 递归 | O(n) | 有 |
| 显式栈 | O(n) | 无 |
| reduce + concat | O(n²) | 有 |

### 去重：Set 与它的盲区

```js
[...new Set(arr)]
```

Set 用 SameValueZero 比较：`NaN` 相等，`+0/-0` 相等，对象按引用区分。

```js
// 常见误区：用 indexOf 判重，NaN 永远找不到
arr.filter((v, i) => arr.indexOf(v) === i)  // [NaN, NaN] 会保留两个
```

按字段去重：

```js
function uniqueBy(list, keyFn) {
  const seen = new Set()
  return list.filter((item) => {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn]
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
```

## 六、Promise 静态方法

```js
function promiseAll(list) {
  return new Promise((resolve, reject) => {
    const results = new Array(list.length)
    let count = 0
    if (!list.length) return resolve(results)

    list.forEach((item, i) => {
      Promise.resolve(item).then((v) => {
        results[i] = v               // 用索引保证顺序
        if (++count === list.length) resolve(results)
      }, reject)                     // 快速失败
    })
  })
}

function promiseRace(list) {
  return new Promise((resolve, reject) => {
    list.forEach((item) => Promise.resolve(item).then(resolve, reject))
  })
}

function allSettled(list) {
  return Promise.all(
    list.map((item) =>
      Promise.resolve(item).then(
        (value) => ({ status: 'fulfilled', value }),
        (reason) => ({ status: 'rejected', reason })
      )
    )
  )
}
```

三个易错点：

1. `all` 必须用**索引**写结果，不能 push（完成顺序与输入顺序可能不同）
2. `race` 是"第一个**落定**"（成功或失败），不是"第一个成功"
3. `all` 对非 Promise 项要先用 `Promise.resolve` 包装

## 通用答题结构

被要求"手写 X"时，按这个顺序讲：

```
1. 一句话说明语义（它解决什么问题）
2. 给出最小可用实现
3. 主动补边界（这一步最加分）
4. 说明取舍（为什么不用另一种写法）
5. 指出适用场景与局限
```

::: interview 面试视角
面试官通常只让你写 30 行，但会花 10 分钟追问边界。**能主动说出"这里的边界我处理了/没处理"**，比写出完美代码更能证明你写过真实业务代码。
:::