微前端是个被严重误用的词。很多人第一次听到时，以为它是"把前端拆小"；也有人以为它是性能优化方案。这两种理解都会导致错误的技术决策。

这一篇从零讲起：它到底是什么、解决什么问题、有哪几种实现流派、怎么落地、怎么判断该不该上。

## 一、先搞清楚它是什么

### 一句话定义

> **微前端是把一个前端应用，拆成若干个可以独立开发、独立测试、独立部署、运行时组合成一个整体的"子应用"的架构模式。**

关键词是**独立部署**。如果拆完之后还是要一起发版，那只是"代码分包"，不是微前端。

### 它借用自微服务，但有个关键差异

| | 微服务 | 微前端 |
| --- | --- | --- |
| 拆分边界 | 服务端（进程/接口） | 浏览器（页面/区块） |
| 通信方式 | 网络调用（HTTP/RPC） | 共享内存、事件、路由 |
| 隔离强度 | 进程级，天然隔离 | **同进程同页面，隔离要靠人为手段** |
| 失败影响 | 服务间可降级 | 一个子应用崩了可能拖垮整页 |
| 部署 | 独立 | 独立 |

最后两行是重点：**后端微服务之间天然隔离，前端子应用之间不隔离**。这正是微前端最大的复杂度来源——你必须自己解决 JS 全局变量污染、样式冲突、路由抢夺、依赖重复。

## 二、它到底解决什么问题

### 场景 A：多团队并行，互相等待（最常见的真实动机）

```
一个单体前端，5 个团队共同维护
  → 每天都要解决 merge 冲突
  → 发版要等所有人就绪（"发版列车"）
  → 一个团队的 bug 阻塞所有人上线
```

微前端让每个团队拥有独立的仓库、构建、发布流水线，**发版解耦**。

### 场景 B：存量系统渐进迁移

```
老系统是 jQuery / Vue 2 / AngularJS
  想换到 Vue 3 / React 18
  全量重写：风险大、周期长、业务不能停
```

微前端允许**按页面逐个替换**，新旧共存，随时可回滚。这是微前端**最合理、风险最低**的场景。

### 场景 C：技术栈异构共存（很少是真实需求）

```
A 部门买了 React 生态的 SaaS 组件
B 部门有 Vue 2 的存量报表
C 部门在试点 Svelte
```

只有在**组织层面确实无法统一技术栈**时才成立。多数情况下"异构"是历史包袱，不是需求。

### 它**不**解决什么

| 误解 | 事实 |
| --- | --- |
| "微前端能加快首屏" | 通常更慢（多一次加载、依赖重复） |
| "微前端能减少代码量" | 总量增加（基座、通信层、适配层） |
| "微前端让代码更好维护" | 局部更好维护，**整体更难调试** |
| "小团队也该上微前端" | 小团队上微前端几乎必亏 |

::: warn 一个必须记住的判断
**微前端是"组织问题的技术解法"，不是"技术问题的技术解法"。**

如果你的痛点是"单页太大、加载慢"，应该用代码分割、懒加载、Tree Shaking；
只有当痛点是"多个团队互相阻塞发版"或"存量系统无法停机重写"时，微前端才是对症的。
:::

## 三、五类实现流派

按**组合时机**分类，这是理解所有方案的骨架。

```
微前端方案
├── 构建时组合
│   └── npm 包复用（严格说不是微前端）
├── 运行时组合
│   ├── iframe 沙箱
│   ├── JS 沙箱加载（qiankun / single-spa / wujie）
│   └── Web Components
├── 服务端组合
│   └── SSI / 边缘包含（Edge Side Include）
└── 模块级共享
    └── Module Federation
```

### 流派 1：构建时组合（npm 包）

子应用打成 npm 包，基座 `import` 后一起构建。

```js
// 基座
import UserModule from '@acme/user-module'
app.use(UserModule)
```

| 优点 | 缺点 |
| --- | --- |
| 类型安全、依赖共享 | **不能独立部署**（必须重新构建基座） |
| 调试简单 | 版本耦合（基座锁死子包版本） |

**它不是微前端**，只是"组件库/模块化"的变体。列在这里是为了澄清常见混淆。

### 流派 2：运行时 JS 沙箱（qiankun / wujie / single-spa）

这是国内主流方案。子应用独立部署，基座在运行时用脚本加载并挂载。

```js
// qiankun 注册
registerMicroApps([
  {
    name: 'user-app',
    entry: '//user.example.com/app.js',
    container: '#subapp-container',
    activeRule: '/user'
  }
])
start()
```

核心要做三件事：

1. **加载**子应用的 HTML / JS，解析出入口
2. **挂载**到指定容器，同时启动沙箱
3. **卸载**时清理副作用（定时器、事件、全局变量）

```js
// single-spa 的生命周期契约（qiankun 基于它）
export async function bootstrap() {}
export async function mount(props) {}
export async function unmount(props) {}
```

所有运行时方案都要实现这套生命周期约定。

### 流派 3：iframe

```html
<iframe src="//report.example.com" sandbox="allow-scripts allow-same-origin"></iframe>
```

| 优点 | 缺点 |
| --- | --- |
| **隔离最彻底**（独立的 window/document/CSS） | 弹窗无法覆盖父页面 |
| 天然支持不同技术栈 | 路由与刷新体验割裂 |
| 几乎零改造 | 通信只能 postMessage |
| 安全性最好 | 内存与性能开销大 |

适合：**完全不可信的三方页面**、需要强隔离的后台工具嵌入。

::: tip iframe 的"弹窗盖不住"问题
子应用在 iframe 内，它的 Modal 只能盖住 iframe 区域，无法覆盖父页面。

业界两个解法：

1. **顶部弹窗服务**：父页面提供 `openModal()`，通过 postMessage 让父级渲染
2. **iframe 尺寸动态撑满**：子应用高度设为 doc 高度，父页面滚动（体验仍不自然）

这是 iframe 方案最容易被低估的成本。
:::

### 流派 4：Module Federation（模块级共享）

Webpack 5 / Rspack 提供的能力，**运行时共享模块**。

```js
// host（基座）
new ModuleFederationPlugin({
  name: 'host',
  remotes: { shop: 'shop@https://shop.example.com/remoteEntry.js' },
  shared: { react: { singleton: true, requiredVersion: '^18.0.0' } }
})

// remote（子应用）
new ModuleFederationPlugin({
  name: 'shop',
  filename: 'remoteEntry.js',
  exposes: { './Cart': './src/Cart' },
  shared: { react: { singleton: true } }
})
```

```jsx
// 基座中按需加载远程组件
const Cart = React.lazy(() => import('shop/Cart'))
```

| 优点 | 缺点 |
| --- | --- |
| 依赖真正共享（不重复打包） | **不做 JS 沙箱**（全局仍共享） |
| 粒度细（可只共享一个组件） | 版本协商复杂（singleton 冲突） |
| 性能最好 | 调试跨构建困难 |

它更像"跨构建的代码复用"，而不是完整的微前端框架。常与沙箱方案组合使用。

### 流派 5：Web Components

用 Custom Elements 把子应用封装成自定义标签。

```js
class UserCard extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.innerHTML = '<div>...</div>'
  }
}
customElements.define('user-card', UserCard)
```

| 优点 | 缺点 |
| --- | --- |
| 浏览器原生样式隔离（Shadow DOM） | 与 React/Vue 生态融合成本高 |
| 无框架依赖 | 事件、context、路由都需要桥接 |
| 标准、长期可用 | SSR 支持不成熟 |

适合**长期演进的组件级隔离**，不适合整页子应用。

### 五种方案横向对比

| 方案 | 独立部署 | JS 隔离 | 样式隔离 | 依赖共享 | 改造成本 |
| --- | --- | --- | --- | --- | --- |
| npm 包 | ❌ | — | — | ✅ | 低 |
| qiankun | ✅ | 中（Proxy） | 中 | 手动 | 中 |
| wujie | ✅ | 强（iframe+Proxy） | 强 | 手动 | 中 |
| iframe | ✅ | 极强 | 极强 | ❌ | 极低 |
| Module Federation | ✅ | ❌ | ❌ | ✅ | 中 |
| Web Components | ✅ | 中 | 强 | ❌ | 中高 |

## 四、三个必须解决的核心难题

这是面试最常深挖的部分。任何运行时微前端方案都要面对同样的三件事。

### 难题 1：JS 全局污染

子应用 A 挂了 `window.$ = jQuery`，子应用 B 挂了 `window.$ = Zepto`，两者互相覆盖。

**解法：沙箱**

```js
// 快照沙箱（简单，但无法多实例）
class SnapshotSandbox {
  constructor() {
    this.snapshot = {}
  }
  active() {
    // 记录当前 window 状态
    for (const key in window) this.snapshot[key] = window[key]
  }
  inactive() {
    // 还原 window，并记录子应用新增的变量
    for (const key in window) {
      if (!(key in this.snapshot)) delete window[key]
      else window[key] = this.snapshot[key]
    }
  }
}
```

```js
// Proxy 沙箱（qiankun 的 legacy 模式，支持单实例）
class ProxySandbox {
  constructor() {
    const fakeWindow = {}
    this.proxy = new Proxy(fakeWindow, {
      get: (target, key) => key in target ? target[key] : window[key],
      set: (target, key, value) => {
        target[key] = value
        return true
      }
    })
  }
}
```

```js
// 多实例 Proxy 沙箱（qiankun 新版）：每个子应用一个 fakeWindow
// 优点：互不影响，可同时挂载多个子应用
```

**沙箱的边界**（面试高频追问）：

| 能拦截 | 拦不住 |
| --- | --- |
| `window.xxx = ...` | 定时器内部闭包 |
| `window.fn()` | 直接修改 `Object.prototype` |
| `document.querySelector` 部分 | 事件监听器（需额外收集） |
| `localStorage` | Web Worker / iframe 内的 window |

所以生产环境还要额外收集与清理：

```js
// 子应用卸载时必须清理
const timers = []
const listeners = []

// 劫持以登记
const rawSetInterval = window.setInterval
window.setInterval = (...args) => {
  const id = rawSetInterval(...args)
  timers.push(id)
  return id
}
```

### 难题 2：样式污染

子应用 A 的 `.button { color: red }` 会影响子应用 B。

| 方案 | 原理 | 局限 |
| --- | --- | --- |
| **CSS Modules / scoped** | 编译期加哈希后缀 | 只对自己的样式生效 |
| **命名前缀** | 约定 `.app-a-button` | 靠人守规矩，第三方组件库破坏前缀 |
| **Shadow DOM** | 浏览器原生隔离 | 弹窗挂载到 body 时会逃出 Shadow |
| **qiankun 的实验性 scoped** | 运行时给子应用所有样式加前缀 | 性能开销，动态插入的样式可能漏 |

```js
// Shadow DOM 的关键陷阱
class AppA extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' })
    // 这里渲染的内容样式被隔离
    // 但第三方库用 document.body.appendChild 的 Modal 不在 Shadow 内
  }
}
```

::: warn 最现实的建议
**样式隔离不要指望"框架自动解决"**。生产项目的可行组合：

1. 所有子应用使用 CSS Modules 或 scoped（基础保证）
2. 子应用 CSS 加统一前缀（兜底）
3. 弹窗/下拉统一由基座提供组件（避免逃逸）
4. 引入 UI 库时统一主题变量命名空间
:::

### 难题 3：路由与容器

两个关键决策：**谁管路由**、**子应用挂在哪**。

```js
// 方案 A：基座统管（qiankun 默认）
// 基座根据 activeRule 决定激活哪个子应用
registerMicroApps([{ name: 'a', activeRule: '/a' }])

// 方案 B：子应用自治（single-spa 的 hash 方案）
// 子应用自己处理内部路由，基座只负责挂载
```

| 决策 | 说明 |
| --- | --- |
| 路由模式 | 主应用用 history，子应用也必须是 history（hash 会互相干扰） |
| base 路径 | 子应用需配置 `base`，否则静态资源 404 |
| 刷新 | 直接访问子应用路径时，服务端必须回退到主应用 HTML |
| 容器 | 每个子应用一个容器 div，卸载时清空 |

## 五、落地：一次真实的接入过程

以 qiankun 为例，说明具体要改什么。

### 基座侧（主应用）

```js
// main.js
import { registerMicroApps, start, initGlobalState } from 'qiankun'

// 1. 定义子应用
registerMicroApps([
  {
    name: 'order',
    entry: process.env.NODE_ENV === 'production'
      ? '//order.example.com/'
      : '//localhost:8081',
    container: '#subapp-viewport',
    activeRule: '/order',
    props: { token: getToken() }
  }
])

// 2. 全局状态（子应用通过 props 或 initGlobalState 通信）
const actions = initGlobalState({ user: null })
actions.onGlobalStateChange((state) => { /* ... */ })

// 3. 启动
start({
  sandbox: { experimentalStyleIsolation: true },
  prefetch: 'all'  // 空闲时预取，改善切换体验
})
```

```html
<!-- 容器 -->
<router-view v-slot="{ Component }">
  <div id="subapp-viewport"></div>
</router-view>
```

### 子应用侧

```js
// 入口文件需要导出生命周期
let instance = null

function render(props = {}) {
  const { container } = props
  instance = createApp(App)
  instance.mount(container ? container.querySelector('#app') : '#app')
}

// 独立运行时直接挂载，作为子应用时等待调用
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

export async function bootstrap() {}
export async function mount(props) {
  render(props)
}
export async function unmount() {
  instance?.unmount()
  instance = null
}
```

```js
// 关键：让 webpack 输出 UMD，并允许跨域加载
module.exports = {
  output: {
    library: 'order-app',
    libraryTarget: 'umd',
    publicPath: '//order.example.com/'
  },
  devServer: { headers: { 'Access-Control-Allow-Origin': '*' } }
}
```

### 必须处理的六个配置点

| 项 | 说明 |
| --- | --- |
| `publicPath` | 子应用静态资源必须用绝对地址（否则相对基座路径 404） |
| CORS | 基座要 fetch 子应用 HTML/JS，子应用需允许跨域 |
| 路由 base | 子应用 router 的 base 必须与 activeRule 一致 |
| 生命周期 | 必须导出 `bootstrap/mount/unmount`，否则无法卸载 |
| 全局变量 | 入口不要直接读写 window，用 props 传 |
| 图标/字体 | 同样需要绝对路径 |

::: warn 最常见的接入失败
```
子应用独立访问正常，接入后白屏
→ 90% 是 publicPath / 静态资源路径问题
→ 检查 Network：JS 404 说明 publicPath 没设绝对地址
```
:::

## 六、通信机制怎么设计

子应用之间不能直接 import，需要明确通道。

| 方案 | 强度 | 场景 |
| --- | --- | --- |
| props 传递 | 单向、简单 | 基座 → 子应用（token、用户信息） |
| 全局状态（initGlobalState） | 双向、响应式 | 共享用户、权限、主题 |
| 事件总线（EventEmitter） | 松耦合 | 跨应用通知（如"下单成功"） |
| URL / query | 可分享、可刷新 | 需要刷新后保持的参数 |
| postMessage | 跨 iframe/窗口 | iframe 方案必用 |

```js
// 全局状态的正确用法：只放真正跨应用的数据
initGlobalState({
  user: { id, name, roles },   // ✅ 跨应用共享
  theme: 'dark'                // ✅ 全局配置
})

// ❌ 不要放：某个页面的列表数据（会导致所有子应用重渲染）
```

::: tip 通信设计的原则
**能用 props 就不要用全局状态，能用 URL 就不要用事件。**

因为：
- props 是显式的，调试时能看到来源
- 全局状态隐式，容易变成"谁都能改的公共变量"
- URL 可分享、可回退，是天然的状态源
:::

## 七、选型决策树

这是面试最想听的部分：**不是"你知道几个方案"，而是"你怎么选"**。

```
是否只有 1 个团队？
├── 是 → 不要上微前端（用模块化 + 分包）
└── 否 → 是否必须独立部署？
         ├── 否 → 不要上微前端
         └── 是 → 是否需要强隔离（不可信三方 / 完全不同技术栈）？
                  ├── 是 → iframe 或 wujie
                  └── 否 → 是否需要共享依赖、避免重复打包？
                           ├── 是 → Module Federation + 沙箱组合
                           └── 否 → qiankun / single-spa
```

### 逐层展开的选型表

| 你的情况 | 推荐 | 理由 |
| --- | --- | --- |
| 单团队、单应用 | **不上微前端** | 收益为 0，成本为正 |
| 单团队、想按业务分包 | 领域分包 + 独立 CI | 达到"发布解耦"效果，成本低得多 |
| 多团队、技术栈统一、中后台 | qiankun | 生态成熟、文档多、沙箱够用 |
| 多团队、需要强隔离 | wujie | iframe + Proxy 组合，隔离更强 |
| 嵌入完全不可信三方 | iframe | 浏览器级隔离 |
| 只想共享组件/工具库 | Module Federation | 粒度细、无沙箱负担 |
| 存量系统逐页替换 | qiankun / wujie | 支持新旧共存、灰度和回滚 |
| 长期演进、希望标准化 | Web Components | 浏览器标准，无框架绑定 |

### 成本清单（用于向老板解释）

| 成本项 | 量化参考 |
| --- | --- |
| 基座开发与维护 | 需要 1–2 人长期投入 |
| 子应用适配改造 | 每个子应用 1–3 人日 |
| 公共依赖重复 | 首屏增加 100–300KB（除非用 MF 共享） |
| 调试复杂度 | 跨仓库定位问题，平均排查时间 ×2 |
| 发布协调 | 基座升级可能破坏子应用契约，需要版本兼容策略 |
| 隔离不彻底 | 仍会有样式/全局变量问题需要人工兜底 |

::: interview 面试视角
**"你会选哪个方案"是伪命题，"你凭什么这么选"才是真问题。**

高分回答的结构：

1. 先问清楚：几个团队？能否统一技术栈？是否需要独立部署？
2. 明确收益：能解决什么具体痛点（发版阻塞？存量迁移？）
3. 承认成本：依赖重复、调试复杂、隔离不彻底、需要专人维护
4. 给出结论并说明**为什么排除其他方案**
5. 给出验证方式：先在 1 个子应用试点，量化切换耗时与问题率

低分回答的特征：直接说"我们用 qiankun"，却说不出为什么不用 iframe、为什么不用 Module Federation、为什么不上单应用分包。
:::

## 八、不上微前端的替代方案

这是很多人忽略的部分。**大多数"微前端需求"其实有更便宜的解法。**

### 替代 1：Monorepo + 领域分包

```
apps/
├── admin/          # 独立构建、独立部署
├── portal/
packages/
├── shared-ui/      # 共享组件
├── shared-utils/
└── domain-order/   # 业务领域包
```

用 pnpm workspace + Turborepo，每个 `apps/*` 独立构建部署，`packages/*` 共享代码。

**达到了"独立部署 + 代码复用"，但没有运行时组装的复杂度。**

### 替代 2：单 SPA + 路由级代码分割

```js
const routes = [
  { path: '/order', component: () => import('./modules/order') },
  { path: '/user', component: () => import('./modules/user') }
]
```

按业务域拆分 chunk，按团队划分目录，用 CODEOWNERS 明确归属。**发版仍是一个**，但冲突大幅减少。

### 替代 3：独立应用 + 统一导航跳转

```
portal.example.com      → 统一登录、导航
order.example.com       → 订单系统
user.example.com        → 用户系统
```

用 SSO 共享登录态，导航时整页跳转。**零框架成本**，缺点是跳转有白屏。

对很多内部系统来说，这个方案的"性价比"远高于微前端。

### 三者对比

| 方案 | 独立部署 | 代码共享 | 运行时复杂度 | 切换体验 |
| --- | --- | --- | --- | --- |
| Monorepo 分包 | ✅ | ✅ | 低 | 好 |
| 单 SPA 分包 | ❌ | ✅ | 极低 | 最好 |
| 独立应用跳转 | ✅ | ❌ | 零 | 差（白屏） |
| 微前端 | ✅ | 手动 | 高 | 好 |

## 九、面试答题模板

**Q：什么是微前端？你们项目为什么（没）用？**

::: interview 参考答案
**1. 定义**：把前端拆成可独立开发、测试、部署的子应用，运行时组合成一个整体。关键词是"独立部署"，否则只是代码分包。

**2. 它解决的问题**：多团队发版解耦（最常见）、存量系统渐进迁移（最合理）、技术栈异构共存（最少见）。

**3. 主流方案**：运行时沙箱（qiankun / wujie）、iframe（隔离最强）、Module Federation（依赖共享）、Web Components（标准隔离）。差异在隔离强度、依赖共享与改造成本。

**4. 我们的情况**：5 人团队、单应用、技术栈统一。真正的痛点是"发版时互相等待"，所以我们用 Monorepo + 领域分包 + 独立 CI 解决，而不是上微前端——因为微前端会引入基座维护、依赖重复、调试复杂三项成本，而我们的收益只是"发版解耦"，用更轻的方式就能达到。

**5. 如果要做**：会先用 1 个非核心子应用试点，量化三个指标——切换耗时、首屏增量、跨应用问题数；确认收益大于成本后再推广。
:::

### 高频追问与要点

| 追问 | 回答要点 |
| --- | --- |
| JS 沙箱怎么实现？ | 快照沙箱 / Proxy 沙箱；说清能拦什么、拦不住什么（定时器、原型修改、事件） |
| 样式怎么隔离？ | CSS Modules → 前缀 → Shadow DOM；说明 Shadow DOM 弹窗逃逸问题 |
| 子应用怎么通信？ | props 优先、URL 次之、全局状态兜底；强调不要什么都放全局 |
| 依赖怎么共享？ | externals 或 Module Federation 的 singleton；说明版本冲突风险 |
| 怎么回滚？ | 子应用独立部署天然可回滚；基座需保留历史版本资源 |
| 怎么调试？ | 跨仓库 source map、统一日志、本地同时起多应用 |
| 为什么不用 iframe？ | 弹窗无法覆盖父页面、路由割裂、性能开销；但完全不可信三方应用 iframe 仍是首选 |

::: warn 回答时最常见的两个错误
1. **把微前端说成性能优化方案**——它通常让加载更慢
2. **说"我们用了 qiankun"就结束**——没有约束、没有对比、没有成本分析
:::