/**
 * 术语词条（glossary）
 *
 * 正文中用 {{术语}} 或 {{术语|显示文字}} 标记，点击弹出简要解释，
 * 弹层里的「查看完整词条」跳到 /glossary#<id>。
 *
 * 字段：
 *   id      锚点，全局唯一
 *   term    正式名称（正文里可直接用它来匹配）
 *   aka     别名 / 英文名，同样可以被 {{...}} 匹配
 *   group   分组，见 glossaryGroups
 *   short   一句话解释（弹层里显示，尽量 60 字以内）
 *   detail  Markdown 详情（词条页显示）
 *   refs    相关章节 slug
 */

export const glossaryGroups = [
  { id: 'language', title: 'JavaScript 语言', accent: '#c9a227' },
  { id: 'runtime', title: '引擎与运行时', accent: '#0f766e' },
  { id: 'browser', title: '浏览器与渲染', accent: '#264de4' },
  { id: 'network', title: '网络与安全', accent: '#be185d' },
  { id: 'framework', title: '框架内部机制', accent: '#42b883' },
  { id: 'typescript', title: 'TypeScript', accent: '#3178c6' },
  { id: 'engineering', title: '工程化与性能', accent: '#7c3aed' }
]

export const glossaryTerms = [
  // ---------- JavaScript 语言 ----------
  {
    id: 'to-primitive',
    term: 'ToPrimitive',
    aka: ['ToPrimitive'],
    group: 'language',
    short: '把对象转成原始值的内部过程：先 Symbol.toPrimitive，再 valueOf / toString，顺序由 hint 决定。',
    detail: [
      '`ToPrimitive(input, hint)` 是所有隐式转换的起点，hint 取 `default` / `number` / `string`。',
      '',
      '1. 有 `Symbol.toPrimitive` 就调用它，返回值必须是原始值，否则抛 `TypeError`',
      '2. hint 为 `number`：先 `valueOf` 再 `toString`',
      '3. hint 为 `string`：先 `toString` 再 `valueOf`',
      '4. hint 为 `default`：除 `Date` 外都按 `number` 处理',
      '',
      '```js',
      'const o = { valueOf: () => 42, toString: () => "str" }',
      'console.log(o + 1)      // → 43，default 走 valueOf',
      'console.log(`${o}`)     // → "str"，模板字符串是 string hint',
      '```',
      '',
      '`Date` 是唯一例外：`date + 1` 走 string hint，结果是字符串拼接。'
    ].join('\n'),
    refs: ['js-types']
  },
  {
    id: 'tdz',
    term: '暂时性死区',
    aka: ['TDZ', 'Temporal Dead Zone'],
    group: 'language',
    short: 'let / const / class 的绑定已创建但未初始化，在声明语句之前访问会抛 ReferenceError。',
    detail: [
      '`let`/`const`/`class` 在进入作用域时就创建了绑定，但一直处于「未初始化」状态，直到执行到声明语句。这段区间就是 TDZ。',
      '',
      '```js',
      'console.log(x)   // ❌ ReferenceError: Cannot access "x" before initialization',
      'let x = 1',
      '',
      '{',
      '  console.log(y) // ❌ 整块都在 TDZ 内，不只是声明之后',
      '  let y = 2',
      '}',
      '```',
      '',
      '注意 `typeof` 也不再安全：`typeof x` 在 TDZ 内同样抛错，这与未声明的变量返回 `undefined` 不同。'
    ].join('\n'),
    refs: ['js-scope-closure']
  },
  {
    id: 'scope-chain',
    term: '作用域链',
    aka: ['Scope Chain'],
    group: 'language',
    short: '每个执行上下文指向外层词法环境的引用链，变量查找沿此链向上，直到全局环境。',
    detail: [
      '每个执行上下文有一个 `LexicalEnvironment`，其中除了当前绑定，还有一个指向外层环境的 `outer` 引用。查找变量时沿 `outer` 逐层向上，直到全局环境，找不到才抛 `ReferenceError`。',
      '',
      '```js',
      'let v = "global"',
      'function outer() {',
      '  let v = "outer"',
      '  function inner() { console.log(v) }',
      '  return inner',
      '}',
      '',
      'outer()()   // → "outer"：链在定义时确定，与调用位置无关',
      '```',
      '',
      '作用域链是**词法**的，所以把函数传给别处调用不会改变它看到的变量。'
    ].join('\n'),
    refs: ['js-scope-closure']
  },
  {
    id: 'closure-context',
    term: '上下文逃逸',
    aka: ['Context', 'Context 对象'],
    group: 'runtime',
    short: '被闭包引用的变量会从栈帧复制到堆上的 Context 对象，生命周期由可达性决定。',
    detail: [
      '函数返回后栈帧被销毁，但被内部函数引用（且内部函数存活）的变量会被「逃逸」到堆上的 `Context` 对象，因此还能被访问——这就是闭包能保留状态的内存原因。',
      '',
      'V8 做的是**变量级**优化：只有真正被引用的变量才进 `Context`。',
      '',
      '```js',
      'function make() {',
      '  const huge = new Array(1e6).fill(0)   // 未被引用 → 不进 Context',
      '  const small = 1',
      '  return () => small',
      '}',
      '```',
      '',
      '一旦出现 `eval` / `with`，或变量以无法静态分析的方式被访问，优化会退化为「整个作用域保留」。这也是闭包泄漏的常见来源。'
    ].join('\n'),
    refs: ['js-scope-closure']
  },

  // ---------- 引擎与运行时 ----------
  {
    id: 'hidden-class',
    term: '隐藏类',
    aka: ['Hidden Class', 'hidden class', 'shape', 'Map（V8 内部）'],
    group: 'runtime',
    short: 'V8 为每个对象形状维护的内部类型信息。形状相同即可复用同一套属性偏移，访问退化时重新学习。',
    detail: [
      'JS 对象是动态的，但 V8 仍希望像访问 C 结构体一样按固定偏移取属性。做法是：为「属性名 + 顺序」相同的对象共享一个**隐藏类**，其中记录了每个属性在内存中的偏移量。',
      '',
      '对象每新增一个属性，就从一个隐藏类迁移到另一个隐藏类。迁移路径可以复用，所以「同一个构造函数、同序赋值」的对象会落到同一个隐藏类上。',
      '',
      '```js',
      '// 形状一致：复用同一个隐藏类',
      'function Point(x, y) { this.x = x; this.y = y }',
      '',
      '// 形状不一致：a 与 b 落在两个不同的隐藏类上',
      'const a = { x: 1 }',
      'const b = { x: 1, y: 2 }',
      '',
      '// 最伤性能：先加后删，形状持续迁移且产生「空洞」',
      'const c = {}',
      'c.x = 1',
      'delete c.x',
      '```',
      '',
      '**实践**：构造函数里一次性赋全所有字段（包括先赋 `undefined`）；不要用 `delete`，改为赋 `null`；避免用不同顺序给同族对象赋值。'
    ].join('\n'),
    refs: ['js-proto', 'js-types']
  },
  {
    id: 'inline-cache',
    term: '内联缓存',
    aka: ['IC', 'Inline Cache', 'inline cache'],
    group: 'runtime',
    short: 'JIT 在调用点缓存「上次见过的隐藏类 → 属性偏移」，下次同形状直接命中，省掉查表。',
    detail: [
      '同一行属性访问代码在不同对象上执行时，引擎会缓存「对象的隐藏类 → 属性偏移」。下次遇到相同隐藏类就走快速路径，不再走原型链查找。',
      '',
      '状态机大致是：**未初始化 → 单态（monomorphic）→ 多态（polymorphic）→ 超多态（megamorphic）**。命中越多态，查询成本越高。',
      '',
      '```js',
      'function getName(o) { return o.name }',
      '',
      '// 单态：只有一种形状，IC 最快',
      'const p1 = { name: "a" }',
      'getName(p1)',
      '',
      '// 多态：调用点见到多种形状，IC 开始线性比对',
      'const p2 = { name: "b", age: 1 }',
      'getName(p2)',
      '```',
      '',
      '**为什么「动态增删属性更慢」**：形状一变，隐藏类就变，IC 的缓存条目失效，需要重新学习；超过阈值后退化为查表，性能显著下降。'
    ].join('\n'),
    refs: ['js-proto']
  },
  {
    id: 'macrotask',
    term: '宏任务',
    aka: ['Macro Task', 'macrotask', 'Task'],
    group: 'runtime',
    short: '事件循环调度的基本任务单位：script 整体、setTimeout、setInterval、I/O、UI 事件回调。',
    detail: [
      '每轮事件循环取**一个**宏任务执行，执行完后清空全部微任务，再视情况渲染，然后进入下一轮。',
      '',
      '```js',
      'console.log("1")',
      'setTimeout(() => console.log("2"))   // 宏任务，下一轮',
      'Promise.resolve().then(() => console.log("3"))  // 微任务，本轮末尾',
      'console.log("4")',
      '// → 1 4 3 2',
      '```',
      '',
      '`setTimeout(fn, 0)` 不是「立刻执行」，而是「尽快排到下一轮」；嵌套超过 5 层时浏览器会强制最小 4ms 延迟。'
    ].join('\n'),
    refs: ['js-async']
  },
  {
    id: 'microtask',
    term: '微任务',
    aka: ['Micro Task', 'microtask'],
    group: 'runtime',
    short: '当前宏任务结束前清空的队列：Promise.then、queueMicrotask、MutationObserver。',
    detail: [
      '每个宏任务执行完毕后，会**完整清空**微任务队列（并包括微任务中新产生的微任务），之后才进入渲染或下一轮宏任务。',
      '',
      '```js',
      'Promise.resolve().then(() => {',
      '  console.log("m1")',
      '  Promise.resolve().then(() => console.log("m2"))   // 仍在本轮清空',
      '})',
      '// → m1 m2',
      '```',
      '',
      '风险：微任务里再排微任务会**饿死渲染**——因为它必须在渲染前全部跑完。无限递归的 `Promise.then` 会让页面卡死，而 `setTimeout` 不会。'
    ].join('\n'),
    refs: ['js-async']
  },

  // ---------- 浏览器与渲染 ----------
  {
    id: 'reflow-repaint',
    term: '重排与重绘',
    aka: ['Reflow', 'Repaint', '重排', '重绘'],
    group: 'browser',
    short: '重排重算几何（布局），重绘重画像素。改 width 触发重排，改 color 只触发重绘。',
    detail: [
      '**重排（reflow / layout）**：元素的几何信息变了，需要重新计算布局树。代价最高，可能波及整棵子树甚至整个文档。',
      '**重绘（repaint）**：几何没变，只是外观变了（颜色、阴影、背景），只需重新栅格化。',
      '',
      '```js',
      'el.style.width = "200px"      // 重排 + 重绘',
      'el.style.color = "red"        // 只重绘',
      'el.style.transform = "translateX(10px)"  // 只合成，不重排不重绘',
      'el.style.opacity = "0.5"      // 只合成',
      '```',
      '',
      '**读写交替是重排放大器**：读 `offsetHeight` 会强制同步布局（forced synchronous layout），紧接着写样式又会失效一次。正确做法是先把要读的值批量读完，再统一写。'
    ].join('\n'),
    refs: ['browser-render', 'perf-vitals']
  },
  {
    id: 'composite-layer',
    term: '合成层',
    aka: ['Compositing Layer', '合成层'],
    group: 'browser',
    short: '被提升到独立图层、由 GPU 单独合成的渲染层；只改变换或透明度时无需重排重绘。',
    detail: [
      '合成层有自己的位图，位置变化可在合成线程完成，不阻塞主线程。常见触发条件：',
      '',
      '- `transform` / `opacity` 配合动画',
      '- `will-change: transform`',
      '- `position: fixed`、`<video>`、`<canvas>`',
      '- 3D 变换（`translateZ(0)` 这类 hack）',
      '',
      '**代价**：每层都要独立显存和栅格化开销。层数过多会带来内存压力和「层爆炸」。不要为了动画随手加 `will-change`——它会让层一直存在，用完应移除。'
    ].join('\n'),
    refs: ['browser-render']
  },
  {
    id: 'bfc',
    term: 'BFC',
    aka: ['块级格式化上下文', 'Block Formatting Context'],
    group: 'browser',
    short: '一块独立的布局区域，内部浮动不溢出、外边距不与之折叠，且能包住浮动子元素。',
    detail: [
      '触发方式：`display: flow-root`（推荐）、`float`、`position: absolute/fixed`、`overflow` 非 `visible`、`display: inline-block/table-cell/flex/grid`。',
      '',
      '三大用途：',
      '',
      '1. **包住浮动**：父元素触发 BFC 后高度包含浮动子元素（现代写法直接 `display: flow-root`）',
      '2. **阻止外边距折叠**：父子 margin 不再合并',
      '3. **阻止浮动环绕**：与浮动元素并排时不再被文字绕排',
      '',
      '```css',
      '.wrap { display: flow-root }  /* 无副作用的 BFC，优于 overflow: hidden */',
      '```'
    ].join('\n'),
    refs: ['css-layout']
  },
  {
    id: 'stacking-context',
    term: '层叠上下文',
    aka: ['Stacking Context', '层叠上下文'],
    group: 'browser',
    short: 'z-index 只在同一层叠上下文内比较；父级建立了上下文，子元素的 z-index 就无法「跨级」压过外部元素。',
    detail: [
      '常见触发：根元素、`position` + `z-index` 非 auto、`opacity < 1`、`transform` / `filter` / `backdrop-filter` 非 none、`will-change` 指定上述属性、`isolation: isolate`。',
      '',
      '```html',
      '<div style="position: relative; z-index: 1">',
      '  <div style="z-index: 999"></div>   <!-- 仍然压不过外部的 z-index: 2 -->',
      '</div>',
      '<div style="position: relative; z-index: 2"></div>',
      '```',
      '',
      '排查口诀：**先找最近的层叠上下文祖先**，再在该层内比较 `z-index`。`opacity: .99` 这种写法会意外创建上下文，是常见 bug 来源。'
    ].join('\n'),
    refs: ['css-common']
  },
  {
    id: 'critical-path',
    term: '关键渲染路径',
    aka: ['Critical Rendering Path', 'CRP'],
    group: 'browser',
    short: 'HTML → DOM → CSSOM → 渲染树 → 布局 → 绘制 → 合成 的完整链路，阻塞点越多首屏越慢。',
    detail: [
      '顺序：解析 HTML 构建 DOM → 解析 CSS 构建 CSSOM → 合并为渲染树 → 布局（layout）→ 绘制（paint）→ 合成（composite）。',
      '',
      '两个关键阻塞：',
      '',
      '- **CSS 阻塞渲染**：CSSOM 未就绪不会绘制，所以首屏关键 CSS 应内联',
      '- **同步脚本阻塞解析**：`<script>` 会中断 HTML 解析并等待执行，用 `defer`（保序、DOM 就绪后执行）或 `async`（无序、下载完即执行）',
      '',
      '```html',
      '<link rel="stylesheet" href="critical.css">      <!-- 关键 CSS 内联更优 -->',
      '<script src="app.js" defer></script>              <!-- 不阻塞解析 -->',
      '```'
    ].join('\n'),
    refs: ['browser-render', 'browser-dom']
  },

  // ---------- 网络与安全 ----------
  {
    id: 'http-cache',
    term: '强缓存与协商缓存',
    aka: ['强缓存', '协商缓存', 'Cache-Control', 'ETag'],
    group: 'network',
    short: '强缓存命中不发请求（Cache-Control）；协商缓存带 ETag/Last-Modified 问服务端，304 表示可复用。',
    detail: [
      '**强缓存**：`Cache-Control: max-age=31536000, immutable`，期间浏览器直接用本地副本，不发请求。',
      '**协商缓存**：强缓存过期后带 `If-None-Match` / `If-Modified-Since` 询问服务端，命中返回 `304 Not Modified`（无响应体）。',
      '',
      '工程做法：',
      '',
      '- HTML：`no-cache`（每次都协商），保证发版即时生效',
      '- 带 hash 的静态资源：`max-age=31536000, immutable`',
      '- 接口：按数据特性设短 `max-age` + `ETag`',
      '',
      '`no-store` 才是「完全不缓存」；`no-cache` 是「可以缓存但必须先验证」。'
    ].join('\n'),
    refs: ['network-http']
  },
  {
    id: 'cors',
    term: 'CORS',
    aka: ['跨域资源共享', 'Cross-Origin Resource Sharing'],
    group: 'network',
    short: '用响应头授权跨源请求的机制；非简单请求先发 OPTIONS 预检，服务端需返回对应 Allow 头。',
    detail: [
      '浏览器的同源策略默认阻止跨源读取响应。CORS 由**服务端响应头**授权，前端无法单方面绕过。',
      '',
      '```http',
      'Access-Control-Allow-Origin: https://a.com',
      'Access-Control-Allow-Methods: GET, POST',
      'Access-Control-Allow-Headers: Content-Type',
      'Access-Control-Allow-Credentials: true',
      '```',
      '',
      '关键规则：',
      '',
      '- 非简单请求（自定义头、`PUT`、`application/json`）会先发 `OPTIONS` 预检',
      '- 带 `credentials: "include"` 时，`Allow-Origin` **不能**为 `*`，且必须显式返回具体源',
      '- 预检结果可用 `Access-Control-Max-Age` 缓存，减少请求数'
    ].join('\n'),
    refs: ['browser-security', 'network-http']
  },
  {
    id: 'xss',
    term: 'XSS',
    aka: ['跨站脚本', 'Cross-Site Scripting'],
    group: 'network',
    short: '攻击者把可执行脚本注入页面，在受害者浏览器里以该站点身份运行。',
    detail: [
      '三种类型：**存储型**（脚本存进库，所有访问者中招）、**反射型**（脚本来自 URL 参数）、**DOM 型**（前端把不可信数据写入 `innerHTML`）。',
      '',
      '```js',
      '// ❌ 用户输入直接拼进 HTML',
      'el.innerHTML = `<p>${userInput}</p>`',
      '',
      '// ✅ 用文本节点，浏览器不会解析为标签',
      'el.textContent = userInput',
      '```',
      '',
      '防御分层：输出编码（按上下文：HTML / 属性 / JS / URL）+ 富文本白名单清洗（DOMPurify）+ CSP 兜底 + `HttpOnly` Cookie 降低被窃取后果。'
    ].join('\n'),
    refs: ['browser-security']
  },
  {
    id: 'csrf',
    term: 'CSRF',
    aka: ['跨站请求伪造', 'Cross-Site Request Forgery'],
    group: 'network',
    short: '借用户已登录的 Cookie，诱导其浏览器向目标站点发起非预期请求。',
    detail: [
      '关键区别：CSRF 不读取响应（同源策略挡住了），只是**借身份发请求**。所以它伤的是「写操作」。',
      '',
      '防御：',
      '',
      '- `SameSite=Lax/Strict` Cookie（现代浏览器默认 Lax，已挡住大部分场景）',
      '- CSRF Token（双提交或服务端校验）',
      '- 校验 `Origin` / `Referer`',
      '- 敏感操作二次确认（验证码、密码）',
      '',
      '注意：`SameSite=None` 必须同时 `Secure`；跨站单点登录场景要用 `SameSite=None; Secure` + Token 双保险。'
    ].join('\n'),
    refs: ['browser-security']
  },
  {
    id: 'csp',
    term: 'CSP',
    aka: ['内容安全策略', 'Content Security Policy'],
    group: 'network',
    short: '通过响应头声明允许加载哪些源、是否允许内联脚本，作为 XSS 的最后一道兜底。',
    detail: [
      '```http',
      "Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m';",
      "  img-src 'self' data: https:; object-src 'none'; base-uri 'none'",
      '```',
      '',
      '要点：',
      '',
      '- 用 `nonce-xxx` 或 `strict-dynamic` 替代 `unsafe-inline`',
      '- 先以 `Content-Security-Policy-Report-Only` 上线观察，收集违规报告再收紧',
      '- `object-src \'none\'`、`base-uri \'none\'` 几乎零成本，建议默认加上',
      '',
      'CSP 是**纵深防御**，不能替代输出编码。'
    ].join('\n'),
    refs: ['browser-security']
  },
  {
    id: 'tls',
    term: 'TLS 握手',
    aka: ['TLS', 'TLS Handshake', 'HTTPS 握手'],
    group: 'network',
    short: '协商密钥并验证证书的过程；TLS 1.3 只需 1-RTT，配合会话复用可 0-RTT。',
    detail: [
      'TLS 1.2 需要 2-RTT 完成握手，TLS 1.3 压缩到 1-RTT（会话复用可 0-RTT）。',
      '',
      '握手中要解决三件事：',
      '',
      '1. **认证**：服务端出示证书链，浏览器校验证书链与域名',
      '2. **密钥交换**：现代用 ECDHE，具备前向保密（PFS）',
      '3. **加密通信**：对称加密传输，非对称只用于协商',
      '',
      '工程优化：开启 TLS 1.3 + OCSP Stapling + 会话复用（`session ticket`）+ HSTS，减少握手往返与证书校验开销。'
    ].join('\n'),
    refs: ['net-tcp', 'network-http']
  },
  {
    id: 'quic',
    term: 'QUIC',
    aka: ['HTTP/3', 'QUIC'],
    group: 'network',
    short: '基于 UDP 的传输协议，在用户态实现可靠传输与多路复用，解决 TCP 队头阻塞。',
    detail: [
      'HTTP/2 的多路复用跑在**单条 TCP** 上，一个丢包会阻塞所有流（TCP 层队头阻塞）。QUIC 把可靠传输搬到 UDP 之上，每条流独立重传。',
      '',
      '其他收益：',
      '',
      '- **0-RTT 建连**：会话复用时首个请求即可携带数据',
      '- **连接迁移**：以 Connection ID 标识连接，切换网络（WiFi → 4G）不断连',
      '- 加密握手与传输握手合并，减少往返',
      '',
      '代价：UDP 在部分企业网络中受限、服务端实现复杂、CPU 开销高于 TCP。'
    ].join('\n'),
    refs: ['net-tcp', 'network-http']
  },

  // ---------- 框架内部机制 ----------
  {
    id: 'dep-collect',
    term: '依赖收集',
    aka: ['track / trigger', '依赖追踪'],
    group: 'framework',
    short: '读取响应式数据时把当前 effect 记进依赖表（track），写入时反查并触发（trigger）。',
    detail: [
      'Vue 3 用一个三层结构保存依赖：`WeakMap<target, Map<key, Set<effect>>>`。',
      '',
      '```js',
      'let activeEffect = null',
      '',
      'function track(target, key) {',
      '  if (!activeEffect) return',
      '  const depsMap = targetMap.get(target) || targetMap.set(target, new Map()).get(target)',
      '  const dep = depsMap.get(key) || depsMap.set(key, new Set()).get(key)',
      '  dep.add(activeEffect)',
      '  activeEffect.deps.push(dep)   // 供下次执行前清理',
      '}',
      '```',
      '',
      '关键设计：① 用 `WeakMap` 让目标对象可被回收；② effect 每次执行前清空自身 `deps` 并重新收集，从而支持**分支切换**（`if` 换分支后旧依赖不再触发）。'
    ].join('\n'),
    refs: ['vue-reactivity']
  },
  {
    id: 'patch-flag',
    term: 'PatchFlag',
    aka: ['PatchFlag', '补丁标记'],
    group: 'framework',
    short: '编译期给动态节点打上的类型标记（文本 / class / props…），运行时据此跳过静态部分比较。',
    detail: [
      '模板编译时能静态分析出「哪些节点是动态的」，于是给 vnode 打上 `PatchFlag`：',
      '',
      '```js',
      '// <div :id="id">{{ msg }}</div> 编译结果大致为：',
      'createElementVNode("div", { id: _ctx.id }, toDisplayString(_ctx.msg), 1 /* TEXT */)',
      '```',
      '',
      '常见值：`TEXT`(1)、`CLASS`(2)、`STYLE`(4)、`PROPS`(8)、`FULL_PROPS`(16)、`NEED_PATCH`(512)。',
      '',
      '好处：diff 时不再盲目遍历所有 key，只处理被标记的维度；配合静态提升与 `Block Tree`，把 diff 从「整棵树」缩小到「动态节点集合」。'
    ].join('\n'),
    refs: ['vue-compiler']
  },
  {
    id: 'block-tree',
    term: 'Block Tree',
    aka: ['Block', '块树'],
    group: 'framework',
    short: '把「结构稳定 + 含动态子节点」的片段划为一个 Block，Block 内只维护动态节点数组，diff 时直接遍历。',
    detail: [
      '`v-if` / `v-for` 会破坏节点结构稳定性，因此编译器把它们当作 Block 边界：Block 内部记录一个扁平的 `dynamicChildren` 数组。',
      '',
      '```js',
      '// 带 v-if 的模板会生成一个 Block，其 dynamicChildren 只含动态节点',
      'const _block = createElementBlock("div", null, [',
      '  _ctx.ok ? (openBlock(), createElementBlock("span", { key: 0 }, "yes")) : createCommentVNode("v-if", true)',
      '])',
      '```',
      '',
      '效果：更新时沿 Block 树只比较 `dynamicChildren`，跳过大量静态节点，避免整树递归 diff。'
    ].join('\n'),
    refs: ['vue-compiler']
  },
  {
    id: 'lis',
    term: '最长递增子序列',
    aka: ['LIS', 'Longest Increasing Subsequence'],
    group: 'framework',
    short: 'Vue diff 用它找出「无需移动」的节点，只移动其余节点，把 DOM 移动次数降到最少。',
    detail: [
      '在 `keyed` 子节点 diff 中，Vue 先求出「新节点在旧列表中的索引序列」，再对该序列求**最长递增子序列**：属于 LIS 的节点位置已经相对有序，不用移动；其余节点才执行 insertBefore。',
      '',
      '```js',
      '// 旧: a b c d e  新: a c d b e',
      '// 新节点在旧列表中的索引: [0, 2, 3, 1, 4]',
      '// LIS = [0, 2, 3, 4] → 只移动 b',
      '```',
      '',
      '复杂度 `O(n log n)`（二分 + 前驱数组）。面试常问：「为什么不是全部重排？」——因为移动 DOM 的代价远高于在内存里算序列。'
    ].join('\n'),
    refs: ['vue-compiler']
  },
  {
    id: 'fiber',
    term: 'Fiber',
    aka: ['Fiber 树', 'Fiber 架构'],
    group: 'framework',
    short: 'React 把渲染工作拆成可中断的单元（Fiber 节点），用链表串起来，实现可暂停、可恢复的并发渲染。',
    detail: [
      '旧架构（Stack Reconciler）递归不可中断，一旦开始就必须跑完，长任务会卡住主线程。Fiber 把递归改成**链表遍历**，每个节点是一个工作单元，可随时让出主线程。',
      '',
      '每个 Fiber 节点上有三个关键指针：`child`（第一个子节点）、`sibling`（下一个兄弟）、`return`（父节点）。',
      '',
      '```js',
      '// 简化的工作循环',
      'function workLoopConcurrent() {',
      '  while (workInProgress !== null && !shouldYield()) {',
      '    performUnitOfWork(workInProgress)',
      '  }',
      '}',
      '```',
      '',
      '`shouldYield()` 通常基于 5ms 时间片判断。这让高优先级更新（输入、动画）可以插队。'
    ].join('\n'),
    refs: ['react-model']
  },
  {
    id: 'double-buffer',
    term: '双缓存',
    aka: ['Double Buffering', 'current / workInProgress'],
    group: 'framework',
    short: '维护 current 与 workInProgress 两棵 Fiber 树，构建完成后一次性切换根指针，避免半成品上屏。',
    detail: [
      '`current` 是已上屏的树，`workInProgress` 是正在构建的树。两者通过 `alternate` 互相引用，构建过程中复用节点对象，构建完成后 `root.current = finishedWork` 一次切换。',
      '',
      '好处：',
      '',
      '- 渲染过程不破坏当前界面（无中间态闪烁）',
      '- 中断后可以继续（进度保存在 workInProgress 上）',
      '- 节点对象可复用，降低 GC 压力'
    ].join('\n'),
    refs: ['react-model']
  },
  {
    id: 'time-slice',
    term: '时间切片',
    aka: ['Time Slicing', '可中断渲染'],
    group: 'framework',
    short: '把渲染拆成 5ms 左右的小片，跑完一片就检查是否该让出主线程，保证交互不被长任务阻塞。',
    detail: [
      'React 的 `Scheduler` 用 `MessageChannel` 在宏任务之间让出，避免 `requestIdleCallback` 的兼容与触发频率问题。',
      '',
      '```js',
      'const channel = new MessageChannel()',
      'channel.port1.onmessage = () => {',
      '  // 处理一小片工作，然后再次 postMessage 让出',
      '}',
      'channel.port2.postMessage(null)',
      '```',
      '',
      '注意：时间切片只解决「不阻塞」，不减少总工作量。真正省时间靠 memo 化与合理的组件拆分。'
    ].join('\n'),
    refs: ['react-model']
  },
  {
    id: 'rsc',
    term: 'RSC',
    aka: ['React Server Components', '服务端组件'],
    group: 'framework',
    short: '在服务端渲染、不向客户端发送 JS 的组件类型；通过序列化描述与 Client 组件组合。',
    detail: [
      'RSC 与 SSR 不是一回事：SSR 只是「先渲染 HTML，再补水合」，组件代码仍要下发；RSC 的组件**代码不下发**，只传序列化后的结果。',
      '',
      '边界规则：',
      '',
      '- Server Component 可以 `import` Client Component',
      '- Client Component **不能** `import` Server Component，只能通过 `children` / props 传入',
      '- `useState`、事件处理只能在 Client Component 中使用',
      '',
      '收益：首屏 JS 体积下降、可直接访问数据库/文件系统；代价是心智模型更复杂（两套运行时）。'
    ].join('\n'),
    refs: ['react-eco']
  },

  // ---------- TypeScript ----------
  {
    id: 'structural-typing',
    term: '结构类型',
    aka: ['Structural Typing', '鸭子类型'],
    group: 'typescript',
    short: '只看形状是否兼容，不看声明来源；名字不同但成员一致即视为同类型。',
    detail: [
      '```ts',
      'interface Point { x: number; y: number }',
      'const p = { x: 1, y: 2, z: 3 }',
      'const q: Point = p        // ✅ 变量有多余属性也兼容',
      "const r: Point = { x: 1, y: 2, z: 3 }  // ❌ 对象字面量触发多余属性检查",
      '```',
      '',
      '对象字面量赋给已知类型时会做**多余属性检查（excess property check）**，这是为了防止拼写错误；先赋给变量再赋值就绕过了该检查。',
      '',
      '对比 Java/C# 的名义类型（nominal typing）：那里必须显式 `implements`。'
    ].join('\n'),
    refs: ['ts-types']
  },
  {
    id: 'variance',
    term: '协变与逆变',
    aka: ['Covariance', 'Contravariance', '逆变', '协变'],
    group: 'typescript',
    short: '返回值方向是协变（子类型→父类型可赋值），函数参数方向是逆变（要求更宽而非更窄）。',
    detail: [
      '```ts',
      'interface Animal { name: string }',
      'interface Dog extends Animal { bark(): void }',
      '',
      'let a: Animal',
      'const d: Dog = { name: "d", bark() {} }',
      'a = d                                   // ✅ 协变',
      '',
      'type Handler = (e: Animal) => void',
      'const h: Handler = (e: Dog) => {}        // ❌ 逆变：参数不能更窄',
      '```',
      '',
      '为什么参数要逆变？因为调用方按 `Animal` 传参，实现却只接受 `Dog`，运行时会炸。`strictFunctionTypes` 开启后才会严格检查（方法声明仍是双变以兼容）。'
    ].join('\n'),
    refs: ['ts-types']
  },
  {
    id: 'mapped-type',
    term: '映射类型',
    aka: ['Mapped Type', '映射类型'],
    group: 'typescript',
    short: '用 in 遍历键集合批量生成类型，是 Partial / Pick / Record 等工具类型的实现基础。',
    detail: [
      '```ts',
      'type MyPartial<T> = { [K in keyof T]?: T[K] }',
      'type MyPick<T, K extends keyof T> = { [P in K]: T[P] }',
      'type Mutable<T> = { -readonly [K in keyof T]: T[K] }   // 去掉 readonly',
      '```',
      '',
      '配合 `as` 可以做键重映射：',
      '',
      '```ts',
      'type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] }',
      '```',
      '',
      '注意：映射类型在同态（homomorphic，直接 `keyof T`）时会保留可选性与 readonly，这是 `Partial` 能正确处理可选属性的原因。'
    ].join('\n'),
    refs: ['ts-types', 'ts-practice']
  },

  // ---------- 工程化与性能 ----------
  {
    id: 'tree-shaking',
    term: 'Tree Shaking',
    aka: ['TreeShaking', '摇树优化'],
    group: 'engineering',
    short: '基于 ESM 静态结构，打包时移除未被使用的导出；副作用代码无法安全移除。',
    detail: [
      'ESM 的导入导出是**静态**的，打包器可在编译期确定哪些导出没人用，从而删除。CommonJS 的 `require` 是运行时行为，基本无法摇。',
      '',
      '常见失效场景：',
      '',
      '- 包只提供 CJS 产物',
      '- `import * as ns` 后动态访问 `ns[key]`',
      '- 顶层有副作用（`import "./polyfill"`），需要 `sideEffects: false` 声明',
      '- Babel 把 ESM 编译成 CJS（`modules: false` 才保留）',
      '',
      '```json',
      '{ "sideEffects": ["*.css"] }',
      '```',
      '',
      '声明 `sideEffects` 时务必列出真正有副作用的文件，否则样式会被误删。'
    ].join('\n'),
    refs: ['build-tools', 'eng-modules']
  },
  {
    id: 'source-map',
    term: 'Source Map',
    aka: ['SourceMap', 'sourcesContent'],
    group: 'engineering',
    short: '把压缩后的行列号映射回源码的文件；线上应上传到监控平台而不是公开发布。',
    detail: [
      '映射关系用 VLQ 编码，字段包含生成文件、源码列表、`mappings`、`sourcesContent`。',
      '',
      '工程要点：',
      '',
      '- 生产构建用 `hidden-source-map`：生成 map 但不写 `sourceMappingURL` 注释，避免浏览器直接暴露源码',
      '- 构建产物上传到监控平台（Sentry 等），由平台在还原堆栈时使用',
      '- 发版时 map 与版本号绑定，回滚后仍可还原旧错误',
      '',
      '```js',
      '// vue.config.js / webpack',
      "module.exports = { productionSourceMap: false }  // 不用 devtool，改用 hidden-source-map",
      '```'
    ].join('\n'),
    refs: ['eng-quality', 'build-tools']
  },
  {
    id: 'long-task',
    term: '长任务',
    aka: ['Long Task', '长任务'],
    group: 'engineering',
    short: '占用主线程超过 50ms 的任务，会阻塞输入响应与渲染，是 INP 劣化的主因。',
    detail: [
      '浏览器把超过 50ms 的主线程任务标记为 Long Task，可用 PerformanceObserver 观测：',
      '',
      '```js',
      'new PerformanceObserver((list) => {',
      '  for (const entry of list.getEntries()) {',
      '    if (entry.duration > 50) console.warn("long task", entry.duration)',
      '  }',
      '}).observe({ type: "longtask", buffered: true })',
      '```',
      '',
      '拆解手段：`setTimeout` / `scheduler.yield()` 切片、`requestIdleCallback` 处理低优任务、Web Worker 移出 CPU 密集计算、虚拟列表减少 DOM 数量。'
    ].join('\n'),
    refs: ['perf-vitals']
  },
  {
    id: 'lcp',
    term: 'LCP',
    aka: ['Largest Contentful Paint', '最大内容绘制'],
    group: 'engineering',
    short: '视口内最大内容元素完成绘制的时间，衡量「主要内容可见」的速度，目标 ≤ 2.5s。',
    detail: [
      '只统计**视口内**的图片、视频封面、文本块等，取最大者。可能被图片加载、字体加载、渲染阻塞资源拖慢。',
      '',
      '常见优化：',
      '',
      '- 首屏主图用 `<img fetchpriority="high">`，不要懒加载',
      '- 预加载关键资源 `<link rel="preload">`',
      '- 减少渲染阻塞的 CSS/JS，关键 CSS 内联',
      '- 服务端 TTFB 优化（缓存、CDN、流式渲染）',
      '- 字体用 `font-display: swap` 并预加载，避免文字延迟',
      '',
      '注意：LCP 元素在加载完成前可能被替换，最终值以最后一次较大元素为准。'
    ].join('\n'),
    refs: ['perf-vitals']
  },
  {
    id: 'inp',
    term: 'INP',
    aka: ['Interaction to Next Paint', '交互到下次绘制'],
    group: 'engineering',
    short: '整个访问期间所有交互的响应延迟代表值（近似最差），目标 ≤ 200ms；2024 年起取代 FID。',
    detail: [
      '每个交互测「从输入到下一帧绘制」的延迟，最终取接近最差的高分位值。它暴露的是**主线程繁忙**问题，而不是首帧问题。',
      '',
      '优化方向：',
      '',
      '- 拆分长任务（>50ms），给输入让路',
      '- 减少不必要的重渲染（memo、状态下沉）',
      '- 事件处理里避免同步重活，移到 Worker',
      '- 避免在输入回调里强制同步布局',
      '- 用 `scheduler.yield()` / `isInputPending()` 主动让出'
    ].join('\n'),
    refs: ['perf-vitals']
  },
  {
    id: 'cls',
    term: 'CLS',
    aka: ['Cumulative Layout Shift', '累计布局偏移'],
    group: 'engineering',
    short: '页面加载期间非预期布局偏移的累计分数，目标 ≤ 0.1；多由图片无尺寸、字体替换、动态插入引起。',
    detail: [
      '分数 = 影响面积比例 × 位移距离比例，只统计「非用户交互引起」的偏移。',
      '',
      '治理：',
      '',
      '- 图片/视频/iframe 显式写 `width` `height` 或用 `aspect-ratio`',
      '- 字体用 `size-adjust` / `font-display: optional` 减少重排',
      '- 广告、Banner 等动态区域预留固定高度',
      '- 不要在已有内容上方插入元素',
      '',
      '```css',
      '.cover { aspect-ratio: 16 / 9; width: 100%; }',
      '```'
    ].join('\n'),
    refs: ['perf-vitals', 'css-modern']
  },
  {
    id: 'js-sandbox',
    term: 'JS 沙箱',
    aka: ['JS Sandbox', '沙箱'],
    group: 'engineering',
    short: '隔离子应用对全局变量、原型链、事件的修改，避免微前端之间互相污染。',
    detail: [
      '主流实现有两条路：',
      '',
      '1. **快照 / 代理沙箱**：记录并劫持 `window` 的读写（`Proxy`），卸载时撤销变更。轻量但拦不住 `eval` 里的逃逸。',
      '2. **iframe 沙箱**：天然隔离，用 `postMessage` 通信。隔离最彻底，但通信异步、样式/弹窗需额外处理。',
      '',
      '```js',
      'const fakeWindow = new Proxy(window, {',
      '  set(target, key, value) { sandboxMap.set(key, value); return true },',
      '  get(target, key) { return sandboxMap.has(key) ? sandboxMap.get(key) : target[key] }',
      '})',
      '```',
      '',
      '即使有沙箱，**样式隔离仍要单独做**（Shadow DOM / CSS Modules / 前缀）。'
    ].join('\n'),
    refs: ['micro-frontend']
  },
  {
    id: 'style-isolation',
    term: '样式隔离',
    aka: ['Style Isolation', '样式隔离'],
    group: 'engineering',
    short: '防止微前端子应用的 CSS 泄漏或互相覆盖；常用 Shadow DOM、CSS Modules、运行时加前缀。',
    detail: [
      '三种方案与取舍：',
      '',
      '| 方案 | 隔离强度 | 代价 |',
      '| --- | --- | --- |',
      '| Shadow DOM | 强（选择器不越界） | 全局样式/字体需手动注入，弹窗挂载点要处理 |',
      '| CSS Modules / scoped | 中（构建期加哈希） | 依赖构建，第三方库样式仍可能冲突 |',
      '| 运行时前缀 / 动态样式表 | 弱（尽力而为） | 实现简单，`!important` 与 `body` 样式仍会泄漏 |',
      '',
      '实践：主应用与子应用都开启 scoped/CSS Modules，弹窗统一挂到约定容器，弃用全局选择器。'
    ].join('\n'),
    refs: ['micro-frontend']
  },
  {
    id: 'monorepo',
    term: 'Monorepo',
    aka: ['Monorepo', '单仓多包'],
    group: 'engineering',
    short: '多个包放在同一仓库统一管理，共享依赖与构建配置；代价是构建隔离与版本发布更复杂。',
    detail: [
      '常见工具：pnpm workspace、Nx、Turborepo、Rush。',
      '',
      '```yaml',
      '# pnpm-workspace.yaml',
      'packages:',
      '  - "apps/*"',
      '  - "packages/*"',
      '```',
      '',
      '关键能力：**任务编排 + 增量构建**（只构建受影响的包）、**统一版本与规范**、**原子提交**（跨包改动一次提交）。',
      '',
      '注意：pnpm 用符号链接 + 硬链接实现「同一份物理文件，多处引用」，因此不要再配 `nohoist` 式提升；跨包引用用 `workspace:*` 协议。'
    ].join('\n'),
    refs: ['engineering-practice', 'eng-modules']
  },
  {
    id: 'dto',
    term: 'DTO',
    aka: ['Data Transfer Object', '数据传输对象'],
    group: 'engineering',
    short: '接口层的形状契约；与视图模型（VO）分离，避免后端字段变化直接污染组件。',
    detail: [
      '分层的意义在于**变更隔离**：后端改字段名时，只改 DTO → VO 的转换层，不动组件。',
      '',
      '```ts',
      '// DTO：与后端一致，字段可能是下划线、可能为 null',
      'interface UserDTO { user_id: number; nick_name: string | null }',
      '',
      '// VO：前端视图需要的样子',
      'interface UserVO { id: number; name: string }',
      '',
      'const toVO = (d: UserDTO): UserVO => ({ id: d.user_id, name: d.nick_name ?? "匿名" })',
      '```',
      '',
      '何时不必分层？小项目、单页面、字段稳定时，直接透传更省事——但要在文档里写清这个取舍。'
    ].join('\n'),
    refs: ['frontend-arch']
  },
  {
    id: 'ssg',
    term: 'SSR / SSG',
    aka: ['SSR', 'SSG', '服务端渲染', '静态生成'],
    group: 'engineering',
    short: 'SSR 请求时在服务端出 HTML；SSG 构建时预生成 HTML。前者实时、后者更快更省，但内容需可预知。',
    detail: [
      '| | SSR | SSG |',
      '| --- | --- | --- |',
      '| 生成时机 | 每次请求 | 构建时 |',
      '| 首屏 | 快（HTML 直达） | 最快（可 CDN） |',
      '| 数据实时性 | 高 | 需 ISR / 重新构建 |',
      '| 运维成本 | 需要 Node 服务 | 纯静态托管 |',
      '',
      '共同代价：需要**水合（hydration）**，即客户端再执行一遍 JS 绑定事件，水合期间交互无响应。RSC 与「岛屿架构」正是在压缩这部分成本。',
      '',
      '选择口径：内容型站点优先 SSG，个性化/实时数据用 SSR，纯后台系统用 CSR 更省事。'
    ].join('\n'),
    refs: ['frontend-arch']
  }
]

/** 名称 / 别名 → 词条 */
export const glossaryMap = (() => {
  const map = new Map()
  glossaryTerms.forEach((entry) => {
    map.set(entry.term, entry)
    ;(entry.aka || []).forEach((alias) => {
      if (!map.has(alias)) map.set(alias, entry)
    })
  })
  return map
})()

export function getTermById(id) {
  return glossaryTerms.find((t) => t.id === id) || null
}

export function lookupTerm(key) {
  if (!key) return null
  return glossaryMap.get(key.trim()) || null
}

export function groupOf(id) {
  return glossaryGroups.find((g) => g.id === id) || null
}
