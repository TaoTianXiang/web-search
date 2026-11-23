## 三个层次的拆分

| 层次 | 手段 |
| --- | --- |
| 路由级 | 路由懒加载 |
| 组件级 | 大组件动态 import |
| 依赖级 | vendor 拆分、手动 chunk |

## 路由级

```js
const routes = [
  { path: '/', component: () => import('@/views/Home.vue') },
  { path: '/admin', component: () => import('@/views/Admin.vue') }
]
```

每个 `import()` 生成独立 chunk，首屏只加载当前路由。

## 组件级

```jsx
// React
const Chart = lazy(() => import('./Chart'))

<Suspense fallback={<Skeleton />}>
  <Chart />
</Suspense>
```

```vue
<!-- Vue：defineAsyncComponent -->
<script setup>
const Chart = defineAsyncComponent(() => import('./Chart.vue'))
</script>
```

适合：图表库、富文本编辑器、地图、大型模态框。

## 依赖级：分包策略

```js
// webpack
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

核心原则：**按变更频率拆分**。

```
react.js       ← 几乎不变，长效缓存
vendor.js      ← 依赖升级才变
app.js         ← 每次发版都变
```

这样发版时用户只需重新下载 app.js。

## 预加载与预取

```js
// 用户 hover 时预取下一个路由
<RouterLink to="/admin" @mouseenter="prefetchAdmin">

const prefetchAdmin = () => import('@/views/Admin.vue')
```

```html
<!-- 浏览器空闲时预取 -->
<link rel="prefetch" href="/next-chunk.js">
```

`prefetch` 优先级很低，不会影响当前页面，但能在用户点击时命中缓存。

## 懒加载的体验问题

```js
// ❌ 点击后才开始加载 → 白屏等待
<button @click="loadEditor">编辑</button>

// ✅ hover 时就开始加载
<button @mouseenter="preloadEditor" @click="openEditor">编辑</button>
```

三种缓解：

1. **预加载**：hover / 空闲时提前拉取
2. **骨架屏**：加载中显示占位
3. **按需 + 渐进**：先渲染静态部分，异步加载增强

## 分包的反模式

| 反模式 | 问题 |
| --- | --- |
| 一切都懒加载 | 首屏需要多个串行请求（瀑布） |
| 只拆一个巨大的 vendor | 缓存粒度太粗，改一个库全部失效 |
| 过度拆分（几百个 chunk） | 请求数过多，HTTP/2 也受不了 |
| 用 index 命名 chunk | 内容变化但文件名不变，缓存失效 |

## 分析产物

```bash
npx vite build
npx rollup-plugin-visualizer   # 或 webpack-bundle-analyzer
```

关注三件事：

1. 首屏 chunk 是否包含非首屏代码
2. 是否有意外的大依赖
3. 是否有重复依赖（同一库的多个版本）

::: warn 代码分割不是免费的
每个 chunk 都有独立的请求与解析成本。拆得过细会让首屏发起十几个并行请求，反而更慢。经验：首屏 chunk 控制在 3–5 个以内。
:::

::: interview 面试视角
能说清"按变更频率分包而非按体积分包"、"懒加载要配合预加载避免白屏"，说明你处理过真实的加载体验问题。
:::
