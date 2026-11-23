## 核心差异

| 维度 | Vuex 4 | Pinia |
| --- | --- | --- |
| 模块 | module 嵌套，需 namespaced | 扁平 store，天然隔离 |
| 变更方式 | 必须 commit mutation | 可直接修改 state（也可写 action） |
| TypeScript | 需额外类型体操 | 原生友好，自动推断 |
| 组合式支持 | 弱 | setup store 完全对齐 |
| 代码量 | 多（state/mutation/action） | 少（state/getter/action 可选） |
| DevTools | 支持 | 支持（含时间旅行） |
| 体积 | 较大 | 更小 |

## Vuex 的样板代码

```js
// Vuex：一个简单的计数器需要三处定义
export default {
  state: () => ({ count: 0 }),
  mutations: {
    increment(state) { state.count++ }
  },
  actions: {
    async incrementAsync({ commit }) {
      await delay(1000)
      commit('increment')
    }
  },
  getters: { double: (s) => s.count * 2 }
}

// 组件内
this.$store.commit('increment')
```

## Pinia 的两种写法

### Options Store

```js
export const useCounter = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: { double: (s) => s.count * 2 },
  actions: {
    increment() { this.count++ },   // 直接改
    async incrementAsync() {
      await delay(1000)
      this.increment()
    }
  }
})
```

### Setup Store（推荐）

```js
export const useCounter = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)

  async function incrementAsync() {
    await delay(1000)
    count.value++
  }

  return { count, double, incrementAsync }
})
```

setup store 的心智模型与组件完全一致（ref / computed / function），对熟悉 Composition API 的开发者几乎没有学习成本。

## 为什么去掉 mutation

Vuex 的 mutation 存在的主要理由是"DevTools 需要同步的变更记录以便时间旅行"。Pinia 通过：

1. 订阅 `$subscribe`（每次 state 变更后触发）
2. 内部用 `patch` 记录变更
实现了同样的能力，不再需要强制 commit。

::: tip 保留 mutation 的价值
如果团队需要**严格的变更审计**（每次改动都记录操作类型与来源），仍可以在 Pinia 里约定"只通过 action 修改 state"，用 lint 规则约束直接赋值。
:::

## 常见用法

```js
const store = useCounter()

// 1. 直接访问
store.count
store.double

// 2. 解构（需 storeToRefs 保持响应性）
const { count, double } = storeToRefs(store)   // ✅ ref
const { increment } = store                      // ✅ action 可直接解构

// 3. 修改
store.count++
store.$patch({ count: 1 })
store.$reset()                                   // 恢复初始状态

// 4. 订阅
store.$subscribe((mutation, state) => {
  localStorage.setItem('counter', JSON.stringify(state))
})

// 5. 跨 store 使用
export const useUser = defineStore('user', () => {
  const counter = useCounter()   // 直接调用其他 store
  return { counter }
})
```

## 与 SSR 的配合

```js
// 服务端：每个请求创建独立 pinia 实例
const pinia = createPinia()

// 客户端：从服务端注入的 state 恢复
pinia.state.value = window.__PINIA_STATE__
```

这是 Pinia 对 SSR 友好的关键：**每个请求一个实例**，避免状态在请求之间串漏。

::: warn 不要把所有数据都放 store
全局 store 只应放"真正跨页面共享的状态"。页面内部数据、服务端数据（用 TanStack Query / `useAsyncData`）都不该放进去。
:::

::: interview 面试视角
能说清"去 mutation 是因为 $subscribe 已能支持 DevTools"、"setup store 与组件心智一致"、"SSR 每请求一个实例"，就体现了实际使用经验。
:::
