<template>
  <div class="mock-page">
    <header class="mock-head">
      <span class="pill pill-brand">模拟面试</span>
      <h1>{{ headTitle }}</h1>
      <p v-if="phase === 'setup'">
        按模块、难度与频率随机抽题。每题先在脑中作答，再展开参考解析并自评。全程本地记录，不上传任何数据。
      </p>
      <p v-else-if="phase === 'running'">第 {{ index + 1 }} / {{ session.length }} 题 · 用时 {{ elapsedText }}</p>
      <p v-else>本场用时 {{ elapsedText }} · {{ session.length }} 题 · 答对 {{ finalScore }} 题</p>
    </header>

    <section v-if="phase === 'setup'" class="setup">
      <div class="setup-grid">
        <div class="setup-card">
          <h3>选择模块</h3>
          <div class="chip-row">
            <button
              v-for="item in chapterOptions"
              :key="item.id"
              type="button"
              class="chip"
              :class="{ active: selectedChapters.includes(item.id) }"
              @click="toggleChapter(item.id)"
            >
              {{ item.title }}
            </button>
          </div>

          <h3>出现频率</h3>
          <div class="chip-row">
            <button
              v-for="item in freqOptions.filter((f) => f !== '全部')"
              :key="item"
              type="button"
              class="chip"
              :class="{ active: selectedFreqs.includes(item) }"
              @click="toggleFreq(item)"
            >
              {{ item }}
            </button>
          </div>

          <h3>难度</h3>
          <div class="chip-row">
            <button
              v-for="item in difficultyOptions"
              :key="item"
              type="button"
              class="chip"
              :class="{ active: difficulty === item }"
              @click="difficulty = item"
            >
              {{ item }}
            </button>
          </div>

          <h3>题目数量</h3>
          <div class="chip-row">
            <button
              v-for="n in [5, 8, 12]"
              :key="n"
              type="button"
              class="chip"
              :class="{ active: count === n }"
              @click="count = n"
            >
              {{ n }} 题
            </button>
          </div>

          <button class="btn btn-primary start-btn" type="button" :disabled="availablePool.length === 0" @click="start">
            开始模拟 · 可选 {{ availablePool.length }} 题
          </button>
          <p v-if="availablePool.length === 0" class="warn-text">当前筛选下没有题目，请放宽范围。</p>
        </div>

        <div class="setup-card history">
          <h3>历史表现</h3>
          <div class="history-row">
            <span>累计作答</span>
            <strong>{{ progress.mock.answered }} 题</strong>
          </div>
          <div class="history-row">
            <span>自评正确</span>
            <strong>{{ progress.mock.correct }} 题</strong>
          </div>
          <div class="history-row">
            <span>完成场次</span>
            <strong>{{ progress.mock.sessions }} 场</strong>
          </div>
          <div class="history-row">
            <span>平均正确率</span>
            <strong>{{ overallAccuracy }}%</strong>
          </div>
          <p class="history-note">
            建议流程：先按"极高"频率抽 5 题快速暴露盲区 → 记下不会的 → 回到对应专题精读 → 隔天再测同一模块。
          </p>
        </div>
      </div>
    </section>

    <section v-else-if="phase === 'running' && current" class="running">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: ((index + 1) / session.length) * 100 + '%' }" />
      </div>

      <div class="question-card card">
        <div class="q-meta">
          <span class="q-code" :style="{ background: current.accent + '14', color: current.accent }">
            Q{{ current.code || current.order }}
          </span>
          <span class="pill freq-pill" :class="'freq-' + FREQ_CLASS[current.freq]">{{ current.freq }}</span>
          <span class="pill" :class="current.level === '高级' ? 'pill-amber' : 'pill-brand'">{{ current.level }}</span>
          <span class="q-chapter">{{ current.categoryTitle }}</span>
        </div>
        <h2>{{ current.title }}</h2>
        <p class="q-body">{{ current.question }}</p>

        <button v-if="!revealed" class="btn btn-primary" type="button" @click="reveal">
          展开参考解析
        </button>

        <div v-else class="answer-box">
                  <p v-if="answerLoading" class="loading-hint">正在加载解析…</p>
                  <MarkdownView v-else :source="answerText" />
          <div class="self-eval">
            <p class="eval-label">自评：你的回答覆盖了多少要点？</p>
            <div class="eval-actions">
              <button class="btn eval-btn" type="button" @click="evaluate(false)">没答上来</button>
              <button class="btn btn-primary eval-btn" type="button" @click="evaluate(true)">基本答对</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-else-if="phase === 'result'" class="result">
      <div class="result-card card">
        <span class="pill pill-green">本场结束</span>
        <h2>{{ finalScore }} / {{ session.length }} 题答对</h2>
        <p class="result-desc">{{ verdictText }}</p>

        <div class="result-list">
          <div v-for="(item, i) in session" :key="item.id" class="result-item">
            <span class="mark" :class="results[i] ? 'ok' : 'bad'">{{ results[i] ? '✓' : '✕' }}</span>
            <RouterLink :to="`/questions/${item.id}`" class="result-title">{{ item.title }}</RouterLink>
            <span class="result-chapter">{{ item.categoryTitle }}</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="btn btn-primary" type="button" @click="start">再抽一组</button>
          <button class="btn" type="button" @click="phase = 'setup'">调整范围</button>
          <RouterLink to="/questions" class="btn btn-ghost">去题库查看全部</RouterLink>
        </div>
      </div>

      <div v-if="weakChapters.length" class="weak-card card">
        <h3>建议复习</h3>
        <ul>
          <li v-for="item in weakChapters" :key="item.id">
            <RouterLink :to="item.link">{{ item.title }}</RouterLink>
            <span>（本场错 {{ item.wrong }} 题）</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, computed, onBeforeUnmount } from 'vue'
import MarkdownView from '@/components/MarkdownView.vue'
import { questionBank, questionCategories, freqOptions, levelOptions, getAnswer } from '@/data/questions'
import { allSections } from '@/data/curriculum'
import { progress, recordMockAnswer, startMockSession } from '@/utils/progress'

const FREQ_CLASS = { 极高: 'hot', 高: 'high', 中高: 'mid', 中: 'normal' }

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default {
  name: 'MockView',
  components: { MarkdownView },
  setup() {
    const phase = ref('setup')
    const selectedChapters = ref(questionCategories.map((c) => c.id))
    const selectedFreqs = ref(freqOptions.filter((f) => f !== '全部'))
    const difficulty = ref('全部')
    const count = ref(5)

    const session = ref([])
    const results = ref([])
    const index = ref(0)
    const revealed = ref(false)
    const seconds = ref(0)
        const answerText = ref('')
        const answerLoading = ref(false)

    let timer = null

    const chapterOptions = questionCategories
    const difficultyOptions = levelOptions

    const availablePool = computed(() =>
      questionBank.filter((item) => {
        if (!selectedChapters.value.includes(item.categoryId)) return false
        if (!selectedFreqs.value.includes(item.freq)) return false
        if (difficulty.value !== '全部' && item.level !== difficulty.value) return false
        return true
      })
    )

    const current = computed(() => session.value[index.value] || null)

    const headTitle = computed(() => {
      if (phase.value === 'setup') return '来一场 25 分钟的面试'
      if (phase.value === 'running') return '正在面试中'
      return '本场复盘'
    })

    const finalScore = computed(() => results.value.filter(Boolean).length)

    const overallAccuracy = computed(() =>
      progress.mock.answered ? Math.round((progress.mock.correct / progress.mock.answered) * 100) : 0
    )

    const elapsedText = computed(() => {
      const m = Math.floor(seconds.value / 60)
      const s = seconds.value % 60
      return `${m}:${String(s).padStart(2, '0')}`
    })

    const verdictText = computed(() => {
      const total = session.value.length || 1
      const ratio = finalScore.value / total
      if (ratio >= 0.85) return '状态不错，可以尝试加入"高级"难度再测一轮。'
      if (ratio >= 0.6) return '基础扎实，但仍有盲区。建议把错题对应的专题重读一遍再复测。'
      if (ratio >= 0.3) return '暴露了不少盲区，这是好事。按错题模块逐个精读，两天后复测会有明显提升。'
      return '目前处于"能听懂但讲不出"的阶段。建议先精读对应专题，并尝试口述结论。'
    })

    const weakChapters = computed(() => {
      const wrongMap = new Map()
      session.value.forEach((item, i) => {
        if (results.value[i]) return
        const entry = wrongMap.get(item.categoryId) || { wrong: 0 }
        entry.wrong += 1
        wrongMap.set(item.categoryId, entry)
      })
      return [...wrongMap.entries()].map(([id, entry]) => {
        const category = questionCategories.find((c) => c.id === id)
        const section = allSections.find((s) => s.chapterId === id)
        return {
          id,
          title: category ? category.title : id,
          wrong: entry.wrong,
          link: section ? `/learn/${section.slug}` : '/learn/js-types'
        }
      })
    })

    function toggleChapter(id) {
      const list = selectedChapters.value
      if (list.includes(id)) selectedChapters.value = list.filter((item) => item !== id)
      else selectedChapters.value = [...list, id]
    }

    function toggleFreq(f) {
      const list = selectedFreqs.value
      if (list.includes(f)) selectedFreqs.value = list.filter((item) => item !== f)
      else selectedFreqs.value = [...list, f]
    }

    async function reveal() {
          if (!current.value) return
          revealed.value = true
          if (current.value.answer) {
            answerText.value = current.value.answer
            return
          }
          answerLoading.value = true
          answerText.value = await getAnswer(current.value)
          answerLoading.value = false
        }

        function start() {
      const pool = availablePool.value
      if (!pool.length) return
      session.value = shuffle(pool).slice(0, Math.min(count.value, pool.length))
      results.value = []
      index.value = 0
      revealed.value = false
          answerText.value = ''
      seconds.value = 0
      phase.value = 'running'
      startMockSession()

      if (timer) clearInterval(timer)
      timer = setInterval(() => {
        seconds.value += 1
      }, 1000)
    }

    function stopTimer() {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    function evaluate(isCorrect) {
      results.value = [...results.value, isCorrect]
      recordMockAnswer(isCorrect)

      if (index.value + 1 < session.value.length) {
        index.value += 1
        revealed.value = false
              answerText.value = ''
      } else {
        stopTimer()
        phase.value = 'result'
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    onBeforeUnmount(stopTimer)

    return {
      FREQ_CLASS,
      phase,
      chapterOptions,
      difficultyOptions,
      freqOptions,
      selectedChapters,
      selectedFreqs,
      difficulty,
      count,
      availablePool,
      session,
      results,
      index,
      current,
      revealed,
          answerText,
          answerLoading,
      elapsedText,
      headTitle,
      finalScore,
      overallAccuracy,
      verdictText,
      weakChapters,
      progress,
      toggleChapter,
      toggleFreq,
          reveal,
      start,
      evaluate
    }
  }
}
</script>

<style scoped>
.mock-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 24px 70px;
}

.mock-head {
  margin-bottom: 26px;
}

.mock-head h1 {
  font-size: 30px;
  margin: 12px 0 10px;
  letter-spacing: -0.02em;
}

.mock-head p {
  margin: 0;
  color: var(--text-soft);
  font-size: 14.5px;
}

.setup-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.setup-card {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 22px 24px;
  background: var(--surface);
}

.setup-card h3 {
  font-size: 12.5px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-mute);
  margin: 0 0 10px;
}

.setup-card h3:not(:first-child) {
  margin-top: 20px;
}

.chip-row {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.chip {
  border: 1px solid var(--border-strong);
  background: #fff;
  color: var(--text-soft);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12.5px;
  transition: 0.14s ease;
}

.chip:hover {
  border-color: var(--brand);
  color: var(--brand);
}

.chip.active {
  background: var(--brand);
  border-color: var(--brand);
  color: #fff;
}

.start-btn {
  width: 100%;
  justify-content: center;
  margin-top: 24px;
  padding: 10px;
  font-size: 14px;
}

.warn-text {
  margin: 10px 0 0;
  font-size: 12.5px;
  color: var(--red);
}

.history {
  background: linear-gradient(180deg, #fbfcff, #fff);
}

.history-row {
  display: flex;
  justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px dashed var(--border);
  font-size: 13.5px;
  color: var(--text-soft);
}

.history-row strong {
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.history-note {
  margin: 16px 0 0;
  font-size: 12.5px;
  color: var(--text-mute);
  line-height: 1.65;
}

.progress-track {
  height: 4px;
  background: var(--bg-muted);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 22px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3355ff, #7c4dff);
  transition: width 0.3s ease;
}

.question-card {
  padding: 26px 30px;
}

.q-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.q-code {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 5px;
}

.freq-pill {
  font-size: 11px;
  padding: 1px 7px;
}

.freq-hot {
  background: #fdecef;
  color: #b81d38;
}

.freq-high {
  background: #fdf1e0;
  color: #9a5a00;
}

.freq-mid {
  background: #eef4ff;
  color: #2455c9;
}

.freq-normal {
  background: var(--bg-muted);
  color: var(--text-mute);
}

.q-chapter {
  font-size: 12.5px;
  color: var(--text-mute);
}

.question-card h2 {
  font-size: 23px;
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}

.q-body {
  white-space: pre-wrap;
  font-size: 15.5px;
  color: var(--text-soft);
  line-height: 1.75;
  margin: 0 0 22px;
}

.answer-box {
  border-top: 1px solid var(--border);
  padding-top: 22px;
}

.self-eval {
  margin-top: 26px;
  padding-top: 18px;
  border-top: 1px dashed var(--border);
}

.eval-label {
  font-size: 13px;
  color: var(--text-mute);
  margin: 0 0 12px;
}

.eval-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.eval-btn {
  padding: 9px 20px;
  font-size: 14px;
}

.result-card {
  padding: 30px 32px;
}

.result-card h2 {
  font-size: 26px;
  margin: 14px 0 8px;
}

.result-desc {
  margin: 0 0 22px;
  color: var(--text-soft);
  font-size: 14.5px;
}

.result-list {
  border-top: 1px solid var(--border);
  padding-top: 14px;
  margin-bottom: 22px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  font-size: 13.5px;
  border-bottom: 1px dashed var(--border);
}

.mark {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.mark.ok {
  background: var(--green-soft);
  color: var(--green);
}

.mark.bad {
  background: var(--red-soft);
  color: var(--red);
}

.result-title {
  color: var(--text);
  font-weight: 500;
}

.result-title:hover {
  color: var(--brand);
}

.result-chapter {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-mute);
}

.result-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.weak-card {
  margin-top: 16px;
  padding: 20px 24px;
}

.weak-card h3 {
  font-size: 14px;
  margin: 0 0 10px;
}

.weak-card ul {
  margin: 0;
  padding-left: 1.2em;
  font-size: 13.5px;
  color: var(--text-soft);
}

.weak-card li {
  margin: 5px 0;
}

@media (max-width: 860px) {
  .mock-page {
    padding: 26px 14px 50px;
  }
  .mock-head h1 {
    font-size: 23px;
  }
  .setup-grid {
    grid-template-columns: 1fr;
  }
  .question-card {
    padding: 20px;
  }
  .result-card {
    padding: 22px;
  }
}
</style>