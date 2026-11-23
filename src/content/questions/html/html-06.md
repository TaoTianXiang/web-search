## 核心对比

| 维度 | Web Worker | Service Worker |
| --- | --- | --- |
| 定位 | 后台线程执行计算 | 网络代理 + 离线缓存 |
| 生命周期 | 与创建它的文档绑定 | **独立于页面**，事件驱动，可被唤醒 |
| 能否访问 DOM | ❌ | ❌ |
| 能否拦截网络请求 | ❌ | ✅（`fetch` 事件） |
| 作用范围 | 单个文档 | 整个源 + 作用域路径 |
| 能否跨标签共享 | ❌（Dedicated） | ✅（同源所有页面共用） |
| 是否需要 HTTPS | ❌ | ✅（本地 localhost 例外） |
| 典型场景 | 大数据计算、图像处理 | PWA、离线、缓存策略、推送 |

## Web Worker

```js
// main.js
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })

worker.postMessage({ cmd: 'sort', data: bigArray })
worker.onmessage = (e) => console.log('result', e.data)

// worker.js
self.onmessage = (e) => {
  const { cmd, data } = e.data
  const result = heavyCompute(data)
  self.postMessage(result)
}
```

限制：

- 不能访问 `window`、`document`、`localStorage`
- 可用：`fetch`、`IndexedDB`、`WebSocket`、`OffscreenCanvas`、`crypto`
- 数据通过结构化克隆传递（对象被复制，不是共享）

```js
// 大数据的零拷贝：Transferable
const buffer = new ArrayBuffer(1024 * 1024)
worker.postMessage(buffer, [buffer])   // 转移所有权，主线程不再可用
```

### SharedArrayBuffer + Atomics

需要真正共享内存时（多线程协同）：

```js
const sab = new SharedArrayBuffer(1024)
const view = new Int32Array(sab)
Atomics.add(view, 0, 1)
```

需要 COOP/COEP 响应头才能启用（安全限制）。

## Service Worker

```js
// 注册
navigator.serviceWorker.register('/sw.js', { scope: '/' })

// sw.js
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('v1').then((c) => c.addAll(['/index.html', '/app.js'])))
})

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  )
})
```

核心能力：

1. **拦截请求**：可自定义缓存策略（cache-first / network-first / stale-while-revalidate）
2. **离线可用**：配合 Cache Storage
3. **后台同步**：`sync` 事件（网络恢复后重试）
4. **推送通知**：`push` 事件

### 缓存策略示例

```js
// stale-while-revalidate
self.addEventListener('fetch', (e) => {
  if (!e.request.url.includes('/api/')) return
  e.respondWith(
    caches.open('api').then(async (cache) => {
      const cached = await cache.match(e.request)
      const network = fetch(e.request).then((res) => {
        cache.put(e.request, res.clone())
        return res
      })
      return cached || network
    })
  )
})
```

::: warn SW 的更新陷阱
Service Worker 文件本身会被浏览器缓存最长 24 小时。更新时：

1. 用户访问 → 旧 SW 仍在控制页面
2. 新 SW 在后台安装，进入 waiting
3. **必须关闭所有标签页**（或调用 `skipWaiting`）才激活

常见做法是提示用户"有新版本，点击刷新"。
:::

## Shared Worker

```js
const sw = new SharedWorker('shared.js')
sw.port.start()
sw.port.postMessage('hello')
```

同一源的多个标签页共享一个 Worker 实例，适合：

- 跨标签页共享 WebSocket 连接
- 共享状态同步（比 BroadcastChannel 更灵活）

但兼容性一般（Safari 支持较晚），跨标签通信更常用 `BroadcastChannel`。

## 选型对照

| 需求 | 选择 |
| --- | --- |
| 大数组排序 / 图像处理 | Web Worker |
| 离线访问 / PWA | Service Worker |
| 跨标签共享连接 | Shared Worker 或 BroadcastChannel |
| 主线程长任务拆分 | Web Worker（或 `scheduler.yield`） |
| 缓存静态资源 | Service Worker（或 HTTP 缓存） |

::: tip 不要滥用 Worker
Worker 的启动与消息传递有成本（约几毫秒）。只有计算超过 ~50ms 时才值得拆到 Worker，否则直接在主线程分片更快。
:::

::: interview 面试视角
能说清"Service Worker 独立于页面生命周期、可被唤醒，而 Web Worker 随文档销毁"，以及"SW 文件本身有 24 小时缓存"这个更新陷阱，说明你真正部署过 PWA。
:::
