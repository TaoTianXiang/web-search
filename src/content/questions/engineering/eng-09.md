## 四类信号

| 类型 | 内容 |
| --- | --- |
| 错误 | JS 异常、Promise 未捕获、资源加载失败、接口失败 |
| 性能 | Web Vitals、长任务、白屏时间、资源瀑布 |
| 行为 | PV/UV、点击、路由、停留时长 |
| 业务 | 转化漏斗、关键操作成功率 |

## 采集实现

```js
// 1. JS 错误（含跨域脚本）
window.addEventListener('error', (e) => {
  report({
    type: 'js-error',
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    stack: e.error?.stack
  })
})

// 2. Promise 未捕获
window.addEventListener('unhandledrejection', (e) => {
  report({ type: 'unhandled-rejection', reason: String(e.reason) })
})

// 3. 资源加载失败（需捕获阶段）
document.addEventListener('error', (e) => {
  const el = e.target
  if (el && el.tagName) {
    report({ type: 'resource-error', tag: el.tagName, src: el.src || el.href })
  }
}, true)

// 4. 接口失败
const originalFetch = window.fetch
window.fetch = async (...args) => {
  const res = await originalFetch(...args)
  if (!res.ok) report({ type: 'api-error', url: String(args[0]), status: res.status })
  return res
}
```

### 跨域脚本的错误信息

```html
<!-- 跨域脚本的 error 事件只能拿到 "Script error." -->
<script src="https://cdn.b.com/app.js" crossorigin="anonymous"></script>
```

服务端需返回 `Access-Control-Allow-Origin`，否则拿不到堆栈。

### Web Vitals

```js
import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals'

;[onLCP, onINP, onCLS, onTTFB].forEach((fn) =>
  fn((m) => report({ type: 'vital', name: m.name, value: m.value, id: m.id }))
)
```

### 路由与 SPAs

```js
router.afterEach((to) => {
  report({ type: 'pageview', path: to.fullPath, from: previousPath })
})
```

## 上报策略

```js
const buffer = []
let timer = null

function report(event) {
  event.ts = Date.now()
  event.app_version = __APP_VERSION__
  buffer.push(event)

  if (buffer.length >= 10) flush()
  else if (!timer) timer = setTimeout(flush, 3000)
}

function flush() {
  clearTimeout(timer)
  timer = null
  if (!buffer.length) return
  navigator.sendBeacon('/collect', JSON.stringify(buffer.splice(0)))
}

// 页面卸载时兜底
window.addEventListener('pagehide', flush)
```

四个要点：

| 要点 | 原因 |
| --- | --- |
| 批量上报 | 减少请求数 |
| `sendBeacon` | 卸载时仍能可靠发送 |
| 采样 | 性能数据可按比例采样（如 10%） |
| 限流 | 单页面上报上限，避免异常风暴 |

## 去重与聚合

```js
// 错误指纹
function fingerprint(err, version) {
  const firstFrame = err.stack?.split('\\n')[1] || ''
  return hash(`${err.message}|${firstFrame}|${version}`)
}
```

同一个错误只记录一次（附带发生次数），避免刷屏。

## 避免监控影响性能

| 风险 | 对策 |
| --- | --- |
| 同步 XHR | 禁止，用 `sendBeacon` |
| 频繁上报 | 批量 + 采样 |
| 大量 DOM 操作 | 避免在 scroll 中采集 |
| SDK 体积大 | 懒加载、异步初始化 |
| 错误堆栈解析耗时 | 在服务端做 source map 还原 |

```js
// 异步初始化，不阻塞首屏
if (document.readyState === 'complete') init()
else window.addEventListener('load', init)
```

## 闭环：告警与定位

```
采集 → 存储 → 聚合（按版本/路由/设备） → 看板 → 告警 → 定位 → 修复 → 验证
```

关键是**与发布系统联动**：

- 新版本发布后 10 分钟内错误率异常 → 自动告警
- 可一键回滚
- 错误聚合后关联到具体代码行与责任人

## Source Map 管理

```bash
# 构建时上传，不公开暴露
curl -X POST https://monitor.example.com/sourcemap \\
  -F "file=@dist/app.3f2a1b.js.map" \\
  -F "release=$GIT_SHA"
```

::: warn 不要把 source map 放在公网
`//# sourceMappingURL=app.js.map` 指向公网可访问的 map 文件，等于公开源码。应上传到监控平台或加鉴权。
:::

::: interview 面试视角
能说清"跨域脚本需 crossorigin 才能拿到堆栈"、"用 sendBeacon 保证卸载时上报"、"source map 不能公开"，说明你真正搭建过监控而非只写过埋点。
:::
