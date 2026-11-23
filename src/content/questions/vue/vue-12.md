## 方式总览

| 方式 | 方向 | 适用层级 |
| --- | --- | --- |
| props / emit | 父 ↔ 子 | 直接父子 |
| `v-model` | 双向 | 父子双向绑定 |
| `defineExpose` + `ref` | 父 → 子（调用方法） | 父主动调用子 |
| provide / inject | 祖先 → 后代 | 跨多层 |
| `$attrs` / `v-bind="$attrs"` | 透传 | 包装组件 |
| 事件总线（mitt） | 任意 | 跨组件解耦 |
| Pinia / Vuex | 任意 | 全局共享 |
| `useXxx` composable（模块级 ref） | 任意 | 轻量共享 |

## 父子：props / emit

```vue
<!-- Parent -->
<Child :user="user" @update="onUpdate" />

<!-- Child -->
<script setup>
const props = defineProps({ user: Object })
const emit = defineEmits(['update'])
emit('update', { ...props.user, name: 'x' })   // 不要直接改 props
</script>
```

## 父调用子：defineExpose

```vue
<!-- Child -->
<script setup>
function focus() { input.value.focus() }
defineExpose({ focus })
</script>
```

```vue
<!-- Parent -->
<Child ref="childRef" />
```

```js
childRef.value?.focus()
```

`<script setup>` 中所有内容默认**封闭**，必须显式 `defineExpose` 才能被父组件访问。

## 跨层：provide / inject

```js
// 祖先
import { provide, ref } from 'vue'
const theme = ref('light')
provide('theme', theme)

// 后代（任意深度）
const theme = inject('theme', ref('light'))   // 第二个参数是默认值
```

用 Symbol 作为 key 避免命名冲突：

```js
export const themeKey = Symbol('theme')
provide(themeKey, theme)
inject(themeKey)
```

### 让 inject 方能够修改

```js
// 祖先：同时提供数据与修改方法
provide('theme', {
  theme: readonly(theme),        // 防止后代直接改
  setTheme: (v) => { theme.value = v }
})
```

## provide/inject vs 全局状态

| 维度 | provide/inject | Pinia |
| --- | --- | --- |
| 作用域 | 组件树（可隔离多个实例） | 应用级全局 |
| 调试 | 较难追踪来源 | DevTools 可见 |
| 适合 | 组件库、主题、表单上下文 | 业务全局状态 |

`provide/inject` 的核心价值是**作用域隔离**：同一个组件库可以在页面不同区域提供不同的配置，而全局 store 无法做到。

```vue
<FormProvider :rules="rulesA"><Form /></FormProvider>
<FormProvider :rules="rulesB"><Form /></FormProvider>
```

## 事件总线

```js
// bus.js
import mitt from 'mitt'
export const bus = mitt()

// 发送
bus.emit('user:logout')

// 接收
onMounted(() => bus.on('user:logout', handler))
onBeforeUnmount(() => bus.off('user:logout', handler))
```

Vue 3 移除了 `$on` / `$emit` / `$off` 实例方法，需要引入 mitt 等库。

::: warn 事件总线必须解绑
忘记 `off` 会导致组件卸载后仍被 bus 引用，是典型的内存泄漏来源。
:::

## 轻量共享：模块级 ref

```js
// stores/useTheme.js
const theme = ref('light')   // 模块级：全局单例

export function useTheme() {
  return { theme, toggle: () => (theme.value = theme.value === 'light' ? 'dark' : 'light') }
}
```

这本质上是"一个只包含一个状态的 Pinia"，适合极轻量的场景，不需要引入额外库。

::: interview 面试视角
不要只背方法名。能说出"provide/inject 的价值是作用域隔离（多实例组件库）"、"script setup 默认封闭需 defineExpose"、"事件总线必须解绑"，说明你设计过组件接口。
:::
