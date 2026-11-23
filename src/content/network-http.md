网络层的问题很"标准化"，但答得好不好，取决于你是否理解**每个机制为什么存在**。

## HTTP 版本演进

| 版本 | 关键变化 | 解决的问题 |
| --- | --- | --- |
| 1.0 | 每请求一个连接 | - |
| 1.1 | 持久连接、管道化 | 减少建连，但管道化有队头阻塞 |
| 2 | 二进制分帧、多路复用、HPACK | 应用层队头阻塞 |
| 3 | QUIC（UDP） | TCP 层队头阻塞、建连延迟 |

### HTTP/1.1 的优化手段与副作用

域名分片（domain sharding）、雪碧图、内联资源，都是为了绕开"每域名 6 个并发连接"。HTTP/2 之后这些手段反而有害（破坏缓存、增加请求数）。

::: warn HTTP/2 下不要做的事
- 雪碧图：多路复用让独立请求更高效
- 域名分片：会额外建连，抵消多路复用收益
- 大量内联：无法单独缓存
:::

## 缓存：完整决策树

```
请求资源
  │
  ├─ 有 Service Worker？ → 走 SW 策略
  │
  ├─ 内存缓存（memory cache）命中？ → 直接用
  │
  ├─ 磁盘缓存存在？
  │    │
  │    ├─ 未过期（max-age / Expires）→ 强缓存，200 from cache
  │    │
  │    └─ 已过期 → 带校验头请求
  │         │
  │         ├─ 304 → 复用本地
  │         └─ 200 → 更新本地
  │
  └─ 无缓存 → 正常请求
```

### 关键头字段

```http
# 强缓存
Cache-Control: public, max-age=31536000, immutable

# 协商缓存
ETag: "abc123"
If-None-Match: "abc123"

Last-Modified: Wed, 21 Oct 2026 07:28:00 GMT
If-Modified-Since: Wed, 21 Oct 2026 07:28:00 GMT
```

| 指令 | 语义 |
| --- | --- |
| `max-age=N` | N 秒内可直接使用 |
| `s-maxage=N` | 仅对共享缓存（CDN）生效 |
| `no-cache` | 可存但每次必须校验 |
| `no-store` | 完全不存（含内存） |
| `private` | 仅浏览器可缓存 |
| `public` | CDN 也可缓存 |
| `immutable` | 有效期内不校验（即使刷新） |
| `stale-while-revalidate=N` | 先用过期副本，后台更新 |

### 推荐策略

```http
# index.html：必须校验，保证发版即时生效
Cache-Control: no-cache

# app.[hash].js：内容不变则 URL 不变
Cache-Control: public, max-age=31536000, immutable

# API：私有 + 短缓存 + 必须校验
Cache-Control: private, max-age=0, must-revalidate
```

核心原则：**入口不缓存，资源永久缓存**。

## 握手成本

### TCP 三次握手

```
Client          Server
  │── SYN ────────►│
  │◄── SYN-ACK ────│
  │── ACK ────────►│
```

1 个 RTT 才能开始传输。

### TLS 1.2 vs 1.3

| 版本 | 往返次数 |
| --- | --- |
| TLS 1.2 | 2-RTT（完整握手） |
| TLS 1.3 | 1-RTT（首次），0-RTT（会话复用） |

TLS 1.3 砍掉了 RSA 密钥交换，强制前向安全（ECDHE），并把密钥交换合并进第一个 flight。

### HTTP/3 的 QUIC

- 基于 UDP，在用户态实现可靠传输
- 0-RTT / 1-RTT 建连
- **流级别**的重传，避免 TCP "一个包丢失阻塞全部流"
- 连接迁移：切换 WiFi/4G 不断连（基于 Connection ID 而非 IP）

## CORS 完整链路

### 简单请求（不预检）

```
GET /api/data HTTP/1.1
Origin: https://a.com

HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://a.com
```

三个条件：方法是 GET/HEAD/POST、头在白名单内、Content-Type 是三种白名单值之一。

### 预检请求

```
OPTIONS /api/data HTTP/1.1
Origin: https://a.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type, authorization

HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

`Access-Control-Max-Age` 决定预检结果缓存多久，能显著减少 OPTIONS 请求。

### 带凭据

```js
fetch(url, { credentials: 'include' })
```

服务端必须：

```http
Access-Control-Allow-Origin: https://a.com   ← 不能是 *
Access-Control-Allow-Credentials: true
```

Cookie 还需 `SameSite=None; Secure`。

::: warn 高频误区
"CORS 错误说明请求没发出去"是错的。**请求可能已经到达服务端并被处理**，只是浏览器拦截了响应。所以 POST 类操作可能已经产生了副作用。
:::

## 连接复用与优先级

### 关键时序优化

```html
<!-- 1. 提前建立连接（DNS + TCP + TLS） -->
<link rel="preconnect" href="https://api.example.com" crossorigin>

<!-- 2. 提前完成 DNS -->
<link rel="dns-prefetch" href="https://static.example.com">

<!-- 3. 提前下载关键资源 -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="modulepreload" href="/src/main.js">
```

`preconnect` 与 `preload` 的差异：

- `preconnect` 只建连接，不下载内容
- `preload` 下载内容并放入缓存，**必须**配合 `as` 声明类型

### 优先级提示

```html
<img src="hero.jpg" fetchpriority="high">
<img src="footer-logo.png" fetchpriority="low" loading="lazy">

<script src="critical.js" fetchpriority="high"></script>
```

浏览器默认给图片低优先级，LCP 主图一定要显式提权。

## CDN 与边缘计算

### 缓存层级

```
浏览器缓存 → Service Worker → CDN 边缘节点 → 源站
```

配置要点：

1. CDN 的 `Cache-Control` 与源站一致，避免反复回源
2. 用 `Vary` 精确控制：`Vary: Accept-Encoding` 而不是 `Vary: User-Agent`
3. 发版时只刷新 HTML，静态资源靠 hash 自然切换
4. 边缘函数（Edge Function）可以做 A/B、鉴权、个性化，但要注意冷启动与一致性

### 回源风暴

新版本发布瞬间，大量用户在缓存未命中时同时回源。缓解：

- `stale-while-revalidate`：先返回旧内容，后台更新
- 请求合并（request coalescing）：边缘节点合并相同回源请求
- 预热：发布前主动把静态资源推送到边缘

## 面试常考的时序题

> 在 HTML 中依次有：一个外部 CSS、一个同步 script、一个 async script。

1. 解析到 CSS：下载并阻塞渲染（不阻塞 HTML 解析）
2. 解析到同步 script：**等待 CSS 下载完成**（因为脚本可能读取样式），然后阻塞解析执行
3. async script 下载完成后立即执行（可能在解析中断点插入）

所以：**同步脚本会等待 CSSOM 就绪**，这是很多人不知道的细节。

::: interview 面试视角
被问"为什么要把 CSS 放在头部、JS 放在底部"，标准回答要包含"CSS 阻塞渲染与后续脚本执行""JS 阻塞解析"两层因果，而不是简单说"更快"。
:::