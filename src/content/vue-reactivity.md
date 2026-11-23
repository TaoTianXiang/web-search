Vue 3 的响应式从 `Object.defineProperty` 换成了 `Proxy`。这不只是实现细节变化，而是能力边界的扩展。面试要能讲清"依赖收集的完整链路"和"为什么需要调度器"。

## 三件套的关系

```
reactive(target)  →  创建 Proxy，读写时触发 track / trigger
effect(fn)        →  注册副作用，执行时把自身设为 activeEffect
依赖容器           →  WeakMap<target, Map<key, Set<effect>>>
```

```
targetMap
└── WeakMap
    ├── { count: 0 }  ──►  Map
    │                       ├── "count" ──► Set [ effect1, computedEffect ]
    │                       └── "other" ──► Set [ ... ]
    └── { name: 'a' } ──►  Map ...
```

## 依赖收集的完整流程

```js
import { reactive, effect } from 'vue'

const state = reactive({ count: 0 })

effect(() => {
  console.log(state.count) // 读取时收集
})

state.count++ // 写入时触发
```

内部展开：

1. `reactive` 返回 Proxy，`get` 拦截器中调用 `track(target, key)`
2. `track` 把当前的 `activeEffect` 加入 `dep`
3. `effect` 执行前设置 `activeEffect`，执行后恢复
4. `set` 拦截器调用 `trigger(target, key)`
5. `trigger` 遍历 `dep`，调用每个 effect 的 `run()` 或 `scheduler()`

```js
// 简化实现
let activeEffect = null

function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
  activeEffect.deps.push(dep) // 支持 cleanup
}

function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  if (!dep) return
  const effects = new Set(dep)
  effects.forEach((e) => (e.scheduler ? e.scheduler() : e.run()))
}
```

用 `new Set(dep)` 是因为遍历时若 effect 内又触发了 track，会修改原集合导致死循环。

## 为什么需要调度器

简单 effect 是"依赖变化立即重跑"。这会导致：

1. 同一 tick 内多次变更 → 重复执行
2. 组件渲染需要在微任务中批量刷新
3. computed 需要惰性求值

所以 effect 支持 `scheduler`：

```js
const jobQueue = new Set()
const p = Promise.resolve()

let flushing = false
function queueJob(job) {
  jobQueue.add(job)
  if (!flushing) {
    flushing = true
    p.then(() => {
      jobQueue.forEach((j) => j())
      jobQueue.clear()
      flushing = false
    })
  }
}
```

Vue 的 `watch` 的 `flush` 选项就是选择哪个队列：

| flush | 时机 |
| --- | --- |
| `pre`（默认） | 组件更新前 |
| `post` | 组件更新后（DOM 已更新） |
| `sync` | 立即执行（慎用） |

## computed 的缓存机制

```js
function computed(getter) {
  let value
  let dirty = true

  const effect = new ReactiveEffect(getter, () => {
    if (!dirty) {
      dirty = true
      trigger(obj, 'value') // 通知依赖该 computed 的 effect
    }
  })

  const obj = {
    get value() {
      if (dirty) {
        value = effect.run()
        dirty = false
      }
      track(obj, 'value')
      return value
    }
  }
  return obj
}
```

两个关键点：

1. **dirty 标记**：依赖变化只标记，不立即重算
2. **computed 本身也是被依赖者**：模板读取 computed 时，computed 的 effect 成为外层 effect 的依赖

这就是"computed 链"能正确工作的原因。

::: warn 不要在 computed 里做副作用
computed 应保持纯函数。如果在里面发请求或改其他状态，会产生难以追踪的依赖关系。
:::

## ref 与 reactive 的边界

```js
const count = ref(0)          // Ref<number>
count.value++                  // 需要 .value

const state = reactive({ n: 0 })
state.n++                      // 直接访问
```

| 维度 | ref | reactive |
| --- | --- | --- |
| 支持类型 | 任意（含原始值） | 仅对象 |
| 访问方式 | `.value`（模板自动解包） | 直接属性 |
| 解构 | 保留响应性 | **丢失** |
| 整体替换 | 安全 | 断开代理 |
| 深度 | 默认深（对象会转 reactive） | 默认深 |

```js
// 解构丢失
const state = reactive({ a: 1, b: 2 })
const { a } = state         // a 是普通数字
const aRef = toRef(state, 'a') // 保留

// 整体替换
let state2 = reactive({ x: 1 })
state2 = { x: 2 }           // ❌ 丢失响应性，应改回 state2.x = 2 或用 ref
```

### 模板中的自动解包

```vue
<script setup>
const count = ref(0)
</script>

<template>
  {{ count }}          <!-- 自动解包 -->
  {{ count + 1 }}      <!-- 自动解包 -->
  <input v-model="count" />
</template>
```

但**在对象中不会解包**：

```js
const obj = { count: ref(0) }
obj.count // 仍是 Ref 对象，需要 obj.count.value
```

## 浅响应与性能

```js
import { shallowRef, shallowReactive, markRaw } from 'vue'

// 大数组只需要整体替换时
const list = shallowRef([])
list.value = newList // 触发

// 只关心顶层属性
const state = shallowReactive({ a: 1, nested: { b: 2 } })
state.a++ // 触发
state.nested.b++ // 不触发

// 明确告诉 Vue 不要代理
const chart = markRaw(new Chart(...))
```

::: tip 性能判断
- 上万条数据的列表：用 `shallowRef`，只做整体替换
- 第三方类实例（地图、图表、编辑器）：`markRaw`
- 只在初始化时读取的配置：直接普通对象
:::

深度代理的成本在于递归创建 Proxy，对大对象是显著的初始化开销，运行时每次访问还要过拦截器。

## 依赖清理与分支切换

```js
effect(() => {
  if (flag.value) {
    console.log(a.value) // flag 为 true 时依赖 flag 和 a
  } else {
    console.log(b.value) // 切换后应只依赖 flag 和 b
  }
})
```

如果不清理旧依赖，`a` 变化时仍会触发。Vue 在 effect 每次执行前会清空自身的 `deps`，然后重新收集。这就是 `activeEffect.deps.push(dep)` 存在的意义。

## 与 Vue 2 的差异总结

| 维度 | Vue 2 | Vue 3 |
| --- | --- | --- |
| 实现 | `Object.defineProperty` | `Proxy` |
| 新增属性 | 需 `$set` | 自动响应 |
| 删除属性 | 需 `$delete` | 自动响应 |
| 数组索引 | 需 `$set` | 自动响应 |
| Map / Set | 不支持 | 支持 |
| 初始化 | 递归转换全部属性 | 访问时惰性代理 |
| 嵌套深度 | 递归成本高 | 按需代理 |

::: interview 面试视角
能说清"Proxy 的优势不只是拦截更多操作，还有**惰性**"这一点，说明理解实现成本而不仅是 API 差异。
:::

## 常见面试追问

**Q：为什么 Vue 3 的 ref 需要 `.value`？**

因为原始值无法被 Proxy 代理，必须用一个包装对象持有。`.value` 提供了 getter/setter 的拦截入口。

**Q：effect 嵌套时如何避免依赖混乱？**

用 effect 栈保存父 effect，执行完子 effect 后恢复父级 `activeEffect`。

**Q：如何实现一个简易响应式？**

```js
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      track(target, key)
      const value = Reflect.get(target, key)
      return typeof value === 'object' && value !== null ? reactive(value) : value
    },
    set(target, key, value) {
      const ok = Reflect.set(target, key, value)
      trigger(target, key)
      return ok
    }
  })
}
```

要点：`Reflect` 保证 receiver 语义正确，嵌套对象需要递归包装（或惰性包装）。