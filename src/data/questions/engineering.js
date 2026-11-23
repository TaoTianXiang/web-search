/* eslint-disable */
/** 性能优化与工程化：第 83–92 题 */

export const engineeringQuestions = [
  {
    id: 'eng-01',
    code: 83,
    title: '如何提高页面加载速度（系统性优化）',
    categoryId: 'engineering',
    level: '高级',
    freq: '极高',
    trend: '单题出现频率最高的题目之一，要求系统性回答而非零散列举',
    tags: ['性能优化', '加载', 'LCP'],
    question:
      '如何提高页面加载速度？你做过哪些性能优化措施？请按"定位 → 手段 → 验证"的完整链路回答，并给出量化结果。',
    answerId: 'eng-01',
    followups: ['如何用 PerformanceObserver 定位具体是哪个资源拖慢了 LCP', 'SSR 与 CSR 的性能取舍如何量化']
  },
  {
    id: 'eng-02',
    code: 84,
    title: '性能优化的四个维度',
    categoryId: 'engineering',
    level: '高级',
    freq: '极高',
    trend: '常要求系统性回答，按加载、渲染、运行时、工程化分层',
    tags: ['性能', '体系化', '方法论'],
    question:
      '前端性能优化可以从哪几个维度入手？请按加载、渲染、运行时、工程化四个维度系统说明，每个维度给出关键指标与手段。',
    answerId: 'eng-02',
    followups: ['如何为不同页面（营销页 vs 后台）设定不同的性能目标', 'RUM 数据如何与发布版本关联']
  },
  {
    id: 'eng-03',
    code: 85,
    title: 'Webpack 构建流程与 loader / plugin 的区别',
    categoryId: 'engineering',
    level: '中级',
    freq: '高',
    tags: ['Webpack', 'loader', 'plugin'],
    question:
      'Webpack 的构建流程是怎样的？loader 和 plugin 有什么区别？各自适用于什么场景？',
    answerId: 'eng-03',
    followups: ['webpack 的持久化缓存如何工作', '如何写一个 loader 处理 sourcemap']
  },
  {
    id: 'eng-04',
    code: 86,
    title: 'Webpack 与 Vite 的差异及 Vite 为什么快',
    categoryId: 'engineering',
    level: '中级',
    freq: '高',
    trend: '2026 趋势上升',
    tags: ['Vite', 'Webpack', '构建'],
    question:
      'Webpack 和 Vite 有什么区别？Vite 为什么开发态启动快？两者的生产构建有什么差异？迁移时要注意什么？',
    answerId: 'eng-04',
    followups: ['Vite 的依赖预构建为什么要合并小文件', 'Module Federation 在 Vite 中的实现方式']
  },
  {
    id: 'eng-05',
    code: 87,
    title: '代码分割与按需加载',
    categoryId: 'engineering',
    level: '中级',
    freq: '中高',
    tags: ['代码分割', '懒加载', '分包'],
    question:
      '前端如何做代码分割和按需加载？分包策略如何设计？懒加载会不会造成体验问题？',
    answerId: 'eng-05',
    followups: ['HTTP/2 下分包策略是否需要调整', '如何为懒加载的组件设计加载态']
  },
  {
    id: 'eng-06',
    code: 88,
    title: 'babel-runtime 的作用',
    categoryId: 'engineering',
    level: '高级',
    freq: '中高',
    tags: ['babel', 'polyfill', '体积'],
    question:
      'babel-runtime 的作用是什么？它与 babel-polyfill / core-js 有什么区别？为什么需要它？',
    answerId: 'eng-06',
    followups: ['现代浏览器还需要哪些 polyfill', 'SWC 与 Babel 在 helper 处理上的差异']
  },
  {
    id: 'eng-07',
    code: 89,
    title: '如何减少项目中的 if-else',
    categoryId: 'engineering',
    level: '高级',
    freq: '中高',
    tags: ['代码质量', '设计模式', '重构'],
    question:
      '项目中 if-else 过多如何优化？请给出至少四种重构思路，并说明各自的适用条件与代价。',
    answerId: 'eng-07',
    followups: ['如何用 TS 的判别联合消除分支', '策略表的类型安全如何保证（Record 与 as const）']
  },
  {
    id: 'eng-08',
    code: 90,
    title: 'pnpm 相比 npm / yarn 的优势',
    categoryId: 'engineering',
    level: '中级',
    freq: '中高',
    tags: ['pnpm', '依赖管理'],
    question:
      'pnpm 相比 npm 和 yarn 有什么优势？它的硬链接与符号链接结构是怎样的？迁移时会遇到什么问题？',
    answerId: 'eng-08',
    followups: ['pnpm 的 overrides 如何统一版本', '如何在 CI 中正确缓存 pnpm store']
  },
  {
    id: 'eng-09',
    code: 91,
    title: '前端监控方案设计',
    categoryId: 'engineering',
    level: '高级',
    freq: '中',
    tags: ['监控', '埋点', '可观测性'],
    question:
      '前端监控方案如何设计？需要采集哪些数据？上报策略如何设计？如何避免监控本身影响性能？',
    answerId: 'eng-09',
    followups: ['如何评估监控 SDK 自身的性能开销', '错误聚合的指纹算法如何设计']
  },
  {
    id: 'eng-10',
    code: 92,
    title: '如何标准化处理线上用户反馈的问题',
    categoryId: 'engineering',
    level: '高级',
    freq: '中',
    tags: ['流程', '定位', '协作'],
    question:
      '线上用户反馈问题时，你如何标准化地定位与处理？请给出从接收反馈到复盘闭环的完整流程。',
    answerId: 'eng-10',
    followups: ['如何设计错误聚合的指纹以平衡准确率与召回', '灰度发布中如何快速判定"要不要回滚"']
  }
]
