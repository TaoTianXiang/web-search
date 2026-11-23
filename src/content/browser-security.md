安全题的特点是"看起来会，深问就露馅"。这一章把存储选型、同源策略与两类经典攻击串起来。

## 存储方案对比

| 方案 | 容量 | 同步性 | 生命周期 | 跨标签页 | 随请求发送 |
| --- | --- | --- | --- | --- | --- |
| Cookie | ~4KB | 同步 | 可设过期 | 同域共享 | ✅ 自动 |
| localStorage | ~5MB | **同步** | 永久 | 同域共享 | ❌ |
| sessionStorage | ~5MB | 同步 | 标签页会话 | 仅当前标签 | ❌ |
| IndexedDB | 数百 MB | 异步 | 永久 | 同域共享 | ❌ |
| Cache Storage | 配额内 | 异步 | 需主动清理 | 同域共享 | ❌ |

### 选型建议

```js
// 小量配置、需要随请求发送 → Cookie
document.cookie = 'theme=dark; Path=/; SameSite=Lax; Secure'

// 非敏感的用户偏好、草稿 → localStorage
localStorage.setItem('draft', JSON.stringify(draft))

// 大量结构化数据、离线缓存 → IndexedDB
const db = await openDB('app', 1, {
  upgrade(db) { db.createObjectStore('notes', { keyPath: 'id' }) }
})

// 表单临时状态 → sessionStorage
sessionStorage.setItem('form', JSON.stringify(values))
```

::: warn localStorage 的三个坑
1. **同步阻塞**：读写在主线程，大数据量会掉帧
2. **仅字符串**：对象需序列化，`Date`、`Map` 会丢失类型
3. **不可跨域**：子域之间无法共享（需 postMessage 中转）

`JSON.stringify` 遇到循环引用会直接抛错。
:::

### Cookie 属性

```http
Set-Cookie: sid=abc123; Path=/; Domain=.example.com;
            Max-Age=86400; Secure; HttpOnly; SameSite=Lax
```

| 属性 | 作用 |
| --- | --- |
| `HttpOnly` | JS 无法读取，防 XSS 窃取 |
| `Secure` | 仅 HTTPS 发送 |
| `SameSite=Strict` | 跨站请求完全不带 |
| `SameSite=Lax` | 顶层导航 GET 会带（现代默认） |
| `SameSite=None` | 跨站都带，必须同时 `Secure` |
| `Domain` | 允许子域共享 |
| `Path` | 限定路径 |

## 同源策略

同源 = 协议 + 域名 + 端口三者完全相同。

| URL A | URL B | 同源？ |
| --- | --- | --- |
| `https://a.com/x` | `https://a.com/y` | ✅ |
| `https://a.com` | `http://a.com` | ❌ 协议不同 |
| `https://a.com` | `https://a.com:8443` | ❌ 端口不同 |
| `https://a.com` | `https://b.a.com` | ❌ 域名不同 |

### 限制的范围

| 资源类型 | 是否受同源限制 |
| --- | --- |
| XHR / fetch 读取响应 | ✅ 受限 |
| img / script / link 加载 | ❌ 可跨域加载（但不可读内容） |
| iframe 访问内部文档 | ✅ 受限 |
| Cookie / Storage | ✅ 按域隔离 |
| WebSocket 建连 | ❌ 不受限（需自行鉴权） |

"可以加载但不能读"是关键：`<img>` 可以显示跨域图片，但 Canvas 读取像素会被污染（tainted）。

### 跨域方案对比

```js
// 1. CORS（标准方案）
fetch('https://api.b.com/data', { credentials: 'include' })

// 2. 开发代理（vue.config.js / vite.config.js）
devServer: {
  proxy: { '/api': { target: 'https://api.b.com', changeOrigin: true } }
}

// 3. postMessage（窗口/iframe 通信）
iframe.contentWindow.postMessage({ type: 'ready' }, 'https://b.com')

// 4. JSONP（仅 GET，历史方案，不推荐）
```

## XSS：注入攻击

### 三种类型

| 类型 | 数据流向 | 例子 |
| --- | --- | --- |
| 存储型 | 恶意内容入库 → 所有访问者中招 | 评论区注入 `<script>` |
| 反射型 | 恶意链接参数 → 立即回显 | 搜索页 `?q=<script>` |
| DOM 型 | 前端代码把不可信数据写入 sink | `innerHTML = location.hash` |

### 危险 sink 清单

```js
// 高风险
el.innerHTML = userInput
el.outerHTML = userInput
document.write(userInput)
new Function(userInput)
eval(userInput)
setTimeout(userInput, 0)      // 字符串形式
location.href = 'javascript:' + userInput
el.insertAdjacentHTML('beforeend', userInput)
```

框架中的对应物：

```jsx
<div dangerouslySetInnerHTML={{ __html: content }} />   // React
<div v-html="content" />                                 // Vue
```

### 防御体系

```js
// 1. 输出转义（按上下文）
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]))
}

// 2. 富文本白名单净化
import DOMPurify from 'dompurify'
el.innerHTML = DOMPurify.sanitize(richText, {
  ALLOWED_TAGS: ['p', 'b', 'i', 'a', 'code', 'pre'],
  ALLOWED_ATTR: ['href', 'title']
})

// 3. CSP
// Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'

// 4. Trusted Types（Chrome）
// require-trusted-types-for 'script'
```

::: warn 转义要按上下文
HTML 转义不能用于 URL、JS、CSS 上下文：

```js
// URL 上下文要 encodeURIComponent
const url = `/search?q=${encodeURIComponent(keyword)}`

// JS 上下文要 JSON.stringify 并转义
const data = JSON.stringify(userData).replace(/</g, '\\u003c')
```
:::

## CSRF：借用身份

成因三要素：

1. 用户已登录，Cookie 有效
2. 攻击者能构造请求
3. 浏览器会自动携带 Cookie

注意：CSRF **不需要读取响应**，只要请求被执行即可（如转账、改密码）。

### 攻击示例

```html
<!-- 攻击者页面上的表单 -->
<form action="https://bank.com/transfer" method="POST">
  <input name="to" value="attacker" hidden>
  <input name="amount" value="10000" hidden>
</form>
<script>document.forms[0].submit()</script>
```

### 防御层次

| 手段 | 原理 | 局限 |
| --- | --- | --- |
| `SameSite=Lax/Strict` | 跨站不带 Cookie | 老浏览器不支持 None |
| CSRF Token | 攻击者无法获知令牌 | 需要服务端会话存储 |
| 双提交 Cookie | 令牌同时存在 Cookie 与 header | 子域可覆盖 Cookie 时失效 |
| 校验 Origin / Referer | 检查请求来源 | Referer 可能被裁剪 |
| 二次验证 | 敏感操作要求密码 | 影响体验 |

```html
<!-- Token 方案 -->
<input type="hidden" name="_csrf" value="随机令牌">
```

```http
<!-- 自定义头方案：攻击者无法通过表单设置自定义头 -->
X-CSRF-Token: 随机令牌
```

::: tip 为什么自定义头能防 CSRF
跨域表单只能发送表单支持的字段，无法设置自定义请求头。而 CORS 预检会阻止攻击者的站点发起带自定义头的请求。
:::

## 其他常见风险

### 点击劫持

```http
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'self'
```

前端配合 `sec-fetch-dest` 或 JS 检测 `window.top !== window.self`。

### 开放重定向

```js
// 差
location.href = query.redirect

// 好：白名单校验
const allow = new Set(['https://a.com', 'https://b.com'])
const target = new URL(query.redirect, location.origin)
if (allow.has(target.origin)) location.href = target.href
```

### 依赖供应链

- 锁定版本（lockfile 必提交）
- 审计：`npm audit`、`pnpm audit`、Snyk
- 安装新依赖前检查维护活跃度与下载量
- 生产构建只装 `dependencies`

```bash
npm ci --omit=dev
```

### 敏感信息泄露

- Source Map 不要直接暴露在公网（或加权限）
- 前端环境变量只能放**非敏感**配置（构建后会打包进产物）
- 日志中不打印 token、身份证、手机号

## 安全响应头清单

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-xxx'; object-src 'none'; base-uri 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

::: interview 面试视角
"我用了 HTTPS"不是安全答案。分层说清：**输入校验 → 输出编码 → 传输加密 → 权限最小化 → 监控告警**，体现的是防御体系而非单点措施。
:::