## Options API 的痛点

```js
export default {
  data() { return { list: [], filter: '', loading: false } },
  computed: { filtered() { /* 用 list 和 filter */ } },
  watch: { filter() { /* 请求 */ } },
  methods: { fetchList() { /* ... */ } },
  mounted() { this.fetchList() }
}
```

问题：**同一个功能被拆散在 5 个选项里**。功能越多，跳转越频繁；复用只能靠 mixin，而 mixin 有致命缺陷：

| mixin 的问题 | 说明 |
| --- | --- |
| 命名冲突 | 多个 mixin 同名属性，后者覆盖前者且无提示 |
| 来源不明 | 模板里用到的变量不知道来自哪个 mixin |
| 隐式依赖 | mixin 之间可能互相依赖，难以拆分 |

## Composition API 的改变

```js
// composables/useList.js
export function useList(fetcher) {
  const list = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function load() {
    loading.value = true
    try { list.value = await fetcher() }
    catch (e) { error.value = e }
    finally { loading.value = false }
  }

  return { list, loading, error, load }
}
```

```vue
<script setup>
const { list, loading, load } = useList(() => api.getUsers())
onMounted(load)
</script>
```

核心收益：

1. **逻辑聚合**：相关代码放在一起，而不是分散在选项里
2. **可组合**：`useXxx` 是普通函数，可嵌套、可参数化
3. **类型友好**：TS 推断更自然（不依赖 this）
4. **无 this**：避免 this 指向问题
5. **tree-shaking 友好**：按需 import

## 代价与成本

| 代价 | 说明 |
| --- | --- |
| 需要理解响应式细节 | ref 的 .value、解构丢响应性 |
| 生命周期需要显式调用 | 不像 Options 那样自动绑定 |
| 代码可能变得"过程式" | 容易写出一大坨 setup |
| 心智模型转变 | 团队需要统一约定 |

## 组织 setup 的实践

```js
// ✅ 按功能拆分 composable，而不是按技术类型
const { list, loading, reload } = useUserList()
const { keyword, filtered } = useSearch(list)
const { sortBy, sorted } = useSort(filtered)

// ❌ 一个巨型 setup，几百行
```

约定：单个 `<script setup>` 控制在 200 行内，超出就拆 composable。

## 什么时候仍用 Options API

- 老项目维护，迁移成本高于收益
- 组件非常简单（只有几个 data + 一个方法）
- 团队对组合式函数的设计能力尚未建立（强行用会写出更差的结构）

混用是允许的：`<script setup>` 与 `export default { }` 可以在同一文件中共存。

## 生命周期对照

| Options | Composition |
| --- | --- |
| `beforeCreate` / `created` | 直接用 setup 顶层代码 |
| `beforeMount` | `onBeforeMount` |
| `mounted` | `onMounted` |
| `beforeUpdate` / `updated` | `onBeforeUpdate` / `onUpdated` |
| `beforeUnmount` / `unmounted` | `onBeforeUnmount` / `onUnmounted` |
| `activated` / `deactivated` | `onActivated` / `onDeactivated` |

::: interview 面试视角
能具体说出"mixin 的命名冲突与来源不明"这两个致命问题，并给出"按功能拆 composable"的实践约定，比空谈"更好的逻辑复用"有说服力。
:::
