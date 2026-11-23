线上问题处理是最能体现"工程成熟度"的一块。面试官关心的是：你有没有**可重复的流程**，而不是"我上次改了个 bug"。

## 一、监控的四类信号

| 类型 | 内容 | 采集方式 |
| --- | --- | --- |
| 错误 | JS 异常、未捕获 Promise、资源失败、接口失败 | 事件监听 + 请求拦截 |
| 性能 | Web Vitals、长任务、资源瀑布 | web-vitals + PerformanceObserver |
| 行为 | PV/UV、点击、路由、停留 | 埋点 SDK |
| 业务 | 转化漏斗、关键操作成功率 | 业务埋点 |

## 二、采集的三个关键实现

### 1. 错误捕获

```js
// JS 异常
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

// Promise 未捕获
window.addEventListener('unhandledrejection', (e) => {
  report({ type: 'unhandled-rejection', reason: String(e.reason) })
})

// 资源加载失败（必须用捕获阶段，资源错误不冒泡）
document.addEventListener('error', (e) => {
  const el = e.target
  if (el && el.tagName) {
    report({ type: 'resource-error', tag: el.tagName, src: el.src || el.href })
  }
}, true)
```

::: warn 跨域脚本拿不到堆栈
```html
<!-- 不加 crossorigin 时，error 事件只有 "Script error." -->
<script src="https://cdn.b.com/app.js" crossorigin="anonymous"></script>
```
同时服务端要返回 `Access-Control-Allow-Origin`。
:::

### 2. 接口失败

```js
const originalFetch = window.fetch
window.fetch = async (...args) => {
  const start = performance.now()
  try {
    const res = await originalFetch(...args)
    if (!res.ok) {
      report({ type: 'api-error', url: String(args[0]), status: res.status })
    }
    return res
  } catch (err) {
    report({ type: 'api-network-error', url: String(args[0]), message: String(err) })
    throw err
  } finally {
    report({ type: 'api-timing', url: String(args[0]), duration: performance.now() - start })
  }
}
```

### 3. 性能指标

```js
import { onLCP, onINP, onCLS, onTTFB } from 'web-vitals'

;[onLCP, onINP, onCLS, onTTFB].forEach((fn) =>
  fn((m) => report({
    type: 'vital',
    name: m.name,
    value: m.value,
    id: m.id,
    attribution: m.attribution   // 归因信息
  }))
)
```

## 三、上报策略

```js
const buffer = []
let timer = null

function report(event) {
  event.ts = Date.now()
  event.app_version = __APP_VERSION__
  event.trace_id = getTraceId()
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

window.addEventListener('pagehide', flush)   // 卸载兜底
```

| 策略 | 原因 |
| --- | --- |
| 批量上报 | 减少请求数 |
| `sendBeacon` | 卸载时仍能可靠发送 |
| 采样（性能 10%） | 控制数据量 |
| 单页面上限 | 避免异常风暴压垮服务 |
| 附带版本号 | 判断是否新引入 |

### 去重

```js
function fingerprint(err, version) {
  const firstFrame = err.stack?.split('\\n')[1] || ''
  return hash(`${err.message}|${firstFrame}|${version}`)
}
```

同一错误只记录一次（附带发生次数与影响用户数），避免刷屏。

## 四、Source Map 管理

```bash
# 构建时上传到监控平台，不公开暴露
curl -X POST https://monitor.example.com/sourcemap \\
  -F "file=@dist/app.3f2a1b.js.map" \\
  -F "release=$GIT_SHA"
```

::: warn 不要把 map 放在公网
```js
//# sourceMappingURL=app.js.map
```
若该文件可公网访问，等于公开源码。应上传到监控平台或加鉴权。
:::

## 五、用户反馈的标准化流程

```
接收 → 分级 → 复现 → 定位 → 修复 → 验证 → 复盘
```

### 1. 接收：结构化信息

```js
// SDK 自动附加
{
  user_id: 'u_123',
  app_version: '2.4.1',
  route: '/orders/987',
  ua: navigator.userAgent,
  screen: `${screen.width}x${screen.height}`,
  dpr: devicePixelRatio,
  network: navigator.connection?.effectiveType,
  timestamp: Date.now(),
  trace_id: getTraceId()   // 与后端日志关联
}
```

没有版本号，就无法判断"是否新引入"。

### 2. 分级

| 级别 | 标准 | 响应 |
| --- | --- | --- |
| P0 | 大面积不可用（白屏、无法登录） | 立即回滚 / 热修 |
| P1 | 核心功能受阻 | 当日修复 |
| P2 | 部分用户异常、有绕过方案 | 本周修复 |
| P3 | 体验问题、文案错误 | 排期 |

分级依据必须**可量化**：影响用户数、错误率、是否阻塞核心流程。

::: warn 只统计次数会误判优先级
```
一个用户刷新 100 次 → 错误次数 100
1000 个用户各遇到 1 次 → 错误次数 1000
```
必须同时看**影响用户数**，否则会优先处理"少数人的高频问题"而忽略"大面积问题"。
:::

### 3. 复现的三个层次

| 方式 | 说明 |
| --- | --- |
| 本地复现 | 用反馈中的版本、路由、设备信息 |
| 日志复现 | 查监控平台的堆栈与用户操作序列 |
| 录屏回放 | rrweb 等工具还原操作路径 |

```js
import { record } from 'rrweb'
record({
  emit(event) { buffer.push(event) },
  sampling: { mousemove: 50 }
})
```

::: warn 录屏涉及隐私
必须脱敏：屏蔽输入框内容、隐藏敏感区域（`rr-block` class）、告知用户并取得同意。
:::

### 4. 定位：从外到内

```
只影响特定版本？   → 对比上一版本
只影响特定设备？   → UA 分组
只影响特定路由？   → 代码分割边界
是接口问题？       → 网络 + 后端日志
是数据问题？       → 看用户的具体数据
```

### 5. 修复后必须验证三件事

1. **问题消失**（用同样条件复现）
2. **没有引入新问题**（回归测试）
3. **同类问题已排查**（是否还有相同代码模式）

```js
// 如果根因是"某个工具函数在某条件下崩溃"
// 应全局搜索同类调用，一起修掉
```

### 6. 复盘

```
现象 → 影响范围 → 时间线 → 根因 → 修复 → 改进项
```

改进项必须**可执行、有负责人、有截止时间**：

| 改进项 | 负责人 | 截止 |
| --- | --- | --- |
| 补充该场景的自动化测试 | 张三 | 本周 |
| 监控增加该错误的告警 | 李四 | 本周 |
| 重构该模块的错误处理 | 王五 | 下周 |

## 六、与发布联动

```
新版本发布
  ├─ 错误率突增 → 自动告警 → 一键回滚
  ├─ LCP 恶化 → 阻断继续放量
  └─ 白屏率上升 → 立即回滚
```

这是可观测性真正的价值：**让发布变成可逆操作**。

### 灰度策略

```
5% 流量 → 观察 30 分钟（错误率、P75 指标）
  → 25% → 50% → 100%
  任一步异常 → 立即回滚
```

::: tip 回滚的前提
只回滚 HTML 是无效的 —— 旧版本的 JS/CSS 必须仍然可访问。上线时要**保留至少 N 个历史版本的静态资源**。
:::

## 七、监控自身的性能开销

| 风险 | 对策 |
| --- | --- |
| 同步 XHR | 禁止，用 `sendBeacon` |
| 频繁上报 | 批量 + 采样 |
| scroll 中采集 | 节流 + passive |
| SDK 体积大 | 懒加载、异步初始化 |
| 堆栈解析耗时 | 在服务端做 source map 还原 |

```js
// 异步初始化，不阻塞首屏
if (document.readyState === 'complete') init()
else window.addEventListener('load', init)
```

::: interview 面试视角
能给出"结构化采集 → 量化分级 → 三层复现 → 同类排查 → 可执行改进项"的完整闭环，并指出"次数不等于影响用户数"这个常见误判，说明你处理过真实线上事故。
:::