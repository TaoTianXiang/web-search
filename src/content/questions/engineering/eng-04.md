## 开发态的本质差异

| 维度 | Webpack | Vite |
| --- | --- | --- |
| 启动 | **先打包全部模块**再起服务 | 不打包，浏览器按 ESM 按需请求 |
| 启动时间 | 与模块数线性相关 | 与模块数几乎无关 |
| 依赖处理 | 一起打包 | esbuild 预构建成少量 chunk |
| 热更新 | 基于模块图 | 基于 ESM，边界更精确 |
| 转换 | loader 链 | 插件（Rollup 兼容） |

```js
// Webpack：启动时
entry → 递归解析全部依赖 → 生成 bundle → 启动 dev server
// 1000 个模块 → 需要几十秒

// Vite：启动时
启动 dev server → 浏览器请求 /src/main.ts
→ 服务端只转换这一个文件 → 返回 ESM
// 1000 个模块 → 仍然只要 1 秒
```

## Vite 快的三个原因

### 1. 基于原生 ESM 的按需编译

```js
// 浏览器直接执行 ESM
import { createApp } from '/node_modules/.vite/deps/vue.js'
import App from '/src/App.vue'
```

只有被请求的模块才会被转换。

### 2. esbuild 预构建依赖

```js
// vite.config.js
optimizeDeps: {
  include: ['lodash-es', 'dayjs']
}
```

把上百个小文件（如 lodash-es）合并成少量 ESM chunk，减少浏览器请求数。用 Go 写的 esbuild 处理，比 JS 快 10–100 倍。

### 3. 按需编译 + 缓存

```
请求 /src/components/Heavy.vue
  ├─ 命中缓存（node_modules/.vite）→ 直接返回
  └─ 未命中 → esbuild 转换单个文件 → 缓存 → 返回
```

## 生产构建

| 工具 | 生产打包器 |
| --- | --- |
| Webpack | Webpack |
| Vite | **Rollup** |

Vite 选择 Rollup 的原因：产物质量更好（Tree Shaking 更彻底）、插件生态成熟、输出更可预测。

```bash
vite build   # 用 Rollup 打包
```

## esbuild 快的代价

esbuild **不做类型检查**（只剥离类型），所以：

```json
{
  "scripts": {
    "build": "vue-tsc --noEmit && vite build",
    "typecheck": "vue-tsc --noEmit --watch"
  }
}
```

类型检查必须单独跑，通常放在 CI 或 build 阶段。

## 迁移注意事项

| 问题 | 处理 |
| --- | --- |
| `require` / `module.exports` | 改为 ESM |
| `process.env.XXX` | 改为 `import.meta.env.XXX` |
| 静态资源引用 | 用 `new URL('./a.png', import.meta.url)` |
| 依赖 CommonJS 的库 | 用 `optimizeDeps.include` 预构建 |
| 自定义 loader | 找对应 Vite 插件 |
| 多入口 | `build.rollupOptions.input` |
| 传统浏览器 | `@vitejs/plugin-legacy` |

```js
// 环境变量前缀变了
// Webpack
if (process.env.NODE_ENV === 'development') {}
// Vite
if (import.meta.env.DEV) {}
if (import.meta.env.VITE_API_BASE) {}
```

## 何时仍选 Webpack

| 场景 | 原因 |
| --- | --- |
| 深度依赖老 loader 生态 | Vite 插件覆盖不足 |
| 需要 Module Federation | Vite 支持但生态弱 |
| 极复杂的自定义构建 | Webpack 钩子更灵活 |
| 团队已有成熟 Webpack 配置 | 迁移成本高于收益 |

::: warn 迁移后的隐性问题
1. **CSS 顺序**：Vite 的 CSS 注入顺序可能与 Webpack 不同，导致覆盖失效
2. **动态 import 路径**：Webpack 的 `require.context` 没有直接等价物
3. **SVG 处理**：默认行为不同，需显式配置

上线前要在真实页面做视觉回归，不能只看构建通过。
:::

::: interview 面试视角
"Vite 快是因为不打包"只是表层。能说清"开发态 esbuild + 按需、生产态 Rollup"这个双引擎设计，以及它带来的生态兼容成本，才是完整回答。
:::
