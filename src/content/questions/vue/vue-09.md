## Vue 3.5 的主要变化

### 1. 响应式内存占用降低

依赖收集的数据结构重构，不再为每个 effect 维护双向 Set，改用版本计数（`version`）。官方给出的数据：

| 场景 | 优化前 | 3.5 |
| --- | --- | --- |
| 内存占用 | 基线 | 约 -56% |
| 大数组响应式 | 慢 | 显著提升 |

这对"长列表 + 大量 computed"的场景收益明显。

### 2. 响应式属性的解构更强

```js
const { count } = defineProps(['count'])   // 3.5 起响应式解构
watch(() => count, (v) => console.log(v))

const { a, b } = reactive({ a: 1, b: 2 })   // 普通 reactive 解构仍不响应
```

注意：**只有 `defineProps` 的解构**是被编译器特殊处理的，普通 reactive 解构依旧会丢失响应性。

### 3. useTemplateRef

```vue
<script setup>
const inputRef = useTemplateRef('input')
onMounted(() => inputRef.value.focus())
</script>

<template>
  <input ref="input" />
</template>
```

替代了"声明 ref + 同名模板 ref"的重复写法，类型推断更准确。

### 4. useId

```vue
<script setup>
const id = useId()   // 服务端与客户端一致
</script>

<template>
  <label :for="id">名称</label>
  <input :id="id" />
</template>
```

用于 SSR 场景生成稳定的唯一 id，避免 hydration mismatch。

### 5. SSR 能力增强

- `useId` 保证服务端/客户端一致
- 懒 hydration（`defineLazyHydrationComponent` 在 3.6 演进）
- 更好的流式渲染与内存控制

### 6. 自定义元素（Custom Elements）改进

```js
app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('my-')
```

Vue 3.5 对 Web Components 的支持更完整（slots、props 映射、prop 类型推断）。

## Vue 3.4 的关键特性（常与 3.5 一起问）

| 特性 | 作用 |
| --- | --- |
| `defineModel` | 简化 v-model 实现 |
| `v-bind` 同名简写 | `:id` 等价于 `:id="id"` |
| 更快的解析器 | 单文件组件编译速度提升 |
| `props` 解构响应式（3.5 完善） | 不再必须 toRefs |

```vue
<!-- 3.4 同名简写 -->
<List :items :loading />

<!-- 等价于 -->
<List :items="items" :loading="loading" />
```

## Vue 3.6 的方向

- Vapor Mode（无虚拟 DOM 编译模式，类似 Solid 的细粒度更新）
- 更小的运行时体积
- 更强的编译期优化

::: tip 迁移建议
大多数 3.x 特性是渐进的，不需要大改。真正需要关注的是：

1. `defineModel` 与 `useTemplateRef` 可以显著减少样板代码
2. `useId` 在 SSR 项目里能消除一类 hydration 警告
3. 3.5 的响应式内存优化在长列表场景几乎零成本收益
:::

::: warn 面试中的常见误区
不要把"Vue 3.6 Vapor Mode"说成已发布。截至 2026 年初它仍处于 alpha/实验阶段，回答时说清"在实验阶段"更稳妥。
:::

::: interview 面试视角
能说清"3.5 优化的是响应式内存结构（版本计数替代双向 Set）"这一具体机制，而不是笼统说"性能更好"，说明你读过 release notes。
:::
