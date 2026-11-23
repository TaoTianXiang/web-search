/* eslint-disable */
/** 浏览器与网络：第 50–65 题 */

export const browserQuestions = [
  {
    id: 'br-01',
    code: 50,
    title: '从输入 URL 到页面渲染完成发生了什么',
    categoryId: 'browser',
    level: '中级',
    freq: '极高',
    tags: ['渲染', '网络', '性能'],
    question:
      '从输入 URL 到页面渲染完成，中间发生了什么？请详细描述每个阶段，并指出各阶段最可能的性能瓶颈与优化手段。',
    answerId: 'br-01',
    followups: ['流式渲染如何在 HTML 未接收完时就开始解析', 'HTTP/3 的 0-RTT 有什么安全风险']
  },
  {
    id: 'br-02',
    code: 51,
    title: '回流（重排）与重绘的区别及优化',
    categoryId: 'browser',
    level: '中级',
    freq: '极高',
    tags: ['重排', '重绘', '合成'],
    question:
      '回流（重排）和重绘的区别是什么？哪些操作会触发回流？如何优化？什么是强制同步布局？',
    answerId: 'br-02',
    followups: ['哪些 CSS 属性可以只在合成线程处理', 'content-visibility 如何减少布局成本']
  },
  {
    id: 'br-03',
    code: 52,
    title: 'HTTP/1.1、HTTP/2、HTTP/3 的核心区别',
    categoryId: 'browser',
    level: '高级',
    freq: '高',
    trend: '2026 趋势上升。追问"HTTP/2 的多路复用为什么还存在队头阻塞"',
    tags: ['HTTP/2', 'HTTP/3', 'QUIC'],
    question:
      'HTTP/1.1、HTTP/2、HTTP/3 的核心区别是什么？HTTP/2 的多路复用为什么还存在队头阻塞？HTTP/3 如何解决？',
    answerId: 'br-03',
    followups: ['QPACK 与 HPACK 的差异', 'QUIC 的 0-RTT 存在什么重放攻击风险']
  },
  {
    id: 'br-04',
    code: 53,
    title: '浏览器缓存策略：强缓存与协商缓存',
    categoryId: 'browser',
    level: '中级',
    freq: '高',
    tags: ['缓存', 'Cache-Control', 'ETag'],
    question:
      '浏览器缓存策略有哪些？强缓存和协商缓存的区别是什么？no-cache 和 no-store 有什么区别？请给出一套静态资源与 HTML 的缓存方案。',
    answerId: 'br-04',
    followups: ['ETag 的生成方式（强/弱）与性能权衡', 'Service Worker 的缓存策略如何与 HTTP 缓存配合']
  },
  {
    id: 'br-05',
    code: 54,
    title: 'Cookie、localStorage、sessionStorage 的区别',
    categoryId: 'browser',
    level: '中级',
    freq: '高',
    tags: ['存储', 'Cookie'],
    question:
      'Cookie、localStorage、sessionStorage 有什么区别？IndexedDB 适合什么场景？为什么不应把 token 存在 localStorage？',
    answerId: 'br-05',
    followups: ['BroadcastChannel 如何实现跨标签页同步', 'PWA 中 Cache Storage 与 IndexedDB 的分工']
  },
  {
    id: 'br-06',
    code: 55,
    title: '三次握手与四次挥手的原理',
    categoryId: 'browser',
    level: '中级',
    freq: '高',
    tags: ['TCP', '握手', '挥手'],
    question:
      'TCP 三次握手与四次挥手的目的是什么？为什么握手是三次而挥手是四次？TIME_WAIT 的作用是什么？',
    answerId: 'br-06',
    followups: ['CLOSE_WAIT 过多说明什么问题', 'TCP 粘包与拆包的产生原因及处理']
  },
  {
    id: 'br-07',
    code: 56,
    title: 'HTTPS 的加密原理与数字证书',
    categoryId: 'browser',
    level: '中级',
    freq: '高',
    tags: ['HTTPS', 'TLS', '证书'],
    question:
      'HTTPS 的加密原理是什么？为什么需要非对称加密与对称加密配合？数字证书的作用是什么？中间人攻击如何被防御？',
    answerId: 'br-07',
    followups: ['ECDHE 与前向安全性（PFS）的关系', 'OCSP Stapling 解决了什么问题']
  },
  {
    id: 'br-08',
    code: 57,
    title: '同源策略与 CDN 资源不受跨域限制的原因',
    categoryId: 'browser',
    level: '中级',
    freq: '高',
    tags: ['同源策略', 'CORS', 'CDN'],
    question:
      '什么是同源策略？为什么 CDN 的图片、脚本可以跨域加载，而 fetch 不行？CORS 到底限制了什么？',
    answerId: 'br-08',
    followups: ['CORS 的 credentials 与 Allow-Origin 通配符为何冲突', 'COOP / COEP / CORP 三个新头的作用']
  },
  {
    id: 'br-09',
    code: 58,
    title: '简单请求、预检请求与 CORS 机制',
    categoryId: 'browser',
    level: '中级',
    freq: '高',
    tags: ['CORS', '预检'],
    question:
      '简单请求和复杂请求的区别是什么？CORS 预检机制是怎样的？带 Cookie 的跨域请求需要注意什么？',
    answerId: 'br-09',
    followups: ['CORS 与 CSRF 防御的关系（为什么 CORS 不能替代 CSRF 防护）', 'preflight 缓存失效的常见原因']
  },
  {
    id: 'br-10',
    code: 59,
    title: 'GET 与 POST 的主要区别',
    categoryId: 'browser',
    level: '中级',
    freq: '高',
    tags: ['HTTP', '方法语义'],
    question:
      'GET 和 POST 的主要区别是什么？"GET 有长度限制、POST 没有"这个说法准确吗？从语义角度看应该如何选择？',
    answerId: 'br-10',
    followups: ['PUT 与 PATCH 的语义差异', '如何设计幂等键以避免重复提交']
  },
  {
    id: 'br-11',
    code: 60,
    title: 'TCP 与 UDP 的主要区别',
    categoryId: 'browser',
    level: '中级',
    freq: '中高',
    tags: ['TCP', 'UDP', 'QUIC'],
    question:
      'TCP 和 UDP 的主要区别是什么？各适合什么场景？为什么 HTTP/3 选择基于 UDP？',
    answerId: 'br-11',
    followups: ['QUIC 如何在 UDP 上实现拥塞控制', 'WebRTC 为什么要用 UDP 而不是 TCP']
  },
  {
    id: 'br-12',
    code: 61,
    title: 'DOMContentLoaded 与 load 事件的区别',
    categoryId: 'browser',
    level: '中级',
    freq: '中高',
    tags: ['事件', '加载'],
    question:
      'DOMContentLoaded、load、beforeunload、unload 分别在什么时机触发？readyState 有哪些状态？首屏优化应该关注哪个事件？',
    answerId: 'br-12',
    followups: ['defer 脚本与 DOMContentLoaded 的精确顺序', 'visibilitychange 相比 unload 的优势']
  },
  {
    id: 'br-13',
    code: 62,
    title: 'defer 与 async 的区别',
    categoryId: 'browser',
    level: '中级',
    freq: '中高',
    tags: ['脚本加载', 'defer', 'async'],
    question:
      'defer 和 async 的区别是什么？两者都不写会怎样？在模块脚本（type="module"）中行为有何不同？',
    answerId: 'br-13',
    followups: ['modulepreload 与 preload 的差异', '动态 import() 的执行时机与顺序']
  },
  {
    id: 'br-14',
    code: 63,
    title: '事件委托的原理与好处',
    categoryId: 'browser',
    level: '中级',
    freq: '中高',
    tags: ['事件', '委托', '冒泡'],
    question:
      '什么是事件委托？有什么好处？哪些事件不能委托？如何正确找到目标元素？',
    answerId: 'br-14',
    followups: ['捕获阶段委托与冒泡阶段委托的差异', 'React 合成事件的委托层被 stopPropagation 影响吗']
  },
  {
    id: 'br-15',
    code: 64,
    title: 'XSS 与 CSRF 的原理与防御',
    categoryId: 'browser',
    level: '高级',
    freq: '中高',
    tags: ['安全', 'XSS', 'CSRF'],
    question:
      'XSS 和 CSRF 的原理分别是什么？两者的本质区别是什么？防御体系如何设计？为什么 CSP 不能替代输出转义？',
    answerId: 'br-15',
    followups: ['Trusted Types 如何落地', '富文本编辑器的 XSS 防护清单']
  },
  {
    id: 'br-16',
    code: 65,
    title: '前端跨域的完整方案对比',
    categoryId: 'browser',
    level: '中级',
    freq: '中高',
    tags: ['跨域', 'CORS', '代理'],
    question:
      '前端如何实现跨域？有哪些方案？各自的原理、适用场景与局限是什么？生产环境应该如何选择？',
    answerId: 'br-16',
    followups: ['如何为多环境（dev/staging/prod）配置跨域策略', 'Cookie 跨域时 Domain 与 Path 的具体行为']
  }
]