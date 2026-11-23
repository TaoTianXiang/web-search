## 本质：value + input 的语法糖

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

Vue 2 编译为：

```js
h(MyInput, {
  value: text,
  input: (v) => { text = v }
})
```

| | Vue 2 | Vue 3 |
| --- | --- | --- |
| 默认 prop | `value` | `modelValue` |
| 默认事件 | `input` | `update:modelValue` |
| 自定义名称 | `model: { prop, event }` | `v-model:propName` |
| 多个 v-model | 不支持 | 支持 |

## 原生元素上的 v-model

```vue
<input v-model="text">
```

内部会按元素类型选择正确的 prop 与事件：

| 元素 | prop | 事件 |
| --- | --- | --- |
| text / textarea | `value` | `input` |
| checkbox | `checked` | `change` |
| radio | `checked` | `change` |
| select | `value` | `change` |

还支持修饰符：

```vue
<input v-model.trim="name" />     <!-- 自动 trim -->
<input v-model.number="age" />    <!-- 转数字 -->
<input v-model.lazy="text" />     <!-- 用 change 而非 input -->
```

## 自定义组件实现 v-model

```vue
<!-- MyInput.vue -->
<script setup>
const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])

const onInput = (e) => emit('update:modelValue', e.target.value)
</script>

<template>
  <input :value="modelValue" @input="onInput" />
</template>
```

三个要点：

1. 声明 `modelValue` prop
2. 触发 `update:modelValue` 事件
3. **不要直接修改 prop**（会破坏单向数据流）

## 多个 v-model

```vue
<UserForm v-model:name="name" v-model:age="age" />
```

```vue
<!-- UserForm.vue -->
<script setup>
defineProps({ name: String, age: Number })
const emit = defineEmits(['update:name', 'update:age'])
</script>

<template>
  <input :value="name" @input="emit('update:name', $event.target.value)" />
  <input :value="age" @input="emit('update:age', +$event.target.value)" />
</template>
```

## 常见错误

```vue
<!-- ❌ 直接修改 prop -->
<script setup>
const props = defineProps({ modelValue: String })
props.modelValue = 'x'   // 警告，且可能不生效
</script>

<!-- ✅ 通过事件 -->
emit('update:modelValue', 'x')
```

```vue
<!-- ❌ 忘了声明 emit，事件被当成原生事件处理 -->
<script setup>
defineProps({ modelValue: String })
</script>

<template>
  <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
</template>
```

Vue 3 中 `$emit` 可以直接用，但建议用 `defineEmits` 声明以获得类型校验与更好的提示。

## 与 defineModel（Vue 3.4+）

```vue
<script setup>
const model = defineModel()          // 等价于 modelValue + update:modelValue
const title = defineModel('title')   // 命名 v-model
</script>

<template>
  <input v-model="model" />
</template>
```

`defineModel` 返回的是可读写的 ref，内部会自动同步 prop 与事件，大幅简化样板代码。

::: interview 面试视角
能说清"v-model 是 prop + 事件的语法糖"，并对比 Vue 2/3 的 prop 名与事件名变化，再给出"多个 v-model"的写法，是完整回答。能补上 Vue 3.4 的 defineModel，说明你跟进最新版本。
:::
