## Vue 2 的问题

```js
import Vue from 'vue'   // 引入的是完整运行时
```

Vue 2 的很多能力挂在 `Vue.prototype` 或全局 API 上：

```js
Vue.component()
Vue.directive()
Vue.mixin()
Vue.use()
```

这些是**对构造函数本身的修改**，打包器无法静态判断哪些被使用，只能全量保留。

即便用 `vue.runtime.esm.js`（运行时版）减掉了模板编译器，Vue 2 的核心体积仍是固定的约 20KB+（gzip）。

## Vue 3 的改动

Vue 3 把全局 API 拆成**具名导出**：

```js
import { createApp, ref, computed, watch, h } from 'vue'
```

好处：

1. 每个 API 都是独立的具名导出，未使用的可被摇掉
2. `app.component()` 等改为实例方法，不再污染全局
3. 支持 `<script setup>`，编译器可精确知道用了哪些 API

```js
// 只用到 ref 的场景，computed / watch 不会进入产物
import { ref } from 'vue'
```

## 模板编译器的按需

Vue 3 的模板编译产物只引用了实际用到的辅助函数：

```js
// 模板：<div>{{ msg }}</div>
import { toDisplayString, createElementVNode } from 'vue'
```

没用到的（如 `v-model` 相关的 `vModelText`）不会被打包。

## 组件库的按需引入

### Vue 2 + Element UI

```js
import { Button, Table } from 'element-ui'
Vue.use(Button)
Vue.use(Table)
```

需要 `babel-plugin-component` 配合，把 `import { Button } from 'element-ui'` 转换成按路径引入：

```js
import Button from 'element-ui/lib/button'
import 'element-ui/lib/theme-chalk/button.css'
```

### Vue 3 + Element Plus

```js
// 自动按需（推荐）
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

plugins: [
  AutoImport({ resolvers: [ElementPlusResolver()] }),
  Components({ resolvers: [ElementPlusResolver()] })
]
```

不再需要手动 import，插件会根据模板中出现的组件名自动注入引入语句与样式。

### 手动按需

```js
import { ElButton } from 'element-plus'
import 'element-plus/es/components/button/style/css'
```

明确可控，但样板多。

## 验证是否真的摇掉了

```bash
# 1. 产物分析
npx vite build
npx rollup-plugin-visualizer

# 2. 直接搜索产物
grep -r "vModelText" dist/assets/*.js
```

也可以用 `webpack-bundle-analyzer` 看模块占比。若发现 `vue` 占了全部体积，说明引入方式不对（例如从 `vue/dist/vue.esm-bundler.js` 全量引入）。

## 常见失效原因

| 原因 | 说明 |
| --- | --- |
| 从 `vue/dist/vue.js` 引入 | 完整版含编译器，无法摇 |
| 组件库未提供 ESM 产物 | 只能全量引入 |
| 组件库的 `index.js` 用 `export *` | 打包器难以判断使用情况 |
| 全局注册所有组件 | `app.use(ElementPlus)` 会注册全部 |
| 使用了 `require` 或动态导入 | 无法静态分析 |

::: warn "全量注册"是最常见的体积事故
```js
app.use(ElementPlus)   // 所有组件 + 所有样式
```
一行代码可能带来几百 KB。中后台项目应改用 `unplugin-vue-components` 自动按需。
:::

::: interview 面试视角
能说清"Vue 2 的全局 API 挂在构造函数上所以无法摇"、"Vue 3 改为具名导出"，并用产物分析验证，说明你实际做过体积优化。
:::
