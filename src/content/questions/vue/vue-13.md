## 五类常见泄漏

| 来源 | 代码 |
| --- | --- |
| 定时器未清理 | `setInterval` 在组件卸载后仍在跑 |
| 原生事件未解绑 | `window.addEventListener` 未 remove |
| 第三方实例未销毁 | 图表、地图、编辑器 |
| 全局事件总线未 off | `bus.on` 无对应 `off` |
| 全局数组 / Map 只增不减 | `history.push` 无上限 |

## 编码阶段的防护

```js
// 1. 定时器：注册即清理
onMounted(() => {
  const id = setInterval(tick, 1000)
  onBeforeUnmount(() => clearInterval(id))
})

// 2. 原生事件
onMounted(() => {
  window.addEventListener('resize', onResize, { passive: true })
  onBeforeUnmount(() => window.removeEventListener('resize', onResize))
})

// 3. 第三方实例
onMounted(() => {
  chart = new Chart(el.value)
  onBeforeUnmount(() => {
    chart.destroy()
    chart = null
  })
})

// 4. 事件总线
onMounted(() => bus.on('evt', handler))
onBeforeUnmount(() => bus.off('evt', handler))
```

## 用 composable 封装清理

```js
// useEventListener.js
export function useEventListener(target, event, handler, options) {
  onMounted(() => target.addEventListener(event, handler, options))
  onBeforeUnmount(() => target.removeEventListener(event, handler, options))
}

// useInterval.js
export function useInterval(fn, ms) {
  let id = null
  const start = () => { if (!id) id = setInterval(fn, ms) }
  const stop = () => { if (id) { clearInterval(id); id = null } }
  onMounted(start)
  onBeforeUnmount(stop)
  return { start, stop }
}
```

把"注册 + 清理"固化在 composable 里，是最有效的预防手段。

## keep-alive 与缓存

```vue
<keep-alive :max="5">
  <component :is="current" />
</keep-alive>
```

不设 `max` 时，缓存的组件会一直保留在内存中（包含其全部响应式数据）。页面越多，占用越大。

## 大数据结构

```js
// ❌ 全局 Map 只增不减
const cache = new Map()

// ✅ 有上限的 LRU
class LRU {
  constructor(limit) { this.limit = limit; this.map = new Map() }
  get(k) {
    if (!this.map.has(k)) return undefined
    const v = this.map.get(k)
    this.map.delete(k); this.map.set(k, v)   // 移到末尾
    return v
  }
  set(k, v) {
    if (this.map.has(k)) this.map.delete(k)
    this.map.set(k, v)
    if (this.map.size > this.limit) this.map.delete(this.map.keys().next().value)
  }
}
```

## 排查流程

1. **Chrome DevTools → Memory**
   - 拍三次快照（打开页面 / 反复切换 / 再切换一次）
   - 对比同类对象的实例数，单调增长即为泄漏
2. **Retainers 面板**
   - 选中可疑对象，向上找引用链，通常能找到某个未清理的监听或定时器
3. **Performance 面板**
   - 勾选 Memory，看 JS Heap 是否呈"锯齿"（正常）还是持续上升
4. **Detached DOM**
   - 搜索 `Detached` 定位已移除但仍被引用的节点

```js
// 也可以用 WeakRef 观测
const ref = new WeakRef(bigObject)
setTimeout(() => console.log(ref.deref()), 5000)
```

## 在 CI 中加入防护

```js
// 用 puppeteer 做泄漏回归测试
async function checkLeak(url, action) {
  const page = await browser.newPage()
  await page.goto(url)
  await page.evaluate(() => (window.gc && window.gc()))

  const before = await page.metrics()
  for (let i = 0; i < 5; i++) await action(page)
  await page.evaluate(() => window.gc && window.gc())
  const after = await page.metrics()

  const growth = after.JSHeapUsedSize / before.JSHeapUsedSize
  expect(growth).toBeLessThan(1.3)
}
```

::: interview 面试视角
"注意清理定时器"太笼统。能说出"用 composable 固化注册与清理"、"keep-alive 不设 max 会累积"、"CI 中用堆快照做回归"，就是系统性回答。
:::
