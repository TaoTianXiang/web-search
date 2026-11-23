## 原理

`keep-alive` 是一个**抽象组件**（不渲染真实 DOM），它把包裹的组件实例与 vnode 存进缓存 Map，切换时不再走完整的卸载/创建流程：

```js
const cache = new Map()          // key → vnode
const keys = new Set()           // 记录顺序，用于 LRU
```

```vue
<keep-alive>
  <component :is="current" />
</keep-alive>
```

内部逻辑：

1. 组件切换前，若 `include/exclude` 允许，把当前 vnode 存入 `cache`
2. 切换回该组件时，从 `cache` 取出 vnode，直接复用其 `component instance`
3. 复用时不执行 `created/mounted`，只触发 `activated`

## 三个属性

```vue
<keep-alive :include="['Home', 'List']" :exclude="['Detail']" :max="10">
  <component :is="current" />
</keep-alive>
```

| 属性 | 作用 | 匹配规则 |
| --- | --- | --- |
| `include` | 只有匹配的组件被缓存 | 组件的 `name` 选项 |
| `exclude` | 匹配的组件不缓存 | 优先于 include |
| `max` | 缓存上限（LRU） | 超出时移除最久未用的 |

```js
export default {
  name: 'Home',   // include 匹配的是这个 name
}
```

```vue
<script setup>
defineOptions({ name: 'Home' })   // Vue 3.3+ 需要在 script setup 中显式声明
</script>
```

## 生命周期变化

| 钩子 | 首次进入 | 再次进入 | 离开 |
| --- | --- | --- | --- |
| `created` | ✅ | ❌ | — |
| `mounted` | ✅ | ❌ | — |
| `activated` | ✅ | ✅ | — |
| `deactivated` | — | — | ✅ |
| `unmounted` | — | — | ❌（在缓存中被保留） |

所以"每次进入都要刷新数据"必须写在 `activated` 里，不能只写在 `mounted`。

## max 与 LRU

```vue
<keep-alive :max="5">
```

超出上限时，移除**最久未被访问**的缓存项，并销毁其组件实例（触发 `unmounted`）。用于防止缓存无限增长导致内存泄漏。

## 手动清理缓存

Vue 3 中没有官方 API，常见做法是通过控制 `include` 列表：

```js
const cached = ref(['Home', 'List'])

function refresh(name) {
  // 暂时移除，下一帧再加回，强制重建
  cached.value = cached.value.filter((n) => n !== name)
  nextTick(() => {
    cached.value = [...cached.value, name]
  })
}
```

```vue
<keep-alive :include="cached">
  <component :is="current" />
</keep-alive>
```

## 常见问题

```vue
<!-- ❌ 与 v-if 混用：v-if 为 false 时仍会卸载 -->
<keep-alive>
  <Comp v-if="show" />
</keep-alive>

<!-- ✅ 用 v-show 或动态组件 -->
<keep-alive>
  <Comp v-show="show" />
</keep-alive>
```

```js
// ❌ 多个根节点时 keep-alive 无法工作
<template>
  <div />
  <div />
</template>

// ✅ 单根
<template>
  <div>
    <div />
  </div>
</template>
```

::: warn 缓存不是万能的
被缓存的组件仍占用内存与响应式依赖。大量页面缓存会拖慢整体性能，`:max` 是必要的兜底。
:::

::: interview 面试视角
能说清"activated 替代 mounted 做数据刷新"、"max 是 LRU 淘汰"、"多根节点会导致缓存失效"，是从"用过"到"理解机制"的差别。
:::
