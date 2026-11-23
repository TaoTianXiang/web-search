/**
 * 面试题库（按 2026 高频 100 题清单整理）
 *
 * 元数据字段：
 *   freq  出现频率：极高 / 高 / 中高 / 中
 *   trend 2026 趋势提示（可选）
 *   code  对应清单中的题号（可选）
 *   level 中级 / 高级
 *   answerId 指向 src/content/questions/<category>/<answerId>.md 的正文
 */
import { jsQuestions } from './js'
import { reactQuestions } from './react'
import { vueQuestions } from './vue'
import { browserQuestions } from './browser'
import { cssQuestions } from './css'
import { htmlQuestions } from './html'
import { engineeringQuestions } from './engineering'
import { tsQuestions } from './ts'
import { aiQuestions } from './ai'
import { loadAnswers } from './qa'

export const categories = [
  { id: 'js', title: 'JavaScript 核心', weight: '约 22%', accent: '#c9a227' },
  { id: 'react', title: 'React', weight: '约 10%', accent: '#3178c6' },
  { id: 'vue', title: 'Vue', weight: '约 8%', accent: '#42b883' },
  { id: 'browser', title: '浏览器与网络', weight: '约 12%', accent: '#0f766e' },
  { id: 'css', title: 'CSS', weight: '约 10%', accent: '#264de4' },
  { id: 'html', title: 'HTML', weight: '约 5%', accent: '#c2410c' },
  { id: 'engineering', title: '性能与工程化', weight: '约 8%', accent: '#7c3aed' },
  { id: 'ts', title: 'TypeScript', weight: '约 5%', accent: '#2563eb' },
  { id: 'ai', title: 'AI 与新趋势', weight: '2026 新增', accent: '#be185d' }
]

const raw = [
  ...jsQuestions,
  ...reactQuestions,
  ...vueQuestions,
  ...browserQuestions,
  ...cssQuestions,
  ...htmlQuestions,
  ...engineeringQuestions,
  ...tsQuestions,
  ...aiQuestions
]

const categoryMap = new Map(categories.map((c) => [c.id, c]))

export const questionBank = raw.map((item, index) => {
  const category = categoryMap.get(item.categoryId)
  return {
    ...item,
    order: index + 1,
    categoryTitle: category ? category.title : '综合',
    accent: category ? category.accent : '#3355ff',
    level: item.level || '中级',
    tags: item.tags || [],
    followups: item.followups || [],
    freq: item.freq || '高'
  }
})

export const levelOptions = ['全部', '中级', '高级']
export const freqOptions = ['全部', '极高', '高', '中高', '中']

/** 频率 → 排序权重（用于"按频率"排序） */
const FREQ_ORDER = { 极高: 0, 高: 1, 中高: 2, 中: 3 }

export function sortByFrequency(list) {
  return [...list].sort((a, b) => (FREQ_ORDER[a.freq] ?? 9) - (FREQ_ORDER[b.freq] ?? 9))
}

export function getQuestion(id) {
  return questionBank.find((q) => q.id === id) || null
}

/** 懒加载某道题的正文（首次调用会加载该模块的所有答案） */
export async function getAnswer(question) {
  if (!question) return ''
  if (question.answer) return question.answer
  const docs = await loadAnswers(question.categoryId)
  const text = docs[question.answerId] || ''
  question.answer = text
  return text
}

/** 预加载模块答案，用于模拟面试等需要立即展示的场景 */
export function prefetchAnswers(categoryIds) {
  categoryIds.forEach((id) => {
    loadAnswers(id)
  })
}

export const freqStats = freqOptions
  .filter((f) => f !== '全部')
  .map((f) => ({ freq: f, count: questionBank.filter((q) => q.freq === f).length }))

const categoryList = questionBank.map((q) => ({
  id: q.categoryId,
  title: q.categoryTitle,
  accent: q.accent
}))

const uniqueCategories = categoryList.filter(
  (c, i) => categoryList.findIndex((x) => x.id === c.id) === i
)

export const categoryStats = uniqueCategories.map((c) => ({
  ...c,
  weight: (categories.find((x) => x.id === c.id) || {}).weight || '',
  count: questionBank.filter((q) => q.categoryId === c.id).length
}))

/** 兼容视图层：题目所属模块列表（含题量） */
export const questionCategories = categories.map((c) => ({
  id: c.id,
  title: c.title,
  count: questionBank.filter((q) => q.categoryId === c.id).length
}))
export const questionChapters = questionCategories

/** 供搜索索引用：只保留必要字段 */
export const questionSearchEntries = questionBank.map((q) => ({
  kind: '面试题',
  title: q.title,
  desc: `${q.categoryTitle} · ${q.level} · ${q.freq}`,
  to: `/questions/${q.id}`,
  haystack: `${q.title} ${q.categoryTitle} ${q.level} ${q.freq} ${q.tags.join(' ')} ${q.question} ${
    q.trend || ''
  }`.toLowerCase()
}))