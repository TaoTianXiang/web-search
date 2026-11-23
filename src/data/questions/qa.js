/**
 * ?????????????
 * ?????? require.context????????????? md?
 */
const loaders = {
  js: () => import('@/content/questions/js/index.js'),
  react: () => import('@/content/questions/react/index.js'),
  vue: () => import('@/content/questions/vue/index.js'),
  browser: () => import('@/content/questions/browser/index.js'),
  css: () => import('@/content/questions/css/index.js'),
  html: () => import('@/content/questions/html/index.js'),
  engineering: () => import('@/content/questions/engineering/index.js'),
  ts: () => import('@/content/questions/ts/index.js'),
  ai: () => import('@/content/questions/ai/index.js')
}

const cache = {}

export async function loadAnswers(categoryId) {
  if (cache[categoryId]) return cache[categoryId]
  const loader = loaders[categoryId]
  if (!loader) return {}
  const mod = await loader()
  cache[categoryId] = mod.default || {}
  return cache[categoryId]
}
