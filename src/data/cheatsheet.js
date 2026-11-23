/**
 * 知识点速查手册
 * 每条：title / category / points（字符串数组，支持行内代码）
 */

export const cheatCategories = [
  { id: 'js', title: 'JavaScript', icon: 'JS', accent: '#c9a227' },
  { id: 'ts', title: 'TypeScript', icon: 'TS', accent: '#3178c6' },
  { id: 'css', title: 'CSS', icon: 'CSS', accent: '#264de4' },
  { id: 'browser', title: '浏览器 / 网络', icon: 'NET', accent: '#0f766e' },
  { id: 'vue', title: 'Vue 3', icon: 'V', accent: '#42b883' },
  { id: 'react', title: 'React', icon: 'R', accent: '#61dafb' },
  { id: 'perf', title: '工程化 / 性能', icon: 'ENG', accent: '#7c3aed' }
]

export const cheatSheets = [
  {
    id: 'js-coercion',
    category: 'js',
    title: '隐式转换与比较',
    points: [
      'ToPrimitive：先 Symbol.toPrimitive，再 valueOf，再 toString（Date 例外，默认 hint 为 string）',
      '`+` 只要有一侧是字符串 / 对象转原始值为字符串 → 拼接',
      '`==` 只在同类型或用 null/undefined 互比时安全，其余一律用 `===`',
      '假值共 8 个：false、0、-0、0n、""、null、undefined、NaN',
      '`Object.is` 修复 NaN 与 ±0；`Number.isNaN` 只对真 NaN 为 true',
      '`Number("")` 为 0，`Number(" 12 ")` 为 12，`Number("12px")` 为 NaN'
    ]
  },
  {
    id: 'js-scope',
    category: 'js',
    title: '作用域 / 闭包 / this',
    points: [
      'var：函数作用域 + 变量提升；let/const：块级作用域 + TDZ',
      'const 只约束绑定，不约束对象内部',
      'this 绑定优先级：new > 显式 bind/call/apply > 隐式 obj.fn() > 默认',
      '箭头函数没有自己的 this/arguments，不能被 new',
      '闭包保留的是被引用的变量；循环中用 let 或 IIFE 隔离',
      '`var` 在 for 头部每轮共享同一绑定，`let` 每轮新建'
    ]
  },
  {
    id: 'js-async',
    category: 'js',
    title: '事件循环 / Promise',
    points: [
      '一轮循环：一个宏任务 → 清空微任务队列 → 可能渲染 → 下一个宏任务',
      '微任务：Promise.then、queueMicrotask、MutationObserver',
      '宏任务：setTimeout、setInterval、I/O、UI 事件回调',
      'Promise 状态不可逆：pending → fulfilled / rejected',
      'then 返回新 Promise，抛错不会中断事件循环',
      '`Promise.all` 快速失败；`allSettled` 全量等待；`race` 取最先落定；`any` 取首个成功',
      'async 函数返回 Promise，await 之后是微任务续体'
    ]
  },
  {
    id: 'js-object',
    category: 'js',
    title: '对象与原型',
    points: [
      '`obj.__proto__` ↔ `Object.getPrototypeOf(obj)`；`Foo.prototype` 是函数属性',
      '原型链终点是 `Object.prototype.__proto__ === null`',
      '`in` 查原型链，`hasOwnProperty` 只查自身',
      '属性描述符：value/writable/enumerable/configurable，访问器用 get/set',
      '`Object.create(null)` 创建无原型对象，可安全做字典',
      '寄生组合继承：`Child.prototype = Object.create(Parent.prototype)` + 修正 constructor'
    ]
  },
  {
    id: 'ts-types',
    category: 'ts',
    title: 'TypeScript 类型武器库',
    points: [
      '`Partial` / `Required` / `Readonly` 都是映射类型',
      '`Pick<T, K>` 与 `Omit<T, K> = Pick<T, Exclude<keyof T, K>>`',
      '`Exclude<T, U>` 用分布式条件类型实现，`Extract` 相反',
      '`ReturnType` / `Parameters` 依赖 `infer`',
      '`as const` 保留字面量与 readonly，仅影响类型',
      '`satisfies` 校验兼容性且保留窄类型',
      '判别联合（discriminated union）配合 `never` 做穷尽性检查'
    ]
  },
  {
    id: 'ts-practice',
    category: 'ts',
    title: '类型设计实践',
    points: [
      '函数重载签名对调用方可见，实现签名不可见',
      '泛型默认值 `T = string`，约束 `T extends object`',
      '`Record<K, V>` 适合字面量键映射；用 `Partial<Record<>>` 表达可选映射',
      '避免 `any`，优先 `unknown` + 收窄',
      '`never` 可用于穷尽检查：`default: assertNever(x)`',
      '开启 `strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`'
    ]
  },
  {
    id: 'css-layout',
    category: 'css',
    title: '布局与层叠',
    points: [
      'BFC 触发：float、overflow≠visible、display: flow-root、flex/grid item、绝对定位元素',
      'BFC 用途：清除浮动、阻止 margin 折叠、隔离自适应布局',
      '`position: sticky` 需要滚动祖先与阈值，父级 overflow:hidden 会失效',
      '层叠上下文触发：transform、opacity<1、filter、will-change、isolation: isolate',
      'Flex 主轴：`justify-content`，交叉轴：`align-items`；`flex-basis` 优先级高于 width',
      'Grid 的 `minmax(0, 1fr)` 可修复内容溢出的经典问题'
    ]
  },
  {
    id: 'css-modern',
    category: 'css',
    title: '现代 CSS',
    points: [
      '`@layer` 层顺序决定优先级，未分层样式优先级最高',
      '`@container` 需祖先 `container-type: inline-size`',
      '`:has()` 是父选择器，注意性能敏感场景',
      '逻辑属性 `margin-inline-start` 天然支持 RTL',
      '`color-mix()` / `oklch()` 提供更均匀的颜色空间',
      '`@property` 让自定义属性可被动画与类型校验'
    ]
  },
  {
    id: 'browser-render',
    category: 'browser',
    title: '渲染与性能',
    points: [
      '流水线：DOM → CSSOM → Render Tree → Layout → Paint → Composite',
      '重排必重绘，重绘不一定重排；transform/opacity 只合成',
      '合成层滥用会吃显存，用 `will-change` 需及时移除',
      '`requestAnimationFrame` 与帧对齐，适合动画',
      '长任务 > 50ms 会阻塞交互，用 `scheduler.yield` / 分片拆解',
      '避免强制同步布局（读写交替的 layout thrashing）'
    ]
  },
  {
    id: 'net-http',
    category: 'browser',
    title: 'HTTP 与缓存',
    points: [
      '强缓存：`Cache-Control: max-age` / `immutable`',
      '协商缓存：`ETag`+`If-None-Match`、`Last-Modified`+`If-Modified-Since`',
      '`no-cache` 是必须校验，`no-store` 是不存储',
      'HTTP/2：二进制分帧、多路复用、HPACK；HTTP/3：QUIC 解决 TCP 队头阻塞',
      '`preconnect` / `preload` / `prefetch` / `modulepreload` 各司其职',
      'CORS 预检条件：非简单方法、非白名单头、非白名单 Content-Type'
    ]
  },
  {
    id: 'browser-security',
    category: 'browser',
    title: '安全与存储',
    points: [
      'Cookie：`HttpOnly`、`Secure`、`SameSite=Lax/Strict/None`',
      'CSRF 防御：SameSite + CSRF Token + 校验 Origin/Referer',
      'XSS 防御：输出转义、CSP、避免 `innerHTML`、慎用 `dangerouslySetInnerHTML`',
      'localStorage 同步阻塞、5MB 上限、不可跨域；IndexedDB 异步、容量大',
      '`window.opener` 风险：外链加 `rel="noopener noreferrer"`',
      'iframe 隔离：`sandbox`、`allow` 白名单'
    ]
  },
  {
    id: 'vue',
    category: 'vue',
    title: 'Vue 3 核心',
    points: [
      '`reactive` 基于 Proxy，`ref` 用 `.value` 包一层并可持有原始值',
      '`ref` 在模板中自动解包；`reactive` 解构会丢失响应性（用 `toRefs`）',
      'effect 调度：computed 有 dirty 标记，watch 支持 flush: pre/post/sync',
      '编译优化：静态提升、PatchFlags、Block Tree、缓存事件处理函数',
      'diff：同层比较 + 双端对比，最长递增子序列减少移动',
      '`v-if` 切换销毁重建，`v-show` 只切 display；频繁切换用 v-show'
    ]
  },
  {
    id: 'react',
    category: 'react',
    title: 'React 核心',
    points: [
      'Fiber 是可中断的工作单元，双缓存树完成提交',
      'Hooks 按调用顺序存在 Fiber 的 memoizedState 链表上',
      '`setState` 批处理：事件与生命周期内合并，18 之后自动批处理覆盖异步',
      '`useMemo` 缓存值，`useCallback` 缓存函数引用；不要过早优化',
      '`useEffect` 在绘制后异步执行，`useLayoutEffect` 在绘制前同步执行',
      '并发特性：`startTransition`、`useDeferredValue`、Suspense'
    ]
  },
  {
    id: 'perf',
    category: 'perf',
    title: '工程化与性能指标',
    points: [
      'Core Web Vitals：LCP < 2.5s、INP < 200ms、CLS < 0.1',
      'LCP 优化：预加载主图、减少阻塞资源、提升 TTFB',
      'INP 优化：拆分长任务、减少主线程工作、避免同步布局',
      'CLS 优化：给媒体设置宽高、字体 `size-adjust`、避免动态插入顶部内容',
      'Vite：开发态 ESM 按需编译 + 依赖预构建；生产用 Rollup',
      'Tree Shaking 依赖 ESM 静态结构与 `sideEffects` 声明',
      '分包策略：按路由拆分 + 稳定 vendor chunk 提升缓存命中'
    ]
  }
]

export function getCheatByCategory(id) {
  return cheatSheets.filter((item) => item.category === id)
}