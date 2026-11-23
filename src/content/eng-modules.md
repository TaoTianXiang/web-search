模块化与运行时是"看起来低级、实际最容易出错"的一块。这一章把 ESM/CJS、polyfill、包管理、代码结构这四件事讲清。

## 一、ESM 与 CommonJS

| 维度 | ESM | CommonJS |
| --- | --- | --- |
| 语法 | `import` / `export` | `require` / `module.exports` |
| 加载时机 | **静态解析**，编译时确定 | 运行时执行 |
| 绑定 | **实时绑定**（live binding） | 值拷贝 |
| 顶层 await | 支持 | 不支持 |
| Tree Shaking | 支持 | 不支持 |
| `this` | `undefined` | `module.exports` |

### 实时绑定 vs 值拷贝

```js
// counter.mjs
export let count = 0
export function inc() { count++ }

// main.mjs
import { count, inc } from './counter.mjs'
console.log(count) // 0
inc()
console.log(count) // 1 —— 实时反映
```

```js
// counter.cjs
let count = 0
module.exports = { count, inc: () => count++ }

// main.cjs
const { count, inc } = require('./counter')
inc()
console.log(count) // 0 —— 拿到的是拷贝
```

### 为什么 Tree Shaking 依赖 ESM

1. `import` 必须写在顶层、路径是字符串字面量 → 静态可分析
2. 导出是命名的 → 可判断"是否被使用"
3. CJS 的 `module.exports = ...` 是动态赋值 → 无法静态判定

但 ESM 也不保证一定被摇掉：

```js
// 顶层副作用会让整个模块被保留
console.log('side effect')
export const a = 1

// 动态属性访问也无法裁剪
import * as m from './m.js'
m[key]
```

### 双包问题

同一个包同时提供 ESM 与 CJS 入口，若两类消费者混用，会得到**两份不同的模块实例**，导致单例失效、`instanceof` 失败。

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

## 二、babel-runtime 与 polyfill

### 问题：降级产生重复代码

```js
// 每个使用 async 的文件都会内联一份辅助函数
function _asyncToGenerator() { /* ... */ }
```

100 个文件 → 100 份重复。

### 解决：抽到运行时库

```js
import _asyncToGenerator from '@babel/runtime/helpers/asyncToGenerator'
```

```js
// babel.config.js
module.exports = {
  plugins: [
    ['@babel/plugin-transform-runtime', {
      helpers: true,
      regenerator: true,
      corejs: 3
    }]
  ]
}
```

### 四个概念分工

| 名称 | 作用 |
| --- | --- |
| `@babel/preset-env` | 语法降级（按 targets） |
| `core-js` | polyfill 实现（Promise、includes 等） |
| `@babel/runtime` | helper 与 polyfill 的运行时容器 |
| `transform-runtime` | 把引入重写为从 runtime 引入 |

### polyfill 的两种方式

**全局引入**（应用首选）：

```js
['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }]
```

按实际使用注入，会**污染全局**（修改 `Array.prototype`）。

**runtime 引入**（库/SDK 必须）：

```js
['@babel/plugin-transform-runtime', { corejs: 3 }]
```

不污染全局，但只能在该文件的转译产物中使用。

| 场景 | 选择 |
| --- | --- |
| 应用（自己控制全部代码） | 全局 polyfill |
| 库 / SDK（不能污染宿主） | transform-runtime + corejs |
| 只支持现代浏览器 | 尽量不用 |

::: warn 不要同时用两种
`preset-env` 的 `useBuiltIns` 与 `transform-runtime` 的 `corejs` 同时开启，会导致同一 polyfill 被引入两次。
:::

### 现代构建的差异

| 工具 | helper | polyfill |
| --- | --- | --- |
| Babel | transform-runtime | core-js |
| esbuild | 自动内联 | **不做**（需手动） |
| SWC | 自动 | 需配合 core-js |

用 Vite（esbuild）时若需兼容老浏览器，仍需显式处理 polyfill。

## 三、减少 if-else

### 先分类

| 类型 | 处理 |
| --- | --- |
| **必要分支**（真实业务规则） | 保留，但结构化 |
| **可消除分支**（重复判断、可数据化） | 重构 |

### 四种手法

**1. 卫语句（几乎零成本，优先做）**

```js
// ❌ 嵌套
function process(user) {
  if (user) {
    if (user.active) {
      return user.role === 'admin' ? doAdmin() : doUser()
    } else throw new Error('inactive')
  } else throw new Error('no user')
}

// ✅
function process(user) {
  if (!user) throw new Error('no user')
  if (!user.active) throw new Error('inactive')
  return user.role === 'admin' ? doAdmin() : doUser()
}
```

**2. 策略表（数据化）**

```js
const PRICE = { normal: 10, vip: 8, svip: 6 }

function getPrice(type, qty) {
  const unit = PRICE[type]
  if (unit === undefined) throw new Error(`unknown type: ${type}`)
  return qty * unit
}
```

**3. 策略对象（行为化）**

```js
const formatters = {
  date: formatDate,
  money: formatMoney,
  percent: formatPercent
}

function format(value, type) {
  const fn = formatters[type]
  if (!fn) throw new Error(`unknown formatter: ${type}`)
  return fn(value)
}
```

**4. 多态**

```js
class Circle { area() { return Math.PI * this.r ** 2 } }
class Rect { area() { return this.w * this.h } }
```

### 判断要不要重构

问三个问题：

1. 新增一个分支需要改几处？（> 1 处就该数据化）
2. 这段逻辑能否独立单测？
3. 新人能否在 30 秒内看懂？

::: warn 过度重构
```js
// 为了消除 if 引入 5 层抽象，可读性反而更差
```
策略表要处理"未知键"（显式抛错），否则从"分支错误"变成"静默 undefined"。
:::

## 四、pnpm 的链接结构

```
全局存储（~/.pnpm-store）
  └── 按内容哈希存放（只存一份）

项目 node_modules
  ├── .pnpm/                         ← 真实文件（硬链接到全局存储）
  │   └── react@18.3.1/node_modules/react
  └── react                          ← 符号链接 → .pnpm/...
```

### 三个优势

| 优势 | 说明 |
| --- | --- |
| 磁盘节省 | 同一版本全局只存一份 |
| **严格依赖** | 未声明的依赖无法 import（消除幽灵依赖） |
| 安装快 | 硬链接几乎零成本 |

### 幽灵依赖的真实危害

```js
// 代码 import 了 A，但 A 只是 B 的依赖（B 才是你声明的）
import { helper } from 'A'

// B 升级后不再依赖 A → 代码突然报错
```

pnpm 让这个问题在**开发时就暴露**。

### 迁移成本

| 问题 | 处理 |
| --- | --- |
| 幽灵依赖报错 | 补全 `package.json` |
| 老包假设"提升结构" | `public-hoist-pattern` 白名单 |
| CI 脚本用 npm | 改为 `pnpm i --frozen-lockfile` |

## 五、包管理选型

| 维度 | npm | yarn classic | pnpm |
| --- | --- | --- | --- |
| 磁盘 | 每项目一份 | 每项目一份 | 全局共享 |
| 幽灵依赖 | 有 | 有 | 无 |
| 安装速度 | 中 | 中 | 快 |
| Monorepo | workspaces | workspaces | workspace 协议更强 |

## 六、Monorepo 的 workspace 协议

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
{
  "dependencies": {
    "@acme/ui": "workspace:*"
  }
}
```

`workspace:*` 发布时会被替换为实际版本号；本地开发时直接链接到源码，改组件库立刻在所有应用生效。

### CI 优化

```bash
# 只跑受影响的包
turbo run build --filter=...[HEAD^]

# 缓存依赖
# actions/cache 缓存 pnpm store，install 从 2 分钟降到 10 秒
```

::: interview 面试视角
能说清"ESM 是实时绑定、CJS 是值拷贝"、"runtime 解决的是 helper 重复与全局污染"、"pnpm 的严格依赖暴露幽灵依赖"，说明你理解运行时机制而不只是会写 import。
:::