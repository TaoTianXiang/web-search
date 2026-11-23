## 问题：Babel 降级会产生重复代码

```js
// 源码
class A { method() {} }
async function f() { await x }

// Babel 降级后（示意）
function _classCallCheck() { /* 每个文件各有一份 */ }
function _asyncToGenerator() { /* 每个文件各有一份 */ }
```

每个使用 class / async 的文件都会内联一份 helper，打包后大量重复。

## babel-runtime 的解决

把 helper 抽到运行时库，按需 import：

```js
import _asyncToGenerator from '@babel/runtime/helpers/asyncToGenerator'
import _classCallCheck from '@babel/runtime/helpers/classCallCheck'
```

配合 `@babel/plugin-transform-runtime`：

```js
// babel.config.js
module.exports = {
  plugins: [
    ['@babel/plugin-transform-runtime', {
      helpers: true,        // 抽出 helper
      regenerator: true,    // 抽出 regenerator
      corejs: 3             // 可选：按需引入 polyfill
    }]
  ]
}
```

## 四个概念的关系

| 名称 | 作用 |
| --- | --- |
| `@babel/preset-env` | 语法降级（按 targets） |
| `core-js` | polyfill 实现（Promise、Array.prototype.includes 等） |
| `@babel/runtime` | helper 与 polyfill 的**运行时容器** |
| `@babel/plugin-transform-runtime` | 把 helper/polyfill 的引入**重写**为从 runtime 引入 |

## polyfill 的两种引入方式

### 全局引入（babel-polyfill / core-js 全量）

```js
// 优点：简单
// 缺点：污染全局、体积大（即使没用到也全量引入）
import 'core-js/stable'
import 'regenerator-runtime/runtime'
```

### 按需引入（transform-runtime + corejs）

```js
['@babel/plugin-transform-runtime', { corejs: 3 }]
```

```js
// 产物：只引入用到的 polyfill，且不污染全局
import _Promise from '@babel/runtime-corejs3/core-js-stable/promise'
```

## 关键取舍：是否污染全局

```js
// 全局 polyfill
Array.prototype.includes = function () {}
// 所有代码（包括第三方库）都能用，但会污染全局

// runtime 的 corejs
const _includes = require('@babel/runtime-corejs3/core-js-stable/instance/includes')
_includes(arr, x)
// 不污染全局，但只能在该文件的转译产物中使用
```

| 场景 | 选择 |
| --- | --- |
| 应用（自己控制全部代码） | 全局 polyfill（`useBuiltIns: 'usage'`） |
| 库 / SDK（不能污染宿主） | transform-runtime + corejs |
| 现代浏览器为主 | 少用或不用 polyfill |

```js
// 应用的推荐配置
module.exports = {
  presets: [
    ['@babel/preset-env', {
      useBuiltIns: 'usage',   // 按实际使用注入 polyfill
      corejs: 3
    }]
  ]
}
```

## 现代构建下的变化

使用 esbuild / SWC 时，helper 与 polyfill 的处理方式不同：

| 工具 | helper | polyfill |
| --- | --- | --- |
| Babel | transform-runtime | core-js |
| esbuild | 自动内联（体积可接受） | **不做**（需手动） |
| SWC | 自动 | 需配合 core-js |

所以用 Vite（esbuild）时，若需支持老浏览器，仍要显式处理 polyfill。

## 体积影响实例

```
100 个文件使用 async/await：
  不用 runtime：每文件 ~500B helper → 50KB 重复
  用 runtime：单份 helper + 100 个引用 → 约 2KB
```

## 常见误区

```js
// ❌ 在库中用全局 polyfill，污染宿主环境
import 'core-js/stable'

// ✅ 库应使用 runtime
['@babel/plugin-transform-runtime', { corejs: 3 }]
```

```js
// ❌ 同时用 preset-env 的 useBuiltIns 与 transform-runtime 的 corejs
// 会导致同一 polyfill 被引入两次
```

::: interview 面试视角
能说清"helper 重复"这个问题，以及"应用用全局 polyfill、库用 runtime"的取舍，就超过了"配置某个插件"的层次。
:::
