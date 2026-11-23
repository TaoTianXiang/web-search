## Vue 2 的实现与局限

```js
Object.defineProperty(obj, 'count', {
  get() { track(); return value },
  set(v) { value = v; trigger() }
})
```

四个无法绕过的问题：

1. **新增/删除属性无法拦截** → 需要 `$set` / `$delete`
2. **数组索引与 length 无法拦截** → 重写了 7 个数组方法
3. **Map / Set / WeakMap 完全不支持**
4. **必须递归遍历所有属性**，初始化成本高

## Vue 3 的实现

```js
function reactive(target) {
  return new Proxy(target, {
    get(t, k, receiver) {
      track(t, k)
      const v = Reflect.get(t, k, receiver)
      return isObject(v) ? reactive(v) : v   // 惰性代理
    },
    set(t, k, v, receiver) {
      const old = t[k]
      const ok = Reflect.set(t, k, v, receiver)
      if (!Object.is(old, v)) trigger(t, k)
      return ok
    },
    deleteProperty(t, k) {
      const ok = Reflect.deleteProperty(t, k)
      trigger(t, k)
      return ok
    },
    has(t, k) { track(t, k); return Reflect.has(t, k) }
  })
}
```

## 依赖容器

```
targetMap: WeakMap<target, Map<key, Set<effect>>>

{ count: 0 } ──► Map
                  ├── 'count' ──► Set [ effect1, computedEffect ]
                  └── 'name'  ──► Set [ ... ]
```

```js
let activeEffect = null

function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
  activeEffect.deps.push(dep)   // 供 cleanup 使用
}

function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  if (!dep) return
  const effects = new Set(dep)   // 复制，避免回调中修改导致死循环
  effects.forEach((e) => (e.scheduler ? e.scheduler() : e.run()))
}
```

用 `new Set(dep)` 复制的原因：effect 执行中可能又重新 track / trigger，直接遍历原集合会导致无限循环。

## effect 的三类调度

| 类型 | 行为 |
| --- | --- |
| 普通 effect | 依赖变化立即重新执行 |
| computed | 只标记 dirty，读取时才重算 |
| watch | 进入调度队列，flush 决定时机（pre / post / sync） |

```js
// 组件渲染的 effect 带 scheduler，进入队列批量刷新
effect(componentUpdate, { scheduler: () => queueJob(update) })
```

## Proxy 相比 defineProperty 的优势

| 维度 | defineProperty | Proxy |
| --- | --- | --- |
| 新增属性 | 需 $set | 自动 |
| 删除属性 | 需 $delete | 自动 |
| 数组索引 | 需特殊处理 | 自动 |
| Map / Set | 不支持 | 支持 |
| 初始化成本 | 递归全部属性 | 访问时惰性代理 |
| 拦截能力 | get/set | 13 种 trap（has、ownKeys、delete...） |

::: tip 惰性代理的价值
```js
const big = reactive({ a: { b: { c: hugeArray } } })
big.a   // 只代理到 a 这一层，b、c 在被访问时才代理
```
对深嵌套大对象，这能显著降低初始化开销。
:::

## Vue 3.4 之后的优化

1. **依赖收集不再用 Set 存 effect 的双向引用**，改为版本号计数（`version`），减少内存与清理开销
2. **数组的 length 与索引分别处理**，避免无意义触发
3. **computed 的 dirty 判断更精确**，减少无效重算

## 与 Vue 2 的行为差异

```js
const state = reactive({})
state.newKey = 1     // ✅ Vue 3 自动响应
delete state.newKey  // ✅ 自动响应
state.arr[0] = 1     // ✅ 自动响应
state.arr.length = 0 // ✅ 自动响应
```

::: interview 面试视角
不要只说"Proxy 比 defineProperty 好"。要说明"能力更完整"+"惰性代理降低初始化成本"这两层，并给出 targetMap 的三层结构，才算讲清了链路。
:::
