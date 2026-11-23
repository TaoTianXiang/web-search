## 本质差异

| | v-if | v-show |
| --- | --- | --- |
| 实现 | 条件渲染：销毁/重建 DOM | `display: none` 切换 |
| 初始渲染 | 条件为假时不渲染 | 总会渲染，只是隐藏 |
| 切换代价 | 高（组件销毁重建、状态丢失） | 低（只改样式） |
| 适合 | 切换不频繁 | 切换频繁 |

```vue
<div v-if="isOpen">内容</div>
<div v-show="isOpen">内容</div>
```

## 容易被忽略的细节

### 1. v-if 会销毁组件状态

```vue
<Child v-if="visible" />
```

`visible` 变为 false 时，Child 被卸载，内部的 `ref`、表单输入、滚动位置全部丢失。再次显示时是一次全新的挂载（会重新执行 `onMounted`、重新发请求）。

### 2. v-show 无法用于 template

```vue
<template v-show="ok">  <!-- ❌ 无效，v-show 需要真实元素 -->
  <div />
</template>
```

`v-if` 可以作用于 `<template>`（渲染 Fragment），`v-show` 不行。

### 3. v-if 与 v-for 的优先级

```vue
<!-- Vue 3：v-if 优先级更高，此时访问不到 item -->
<li v-for="item in list" v-if="item.active">❌

<!-- 正确：用计算属性过滤 -->
<li v-for="item in activeList">
```

Vue 3 中 `v-if` 优先级高于 `v-for`，所以在同一元素上使用会报"item 未定义"。必须用计算属性先过滤。

### 4. 与 keep-alive 的组合

```vue
<keep-alive>
  <Component :is="current" v-if="show" />
</keep-alive>
```

`keep-alive` 缓存的是组件实例，但 `v-if` 为 false 时组件会被卸载（即使有 keep-alive，因为卸载是父级决定的结构变化）。需要保留状态时改用 `v-show` 或动态组件。

### 5. 与过渡动画

```vue
<Transition>
  <div v-if="show">内容</div>
</Transition>
```

`Transition` 需要元素的进入/离开钩子，只能配合 `v-if`（真实创建/销毁）。`v-show` 也支持 `<Transition>`，但走的是 CSS 过渡（display 切换），行为略有差异。

## 选型判断

| 场景 | 选择 |
| --- | --- |
| 弹窗（打开不频繁） | `v-if`（省初始渲染） |
| Tab 切换（高频） | `v-show` 或 `keep-alive` |
| 下拉菜单（高频） | `v-show` |
| 权限控制的整块内容 | `v-if`（有安全意义，不渲染） |
| 需要保留表单输入 | `v-show` 或 `keep-alive` |
| 大数据块、初始不需要 | `v-if` + 懒加载 |

::: warn 权限控制必须用 v-if
```vue
<div v-show="hasPermission">敏感数据</div>
```
v-show 只是隐藏，DOM 与数据仍在页面中，可通过开发者工具看到。权限控制必须用 `v-if`，并且服务端也要校验。
:::

::: interview 面试视角
除了"v-if 销毁重建、v-show 切 display"之外，能补上"v-if 优先级高于 v-for"、"v-show 不能用于 template"、"权限必须用 v-if"，就是完整回答。
:::
