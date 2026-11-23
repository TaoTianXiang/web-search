/**
 * 教材大纲：章节 → 专题
 * 正文位于 src/content/<slug>.md
 */

const docLoaders = require.context('@/content', false, /\.md$/)

export const chapters = [
  {
    id: 'js',
    title: 'JavaScript 核心',
    subtitle: '占比约 22%，中级与高级的分水岭',
    icon: 'JS',
    accent: '#c9a227',
    sections: [
      {
        slug: 'js-types',
        title: '类型、转换与相等性',
        summary: '原始类型与引用类型、ToPrimitive 转换链路、== 的判定流程、装箱与 Symbol.toPrimitive',
        minutes: 18,
        tags: ['类型', '隐式转换', '相等性']
      },
      {
        slug: 'js-scope-closure',
        title: '作用域、闭包与 this',
        summary: '词法作用域链、闭包的内存语义与常见泄漏、this 的四种绑定、箭头函数的边界',
        minutes: 22,
        tags: ['闭包', 'this', '作用域']
      },
      {
        slug: 'js-async',
        title: '事件循环与异步模型',
        summary: '宏任务与微任务、渲染时机、Promise 状态机、async/await 与 Generator 的关系',
        minutes: 25,
        tags: ['EventLoop', 'Promise', 'async']
      },
      {
        slug: 'js-proto',
        title: '原型链、继承与对象模型',
        summary: 'prototype 与 __proto__、instanceof 原理、寄生组合继承、class 的真实差异',
        minutes: 20,
        tags: ['原型链', '继承', 'class']
      },
      {
        slug: 'js-handwrite',
        title: '手写题专题',
        summary: '防抖节流、深拷贝、EventEmitter、柯里化、扁平化、去重、Promise.all，以及边界与取舍',
        minutes: 28,
        tags: ['手写', '防抖', '深拷贝']
      }
    ]
  },
  {
    id: 'ts',
    title: 'TypeScript',
    subtitle: '占比约 5%，2026 权重上升',
    icon: 'TS',
    accent: '#3178c6',
    sections: [
      {
        slug: 'ts-types',
        title: '类型系统、泛型与工具类型',
        summary: '结构类型与协变逆变、泛型约束、条件类型、映射类型、内置工具类型手写实现',
        minutes: 24,
        tags: ['泛型', '工具类型', '类型体操']
      },
      {
        slug: 'ts-practice',
        title: '类型安全的设计实践',
        summary: '判别联合与收窄、泛型 API 设计、satisfies、类型测试、渐进式迁移策略',
        minutes: 20,
        tags: ['收窄', 'satisfies', '工程实践']
      }
    ]
  },
  {
    id: 'css',
    title: 'CSS',
    subtitle: '占比约 10%，考"为什么这样排"而不是背属性',
    icon: 'CSS',
    accent: '#264de4',
    sections: [
      {
        slug: 'css-layout',
        title: '盒模型、BFC 与 Flex/Grid',
        summary: '盒模型与 box-sizing、margin 折叠、BFC 触发与用途、Flex 弹性计算、Grid 轨道',
        minutes: 20,
        tags: ['BFC', 'Flex', 'Grid']
      },
      {
        slug: 'css-modern',
        title: '现代 CSS 能力',
        summary: '级联层、容器查询、:has、逻辑属性、颜色空间、@property 与动画性能',
        minutes: 16,
        tags: ['容器查询', '级联层', ':has']
      },
      {
        slug: 'css-common',
        title: '高频细节：居中、显示隐藏、层叠与单位',
        summary: '五种居中方案与副作用、display/visibility/opacity 三方对比、层叠上下文、px/em/rem/vw、三角形与翻牌',
        minutes: 26,
        tags: ['居中', '层叠上下文', '单位']
      }
    ]
  },
  {
    id: 'browser',
    title: '浏览器与网络',
    subtitle: '占比约 12%，性能与安全的底层依据',
    icon: 'NET',
    accent: '#0f766e',
    sections: [
      {
        slug: 'browser-render',
        title: '渲染流水线与合成',
        summary: 'DOM/CSSOM 到像素的五个阶段、重排重绘与合成层、关键渲染路径优化',
        minutes: 22,
        tags: ['渲染', '重排', '合成']
      },
      {
        slug: 'network-http',
        title: 'HTTP、缓存与传输优化',
        summary: 'HTTP/1.1 到 HTTP/3、强缓存与协商缓存、TLS 握手、CDN 与预连接、CORS 完整链路',
        minutes: 24,
        tags: ['缓存', 'HTTP/2', 'HTTPS']
      },
      {
        slug: 'browser-security',
        title: '存储、跨域与安全',
        summary: 'Cookie/localStorage/IndexedDB 选型、同源策略、XSS/CSRF 防御、CSP 落地',
        minutes: 20,
        tags: ['存储', 'CORS', '安全']
      },
      {
        slug: 'browser-dom',
        title: 'DOM 事件与加载时序',
        summary: '事件委托与冒泡、DOMContentLoaded 与 load、defer/async、图片懒加载、Worker 体系',
        minutes: 22,
        tags: ['事件委托', 'defer', '懒加载']
      },
      {
        slug: 'net-tcp',
        title: 'TCP、TLS 与传输层',
        summary: '三次握手与四次挥手、TIME_WAIT、HTTPS 加密链路、数字证书、TCP/UDP 与 QUIC',
        minutes: 20,
        tags: ['TCP', 'TLS', 'QUIC']
      }
    ]
  },
  {
    id: 'react',
    title: 'React',
    subtitle: '占比约 10%，高阶能力分水岭',
    icon: 'R',
    accent: '#3178c6',
    sections: [
      {
        slug: 'react-model',
        title: 'Fiber、Hooks 与并发渲染',
        summary: 'Fiber 链表结构、双缓存与时间切片、Hooks 链表、useEffect 时序、并发优先级',
        minutes: 24,
        tags: ['Fiber', 'Hooks', '并发']
      },
      {
        slug: 'react-eco',
        title: 'RSC、状态管理与性能优化',
        summary: 'RSC 与 Client 边界、useState/useReducer、memo 三件套、状态管理选型、Context 重渲染、合成事件',
        minutes: 26,
        tags: ['RSC', 'memo', '状态管理']
      }
    ]
  },
  {
    id: 'vue',
    title: 'Vue',
    subtitle: '占比约 8%，与 React 合计构成框架考察核心',
    icon: 'V',
    accent: '#42b883',
    sections: [
      {
        slug: 'vue-reactivity',
        title: 'Vue 响应式系统',
        summary: 'Proxy 依赖收集、effect 调度、computed 缓存、ref 与 reactive 的边界',
        minutes: 24,
        tags: ['Proxy', '依赖收集', 'computed']
      },
      {
        slug: 'vue-compiler',
        title: '模板编译与 Diff',
        summary: 'AST 转换、静态提升、PatchFlags、Block Tree、最长递增子序列复用节点',
        minutes: 22,
        tags: ['编译', 'diff', 'PatchFlag']
      },
      {
        slug: 'vue-api',
        title: 'API 细节与工程实践',
        summary: 'v-if/v-show、data 函数、v-model 原理、生命周期顺序、keep-alive、3.5 新特性、Router、Pinia、组件通信',
        minutes: 28,
        tags: ['v-model', 'keep-alive', 'Pinia']
      }
    ]
  },
  {
    id: 'engineering',
    title: '性能与工程化',
    subtitle: '占比约 8%，最容易被追问"如何量化"',
    icon: 'ENG',
    accent: '#7c3aed',
    sections: [
      {
        slug: 'build-tools',
        title: '构建工具与产物优化',
        summary: 'Webpack 构建流程与 loader/plugin、Vite 双引擎、Tree Shaking 失效场景、分包与长效缓存',
        minutes: 22,
        tags: ['Webpack', 'Vite', 'TreeShaking']
      },
      {
        slug: 'perf-vitals',
        title: '性能指标与优化手段',
        summary: 'LCP/INP/CLS 成因与优化、四维优化框架、长任务拆解、资源优先级、度量与归因',
        minutes: 24,
        tags: ['WebVitals', 'LCP', 'INP']
      },
      {
        slug: 'engineering-practice',
        title: '规范化、CI 与可维护性',
        summary: 'Monorepo 与包管理、Lint 与提交规范、灰度与回滚、可观测性建设',
        minutes: 18,
        tags: ['Monorepo', 'CI', '规范']
      },
      {
        slug: 'eng-modules',
        title: '模块化、运行时与包管理',
        summary: 'ESM 与 CommonJS、babel-runtime 与 polyfill、减少 if-else、pnpm 的链接结构',
        minutes: 22,
        tags: ['ESM', 'babel-runtime', 'pnpm']
      },
      {
        slug: 'eng-quality',
        title: '监控与线上问题闭环',
        summary: '监控采集与上报策略、Source Map 管理、用户反馈的标准化处理与复盘',
        minutes: 20,
        tags: ['监控', '反馈闭环', '复盘']
      }
    ]
  },
  {
    id: 'html',
    title: 'HTML',
    subtitle: '占比约 5%，语义化与原生能力常被低估',
    icon: 'H',
    accent: '#c2410c',
    sections: [
      {
        slug: 'html-basics',
        title: '语义化、DOCTYPE 与元素模型',
        summary: 'HTML5 语义化标签的实际用法、dialog/search/details 原生能力、行内与块级元素、DOCTYPE 与怪异模式、src/href',
        minutes: 24,
        tags: ['语义化', 'dialog', 'DOCTYPE']
      }
    ]
  },
  {
    id: 'arch',
    title: '架构与面试表达',
    subtitle: '把技术细节讲成有取舍的工程决策',
    icon: 'ARCH',
    accent: '#be185d',
    sections: [
      {
        slug: 'micro-frontend',
        title: '微前端：从概念到选型',
        summary: '从零讲清微前端是什么、解决什么问题、五种实现流派、JS/样式隔离、通信设计、选型决策树与不上微前端的替代方案',
        minutes: 32,
        tags: ['微前端', 'qiankun', '沙箱']
      },
      {
        slug: 'frontend-arch',
        title: '前端架构与方案取舍',
        summary: '中后台分层、SSR/SSG 成本、状态管理与数据流边界、DTO 与权限模型',
        minutes: 22,
        tags: ['架构', '分层', 'SSR']
      },

      {
        slug: 'interview-soft',
        title: '项目复盘与面试表达',
        summary: 'STAR 与量化指标、难点叙事结构、系统设计答题框架、反问与沟通',
        minutes: 16,
        tags: ['STAR', '项目', '表达']
      }
    ]
  },
  {
    id: 'ai',
    title: 'AI 与新趋势',
    subtitle: '2026 新增必考模块，权重增长最快',
    icon: 'AI',
    accent: '#be185d',
    sections: [
      {
        slug: 'ai-workflow',
        title: 'AI 工程实践',
        summary: '日常 AI 工作流、AI 代码质量的自动化保障、迁移遗留项目、核心竞争力',
        minutes: 22,
        tags: ['AI', '代码质量', '重构']
      }
    ]
  }
]

export const allSections = chapters.flatMap((chapter) =>
  chapter.sections.map((section) => ({
    ...section,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    accent: chapter.accent,
    chapterIcon: chapter.icon
  }))
)

export function getSection(slug) {
  return allSections.find((s) => s.slug === slug) || null
}

export function getChapterOf(slug) {
  return chapters.find((c) => c.sections.some((s) => s.slug === slug)) || null
}

export function getNeighbors(slug) {
  const index = allSections.findIndex((s) => s.slug === slug)
  if (index < 0) return { prev: null, next: null }
  return {
    prev: index > 0 ? allSections[index - 1] : null,
    next: index < allSections.length - 1 ? allSections[index + 1] : null
  }
}

export function getDoc(slug) {
  const key = `./${slug}.md`
  return docLoaders.keys().includes(key) ? docLoaders(key) : ''
}

export function getDocs() {
  return allSections.map((s) => ({ ...s, content: getDoc(s.slug) }))
}

export const totalMinutes = allSections.reduce((sum, s) => sum + (s.minutes || 0), 0)