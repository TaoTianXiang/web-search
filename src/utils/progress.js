import { reactive, computed, watch } from 'vue'

const STORAGE_KEY = 'fe-interview-progress-v1'

function loadSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

const defaults = {
  read: {}, // slug -> timestamp
  quiz: {}, // slug -> { correct, total }
  mock: {
    answered: 0,
    correct: 0,
    sessions: 0,
    lastPlayed: null
  }
}

const snapshot = loadSnapshot()

export const progress = reactive({
  read: snapshot?.read || {},
  quiz: snapshot?.quiz || {},
  mock: { ...defaults.mock, ...(snapshot?.mock || {}) }
})

let saveTimer = null
watch(
  progress,
  () => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
      } catch {
        /* 隐私模式等场景下静默降级 */
      }
    }, 200)
  },
  { deep: true }
)

/** 标记章节为已读（进入正文一段时间后调用） */
export function markRead(slug) {
  if (!slug) return
  if (!progress.read[slug]) {
    progress.read[slug] = Date.now()
  }
}

export function isRead(slug) {
  return Boolean(progress.read[slug])
}

/** 记录章末自测得分 */
export function saveQuizResult(slug, correct, total) {
  const prev = progress.quiz[slug]
  const best = prev ? Math.max(prev.correct, correct) : correct
  progress.quiz[slug] = { correct: best, total, updatedAt: Date.now() }
}

export function recordMockAnswer(isCorrect) {
  progress.mock.answered += 1
  if (isCorrect) progress.mock.correct += 1
  progress.mock.lastPlayed = Date.now()
}

export function startMockSession() {
  progress.mock.sessions += 1
  progress.mock.lastPlayed = Date.now()
}

export function resetProgress() {
  progress.read = {}
  progress.quiz = {}
  progress.mock = { ...defaults.mock }
}

export function buildStats(totalSections) {
  const readCount = Object.keys(progress.read).length
  const quizEntries = Object.values(progress.quiz)
  const quizCorrect = quizEntries.reduce((sum, item) => sum + item.correct, 0)
  const quizTotal = quizEntries.reduce((sum, item) => sum + item.total, 0)
  return {
    readCount,
    totalSections,
    readPercent: totalSections ? Math.round((readCount / totalSections) * 100) : 0,
    quizCorrect,
    quizTotal,
    quizPercent: quizTotal ? Math.round((quizCorrect / quizTotal) * 100) : 0,
    mock: progress.mock
  }
}

export function useStats(totalSections) {
  return computed(() => buildStats(totalSections))
}