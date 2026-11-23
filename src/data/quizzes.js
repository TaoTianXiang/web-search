/**
 * 章末自测题：按专题 slug 索引
 * 每题仅一个正确选项，用于页面底部自测与模拟面试抽题
 */
export const quizzes = {
  'js-types': [
    {
      q: '`[] == ![]` 的结果是？',
      options: ['true', 'false', '抛出 TypeError', '取决于浏览器'],
      answer: 0,
      explain:
        '`![]` 先转布尔得到 false，再转数字 0；左侧 `[]` 经 ToPrimitive 得到空字符串，再转数字为 0，因此 0 == 0 为 true。'
    },
    {
      q: '`Object.is(NaN, NaN)` 与 `Object.is(0, -0)` 分别是？',
      options: ['false / false', 'true / false', 'true / true', 'false / true'],
      answer: 1,
      explain: 'Object.is 修复了 === 的两个特例：NaN 与自身相等，+0 与 -0 不相等。'
    },
    {
      q: '`1 + "2" + 3` 的结果是？',
      options: ['6', '"123"', '"33"', 'NaN'],
      answer: 1,
      explain: '加法从左到右结合，先 1 + "2" 得到字符串 "12"，再与 3 拼接得到 "123"。'
    }
  ],
  'js-scope-closure': [
    {
      q: '`for (var i = 0; i < 3; i++) setTimeout(() => console.log(i))` 输出？',
      options: ['0 1 2', '3 3 3', '0 0 0', 'undefined ×3'],
      answer: 1,
      explain: 'var 只有函数作用域，三个回调共享同一个 i，循环结束时 i 为 3。'
    },
    {
      q: '关于闭包的内存行为，正确的是？',
      options: [
        '只要函数返回就一定会泄漏',
        '闭包保留被引用的外部变量，未被引用的变量可被回收',
        '闭包会导致栈溢出',
        '闭包在引擎层面等同于全局变量'
      ],
      answer: 1,
      explain: '闭包保留的是被实际引用的自由变量；现代引擎会做变量级别优化，未引用变量不会拦截回收。'
    },
    {
      q: '以下哪个调用中 this 指向全局对象（非严格模式）？',
      options: ['obj.method()', 'new Foo()', 'fn()', 'fn.call(obj)'],
      answer: 2,
      explain: '普通独立调用（默认绑定）在非严格模式下 this 为全局对象，严格模式下为 undefined。'
    }
  ],
  'js-async': [
    {
      q: '同步代码执行完后，以下哪个队列先被清空？',
      options: ['定时器队列', '微任务队列', 'requestAnimationFrame 回调', 'I/O 回调'],
      answer: 1,
      explain: '每个宏任务结束后会清空全部微任务（promise.then、queueMicrotask、MutationObserver），之后才进入渲染与下一个宏任务。'
    },
    {
      q: '`async` 函数中 `await` 之后的代码相当于？',
      options: [
        '同步执行',
        '放入 setTimeout',
        '注册为该 Promise 的 then 回调（微任务）',
        '放入 requestIdleCallback'
      ],
      answer: 2,
      explain: 'await 把后续代码包装成微任务继续，暂停的是该 async 函数本身，不阻塞主线程。'
    },
    {
      q: 'Promise 的 then 回调抛错后，状态变为？',
      options: ['仍然是 fulfilled', '变为 rejected，错误向下游传递', '中断整个事件循环', '重新执行 then'],
      answer: 1,
      explain: 'then 回调抛错会让派生 Promise 变为 rejected，后续 catch/第二个参数可捕获。'
    }
  ],
  'js-proto': [
    {
      q: '关于 prototype 与 __proto__ 的关系，正确的是？',
      options: [
        '函数的 prototype 指向其原型对象，实例的 __proto__ 指向该原型对象',
        '两者完全等价',
        '实例的 prototype 指向构造函数',
        '原型对象没有 __proto__'
      ],
      answer: 0,
      explain: 'Foo.prototype 是函数自带对象；new Foo() 的实例 __proto__ 指向 Foo.prototype，其 __proto__ 再指向 Object.prototype。'
    },
    {
      q: '使用 class 语法时，以下哪项不成立？',
      options: [
        'class 声明存在暂时性死区',
        'class 内部默认严格模式',
        '可以直接当作普通函数调用',
        '方法定义在 prototype 上且不可枚举'
      ],
      answer: 2,
      explain: 'class 只能通过 new 调用，直接调用会抛 TypeError。'
    }
  ],
  'ts-types': [
    {
      q: '`Omit<T, K>` 的典型实现是？',
      options: [
        'Pick<T, Exclude<keyof T, K>>',
        'Partial<Pick<T, K>>',
        'Pick<T, Extract<keyof T, K>>',
        'Record<K, T>'
      ],
      answer: 0,
      explain: 'Omit 先排除 K，再从 T 中挑选剩余键。'
    },
    {
      q: '条件类型 `T extends U ? X : Y` 的分布式行为发生在？',
      options: ['T 为任意类型', 'T 为裸类型参数且传入联合类型', 'U 为联合类型', '只在映射类型中'],
      answer: 1,
      explain: '当 T 是裸类型参数且被传入联合类型时，条件类型会对联合的每个成员分别求值再合并结果。'
    }
  ],
  'ts-practice': [
    {
      q: '`as const` 的作用是？',
      options: ['把对象运行时冻结', '属性变只读且保留字面量类型', '做类型断言不做检查', '转换为 JSON'],
      answer: 1,
      explain: 'as const 只影响类型推断：readonly + 字面量窄化，运行时不发生任何事。'
    },
    {
      q: '`satisfies` 相比 `as` 的优势？',
      options: [
        '会做运行时校验',
        '既校验兼容性又保留更精确的推导类型',
        '可绕过所有类型错误',
        '编译更快'
      ],
      answer: 1,
      explain: 'as 放弃校验并可能放宽类型；satisfies 检查是否满足目标类型，同时保留窄化推断。'
    }
  ],
  'css-layout': [
    {
      q: '以下哪种情况不会创建 BFC？',
      options: ['overflow: hidden', 'float: left', 'position: absolute', 'display: flow-root'],
      answer: 2,
      explain: 'absolute/fixed 会创建新的包含块，但不创建 BFC；其余三项都是 BFC 触发条件。'
    },
    {
      q: '`flex: 1` 等价于？',
      options: ['flex: 1 1 0%', 'flex: 1 1 auto', 'flex: 0 1 auto', 'flex: 1 0 auto'],
      answer: 0,
      explain: 'flex 简写中数字同时给 grow，shrink 默认 1，basis 写 0 会补单位得到 0%。'
    },
    {
      q: '下列哪种情况会发生 margin 折叠？',
      options: [
        '父子元素之间且父元素有 padding-top',
        '相邻兄弟块级元素之间的垂直外边距',
        'flex 容器内的子项之间',
        '设置了 overflow: hidden 的父元素与其子元素之间'
      ],
      answer: 1,
      explain: '外边距折叠发生在同一 BFC 内的相邻块级元素之间；触发 BFC、flex/grid 布局、有 padding/border 时会阻止折叠。'
    }
  ],
  'css-modern': [
    {
      q: '`@layer` 的核心价值是？',
      options: ['提升渲染性能', '显式控制不同来源样式的优先级顺序', '替代媒体查询', '自动生成类名'],
      answer: 1,
      explain: '级联层让优先级由层的声明顺序决定，避免用选择器权重或 !important 硬拼。'
    },
    {
      q: '容器查询与媒体查询的关键区别？',
      options: [
        '容器查询只能查宽度',
        '容器查询依据父容器尺寸而非视口尺寸',
        '容器查询性能更差',
        '容器查询需要 JS'
      ],
      answer: 1,
      explain: '@container 需要祖先声明 container-type，组件根据自身可用空间自适应。'
    }
  ],
  'browser-render': [
    {
      q: '修改哪个属性最可能只触发合成（composite）？',
      options: ['width', 'background-color', 'transform', 'top'],
      answer: 2,
      explain: 'transform 与 opacity 可由合成线程处理，不触发布局与绘制（元素被提升为合成层时）。'
    },
    {
      q: '以下哪一项不属于关键渲染路径？',
      options: ['构建 DOM 树', '构建 CSSOM 树', '执行 Web Worker 脚本', '布局与绘制'],
      answer: 2,
      explain: 'DOM → CSSOM → Render Tree → Layout → Paint，Web Worker 不直接参与渲染流水线。'
    }
  ],
  'network-http': [
    {
      q: '`Cache-Control: no-cache` 的准确含义是？',
      options: ['完全不走缓存', '必须协商验证后才能使用缓存', '只能缓存一天', '只缓存静态资源'],
      answer: 1,
      explain: 'no-cache 允许缓存但每次使用前必须校验；no-store 才是完全不存储。'
    },
    {
      q: 'HTTP/2 相比 HTTP/1.1 的关键改进不包括？',
      options: ['二进制分帧', '多路复用', '头部压缩', '强制端到端加密'],
      answer: 3,
      explain: 'HTTP/2 本身不强制加密；TCP 层队头阻塞仍存在，这也是 HTTP/3 改用 QUIC 的动机。'
    }
  ],
  'browser-security': [
    {
      q: '以下哪种做法最不能抵御 XSS？',
      options: [
        '输出转义 + 可信模板',
        'CSP 限制内联脚本',
        '把 token 存在 localStorage',
        '使用 HttpOnly + Secure Cookie'
      ],
      answer: 2,
      explain: 'localStorage 可被同源 XSS 脚本读取，存 token 会放大 XSS 危害。'
    },
    {
      q: '以下哪个请求会触发 CORS 预检？',
      options: [
        'GET 且无自定义头',
        'POST 且 Content-Type 为 application/x-www-form-urlencoded',
        'PUT 请求',
        'HEAD 请求'
      ],
      answer: 2,
      explain: '非简单方法（PUT/DELETE/PATCH）以及非白名单 Content-Type、自定义头都会触发 OPTIONS 预检。'
    }
  ],
  'vue-reactivity': [
    {
      q: 'Vue 3 使用 Proxy 而非 defineProperty 的主要原因是？',
      options: [
        'Proxy 性能一定更好',
        '可拦截新增/删除属性、数组索引与 Map/Set，且无需递归初始化',
        'Proxy 兼容 IE11',
        'Proxy 支持 JSON 序列化'
      ],
      answer: 1,
      explain: 'defineProperty 只能拦截已存在属性，需要递归遍历；Proxy 能力更完整且惰性。'
    },
    {
      q: 'computed 的缓存失效条件是？',
      options: ['每次组件渲染', '依赖的响应式数据变化', '定时刷新', '父组件更新'],
      answer: 1,
      explain: 'computed 内部是带 dirty 标记的 effect，依赖变化时置 dirty，下次读取才重算。'
    }
  ],
  'vue-compiler': [
    {
      q: 'Vue 3 静态提升（hoistStatic）优化了什么？',
      options: ['减少网络请求', '把不变节点提到 render 外，避免重复创建', '减少 CSS 体积', '加快 HTML 下载'],
      answer: 1,
      explain: '静态节点与静态属性被提升为模块级常量，重复渲染时直接复用。'
    },
    {
      q: 'PatchFlags 的意义是？',
      options: [
        '标记组件生命周期',
        '告诉 diff 该节点哪部分可能变化，做定向更新',
        '标识代码覆盖率',
        '标记 SSR 与 CSR'
      ],
      answer: 1,
      explain: '编译器为动态节点打上 TEXT/CLASS/PROPS 等标记，运行时只比对相关部分。'
    }
  ],
  'react-model': [
    {
      q: '为什么 Hooks 不能在条件语句中调用？',
      options: [
        '会造成内存泄漏',
        'Hooks 依赖调用顺序，在 Fiber 上以链表存放',
        '只是 ESLint 规范，运行时无影响',
        'React 按名字匹配 Hook'
      ],
      answer: 1,
      explain: 'Hook 状态按调用顺序挂在 Fiber 的链表中，顺序变化会导致状态错位。'
    },
    {
      q: 'useLayoutEffect 与 useEffect 的关键区别？',
      options: [
        '前者在绘制前同步执行，后者在绘制后异步执行',
        '前者只在服务端执行',
        '后者不支持清理函数',
        '两者完全等价'
      ],
      answer: 0,
      explain: 'useLayoutEffect 在 DOM 变更后、绘制前同步执行，适合测量布局，但会阻塞绘制。'
    }
  ],
  'build-tools': [
    {
      q: 'Vite 开发态快的核心原因是？',
      options: [
        '用 Rollup 预打包全部代码',
        '基于原生 ESM 按需编译，依赖用 esbuild 预构建',
        '跳过类型检查',
        '使用 Service Worker 缓存'
      ],
      answer: 1,
      explain: '开发态不打包业务代码，浏览器按 ESM 请求，依赖预构建减少请求数量。'
    },
    {
      q: '以下哪种情况最可能导致 Tree Shaking 失效？',
      options: ['ESM 具名导入', '使用 /*#__PURE__*/ 标注', 'CommonJS 动态 require 且被标记有副作用', '生产模式构建'],
      answer: 2,
      explain: 'CommonJS 是动态的，打包器无法静态判定导出使用情况，只能整体保留。'
    }
  ],
  'perf-vitals': [
    {
      q: 'LCP 变慢最常见的原因不包括？',
      options: ['首屏主图未预加载', '阻塞渲染的同步脚本', '服务端响应慢', '使用 flex 布局'],
      answer: 3,
      explain: 'LCP 受 TTFB、资源加载、渲染阻塞与元素尺寸影响，布局方式本身不是主因。'
    },
    {
      q: 'INP 衡量的是？',
      options: ['页面加载速度', '用户交互到下一帧绘制的响应延迟', '布局偏移', '内存占用'],
      answer: 1,
      explain: 'INP 取代 FID，衡量整页生命周期内交互响应性，反映主线程被长任务阻塞的程度。'
    }
  ],
  'engineering-practice': [
    {
      q: 'pnpm workspace 的主要优势是？',
      options: ['天然支持热更新', '硬链接节省磁盘并严格隔离依赖', '自动生成文档', '替代 Git 子模块'],
      answer: 1,
      explain: 'pnpm 通过内容寻址存储与硬链接复用文件，并避免幽灵依赖。'
    },
    {
      q: '前端灰度发布通常依赖？',
      options: ['只在本地验证', '按用户/流量维度路由版本并支持快速回滚', '强制所有用户刷新', '关闭 CDN'],
      answer: 1,
      explain: '灰度要求版本可并行、流量可切分、指标可观测、回滚可秒级完成。'
    }
  ],
  'frontend-arch': [
    {
      q: 'SSR 的主要成本在于？',
      options: [
        '需要额外的服务端渲染、缓存、降级与 hydration 一致性维护',
        '无法做 SEO',
        '首屏一定更慢',
        '不能使用 CDN'
      ],
      answer: 0,
      explain: 'SSR 换来更快的首屏与 SEO，但引入服务端算力、流式/缓存策略、hydrate 一致性等复杂度。'
    },
    {
      q: '前端架构中"依赖只能自上而下"的作用是？',
      options: [
        '提升构建速度',
        '避免循环依赖与底层耦合业务，便于复用与测试',
        '减少包体积',
        '强制使用 TypeScript'
      ],
      answer: 1,
      explain: '反向依赖（底层 import 上层）会导致循环依赖、无法单独复用与测试，是架构腐化的主要来源。'
    }
  ],
  'micro-frontend': [
    {
      q: '判断是否该上微前端，最关键的一条标准是？',
      options: [
        '是否有多团队需要独立部署',
        '单页是否超过 1MB',
        '是否使用 React',
        '是否要做 SSR'
      ],
      answer: 0,
      explain:
        '微前端是组织问题的技术解法。若单团队、单应用，收益几乎为零，而基座维护、依赖重复、调试复杂度都是实打实的成本。'
    },
    {
      q: 'Proxy 沙箱拦不住以下哪一项？',
      options: [
        'window.foo = 1',
        'window.foo() 调用',
        '子应用内部闭包里的 setTimeout',
        '读取 window.location'
      ],
      answer: 2,
      explain:
        '沙箱只能劫持 window 上的读写。定时器、事件监听需要额外劫持收集才能清理；修改 Object.prototype 同样无法还原。'
    },
    {
      q: '以下哪种方案对"完全不可信的三方页面"最合适？',
      options: ['qiankun', 'Module Federation', 'iframe', 'Web Components'],
      answer: 2,
      explain:
        'iframe 提供浏览器级隔离（独立 window/document/CSS），是不可信内容的首选。代价是弹窗无法覆盖父页面、路由割裂。'
    }
  ],
  'interview-soft': [
    {
      q: '讲项目难点时最有效的结构是？',
      options: [
        '先罗列所有技术名词',
        '背景与约束 → 方案对比 → 取舍依据 → 结果与度量',
        '只讲最终结果',
        '描述团队分工'
      ],
      answer: 1,
      explain: '面试官考察判断力：约束是什么、有哪些备选、为什么这么选、如何验证有效。'
    },
    {
      q: '系统设计题中最先应该明确的是？',
      options: ['数据库选型', '需求边界与非功能指标', '使用的框架', '代码目录结构'],
      answer: 1,
      explain: '先澄清范围与量化目标，再谈架构，否则方案无法被评估。'
    }
        ],
        'js-handwrite': [
          {
            q: '防抖实现中保存 lastThis 的作用是？',
            options: [
              '减少内存占用',
              '保证 setTimeout 回调中能拿到调用时的 this 与参数',
              '避免闭包',
              '防止重复执行'
            ],
            answer: 1,
            explain: 'setTimeout 回调中的 this 是 window/undefined，必须用 lastThis/lastArgs 保存最后一次调用上下文。'
          },
          {
            q: 'JSON.parse(JSON.stringify(obj)) 无法正确处理哪种值？',
            options: ['数字', '布尔值', 'Date 与循环引用', '字符串'],
            answer: 2,
            explain: 'Date 会变字符串，循环引用直接抛 TypeError，undefined/函数/Symbol 会被删除，Map/Set 变 {}。'
          },
          {
            q: 'EventEmitter 的 emit 为什么要遍历副本？',
            options: [
              '为了性能',
              '因为回调中调用 off/on 会修改正在遍历的集合',
              '为了保持顺序',
              '因为 Set 不能直接遍历'
            ],
            answer: 1,
            explain: '回调内部可能 off 或新增监听，直接遍历原集合会导致漏调用或报错。'
          }
        ],
        'css-common': [
          {
            q: '使用 transform: translate(-50%, -50%) 居中时，可能的副作用是？',
            options: [
              '元素无法被点击',
              '创建包含块，其内部 position: fixed 改为相对它定位',
              '导致内存泄漏',
              '无法使用 transition'
            ],
            answer: 1,
            explain: 'transform 会创建包含块与层叠上下文，内部 fixed 元素会相对这个元素定位，而不是视口。'
          },
          {
            q: 'opacity: 0 与 display: none 相比，特殊之处在于？',
            options: [
              '元素仍占据空间且仍可被点击/聚焦',
              '完全不渲染',
              '会触发重排',
              '无法被屏幕阅读器访问'
            ],
            answer: 0,
            explain: 'opacity: 0 只是视觉透明，元素仍占据空间、可被点击、可被 Tab 聚焦，也会被屏幕阅读器读到。'
          }
        ],
        'browser-dom': [
          {
            q: '以下哪个事件不能通过冒泡实现委托？',
            options: ['click', 'input', 'focus', 'mouseover'],
            answer: 2,
            explain: 'focus/blur 不冒泡，需要用 focusin/focusout，或在捕获阶段监听。'
          },
          {
            q: 'img 使用 loading="lazy" 但不设宽高会有什么问题？',
            options: [
              '图片会被压缩',
              '占位为 0，元素永远到不了视口，图片永不加载，且造成 CLS',
              '浏览器会报错',
              '图片会自动变成 WebP'
            ],
            answer: 1,
            explain: '没有尺寸时元素高度为 0，永远不在视口内，懒加载不会触发；同时首屏插入会造成布局偏移。'
          }
        ],
        'net-tcp': [
          {
            q: 'HTTPS 中非对称加密的作用是？',
            options: [
              '加密全部业务数据',
              '协商出对称密钥，之后用对称加密传输数据',
              '压缩数据',
              '防止 DNS 劫持'
            ],
            answer: 1,
            explain: '非对称计算慢，只用于安全协商密钥；实际数据传输用对称加密（AES）。'
          },
          {
            q: 'HTTP/3 使用 UDP 的主要原因是？',
            options: [
              'UDP 一定更快',
              '可在应用层实现流级可靠传输，绕开 TCP 队头阻塞与内核演进缓慢',
              'UDP 更省电',
              '为了兼容旧浏览器'
            ],
            answer: 1,
            explain: 'QUIC 在 UDP 上自行实现可靠传输、拥塞控制与 TLS，实现流级别重传，一个流丢包不影响其他流。'
          }
        ],
        'react-eco': [
          {
            q: 'React Server Component 的产物是什么？',
            options: [
              'HTML 字符串',
              '序列化的组件树描述（Flight 协议）',
              '完整的 JS bundle',
              '图片资源'
            ],
            answer: 1,
            explain: 'RSC 在服务端执行组件并输出可序列化的组件树描述，客户端只加载 Client Component 的 JS。'
          },
          {
            q: '为什么必须为 Context 的 value 使用 useMemo？',
            options: [
              '提升渲染速度',
              'value 每次是新对象会导致所有消费者重渲染',
              '否则会报错',
              '避免内存泄漏'
            ],
            answer: 1,
            explain: 'Context 用引用比较判断是否更新，value 每次新建对象会让所有消费者失效重渲染。'
          }
        ],
        'vue-api': [
          {
            q: 'keep-alive 缓存的组件再次进入时，哪个钩子会执行？',
            options: ['mounted', 'created', 'activated', 'unmounted'],
            answer: 2,
            explain: '被缓存的组件不会重新 mounted，只触发 activated；离开时触发 deactivated。'
          },
          {
            q: 'Vue 3 中 v-if 与 v-for 同时使用会怎样？',
            options: [
              '正常工作',
              'v-if 优先级更高，无法访问 v-for 的 item',
              'v-for 优先级更高',
              '编译报错'
            ],
            answer: 1,
            explain: 'Vue 3 中 v-if 优先级高于 v-for，应先用计算属性过滤再渲染。'
          }
        ],
        'eng-modules': [
          {
            q: 'ESM 与 CommonJS 在导出绑定上的关键差异是？',
            options: [
              'ESM 是实时绑定，CommonJS 是值拷贝',
              '两者都是值拷贝',
              'ESM 不支持导出变量',
              'CommonJS 是实时绑定'
            ],
            answer: 0,
            explain: 'ESM 导入的是实时绑定，原模块变量变化会反映到导入方；CommonJS 拿到的是当时的值拷贝。'
          },
          {
            q: '库（SDK）应如何处理 polyfill？',
            options: [
              '使用全局 core-js 引入',
              '使用 @babel/plugin-transform-runtime + corejs 避免污染宿主环境',
              '不做任何处理',
              '要求宿主必须全量引入'
            ],
            answer: 1,
            explain: '库不能污染宿主全局环境，应使用 runtime 方式引入 polyfill。'
          }
        ],
        'eng-quality': [
          {
            q: '跨域脚本报错只能拿到 "Script error." 时，应该如何修复？',
            options: [
              '改用 iframe',
              '给 script 加 crossorigin="anonymous"，服务端返回 CORS 头',
              '关闭 CORS',
              '改用 JSONP'
            ],
            answer: 1,
            explain: '跨域脚本默认不暴露错误详情，声明 crossorigin 并由服务端返回 Access-Control-Allow-Origin 才能拿到堆栈。'
          },
          {
            q: '评估线上问题优先级时，除了错误次数还必须看什么？',
            options: ['代码行数', '影响用户数', '浏览器版本数', '构建时间'],
            answer: 1,
            explain: '一个用户刷新 100 次会产生 100 次错误，但影响面很小；必须同时看影响用户数才能正确分级。'
          }
        ],
        'html-basics': [
          {
            q: '原生 <dialog> 的 showModal() 相比手写 Modal，额外提供了什么？',
            options: [
              '动画效果',
              '焦点锁定、ESC 关闭、top layer 层叠、无障碍语义',
              '更小的体积',
              '响应式布局'
            ],
            answer: 1,
            explain: 'showModal 会进入 top layer（不受父级 z-index 影响），并自动实现焦点陷阱、ESC 关闭与模态语义。'
          },
          {
            q: '怪异模式（quirks mode）下盒模型的行为是？',
            options: ['content-box', 'border-box', '没有盒模型', '取决于浏览器'],
            answer: 1,
            explain: '怪异模式下 width 包含 padding 与 border（等价 border-box），与标准模式完全不同。'
          }
        ],
        'ai-workflow': [
          {
            q: 'AI 生成的代码最常遗漏的三类边界是？',
            options: [
              '注释、缩进、命名',
              '并发竞态、资源清理、失败路径',
              '类型、接口、泛型',
              '文件结构、目录命名'
            ],
            answer: 1,
            explain: 'AI 常忽略并发乱序、定时器/监听器未清理、网络或权限失败等边界，这些需要人工补测。'
          },
          {
            q: '用 AI 重构遗留项目时，第一步应该做什么？',
            options: [
              '让 AI 直接重写核心模块',
              '先建立安全网（测试、冒烟、监控基线）',
              '升级所有依赖',
              '更换技术栈'
            ],
            answer: 1,
            explain: '没有测试保护就大改是最高风险的做法；安全网应占整个重构 40% 的时间。'
          }
  ]
}

export function getQuiz(slug) {
  return quizzes[slug] || []
}