## 对照表

| 维度 | ref | reactive |
| --- | --- | --- |
| 支持类型 | 任意（含原始值） | 仅对象（Array/Map/Set/Object） |
| 访问方式 | `.value`（模板自动解包） | 直接访问属性 |
| 解构 | 保持响应性 | **丢失** |
| 整体替换 | 安全（替换 .value） | 断开代理 |
| 深度 | 对象会转 reactive | 默认深 |
| 类型签名 | `Ref<T>` | `T`（返回代理） |

## 为什么 reactive 解构会丢失

```js
const state = reactive({ count: 0 })
const { count } = state
count++   // 改的是普通数字，与代理无关
```

解构拿到的是一次性读取的**值**（对原始类型）或**引用**（对嵌套对象）。前者脱离响应系统，后者在 Vue 3 中仍是代理，所以嵌套解构有时"看起来还能用"，但这不可靠。

```js
// 修复方式
const { count } = toRefs(state)      // 每个字段变成 ref
const count = toRef(state, 'count')  // 单个字段变 ref
```

## reactive 整体替换的坑

```js
let state = reactive({ a: 1 })
state = { a: 2 }    // ❌ 变量指向普通对象，模板仍在监听旧代理

// ✅ 正确做法
state.a = 2
// 或用 ref
const state = ref({ a: 1 })
state.value = { a: 2 }
```

## 选型建议

| 场景 | 推荐 |
| --- | --- |
| 单个原始值（数字、字符串、布尔） | `ref` |
| 需要整体替换的对象 | `ref` |
| 表单对象、多字段组合 | `reactive`（配合 toRefs） |
| 需要传递给组合式函数并保持响应 | `ref` / `toRef` |
| 大数组只需整体替换 | `shallowRef` |

**默认用 ref** 是社区的主流建议：它没有解构陷阱，类型更统一，也不会遇到"整体替换失效"。

## 模板中的自动解包

```vue
<script setup>
const count = ref(0)
const state = reactive({ n: 0 })
</script>

<template>
  {{ count }}        <!-- 自动解包 -->
  {{ state.n }}      <!-- 直接访问 -->
  <input v-model="count" />
</template>
```

但在对象里不会解包：

```js
const obj = { count: ref(0) }
obj.count      // 仍是 Ref 对象
obj.count.value // 0
```

## 性能相关

```js
// 大数组只做整体替换：shallowRef 避免递归代理
const list = shallowRef([])
list.value = newList   // 触发更新

// 第三方实例：markRaw 明确不代理
const chart = markRaw(new Chart(el))
```

`shallowRef` 只监听 `.value` 的替换，不代理内部属性。用于"数据量大但只整体更新"的场景，性能提升明显。

::: warn ref 在解构后仍然响应吗
```js
const count = ref(0)
const { value } = count   // ❌ 拿到的是当前数值
```
ref 本身要保留对象，不能解构 `.value`。
:::

::: interview 面试视角
能说清"reactive 解构丢失是因为拿到的是值"、"整体替换会断开代理"、"shallowRef 用于大数组"，说明你实际写过组合式函数并踩过这些坑。
:::
