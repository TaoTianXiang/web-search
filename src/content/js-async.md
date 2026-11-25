异步模型是前端面试的高频区，因为它是"能否理解运行时"的分水岭。很多人能写 `Promise`，却说不清"为什么这段代码的输出顺序是这样"。

## 单线程与任务队列

JavaScript 主线程只有一个调用栈。为了不阻塞，耗时的操作（网络、定时器、I/O）由宿主环境（浏览器/Node）在别的线程完成，完成后把回调放入队列，等主线程空闲时执行。

```
        ┌──────────── 主线程 ────────────┐
事件 ──► │ 调用栈 │ 宏任务队列 │ 微任务队列  │ ──► 渲染
        └────────────────────────────────┘
                        ▲
              ┌─────────┴─────────┐
              │  宿主线程（定时器、  │
              │  网络、I/O、Worker） │
              └───────────────────┘
```

## 一轮事件循环做了什么

1. 从**宏任务队列**取出一个任务执行
2. 执行完毕后，**清空整个微任务队列**（新产生的微任务也在本轮清空）
3. 若到达渲染时机：执行 `requestAnimationFrame` → 样式计算 → 布局 → 绘制 → 合成
4. 进入下一轮

| 队列 | 来源 |
| --- | --- |
| 宏任务 | `setTimeout`、`setInterval`、`setImmediate`(Node)、I/O、UI 事件、`MessageChannel`、`postMessage` |
| 微任务 | `Promise.then/catch/finally`、`queueMicrotask`、`MutationObserver`、`await` 续体 |
| 渲染回调 | `requestAnimationFrame` |

```js
console.log('A')
setTimeout(() => console.log('B'))
Promise.resolve().then(() => console.log('C'))
queueMicrotask(() => console.log('D'))
console.log('E')
// → A E C D B
```

### 微任务可以饿死渲染

```js
function loop() {
  Promise.resolve().then(loop)
}
loop() // 页面完全卡死
```

因为微任务队列永远不会清空，浏览器拿不到渲染机会。这也是为什么"用微任务做无限轮询"是危险写法。

### 嵌套定时器的 4ms 限制

浏览器对嵌套超过 5 层的 `setTimeout` 强制最小延迟 4ms。所以"用 `setTimeout(0)` 做时间片"在高频场景下并不精确，`MessageChannel` 或 `scheduler.postTask` 更合适。

## setTimeout 的真实含义

```js
setTimeout(fn, 100)  // "至少在 100ms 后有空时执行"，不是精确 100ms
```

延迟时间只是**最早可执行时间**。如果主线程正忙，回调会推迟。测过就知道：

```js
const start = Date.now()
setTimeout(() => console.log(Date.now() - start), 100)
// 主线程阻塞 300ms 后，实际耗时接近 400ms
```

## Promise 状态机

三个状态：`pending` → `fulfilled` / `rejected`，**单向不可逆**。

```js
const p = new Promise((resolve, reject) => {
  resolve(1)
  reject(2) // 被忽略，状态已锁定
})
p.then(console.log) // → 1
```

四个关键语义：

1. **then 总是异步执行**（微任务），即使 Promise 已 resolved
2. **then 返回新的 Promise**，支持链式
3. **返回值穿透**：then 参数非函数时，值原样传下去
4. **抛错向下传递**：任一环抛错，后续 then 的第二个参数或 catch 捕获

```js
Promise.resolve(1)
  .then((v) => v + 1)     // 2
  .then(() => { throw new Error('x') })
  .then(() => console.log('不会执行'))
  .catch((e) => console.log(e.message)) // 'x'
  .finally(() => console.log('finally'))
```

`finally` 不改变值，除非它抛错或返回 rejected Promise。

### 手写实现的核心骨架

```js
const PENDING = 0, FULFILLED = 1, REJECTED = 2

class MyPromise {
  constructor(executor) {
    this.state = PENDING
    this.value = undefined
    this.handlers = []

    const settle = (state, value) => {
      if (this.state !== PENDING) return
      this.state = state
      this.value = value
      this.handlers.forEach((h) => h())
    }

    const resolve = (v) => {
      if (v === this) return settle(REJECTED, new TypeError('cycle'))
      if (v && typeof v.then === 'function') {
        let called = false
        v.then(
          (x) => { if (!called) { called = true; resolve(x) } },
          (e) => { if (!called) { called = true; settle(REJECTED, e) } }
        )
        return
      }
      settle(FULFILLED, v)
    }

    try { executor(resolve, (e) => settle(REJECTED, e)) }
    catch (e) { settle(REJECTED, e) }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const run = () => queueMicrotask(() => {
        const cb = this.state === FULFILLED ? onFulfilled : onRejected
        if (typeof cb !== 'function') {
          return this.state === FULFILLED ? resolve(this.value) : reject(this.value)
        }
        try { resolve(cb(this.value)) }
        catch (e) { reject(e) }
      })
      this.state === PENDING ? this.handlers.push(run) : run()
    })
  }
}
```

面试考察点：异步保证、返回值穿透、循环引用、thenable 采纳。

## async / await 的真实执行顺序

`await` 等价于把后续代码注册为 then 回调：

```js
async function a() {
  console.log('a1')
  await null
  console.log('a2')
}

console.log('start')
a()
console.log('end')
// → start a1 end a2
```

`await null` 也会让出一次微任务。这是很多人以为"await 同步值不会让出"的误区。

### 经典改错题

```js
async function async1() {
  console.log('1')
  await async2()
  console.log('2')
}
async function async2() { console.log('3') }

console.log('4')
setTimeout(() => console.log('5'))
async1()
new Promise((r) => { console.log('6'); r() }).then(() => console.log('7'))
console.log('8')
// 4 1 3 6 8 2 7 5
```

拆解：

1. 同步：`4`
2. `async1` 同步执行到 `await`：`1`、`3`
3. Promise 执行器同步：`6`
4. 同步：`8`
5. 微任务队列：`2`（await 续体）、`7`（then）
6. 宏任务：`5`

### await 与 return 的差异

```js
async function f() {
  return Promise.resolve(1)   // 会被展开
}
async function g() {
  return await Promise.resolve(1)
}
```

两者对外都是 `Promise<1>`，但 `return await` 会在 try/catch 中捕获错误，`return` 不会。在 try 块内必须用 `return await`。

```js
async function noCatch() {
  try {
    return Promise.reject(new Error('x'))   // 错误逃逸，外层拿不到
  } catch {
    return 'caught'
  }
}
async function withCatch() {
  try {
    return await Promise.reject(new Error('x')) // 被 catch 捕获
  } catch {
    return 'caught'
  }
}

noCatch().catch((e) => console.log(e.message))   // → "x"（没被捕获）
withCatch().then((v) => console.log(v))           // → "caught"
```

## 并发控制

面试常考"同时最多 3 个请求"：

```js
async function pool(tasks, limit) {
  const results = new Array(tasks.length)
  let cursor = 0

  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++
      results[i] = await tasks[i]()
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker))
  return results
}
```

要点：共享游标避免重复领取、`while` 循环让 worker 复用、`Promise.all` 等待全部完成。

## 组合器语义对照

| API | 成功条件 | 失败条件 |
| --- | --- | --- |
| `all` | 全部成功 | 任一失败立即 reject |
| `allSettled` | 全部落定 | 永不 reject |
| `race` | 第一个落定（成功或失败） | 同左 |
| `any` | 第一个成功 | 全部失败时 reject（AggregateError） |

## 取消与超时

原生 Promise 不可取消。标准做法是 `AbortController`：

```js
const controller = new AbortController()
fetch(url, { signal: controller.signal })
setTimeout(() => controller.abort(), 3000)
```

对纯 Promise 任务可以包一层竞速：

```js
function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
```

::: warn 注意
`race` 只是"忽略"结果，被超时的请求仍在后台执行、仍会消耗资源。真正的取消必须依赖 AbortController 或业务层的 token 校验。
:::

::: interview 面试视角
能说清"微任务可以饿死渲染"、"`setTimeout` 只保证最早时间"、"race 不等于取消"这三点，基本可以判断候选人真的调试过异步问题。
:::