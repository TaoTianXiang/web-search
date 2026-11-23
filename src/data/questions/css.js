/* eslint-disable */
/** CSS：第 66–76 题 */

export const cssQuestions = [
  {
    id: 'css-01',
    code: 66,
    title: '元素水平垂直居中的多种实现',
    categoryId: 'css',
    level: '中级',
    freq: '极高',
    tags: ['居中', 'Flex', 'Grid'],
    question:
      '实现元素水平垂直居中，请至少给出三种方式，并说明各自的适用场景与副作用。',
    answerId: 'css-01',
    followups: ['如何居中一个未知宽高的图片并保持比例', '绝对定位元素在 transform 父级中的定位基准']
  },
  {
    id: 'css-02',
    code: 67,
    title: 'BFC 的触发条件与作用',
    categoryId: 'css',
    level: '中级',
    freq: '极高',
    tags: ['BFC', '布局'],
    question:
      '什么是 BFC？触发条件有哪些？请说明 BFC 的三个典型作用，并区分 BFC、层叠上下文与包含块。',
    answerId: 'css-02',
    followups: ['margin 折叠的三个条件', 'IFC（行内格式化上下文）的作用']
  },
  {
    id: 'css-03',
    code: 68,
    title: '标准盒模型与怪异盒模型',
    categoryId: 'css',
    level: '中级',
    freq: '极高',
    tags: ['盒模型', 'box-sizing'],
    question:
      '标准盒模型和怪异盒模型的区别是什么？box-sizing 如何影响宽高计算？为什么工程中普遍设置为 border-box？',
    answerId: 'css-03',
    followups: ['如何用 calc 实现带间距的百分比列布局', 'outline 与 border 在盒模型中的差异']
  },
  {
    id: 'css-04',
    code: 69,
    title: 'flex: 1 的含义与 Flex 对齐属性',
    categoryId: 'css',
    level: '中级',
    freq: '高',
    tags: ['Flex', '布局'],
    question:
      'flex: 1 代表什么？flex-grow / flex-shrink / flex-basis 如何计算？为什么 flex: 1 有时不收缩？justify-content 与 align-items 分别控制什么？',
    answerId: 'css-04',
    followups: ['flex: 1 与 width: 100% 的区别', 'align-items: baseline 的实际用途']
  },
  {
    id: 'css-05',
    code: 70,
    title: 'CSS 选择器优先级的计算规则',
    categoryId: 'css',
    level: '中级',
    freq: '高',
    tags: ['优先级', '层叠'],
    question:
      'CSS 选择器优先级如何计算？!important、行内样式、@layer 分别处在什么位置？:not() / :is() / :where() 的权重如何处理？',
    answerId: 'css-05',
    followups: ['@layer 与 !important 的交互细节', 'CSS-in-JS 如何解决权重问题']
  },
  {
    id: 'css-06',
    code: 71,
    title: 'display: none 与 visibility: hidden 的区别',
    categoryId: 'css',
    level: '中级',
    freq: '中高',
    tags: ['显示隐藏', '布局'],
    question:
      'display: none、visibility: hidden、opacity: 0 三者的区别是什么？分别在布局、事件、动画、无障碍上有何表现？',
    answerId: 'css-06',
    followups: ['content-visibility: hidden 与 display: none 的差异', '如何实现真正的"视觉隐藏但可读屏"']
  },
  {
    id: 'css-07',
    code: 72,
    title: '浮动的工作原理与清除浮动',
    categoryId: 'css',
    level: '中级',
    freq: '中高',
    tags: ['float', '清除浮动'],
    question:
      '浮动的工作原理是什么？为什么需要清除浮动？清除浮动有哪些方式？float 在现代布局中还有用吗？',
    answerId: 'css-07',
    followups: ['clear: both 的具体作用范围', 'float 元素与 BFC 的交互']
  },
  {
    id: 'css-08',
    code: 73,
    title: '层叠上下文与 z-index',
    categoryId: 'css',
    level: '中级',
    freq: '中高',
    tags: ['层叠上下文', 'z-index'],
    question:
      '什么是层叠上下文？哪些属性会创建它？为什么 z-index 设成 9999 仍然被盖住？如何排查这类问题？',
    answerId: 'css-08',
    followups: ['isolation: isolate 的实际用途', '弹层组件的 z-index 管理策略']
  },
  {
    id: 'css-09',
    code: 74,
    title: 'px、em、rem、vw/vh 与移动端适配',
    categoryId: 'css',
    level: '中级',
    freq: '中高',
    tags: ['单位', '移动端', '适配'],
    question:
      'px、em、rem、vw/vh 有什么区别？移动端适配方案有哪些？1px 边框问题如何解决？',
    answerId: 'css-09',
    followups: ['如何在不使用 JS 的情况下实现根字号自适应', 'font-size 用 clamp 时的无障碍影响']
  },
  {
    id: 'css-10',
    code: 75,
    title: 'CSS 实现三角形、翻牌等常见图形',
    categoryId: 'css',
    level: '中级',
    freq: '中',
    tags: ['CSS 技巧', '三角形', '3D'],
    question:
      '如何用 CSS 实现三角形、圆角梯形、翻牌效果？请说明原理并给出代码。',
    answerId: 'css-10',
    followups: ['如何使用 clip-path 做 hover 形状过渡动画', 'CSS 实现斜切角（切角卡片）的多种方案']
  },
  {
    id: 'css-11',
    code: 76,
    title: '响应式设计的实现方式',
    categoryId: 'css',
    level: '中级',
    freq: '中',
    tags: ['响应式', '媒体查询', '容器查询'],
    question:
      '响应式设计有哪些实现方式？媒体查询、容器查询、流体排版各自适合什么场景？移动端优先与桌面端优先如何选择？',
    answerId: 'css-11',
    followups: ['容器查询对布局的影响（container-type: size 的副作用）', '如何在 SSR 中处理响应式图片']
  }
]