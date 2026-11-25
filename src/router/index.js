import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: '首页' } },
  { path: '/learn', redirect: '/learn/js-types' },
  { path: '/learn/:slug', name: 'chapter', component: () => import('@/views/ChapterView.vue') },
  {
    path: '/questions',
    name: 'questions',
    component: () => import('@/views/QuestionsView.vue'),
    meta: { title: '面试题库' }
  },
  {
    path: '/questions/:id',
    name: 'question',
    component: () => import('@/views/QuestionView.vue'),
    meta: { title: '题目详情' }
  },
  {
    path: '/cheatsheet',
    name: 'cheatsheet',
    component: () => import('@/views/CheatsheetView.vue'),
    meta: { title: '知识点速查' }
  },
  {
    path: '/glossary',
    name: 'glossary',
    component: () => import('@/views/GlossaryView.vue'),
    meta: { title: '术语词条' }
  },
  { path: '/mock', name: 'mock', component: () => import('@/views/MockView.vue'), meta: { title: '模拟面试' } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 84, behavior: 'smooth' }
    return { top: 0 }
  }
})

router.afterEach((to) => {
  const base = '前端面试进阶手册'
  const title = to.meta.title || (to.name === 'chapter' ? '教材' : to.name === 'question' ? '面试题' : '')
  document.title = title ? `${title} · ${base}` : base
})

export default router