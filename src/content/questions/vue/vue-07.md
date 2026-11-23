## 完整钩子与执行顺序

```
创建阶段
  setup()                        （Composition API 的入口）
  beforeCreate  → created        （Options API）
  beforeMount → mounted
更新阶段
  beforeUpdate → updated
销毁阶段
  beforeUnmount → unmounted
缓存组件
  activated → deactivated
错误捕获
  errorCaptured
```

| Options API | Composition API | 时机 |
| --- | --- | --- |
| `beforeCreate` | 不需要（setup 本身更早） | 实例初始化前 |
| `created` | setup 顶层代码 | 数据观测完成，DOM 未生成 |
| `beforeMount` | `onBeforeMount` | 挂载前 |
| `mounted` | `onMounted` | DOM 已插入 |
| `beforeUpdate` | `onBeforeUpdate` | 数据变化、DOM 未更新 |
| `updated` | `onUpdated` | DOM 已更新 |
| `beforeUnmount` | `onBeforeUnmount` | 卸载前 |
| `unmounted` | `onUnmounted` | 卸载后 |
| `activated` | `onActivated` | keep-alive 激活 |
| `deactivated` | `onDeactivated` | keep-alive 停用 |

## Vue 3 的变化

1. **`beforeDestroy` / `destroyed` 改名为 `beforeUnmount` / `unmounted`**（语义更准确）
2. **`beforeCreate` / `created` 在 Composition API 中不再需要**，直接在 setup 顶层写代码
3. **同一钩子可多次注册**，按注册顺序执行（Vue 2 中同名的会被覆盖）
4. **`<script setup>` 中生命周期随组件卸载自动清理**（不需要手动移除）

## 父子组件的执行顺序

```vue
<!-- Parent -->
<template><Child /></template>
```

挂载：

```
parent beforeCreate → parent created
parent beforeMount
  child beforeCreate → child created
  child beforeMount
  child mounted
parent mounted
```

更新（父的数据变化导致子更新）：

```
parent beforeUpdate
  child beforeUpdate → child updated
parent updated
```

卸载：

```
parent beforeUnmount
  child beforeUnmount → child unmounted
parent unmounted
```

记忆方法：**创建由外向内，挂载由内向外；销毁由外向内**。

## 各钩子的实际用途

| 钩子 | 典型用途 |
| --- | --- |
| setup | 初始化响应式数据、调用 composable |
| onMounted | 访问 DOM（`ref` 已就绪）、初始化第三方库、发请求 |
| onUpdated | 需要在 DOM 更新后测量布局（需防死循环） |
| onBeforeUnmount | 清理定时器、解绑原生事件、取消订阅 |
| onActivated | 恢复轮询、刷新数据 |
| onDeactivated | 暂停轮询、保存滚动位置 |

```js
onMounted(() => {
  const chart = new Chart(el.value)
  onBeforeUnmount(() => chart.destroy())   // 必须清理
})
```

## 容易踩的坑

```js
// 1. onUpdated 里改状态 → 无限循环
onUpdated(() => { count.value++ })

// 2. mounted 中拿不到 v-if=false 的元素
<div v-if="show" ref="el" />   // show 为 false 时 el 为 null

// 3. 在 setup 中直接 await 会阻塞渲染
const data = await fetch()     // 需要配合 <Suspense>
```

::: tip keep-alive 下 mounted 只执行一次
被 `keep-alive` 缓存的组件，第二次进入时**不会重新 mounted**，只会触发 `activated`。需要刷新数据时应在 `activated` 中处理。
:::

::: interview 面试视角
能准确说出"创建由外向内、挂载由内向外、销毁由外向内"，并指出"keep-alive 下 mounted 只执行一次"，说明你写过带缓存的真实页面。
:::
