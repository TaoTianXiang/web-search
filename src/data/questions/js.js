/* eslint-disable */
/** JavaScript 核心：第 1–24 题 */

export const jsQuestions = [
  {
    id: 'js-01',
    code: 1,
    title: '事件循环：宏任务、微任务与渲染时机',
    categoryId: 'js',
    level: '中级',
    freq: '极高',
    trend: '2026 进阶问法要求画出调用栈 / 微任务队列 / 宏任务队列的状态变化，并对比 Node.js 与浏览器的差异',
    tags: ['EventLoop', '微任务', '渲染时机'],
    question:
      '请解释事件循环（Event Loop）机制，并分析下面代码的输出顺序。进阶要求：说明每一轮循环中调用栈、微任务队列、宏任务队列的状态变化，以及浏览器与 Node.js 的差异。',
    answerId: 'js-01',
    followups: ['实现一个基于 MessageChannel 的宏任务调度器，比较与 setTimeout 的延迟', 'requestAnimationFrame 与 setTimeout 16ms 的差异']
  },
  {
    id: 'js-02',
    code: 2,
    title: 'let、const、var 的区别与暂时性死区',
    categoryId: 'js',
    level: '中级',
    freq: '极高',
    tags: ['作用域', 'TDZ', '提升'],
    question:
      'let、const、var 的区别是什么？什么是暂时性死区（TDZ）？为什么说 let 并没有"取消提升"？',
    answerId: 'js-02',
    followups: ['switch 的 case 块中声明 let 会发生什么', '函数声明在块级作用域中的行为（ES6 规范与浏览器实现的差异）']
  },
  {
    id: 'js-03',
    code: 3,
    title: '闭包原理、真实使用场景与内存泄漏',
    categoryId: 'js',
    level: '中级',
    freq: '极高',
    trend: '2026 更倾向要求给出真实项目中的闭包使用案例，而非仅背诵定义',
    tags: ['闭包', '内存', '工程实践'],
    question:
      '请说明闭包的原理，并举 2–3 个你项目中的真实使用场景。闭包在内存中保留了哪些东西？如何排查闭包导致的内存泄漏？',
    answerId: 'js-03',
    followups: ['V8 的闭包优化在什么情况下失效', '如何用 FinalizationRegistry 验证回收时机']
  },
  {
    id: 'js-04',
    code: 4,
    title: '手写防抖与节流（含 cancel / leading / trailing）',
    categoryId: 'js',
    level: '中级',
    freq: '极高',
    trend: '进阶要求实现 cancel 方法，并支持 leading / trailing 选项',
    tags: ['手写', '防抖', '节流'],
    question:
      '请分别实现防抖（debounce）与节流（throttle），说明两者的区别与适用场景。要求支持 cancel，节流需支持 leading / trailing 选项。',
    answerId: 'js-04',
    followups: ['实现一个取消后可以重新激活的防抖', '如何在 React 中封装 useDebounce / useThrottle 并避免闭包陷阱']
  },
  {
    id: 'js-05',
    code: 5,
    title: '原型链与 instanceof 的实现原理',
    categoryId: 'js',
    level: '中级',
    freq: '极高',
    tags: ['原型链', 'instanceof'],
    question:
      '原型链是什么？instanceof 的工作原理是什么？手写一个 instanceof。__proto__ 与 prototype 有什么区别？',
    answerId: 'js-05',
    followups: ['如何实现一个更安全的类型判断（考虑跨 iframe）', 'Symbol.hasInstance 如何自定义 instanceof 行为']
  },
  {
    id: 'js-06',
    code: 6,
    title: 'this 的绑定规则与箭头函数差异',
    categoryId: 'js',
    level: '中级',
    freq: '极高',
    tags: ['this', '箭头函数'],
    question:
      '请完整说出 this 的绑定优先级，并解释箭头函数与普通函数在 this、arguments、new 上的差异。',
    answerId: 'js-06',
    followups: ['实现一个 bind，需要处理哪些边界', 'class 字段初始化的时机与 this 的可用性']
  },
  {
    id: 'js-07',
    code: 7,
    title: '深拷贝与浅拷贝（含循环引用与 WeakMap 优化）',
    categoryId: 'js',
    level: '中级',
    freq: '高',
    trend: '进阶追问循环引用处理、WeakMap 优化，以及与 structuredClone 的差异',
    tags: ['深拷贝', '手写', '循环引用'],
    question:
      '浅拷贝与深拷贝的区别是什么？手写一个深拷贝，要求处理循环引用、Date、RegExp、Map、Set、Symbol 键。与 structuredClone 相比有什么差异？',
    answerId: 'js-07',
    followups: ['如何实现一个只拷贝可序列化部分的"安全深拷贝"', 'Immer 的结构化共享（structural sharing）与深拷贝的区别']
  },
  {
    id: 'js-08',
    code: 8,
    title: 'Promise 原理与手写 Promise.all / race',
    categoryId: 'js',
    level: '高级',
    trend: '2026 趋势：不再单纯考"能不能写出来"，改考"能不能讲清原理"',
    tags: ['Promise', '手写', '异步'],
    question:
      'Promise 的状态机与 then 的规范要求是什么？手写 Promise.all、race、allSettled，并说明各自的边界。',
    answerId: 'js-08',
    followups: ['Promise 的 unhandledRejection 在什么时机触发', '如何实现一个带并发上限的 Promise 调度器']
  },
  {
    id: 'js-09',
    code: 9,
    title: 'async/await 原理与 Generator 的关系',
    categoryId: 'js',
    level: '高级',
    tags: ['async', 'Generator', '协程'],
    question:
      'async/await 的底层原理是什么？它与 Generator + 自动执行器有什么关系？await 之后发生了什么？',
    answerId: 'js-09',
    followups: ['如何用 Generator 实现一个可暂停的任务队列', 'async 函数中 return await 与 return 的性能差异']
  },
  {
    id: 'js-10',
    code: 10,
    title: '会改变原数组与不会改变原数组的方法',
    categoryId: 'js',
    level: '中级',
    freq: '高',
    tags: ['数组', '不可变'],
    question:
      '数组有哪些方法会改变原数组？哪些不会？在 React/Vue 的不可变更新中有什么注意事项？',
    answerId: 'js-10',
    followups: ['reduce 的实现与常见误用', 'Array.prototype.sort 的稳定性与 V8 的实现']
  },
  {
    id: 'js-11',
    code: 11,
    title: '== 与 === 的区别与类型转换规则',
    categoryId: 'js',
    level: '中级',
    freq: '高',
    tags: ['相等性', '类型转换'],
    question:
      '== 与 === 的区别是什么？请写出 ToPrimitive 的完整流程，并解释 [] == ![] 为什么是 true。',
    answerId: 'js-11',
    followups: ["Number('') 与 parseInt('') 的差异", 'a == b 在什么情况下会触发 getter']
  },
  {
    id: 'js-12',
    code: 12,
    title: '如何判断一个值是不是引用类型',
    categoryId: 'js',
    level: '中级',
    freq: '高',
    tags: ['类型判断', 'typeof'],
    question:
      'JavaScript 中如何判断一个数据是引用类型？typeof 有哪些坑？如何写出可靠的类型判断工具？',
    answerId: 'js-12',
    followups: ['Symbol.toStringTag 如何影响 toString 的结果', '如何判断一个值是否可迭代']
  },
  {
    id: 'js-13',
    code: 13,
    title: '构造函数的 prototype 指向什么',
    categoryId: 'js',
    level: '中级',
    freq: '高',
    tags: ['原型', 'constructor'],
    question:
      '构造函数的 prototype 属性指向什么？实例的 constructor 指向谁？修改 prototype 会发生什么？',
    answerId: 'js-13',
    followups: ['Object.setPrototypeOf 的性能问题', '如何检测一个对象是否是某个类的实例而不受 constructor 影响']
  },
  {
    id: 'js-14',
    code: 14,
    title: "['1','2','3'].map(parseInt) 为什么是 [1, NaN, NaN]",
    categoryId: 'js',
    level: '中级',
    freq: '高',
    tags: ['陷阱题', 'map', 'parseInt'],
    question:
      "['1','2','3'].map(parseInt) 的结果是什么？为什么？如何写出正确的写法？",
    answerId: 'js-14',
    followups: ['数组的 reduce 回调参数顺序与常见误用', '为什么 [1,2,3].map(parseFloat) 不会出问题']
  },
  {
    id: 'js-15',
    code: 15,
    title: 'Map / Set / WeakMap / WeakSet 的区别与场景',
    categoryId: 'js',
    level: '中级',
    freq: '高',
    tags: ['Map', 'Set', '弱引用'],
    question:
      'Map、Set、WeakMap、WeakSet 的区别是什么？WeakMap 为什么不能遍历？各自适合什么场景？',
    answerId: 'js-15',
    followups: ['Symbol 作为键与 Map 键的差异', '如何实现一个带过期时间的缓存（Map + 定时器 vs WeakMap）']
  },
  {
    id: 'js-16',
    code: 16,
    title: '实现一个 EventEmitter（发布订阅）',
    categoryId: 'js',
    level: '中级',
    freq: '中高',
    trend: '2026 仍考，但重点转向原理阐述能力（订阅、触发、取消、once、异常隔离）',
    tags: ['发布订阅', '手写', '设计模式'],
    question:
      '实现一个 EventEmitter，要求支持 on / once / off / emit，并说明 on 返回取消函数的好处。',
    answerId: 'js-16',
    followups: ['如何实现带优先级的 emit', '如何支持异步订阅者并按顺序等待']
  },
  {
    id: 'js-17',
    code: 17,
    title: '垃圾回收机制与内存泄漏排查',
    categoryId: 'js',
    level: '高级',
    freq: '中高',
    tags: ['GC', '内存'],
    question:
      '说说你对垃圾回收机制的理解。V8 的分代回收是怎么做的？前端常见的内存泄漏有哪些？如何排查？',
    answerId: 'js-17',
    followups: ['Node.js 中的 Buffer 与外部内存如何计入 GC', '如何用 --trace-gc 观察 GC 行为']
  },
  {
    id: 'js-18',
    code: 18,
    title: 'JavaScript 的继承方式与各自缺陷',
    categoryId: 'js',
    level: '中级',
    freq: '中高',
    tags: ['继承', '原型链', 'class'],
    question:
      'JavaScript 有哪些继承方式？各自有什么优缺点？寄生组合继承为什么是 ES5 的最优解？class extends 与它有什么差异？',
    answerId: 'js-18',
    followups: ['Object.create 与 new 的差异', 'mixin 的冲突处理策略']
  },
  {
    id: 'js-19',
    code: 19,
    title: '变量提升（Hoisting）的真实机制',
    categoryId: 'js',
    level: '中级',
    freq: '中高',
    trend: '英文面试中出现于 Top 1 位置',
    tags: ['提升', '执行上下文'],
    question:
      '解释变量提升（hoisting）的概念。函数声明、var、let 的提升行为分别是什么？为什么说"提升"这个说法并不准确？',
    answerId: 'js-19',
    followups: ['try/catch 中 catch 参数的作用域', '模块顶层声明与脚本顶层声明的差异']
  },
  {
    id: 'js-20',
    code: 20,
    title: '数组去重的多种方法与性能对比',
    categoryId: 'js',
    level: '中级',
    freq: '中高',
    tags: ['数组', '去重', '性能'],
    question:
      '数组去重有哪些方法？手写一个高效去重。NaN、对象、引用类型分别会有什么问题？',
    answerId: 'js-20',
    followups: ['如何实现稳定去重（保留最后一次出现的元素）', '超大数据量（百万级）如何去重']
  },
  {
    id: 'js-21',
    code: 21,
    title: '多维数组扁平化的多种实现',
    categoryId: 'js',
    level: '中级',
    freq: '中高',
    tags: ['数组', '递归', '手写'],
    question:
      '实现数组扁平化，要求支持指定深度。请给出至少三种实现方式并说明各自的取舍。',
    answerId: 'js-21',
    followups: ['如何实现一个扁平化并去重的组合函数', '深度优先与广度优先扁平化的差异']
  },
  {
    id: 'js-22',
    code: 22,
    title: '0.1 + 0.2 !== 0.3 的原因与解决方案',
    categoryId: 'js',
    level: '中级',
    freq: '中',
    tags: ['浮点数', '精度'],
    question:
      '为什么 0.1 + 0.2 !== 0.3？如何解决金额计算中的精度问题？Number.EPSILON 有什么用？',
    answerId: 'js-22',
    followups: ['bigint 与 number 混用的限制', '如何实现一个精确的四舍五入函数']
  },
  {
    id: 'js-23',
    code: 23,
    title: '柯里化（Currying）原理与通用实现',
    categoryId: 'js',
    level: '中级',
    freq: '中',
    tags: ['函数式', '手写', '柯里化'],
    question:
      '什么是柯里化？手写一个通用柯里化函数，支持占位符与任意参数个数。它在工程中有什么实际用途？',
    answerId: 'js-23',
    followups: ['实现一个支持任意 arity 的 partial 函数', '柯里化与 lodash/fp 的 flow 如何配合']
  },
  {
    id: 'js-24',
    code: 24,
    title: 'ES Module 与 CommonJS 的区别',
    categoryId: 'js',
    level: '中级',
    freq: '中高',
    tags: ['模块化', 'ESM', 'CommonJS'],
    question:
      'ES Module 与 CommonJS 有什么区别？为什么 Tree Shaking 依赖 ESM？两者混用会有什么问题？',
    answerId: 'js-24',
    followups: ['import() 动态导入的返回值与使用场景', 'Node 的 ESM 加载器如何处理 .js 与 .mjs']
  }
]