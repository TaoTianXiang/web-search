网络层的题看似标准，但要把"机制为什么存在"讲清，才算过关。

## 一、TCP 三次握手

```
Client                          Server
  │──── SYN (seq=x) ──────────►│  LISTEN
  │◄─── SYN+ACK (seq=y,ack=x+1)│  SYN_RCVD
  │──── ACK (ack=y+1) ────────►│  ESTABLISHED
```

### 目的：确认双方的收发能力

| 次数 | 确认内容 |
| --- | --- |
| 第 1 次 | 服务端知道：客户端**发送**能力正常 |
| 第 2 次 | 客户端知道：服务端**收发**都正常 |
| 第 3 次 | 服务端知道：客户端**接收**能力正常 |

为什么不是两次：两次时服务端无法确认"客户端能收到我的包"，且历史滞留在网络中的 SYN 会导致服务端建立无效连接并占用资源。

## 二、四次挥手

```
Client                          Server
  │──── FIN ──────────────────►│  CLOSE_WAIT
  │◄─── ACK ───────────────────│
  │                            │（服务端处理完剩余数据）
  │◄─── FIN ───────────────────│  LAST_ACK
  │──── ACK ──────────────────►│  CLOSED
```

**为什么是四次**：TCP 是全双工，两个方向需要**独立关闭**。服务端收到 FIN 后可能还有数据要发，所以先 ACK，等数据发完再发 FIN。

### TIME_WAIT

主动关闭方在发出最后一个 ACK 后进入 TIME_WAIT，等待 2MSL（约 60 秒）。

两个作用：

1. **保证最后一个 ACK 能到达**：ACK 丢失时，对方会重发 FIN，此时本端仍在 TIME_WAIT 可以重发 ACK
2. **防止旧连接的数据包干扰新连接**

高并发短连接会产生大量 TIME_WAIT，占用端口。缓解方式是**开启 keep-alive 复用连接**。

```bash
netstat -n | awk '/^tcp/ {++S[$NF]} END {for(a in S) print a, S[a]}'
```

## 三、HTTPS 加密链路

### 目标

| 目标 | 手段 |
| --- | --- |
| 机密性 | 对称加密（AES） |
| 完整性 | 摘要 + MAC |
| 身份认证 | 数字证书 |

### 为什么不全部用非对称加密

| 类型 | 优点 | 缺点 |
| --- | --- | --- |
| 对称（AES） | 快 | 密钥分发困难 |
| 非对称（RSA/ECDHE） | 密钥交换安全 | 计算慢百倍 |

所以 HTTPS 的组合是：**用非对称协商出对称密钥，之后用对称加密传输数据**。

### TLS 1.3 握手

```
Client                                Server
  │── ClientHello (套件、key_share) ─►│
  │◄── ServerHello + 证书 + key_share ─│
  │   [双方用 ECDHE 算出相同共享密钥]   │
  │── Finished ─────────────────────►│
  │◄── Finished ─────────────────────│
  │═══ 后续用对称密钥加密 ════════════│
```

1-RTT（TLS 1.3）；会话复用可 0-RTT。

### 数字证书的作用

解决"**我拿到的公钥是不是真的属于这个域名**"。

```
证书内容：域名、公钥、有效期、颁发机构
         + CA 用私钥对上述内容的哈希签名
```

验证流程：

1. 用浏览器**内置的 CA 根证书公钥**验证签名
2. 校验域名匹配
3. 校验有效期
4. 检查吊销状态（CRL / OCSP）

### 中间人攻击为什么失败

| 攻击者手段 | 结果 |
| --- | --- |
| 用自签证书 | 非受信 CA → 浏览器拒绝 |
| 转发真实证书 | 无法解密（没有服务器私钥） |

### 常见证书错误

| 报错 | 原因 |
| --- | --- |
| `CERT_DATE_INVALID` | 过期 |
| `CERT_COMMON_NAME_INVALID` | 域名不匹配 |
| `CERT_AUTHORITY_INVALID` | 自签名或 CA 不受信 |
| 混合内容（Mixed Content） | HTTPS 页面加载 HTTP 资源 |

### HSTS

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

告诉浏览器"以后访问此域名一律用 HTTPS"。`preload` 会把域名写入浏览器内置列表，但**移除非常困难**（需数月），上线前要慎重。

## 四、TCP 与 UDP

| 维度 | TCP | UDP |
| --- | --- | --- |
| 连接 | 面向连接 | 无连接 |
| 可靠性 | 保证送达、有序 | 不保证 |
| 流量控制 | 有 | 无 |
| 拥塞控制 | 有 | 无（QUIC 在应用层实现） |
| 头部开销 | 20 字节起 | 8 字节 |
| 传输方式 | 字节流 | 数据报 |

### 场景

| 场景 | 协议 | 原因 |
| --- | --- | --- |
| 网页 / API | TCP 或 QUIC | 可靠有序 |
| 文件传输 | TCP | 完整性 |
| 视频直播 | UDP / QUIC | 宁可丢帧不要延迟 |
| 在线游戏 | UDP | 低延迟 |
| DNS | UDP（大响应转 TCP） | 一问一答，开销小 |

### 为什么 HTTP/3 用 UDP

不是"UDP 更快"，而是**在 UDP 之上可以自定义可靠传输**，从而摆脱 TCP 的两个限制：

1. **TCP 层队头阻塞**：一个包丢失阻塞所有流
2. **内核实现难以快速演进**：TCP 改动需操作系统升级，QUIC 在用户态实现

QUIC 自己实现：可靠传输、拥塞控制、流量控制、TLS 1.3、连接迁移。

```
HTTP/2 over TCP:  丢包 → 所有 stream 等待
HTTP/3 over QUIC: 丢包 → 只有该 stream 等待
```

## 五、DNS 与连接优化

### DNS 查询链路

```
浏览器缓存 → 系统 hosts → 系统 DNS 缓存
  → 递归查询（根 → 顶级域 → 权威）
```

一次查询就是一次 RTT。优化：`dns-prefetch`、减少域名数量。

### 建连优化

```html
<!-- 提前建立连接（DNS + TCP + TLS） -->
<link rel="preconnect" href="https://api.example.com" crossorigin>

<!-- 只做 DNS -->
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- 提前下载关键资源 -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="modulepreload" href="/src/main.js">
```

`preconnect` 只建连接，不下载内容；`preload` 下载并放入缓存（必须声明 `as`，否则可能重复下载）。

### 前端能做的事

| 手段 | 效果 |
| --- | --- |
| `preconnect` 到 API / CDN 域名 | 省 1–2 RTT |
| 减少域名数 | 减少建连次数 |
| 确保 keep-alive | 复用连接 |
| HTTP/2 / HTTP/3 | 单连接多路复用 |
| CDN 就近接入 | 降低 RTT |

## 六、常见追问

> **Q：为什么 HTTP/2 多路复用后还有队头阻塞？**
>
> 因为底层仍是 TCP。TCP 保证字节流有序，一个包丢了，后续包即使收到也要等重传 —— 这是 TCP 层队头阻塞，HTTP/2 无法绕过。

> **Q：QUIC 的连接迁移是怎么做的？**
>
> 用 Connection ID 而非 IP + 端口标识连接。切换 WiFi/4G 时 IP 变化但 Connection ID 不变，连接继续可用。

> **Q：CLOSE_WAIT 过多说明什么？**
>
> 服务端收到 FIN 后没有调用 close()，通常是代码里忘记关闭连接（连接泄漏）。FIN_WAIT2 过多则是客户端主动关闭后等待服务端关闭超时。

::: interview 面试视角
"三次握手确认双方收发能力、四次挥手因为全双工"是标准答案。能补上"TIME_WAIT 保证最后 ACK 可达"、"HTTPS 用非对称协商对称密钥"、"QUIC 用 Connection ID 实现连接迁移"，就是完整的网络链路回答。
:::