## 四维框架

```
加载性能   → 多快能"看到"
渲染性能   → 滚动/动画是否流畅
运行时性能 → 交互是否及时响应
工程化     → 如何持续守住
```

## 一、加载性能（Network + Resource）

**指标**：TTFB、FCP、LCP、资源体积、请求数

| 手段 | 效果 |
| --- | --- |
| CDN + 边缘节点 | 降低 TTFB |
| Brotli / gzip | 减小传输体积 |
| HTTP/2 / HTTP/3 | 减少连接开销 |
| 代码分割 + 懒加载 | 减小首屏包体积 |
| 图片 AVIF/WebP + srcset | 减小图片体积 |
| 字体子集化 + preload | 减少字体阻塞 |
| preconnect / preload / fetchpriority | 提前关键资源 |
| SSR / SSG / 流式渲染 | 更快首屏可见 |

```html
<link rel="preconnect" href="https://api.example.com" crossorigin>
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high">
```

## 二、渲染性能（Layout + Paint + Composite）

**指标**：帧率（FPS）、长任务数、CLS

| 问题 | 手段 |
| --- | --- |
| 重排过多 | 用 `transform` 代替 `left/top` |
| 强制同步布局 | 批量读、批量写 |
| 大面积重绘 | 减少阴影/模糊，提升合成层 |
| 长列表 | 虚拟滚动 |
| 布局偏移 | 媒体设宽高、预留广告位 |
| 首屏外渲染 | `content-visibility: auto` |

```js
// ❌ 读写交替
for (const el of items) {
  const h = el.offsetHeight
  el.style.height = h * 2 + 'px'
}

// ✅ 批量
const heights = items.map((el) => el.offsetHeight)
items.forEach((el, i) => { el.style.height = heights[i] * 2 + 'px' })
```

## 三、运行时性能（Interaction）

**指标**：INP、长任务占比、主线程繁忙度

| 问题 | 手段 |
| --- | --- |
| 长任务阻塞输入 | 拆分任务（`scheduler.yield`） |
| 计算密集 | Web Worker |
| 大列表渲染 | 虚拟列表 |
| 频繁重渲染 | memo / selector 订阅 |
| 帧内多次更新 | 批处理、`startTransition` |
| 事件高频触发 | 节流 + passive |

```js
// 分片处理，每片让出主线程
async function chunked(list, fn, size = 100) {
  for (let i = 0; i < list.length; i += size) {
    list.slice(i, i + size).forEach(fn)
    await scheduler.yield?.() ?? new Promise((r) => setTimeout(r))
  }
}
```

## 四、工程化（可度量、可守住）

| 手段 | 作用 |
| --- | --- |
| RUM 采集（web-vitals） | 真实用户体验 |
| 性能预算（CI） | 防止退步 |
| Bundle 分析 | 定位体积异常 |
| 灰度 + 监控告警 | 快速发现回归 |
| 依赖治理 | 避免重复打包 |

```js
// CI 中的体积预算
const budgets = {
  'dist/js/main.*.js': 200 * 1024,
  'dist/css/*.css': 60 * 1024
}
```

```js
// 埋点：按 p75 分位数告警
if (p75LCP > 2500) alert('LCP regression detected')
```

## 优先级判断

```
先测量 → 找最大短板 → 优化该短板 → 再测量
```

不要全面铺开，因为：

1. 不同页面瓶颈不同（营销页看 LCP，后台看 INP）
2. 优化有成本（开发时间、复杂度）
3. 先做"收益/成本比最高"的那一项

## 常见误区

| 误区 | 纠正 |
| --- | --- |
| 只看 Lighthouse 分数 | 实验室数据与真实体验差异大 |
| 用平均值衡量 | 应看 p75（长尾才是真实痛点） |
| 合并所有资源 | HTTP/2 下破坏缓存粒度 |
| 过早 memo 一切 | 增加复杂度，收益不确定 |
| 优化完不监控 | 下一个版本可能退回去 |

::: interview 面试视角
四维框架 + "先测量后优化 + 用 p75 验证"的方法论，比列举 20 个手段更能体现工程素养。
:::
