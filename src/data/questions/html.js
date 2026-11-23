/* eslint-disable */
/** HTML：第 77–82 题 */

export const htmlQuestions = [
  {
    id: 'html-01',
    code: 77,
    title: 'HTML5 语义化标签与实际用法',
    categoryId: 'html',
    level: '中级',
    freq: '高',
    trend: '2026 要求结合业务场景，如用 search 包裹搜索区域、dialog 实现原生弹窗',
    tags: ['语义化', 'HTML5', '无障碍'],
    question:
      'HTML5 新增了哪些语义化标签？实际项目中怎么用？语义化除了 SEO 还有什么价值？',
    answerId: 'html-01',
    followups: ['如何用 popover 属性实现轻量浮层', 'landmark 角色与 skip link 的配合']
  },
  {
    id: 'html-02',
    code: 78,
    title: '行内元素、块级元素、行内块元素的区别',
    categoryId: 'html',
    level: '中级',
    freq: '高',
    tags: ['display', '盒模型'],
    question:
      '行内元素、块级元素、行内块元素的区别是什么？各自的宽高、外边距、换行行为如何？还有哪些 display 值需要了解？',
    answerId: 'html-02',
    followups: ['display: contents 的无障碍陷阱', '如何让 inline 元素支持垂直 margin']
  },
  {
    id: 'html-03',
    code: 79,
    title: 'DOCTYPE 的作用与怪异模式',
    categoryId: 'html',
    level: '中级',
    freq: '中高',
    tags: ['DOCTYPE', '标准模式'],
    question:
      'DOCTYPE 的作用是什么？标准模式与怪异模式（quirks mode）有什么区别？不写 DOCTYPE 会怎样？',
    answerId: 'html-03',
    followups: ['almost standards mode 的具体触发条件', 'XHTML 的 DOCTYPE 与现代 HTML5 的差异']
  },
  {
    id: 'html-04',
    code: 80,
    title: 'src 与 href 的区别',
    categoryId: 'html',
    level: '中级',
    freq: '中高',
    tags: ['src', 'href', '资源加载'],
    question:
      'src 和 href 有什么区别？为什么 script 用 src、link 用 href？两者对页面解析的影响有何不同？',
    answerId: 'html-04',
    followups: ['rel="preload" 与 rel="prefetch" 的优先级差异', 'defer / async 对 script src 的影响']
  },
  {
    id: 'html-05',
    code: 81,
    title: '图片懒加载的实现方式',
    categoryId: 'html',
    level: '中级',
    freq: '中',
    tags: ['懒加载', 'IntersectionObserver', '性能'],
    question:
      'HTML 中如何实现图片懒加载？原生 loading="lazy" 有什么限制？IntersectionObserver 方案如何写？首屏图片为什么不能懒加载？',
    answerId: 'html-05',
    followups: ['如何统计图片的真实曝光率（而非加载率）', 'content-visibility: auto 能否替代图片懒加载']
  },
  {
    id: 'html-06',
    code: 82,
    title: 'Web Worker 与 Service Worker 的区别',
    categoryId: 'html',
    level: '中级',
    freq: '中',
    tags: ['Worker', 'PWA', '离线'],
    question:
      'Web Worker 和 Service Worker 有什么区别？各自适合什么场景？Shared Worker 又是什么？',
    answerId: 'html-06',
    followups: ['Worklet（Audio / Paint / Layout）的定位', 'Service Worker 与 HTTP 缓存的优先级']
  }
]