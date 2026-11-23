构建工具是工程化的地基。面试不会考"某个 loader 怎么写"，而是考"你是否理解产物为什么这样、体积为什么这么大"。

## Webpack 的核心模型

Webpack 把一切视为**模块**，通过 loader 转换、plugin 扩展，最终输出 bundle。

```
entry
  │
  ▼ 递归解析 import
依赖图（dependency graph）
  │
  ▼ loader 链转换
chunks（按 splitChunks 规则分组）
  │
  ▼ plugin 钩子介入
assets（js / css / 图片 / html）
```

### 关键概念对照

| 概念 | 作用 |
| --- | --- |
| `entry` | 入口，决定依赖图起点 |
| `output` | 产物路径与命名 |
| `loader` | 单文件转换（从右到左、从下到上） |
| `plugin` | 生命周期钩子，能做任意事 |
| `chunk` | 输出单元 |
| `module` | 源文件在依赖图中的节点 |

```js
module.exports = {
  entry: './src/index.js',
  output: {
    filename: '[name].[contenthash:8].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'esbuild-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [new HtmlWebpackPlugin()]
}
```

::: warn loader 顺序
`use: ['style-loader', 'css-loader']` 是**从后往前**执行：先 `css-loader` 把 CSS 转成 JS 模块，再 `style-loader` 把它注入 `<style>`。写反了会直接报错。
:::

## Vite 的双引擎设计

### 开发态

```
浏览器 ──GET /src/main.js──► 开发服务器
                              │
                              ├─ 命中缓存 → 直接返回转换结果
                              └─ 未命中 → esbuild 转换单个文件 → 返回 ESM
```

不打包业务代码，只做**按需转换**。第三方依赖用 esbuild 预构建（`node_modules/.vite/deps`），把上百个小文件合并成少量 ESM 模块，减少浏览器请求数。

### 生产态

用 **Rollup** 打包，因为 Rollup 的 tree shaking 与产物质量更好，插件生态也更成熟。

| 阶段 | 打包器 | 原因 |
| --- | --- | --- |
| dev | esbuild（单文件转换） | 极快，Go 实现 |
| build | Rollup | 产物优化、插件成熟 |

### 为什么 esbuild 快

- Go 编写，可多线程并行
- 自己实现解析器，不做 TS 类型检查（只剥离类型）
- AST 直接生成产物，无中间表示

但代价是：**不做类型检查**。所以 Vite 开发时不报 TS 类型错误，需要单独的 `vue-tsc --noEmit`。

::: tip 类型检查的位置
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "typecheck": "vue-tsc --noEmit --watch"
  }
}
```
把类型检查放进 build 与 CI，开发态保持快。
:::

## Tree Shaking 的完整条件

1. **ESM 静态语法**：`import`/`export` 可静态分析
2. **无副作用声明**：`package.json` 的 `sideEffects`
3. **生产模式**：压缩器执行 DCE（dead code elimination）
4. **模块不被动态访问**：`mod[key]` 会让整个模块保留

```json
// 库的 package.json
{
  "sideEffects": false
}
```

```json
// 有副作用的（如 polyfill、CSS 导入）
{
  "sideEffects": ["*.css", "./src/polyfill.js"]
}
```

### 五种失效场景

| 写法 | 原因 |
| --- | --- |
| `require()` 动态调用 | CJS 无法静态分析 |
| `import * as _ from 'lodash'` | 命名空间对象无法裁剪 |
| 顶层立即执行代码 | 视为副作用 |
| `export default { a, b }` | default 导出整体不可分解 |
| 类的装饰器 / getter 副作用 | 保守保留 |

```js
// 差：整个 lodash 进入产物
import _ from 'lodash'
_.debounce(fn, 300)

// 好
import debounce from 'lodash-es/debounce'
// 或
import { debounce } from 'lodash-es'
```

## 分包策略

### 三类 chunk

| 类型 | 内容 | 缓存特性 |
| --- | --- | --- |
| vendor | 第三方依赖 | 变化少，缓存命中高 |
| common | 多入口共享的业务代码 | 中等 |
| async | 路由 / 动态 import | 按需加载 |

```js
// Webpack
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      react: {
        test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
        name: 'react',
        priority: 20
      },
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendor',
        priority: 10
      }
    }
  },
  runtimeChunk: 'single'
}
```

`runtimeChunk: 'single'` 把 webpack runtime 单独抽出，避免主 chunk 的 hash 因 runtime 变化而频繁失效。

### 长效缓存的关键

```
文件名 = [name].[contenthash]
```

- 用 `contenthash` 而不是 `chunkhash`（后者受 chunk 内其他模块影响）
- 稳定 `moduleIds`（`optimization.moduleIds: 'deterministic'`）
- runtime 单独抽出

::: warn 常见 hash 抖动
即使代码没变，构建产物 hash 也可能变化，原因：
- 模块 id 基于顺序而非路径
- 注释中的版本号被保留
- 依赖的 `package.json` 字段顺序变化

解法：`deterministic` moduleIds + 固定依赖版本。
:::

## Module Federation

运行时共享模块，让多个独立构建的应用互相引用代码。

```js
// host
new ModuleFederationPlugin({
  name: 'host',
  remotes: { shop: 'shop@https://shop.com/remoteEntry.js' },
  shared: { react: { singleton: true, requiredVersion: '^18.0.0' } }
})

// remote
new ModuleFederationPlugin({
  name: 'shop',
  filename: 'remoteEntry.js',
  exposes: { './Cart': './src/Cart' },
  shared: { react: { singleton: true } }
})
```

### singleton 的意义

`singleton: true` 保证 React 只有一份实例。否则两个版本共存会导致 Hooks 报错（"Invalid hook call"）。

### 常见坑

| 问题 | 原因 |
| --- | --- |
| 样式冲突 | CSS 未做隔离 |
| 版本不匹配 | shared 版本范围过窄 |
| 首次加载慢 | remoteEntry 需要同步下载 |
| 循环依赖 | 双向 remote |

## 构建性能优化

```js
// 1. 缩小 loader 范围
{ test: /\.tsx?$/, include: path.resolve('src'), use: 'esbuild-loader' }

// 2. 持久化缓存（Webpack 5）
cache: { type: 'filesystem', buildDependencies: { config: [__filename] } }

// 3. 并行处理
new TerserPlugin({ parallel: true })

// 4. 减少 resolve 范围
resolve: { extensions: ['.ts', '.tsx', '.js'], modules: ['node_modules'] }
```

Vite 侧的优化：

```js
// 预热高频文件，避免首次访问时的瀑布请求
server: {
  warmup: { clientFiles: ['./src/main.ts', './src/App.vue'] }
},

// 优化依赖预构建
optimizeDeps: {
  include: ['lodash-es', 'dayjs']
}
```

## 产物分析

```bash
# Webpack
npx webpack --profile --json > stats.json
npx webpack-bundle-analyzer stats.json

# Vite / Rollup
npx vite build
npx rollup-plugin-visualizer
```

分析要点：

1. 找**意外的大依赖**（如整个 moment 语言包）
2. 检查**重复依赖**（同一库的多个版本）
3. 看**首屏 chunk 是否包含非首屏代码**
4. 对比版本间的体积变化，建立回归告警

::: interview 面试视角
能说出"用 `contenthash` 而不是 `chunkhash`"、"runtime 要单独抽出"、"esbuild 不做类型检查"这类细节，说明你维护过真实构建配置，而不是只写过 `npm run build`。
:::