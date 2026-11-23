/* eslint-disable */
/** Vue：第 36–49 题 */

export const vueQuestions = [
  {
    id: 'vue-01',
    code: 36,
    title: 'Vue 3 响应式原理与 Proxy 替换 defineProperty 的原因',
    categoryId: 'vue',
    level: '高级',
    freq: '极高',
    tags: ['Proxy', '响应式', '依赖收集'],
    question:
      'Vue 3 的响应式原理是什么？与 Vue 2 有什么区别？为什么用 Proxy 替代 Object.defineProperty？effect、track、trigger 的完整链路是怎样的？',
    answerId: 'vue-01',
    followups: ['effect 的嵌套与 effectScope 的作用', 'shallowReactive 的实现与性能收益']
  },
  {
    id: 'vue-02',
    code: 37,
    title: 'ref 与 reactive 的区别和适用场景',
    categoryId: 'vue',
    level: '中级',
    freq: '极高',
    tags: ['ref', 'reactive', '响应性丢失'],
    question:
      'ref 和 reactive 有什么区别？各自适用于什么场景？为什么 reactive 解构会丢失响应性？',
    answerId: 'vue-02',
    followups: ['toRef 与 toRefs 的实现差异', 'computed 返回的是 ref 还是普通值']
  },
  {
    id: 'vue-03',
    code: 38,
    title: 'Composition API 解决了什么问题',
    categoryId: 'vue',
    level: '中级',
    freq: '极高',
    tags: ['Composition API', 'Options API'],
    question:
      'Composition API 解决了哪些痛点？与 Options API 相比有什么优势和代价？在什么情况下仍应使用 Options API？',
    answerId: 'vue-03',
    followups: ['composable 中如何安全使用生命周期（effectScope）', '如何为 composable 设计返回值（ref vs reactive）']
  },
  {
    id: 'vue-04',
    code: 39,
    title: 'v-if 与 v-show 的区别与选型',
    categoryId: 'vue',
    level: '中级',
    freq: '高',
    tags: ['指令', '渲染'],
    question:
      'v-if 和 v-show 的区别是什么？各自的渲染与更新代价是什么？如何选型？还有哪些容易忽略的细节？',
    answerId: 'vue-04',
    followups: ['keep-alive 与 v-if 混用时的缓存行为', 'Vue 3 Fragment 对 v-if 的影响']
  },
  {
    id: 'vue-05',
    code: 40,
    title: 'Vue 中 data 为什么必须是函数',
    categoryId: 'vue',
    level: '中级',
    freq: '高',
    tags: ['data', '复用', '实例隔离'],
    question:
      'Vue 组件中 data 为什么必须是一个函数而不是对象？根实例为什么可以用对象？如果是对象会发生什么？',
    answerId: 'vue-05',
    followups: ['组件内的 props 为什么不需要函数', 'Vue 3 中如何有意实现跨组件共享状态']
  },
  {
    id: 'vue-06',
    code: 41,
    title: 'v-model 的底层实现原理',
    categoryId: 'vue',
    level: '中级',
    freq: '高',
    tags: ['v-model', '编译', '自定义组件'],
    question:
      'v-model 的底层实现原理是什么？Vue 2 与 Vue 3 的实现有什么差异？如何在自定义组件上实现 v-model？如何支持多个 v-model？',
    answerId: 'vue-06',
    followups: ['v-model 在 checkbox 组（数组绑定）时的行为', 'defineModel 的实现原理与编译产物']
  },
  {
    id: 'vue-07',
    code: 42,
    title: 'Vue 生命周期钩子与 Vue 3 的变化',
    categoryId: 'vue',
    level: '中级',
    freq: '高',
    tags: ['生命周期'],
    question:
      'Vue 的生命周期钩子有哪些？Vue 3 中有什么变化？父子组件的生命周期执行顺序是怎样的？',
    answerId: 'vue-07',
    followups: ['Suspense 下异步 setup 的执行顺序', 'errorCaptured 与全局 errorHandler 的关系']
  },
  {
    id: 'vue-08',
    code: 43,
    title: 'keep-alive 的原理与主要属性',
    categoryId: 'vue',
    level: '高级',
    freq: '中高',
    tags: ['keep-alive', '缓存'],
    question:
      'keep-alive 的缓存原理是什么？include / exclude / max 三个属性怎么用？被缓存的组件生命周期有什么变化？如何手动清理缓存？',
    answerId: 'vue-08',
    followups: ['RouterView + keep-alive 时 include 应该配什么 name', 'keep-alive 缓存的组件中 ref 引用的实际值']
  },
  {
    id: 'vue-09',
    code: 44,
    title: 'Vue 3.5 与近期版本的新特性',
    categoryId: 'vue',
    level: '高级',
    freq: '中高',
    trend: '2026 新趋势，考察是否跟进版本演进',
    tags: ['版本特性', 'Vue 3.5'],
    question:
      'Vue 3.5（及近期版本）有哪些值得关注的新特性？它们分别解决了什么问题？',
    answerId: 'vue-09',
    followups: ['Vapor Mode 与虚拟 DOM 的本质差异', 'defineProps 解构响应式的编译器实现']
  },
  {
    id: 'vue-10',
    code: 45,
    title: 'Vue Router 原理与 hash / history 模式',
    categoryId: 'vue',
    level: '高级',
    freq: '中高',
    tags: ['路由', 'history', 'hash'],
    question:
      'Vue Router 的原理是什么？hash 模式与 history 模式有什么区别？history 模式为什么需要服务端配置？导航守卫的执行顺序是怎样的？',
    answerId: 'vue-10',
    followups: ['beforeRouteEnter 中为什么拿不到 this，如何解决', '动态路由（addRoute）的权限方案设计']
  },
  {
    id: 'vue-11',
    code: 46,
    title: 'Pinia 与 Vuex 的区别',
    categoryId: 'vue',
    level: '中级',
    freq: '中高',
    tags: ['Pinia', 'Vuex', '状态管理'],
    question:
      'Pinia 和 Vuex 有什么区别？为什么 Vue 3 推荐 Pinia？Pinia 的 setup store 与 options store 有什么不同？',
    answerId: 'vue-11',
    followups: ['Pinia 插件如何实现状态持久化', 'storeToRefs 的实现原理']
  },
  {
    id: 'vue-12',
    code: 47,
    title: 'Vue 组件通信的完整方式',
    categoryId: 'vue',
    level: '中级',
    freq: '中高',
    tags: ['组件通信', 'provide/inject'],
    question:
      'Vue 组件间通信有哪些方式？各自适用于什么场景？provide/inject 与全局状态的区别是什么？',
    answerId: 'vue-12',
    followups: ['provide/inject 中如何避免后代意外修改状态', '封装 composable 时如何决定用模块级 ref 还是 Pinia']
  },
  {
    id: 'vue-13',
    code: 48,
    title: '如何避免 Vue 项目中的内存泄漏',
    categoryId: 'vue',
    level: '高级',
    freq: '中',
    tags: ['内存泄漏', '清理'],
    question:
      'Vue 项目中常见的内存泄漏有哪些？如何在编码阶段避免？如何排查线上页面的内存泄漏？',
    answerId: 'vue-13',
    followups: ['Vue 的响应式依赖是否会在组件卸载后自动清理', '如何在开发环境自动检测未清理的定时器']
  },
  {
    id: 'vue-14',
    code: 49,
    title: 'Vue 2 与 Vue 3 在按需引入上的差异',
    categoryId: 'vue',
    level: '高级',
    freq: '中',
    tags: ['按需引入', 'TreeShaking', '体积'],
    question:
      'Vue 2 和 Vue 3 在按需引入上有什么差异？为什么 Vue 3 的 tree-shaking 更好？如何验证某个 API 是否被摇掉？',
    answerId: 'vue-14',
    followups: ['unplugin-vue-components 的实现原理', '组件库的 sideEffects 声明如何影响按需']
  }
]