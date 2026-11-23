## 构建流程

```
1. 初始化：读取配置，创建 Compiler，注册 plugin
2. 编译：从 entry 出发递归解析依赖
   ├─ 解析（resolve）：找到文件路径
   ├─ 加载（load）：用 loader 把文件转成 JS 模块
   └─ 转换（transform）：AST 分析，提取依赖
3. 生成 chunk：按 splitChunks 规则分组
4. 输出 assets：执行 plugin 的 emit 钩子，写文件
5. 完成：触发 done 钩子
```

对应生命周期钩子：

| 钩子 | 时机 |
| --- | --- |
| `beforeRun` / `run` | 开始构建前 |
| `compilation` | 创建一次编译 |
| `make` | 开始递归解析依赖 |
| `buildModule` | 单个模块开始构建 |
| `seal` | 依赖图完成，开始生成 chunk |
| `emit` | 输出文件前 |
| `done` | 完成 |

## loader vs plugin

| 维度 | loader | plugin |
| --- | --- | --- |
| 作用对象 | **单个文件** | 整个构建流程 |
| 执行方式 | 转换源码（字符串 → 字符串） | 监听钩子，做任意事 |
| 执行顺序 | 从右到左，从下到上 | 按注册顺序 |
| 典型用途 | 编译 TS/JSX、处理 CSS、加载图片 | 生成 HTML、压缩、复制文件、定义全局变量 |

```js
module.exports = {
  module: {
    rules: [
      // 从右往左：先 css-loader 再 style-loader
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.tsx?$/, use: 'esbuild-loader' }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new DefinePlugin({ __DEV__: false })
  ]
}
```

## 手写一个 loader

loader 本质是一个函数，接收源码字符串，返回新字符串：

```js
// my-loader.js
module.exports = function (source) {
  const options = this.getOptions()   // 配置项
  return source.replace(/console\.log\([^)]*\);?/g, '')
}
```

```js
// 使用
{ test: /\.js$/, use: [{ loader: './my-loader', options: { keep: false } }] }
```

异步 loader：

```js
module.exports = function (source) {
  const callback = this.async()
  doAsyncTransform(source).then((result) => callback(null, result))
}
```

关键点：loader 应保持**纯函数**（同样输入 → 同样输出），否则缓存会失效。

## 手写一个 plugin

```js
class MyPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      const files = Object.keys(compilation.assets)
      const manifest = JSON.stringify({ files })
      compilation.assets['manifest.json'] = {
        source: () => manifest,
        size: () => manifest.length
      }
      callback()
    })
  }
}
```

plugin 的核心是 **tapable** 提供的钩子系统。

## loader 顺序的实际影响

```js
// ❌ 顺序反了：style-loader 收到的是未处理的 CSS 文本
{ test: /\.css$/, use: ['css-loader', 'style-loader'] }

// ✅
{ test: /\.css$/, use: ['style-loader', 'css-loader'] }
```

调用链：`style-loader(css-loader(source))`。

## 常见 loader 清单

| loader | 作用 |
| --- | --- |
| `babel-loader` | ES 语法降级 |
| `esbuild-loader` / `swc-loader` | 高速转译（不做类型检查） |
| `ts-loader` | TypeScript + 类型检查 |
| `css-loader` | 解析 CSS 的 @import / url() |
| `postcss-loader` | 自动前缀、现代语法降级 |
| `sass-loader` | Sass 编译 |
| `asset/resource`（内置） | 图片/字体输出 |

## 常见 plugin 清单

| plugin | 作用 |
| --- | --- |
| `HtmlWebpackPlugin` | 生成 HTML 并注入资源 |
| `MiniCssExtractPlugin` | 抽出独立的 CSS 文件 |
| `DefinePlugin` | 定义编译期常量 |
| `CopyWebpackPlugin` | 复制静态文件 |
| `BundleAnalyzerPlugin` | 体积分析 |
| `compression-webpack-plugin` | 生成 gzip/brotli 文件 |

::: interview 面试视角
"loader 处理文件、plugin 处理流程"只是表层。能说清"从右到左执行"、"loader 应是纯函数否则缓存失效"、"plugin 基于 tapable 钩子"，说明你写过或改过构建配置。
:::
