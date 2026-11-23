Vue 的面试题有一半在 API 细节上。这一章把"看起来简单但答不完整"的一组集中处理。

## 一、v-if 与 v-show

| | v-if | v-show |
| --- | --- | --- |
| 实现 | 销毁/重建 DOM | `display: none` 切换 |
| 初始渲染 | 条件为假时不渲染 | 总会渲染 |
| 切换代价 | 高（状态丢失、重新 mounted） | 低（只改样式） |
| 适合 | 切换不频繁 | 切换频繁 |

### 四个容易忽略的细节

```vue
<!-- 1. v-show 不能用于 template -->
<template v-show="ok">❌</template>

<!-- 2. Vue 3 中 v-if 优先级高于 v-for -->
<li v-for="item in list" v-if="item.active">❌ 访问不到 item</li>

<!-- ✅ 用计算属性过滤 -->
<li v-for="item in activeList">
```

```vue
<!-- 3. v-if 会销毁组件状态 -->
<Child v-if="visible" />
<!-- visible 变 false → 组件卸载 → 内部 ref / 表单输入 / 滚动位置全丢失 -->

<!-- 4. 与 keep-alive 组合时 v-if 仍会卸载 -->
<keep-alive>
  <Comp v-if="show" />   <!-- show=false 时组件被卸载 -->
</keep-alive>
```

::: warn 权限控制必须用 v-if
```vue
<div v-show="hasPermission">敏感数据</div>
```
v-show 只是隐藏，DOM 与数据仍在页面中，可通过开发者工具看到。权限必须用 `v-if`，且服务端也要校验。
:::

## 二、data 为什么必须是函数

```js
// ❌ 对象：所有实例共享同一份数据
const data = { count: 0 }
new Vue({ data })
new Vue({ data })
// 改一个实例，另一个也跟着变

// ✅ 函数：每次创建实例调用一次，返回全新对象
data() { return { count: 0 } }
```

根实例可以用对象，因为**只会创建一次**，不存在复用问题。

### Vue 3 中的等价问题

```js
// ❌ 模块级 ref = 全局单例，所有使用该 composable 的组件共享
const count = ref(0)
export function useCounter() {
  return { count }
}

// ✅ 每次调用创建新状态
export function useCounter() {
  const count = ref(0)
  return { count }
}
```

如果想**故意**做成全局共享（如主题），模块级 ref 就是正确写法。理解这个区别比背结论更重要。

## 三、v-model 的原理

### 本质：prop + 事件

```vue
<MyInput v-model="text" />
```

Vue 3 编译为：

```js
h(MyInput, {
  modelValue: text,
  'onUpdate:modelValue': (v) => { text = v }
})
```

| | Vue 2 | Vue 3 |
| --- | --- | --- |
| 默认 prop | `value` | `modelValue` |
| 默认事件 | `input` | `update:modelValue` |
| 多个 v-model | ❌ | ✅ |

### 自定义组件实现

```vue
<script setup>
const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])

function onInput(e) {
  emit('update:modelValue', e.target.value)   // 不要直接改 prop
}
</script>

<template>
  <input :value="modelValue" @input="onInput" />
</template>
```

### 多个 v-model

```vue
<UserForm v-model:name="name" v-model:age="age" />
```

```vue
<script setup>
defineProps({ name: String, age: Number })
const emit = defineEmits(['update:name', 'update:age'])
</script>
```

### Vue 3.4 的 defineModel

```vue
<script setup>
const model = defineModel()
const title = defineModel('title')   // 命名
</script>

<template>
  <input v-model="model" />
</template>
```

内部自动同步 prop 与事件，大幅减少样板代码。

## 四、生命周期顺序

### 单个组件

```
setup → beforeMount → mounted → beforeUpdate → updated → beforeUnmount → unmounted
```

| Options | Composition |
| --- | --- |
| `created` | setup 顶层代码 |
| `mounted` | `onMounted` |
| `beforeUpdate` | `onBeforeUpdate` |
| `updated` | `onUpdated` |
| `beforeUnmount` | `onBeforeUnmount` |
| `unmounted` | `onUnmounted` |
| `activated` | `onActivated` |
| `deactivated` | `onDeactivated` |

Vue 3 的变化：`beforeDestroy/destroyed` 改名为 `beforeUnmount/unmounted`；`beforeCreate/created` 在 Composition API 中不再需要。

### 父子组件顺序

```
挂载（由内向外）：
  parent beforeMount → child beforeMount → child mounted → parent mounted

更新（由外向内）：
  parent beforeUpdate → child beforeUpdate → child updated → parent updated

卸载（由外向内）：
  parent beforeUnmount → child beforeUnmount → child unmounted → parent unmounted
```

记忆：**创建由外向内，挂载由内向外，销毁由外向内**。

## 五、keep-alive

### 三个属性

| 属性 | 作用 |
| --- | --- |
| `include` | 只缓存匹配的组件（按组件 name） |
| `exclude` | 不缓存（优先于 include） |
| `max` | 上限，超出按 LRU 淘汰 |

```vue
<keep-alive :include="['Home', 'List']" :max="10">
  <component :is="current" />
</keep-alive>
```

```vue
<script setup>
defineOptions({ name: 'Home' })   // Vue 3.3+ 需显式声明
</script>
```

### 生命周期变化

| 钩子 | 首次 | 再次进入 |
| --- | --- | --- |
| `created` / `mounted` | ✅ | ❌ |
| `activated` | ✅ | ✅ |
| `deactivated` | — | 离开时 |

**"每次进入都要刷新数据"必须写在 `activated`**，不能只写在 `mounted`。

### 与 v-if 的冲突

```vue
<!-- ❌ v-if 为 false 时仍会卸载 -->
<keep-alive>
  <Comp v-if="show" />
</keep-alive>

<!-- ✅ -->
<keep-alive>
  <Comp v-show="show" />
</keep-alive>
```

### 手动清理

Vue 3 没有官方 API，可通过控制 include 列表：

```js
const cached = ref(['Home', 'List'])

function refresh(name) {
  cached.value = cached.value.filter((n) => n !== name)
  nextTick(() => { cached.value = [...cached.value, name] })
}
```

## 六、Vue Router

### 两种模式

| 模式 | URL | 监听 |
| --- | --- | --- |
| hash | `/#/user/1` | `hashchange` |
| history | `/user/1` | `pushState` + `popstate` |

history 模式**必须服务端 fallback**：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

否则直接访问 `/user/1` 会 404。

### 导航流程（12 步）

```
1. 触发导航
2. 失活组件 beforeRouteLeave
3. 全局 beforeEach
4. 重用组件 beforeRouteUpdate
5. 路由 beforeEnter
6. 解析异步组件
7. 激活组件 beforeRouteEnter（无 this）
8. 全局 beforeResolve
9. 确认导航
10. 全局 afterEach
11. DOM 更新
12. beforeRouteEnter 的 next 回调（可访问 this）
```

### 常见问题

```js
// 参数变化但组件不重建 → 需要监听
watch(() => route.params.id, fetchData)
// 或用 beforeRouteUpdate

// base 路径
createRouter({ history: createWebHistory('/app/') })
```

## 七、Pinia 与 Vuex

| 维度 | Vuex 4 | Pinia |
| --- | --- | --- |
| 变更 | 必须 commit mutation | 可直接修改 |
| 模块 | 嵌套 + namespaced | 扁平 store |
| TS | 需类型体操 | 原生友好 |
| 样板代码 | 多 | 少 |

### setup store（推荐）

```js
export const useCounter = defineStore('counter', () => {
  const count = ref(0)
  const double = computed(() => count.value * 2)
  function inc() { count.value++ }
  return { count, double, inc }
})
```

心智模型与组件完全一致。

### 为什么去掉 mutation

Vuex 的 mutation 主要为了"DevTools 需要同步变更记录"。Pinia 通过 `$subscribe` 实现同样能力：

```js
store.$subscribe((mutation, state) => {
  localStorage.setItem('counter', JSON.stringify(state))
})
```

### 注意事项

```js
// 解构 state 会丢响应性
const { count } = storeToRefs(store)   // ✅
const { inc } = store                    // ✅ action 可直接解构
```

## 八、组件通信

| 方式 | 方向 | 层级 |
| --- | --- | --- |
| props / emit | 父子 | 直接 |
| v-model | 双向 | 父子 |
| defineExpose + ref | 父调用子 | 父主动 |
| provide / inject | 祖先 → 后代 | 跨多层 |
| `$attrs` | 透传 | 包装组件 |
| 事件总线（mitt） | 任意 | 跨组件 |
| Pinia | 任意 | 全局 |

### provide/inject 的独特价值

```vue
<!-- 同一个组件库在不同区域提供不同配置 -->
<FormProvider :rules="rulesA"><Form /></FormProvider>
<FormProvider :rules="rulesB"><Form /></FormProvider>
```

**作用域隔离**：全局 store 做不到。

### defineExpose

```vue
<script setup>
function focus() { input.value.focus() }
defineExpose({ focus })   // script setup 默认封闭
</script>
```

### 事件总线必须解绑

```js
onMounted(() => bus.on('evt', handler))
onBeforeUnmount(() => bus.off('evt', handler))   // 忘记就是内存泄漏
```

## 九、Vue 3.5 新特性

| 特性 | 作用 |
| --- | --- |
| 响应式内存优化 | 依赖收集改为版本计数，内存约 -56% |
| `defineProps` 解构响应式 | 不再必须 toRefs |
| `useTemplateRef` | 替代"声明 ref + 同名模板 ref" |
| `useId` | SSR 稳定唯一 id |
| SSR 增强 | 流式、内存控制 |

```vue
<script setup>
const inputRef = useTemplateRef('input')
const id = useId()
</script>

<template>
  <input ref="input" :id="id" />
</template>
```

::: warn 注意版本边界
Vapor Mode（3.6）截至 2026 年初仍处于实验阶段。回答时要说明"在实验阶段"，不要当成已发布特性。
:::

::: interview 面试视角
Vue 题的区分点在"细节的副作用"。能说出"keep-alive 下 mounted 只执行一次"、"v-if 优先级高于 v-for 导致访问不到 item"、"script setup 默认封闭需 defineExpose"，就是真实使用经验。
:::