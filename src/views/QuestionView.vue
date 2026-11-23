<template>
  <div v-if="question" class="question-page">
    <aside class="side">
      <RouterLink to="/questions" class="back">← 返回题库</RouterLink>
      <div class="side-block">
        <p class="side-label">所属模块</p>
        <p class="side-value">{{ question.categoryTitle }}</p>
      </div>
      <div class="side-block">
        <p class="side-label">出现频率</p>
        <p class="side-value">{{ question.freq }}</p>
      </div>
      <div class="side-block">
        <p class="side-label">难度</p>
        <p class="side-value">{{ question.level }}</p>
      </div>
      <div v-if="related.length" class="side-block">
        <p class="side-label">相关题目</p>
        <RouterLink v-for="item in related" :key="item.id" :to="`/questions/${item.id}`" class="related-link">
          {{ item.title }}
        </RouterLink>
      </div>
      <RouterLink :to="learnLink" class="btn btn-sm side-btn">阅读对应专题 →</RouterLink>
    </aside>

    <article class="main">
      <div class="q-head">
        <div class="q-meta">
          <span class="q-code" :style="{ background: question.accent + '14', color: question.accent }">
            Q{{ question.code || question.order }}
          </span>
          <span class="pill freq-pill" :class="'freq-' + FREQ_CLASS[question.freq]">{{ question.freq }}</span>
          <span class="pill" :class="question.level === '高级' ? 'pill-amber' : 'pill-brand'">
            {{ question.level }}
          </span>
          <span class="q-chapter">{{ question.categoryTitle }}</span>
        </div>
        <h1>{{ question.title }}</h1>
        <p v-if="question.trend" class="q-trend">2026 趋势：{{ question.trend }}</p>
        <div class="q-tags">
          <span v-for="tag in question.tags" :key="tag">#{{ tag }}</span>
        </div>
      </div>

      <section class="panel question-panel">
        <h2>面试官问的是</h2>
        <div class="question-text" v-html="renderedQuestion" />
      </section>

      <section class="panel answer-panel">
        <div class="answer-head">
          <h2>参考解析</h2>
          <button class="btn btn-sm" type="button" @click="toggleAnswer">
            {{ showAnswer ? '收起解析' : '展开解析' }}
          </button>
        </div>
        <div v-if="showAnswer">
          <p v-if="answerLoading" class="collapsed-hint">正在加载解析…</p>
          <MarkdownView v-else :source="answerText" />
        </div>
        <p v-else class="collapsed-hint">先自己组织一遍答案，再展开对照。这样记得更牢。</p>
      </section>

      <section v-if="question.followups.length" class="panel followup-panel">
        <h2>可能的追问</h2>
        <ul>
          <li v-for="item in question.followups" :key="item">{{ item }}</li>
        </ul>
      </section>

      <nav class="pager">
        <RouterLink v-if="prevQuestion" :to="`/questions/${prevQuestion.id}`" class="pager-card">
          <span>← 上一题</span>
          <strong>{{ prevQuestion.title }}</strong>
        </RouterLink>
        <span v-else />
        <RouterLink v-if="nextQuestion" :to="`/questions/${nextQuestion.id}`" class="pager-card next">
          <span>下一题 →</span>
          <strong>{{ nextQuestion.title }}</strong>
        </RouterLink>
      </nav>
    </article>
  </div>

  <div v-else class="not-found">
    <h1>题目不存在</h1>
    <RouterLink to="/questions" class="btn btn-primary">返回题库</RouterLink>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownView from '@/components/MarkdownView.vue'
import { getQuestion, getAnswer, questionBank, prefetchAnswers } from '@/data/questions'
import { allSections } from '@/data/curriculum'
import { renderMarkdown } from '@/utils/markdown'

const FREQ_CLASS = { 极高: 'hot', 高: 'high', 中高: 'mid', 中: 'normal' }

export default {
  name: 'QuestionView',
  components: { MarkdownView },
  setup() {
    const route = useRoute()
    const showAnswer = ref(false)
    const answerText = ref('')
    const answerLoading = ref(false)

    const question = computed(() => getQuestion(route.params.id))

    const renderedQuestion = computed(() => {
      if (!question.value) return ''
      return renderMarkdown(question.value.question).html.replace(/^<p>|<\/p>\n?$/g, '')
    })

    const related = computed(() => {
      if (!question.value) return []
      return questionBank
        .filter((q) => q.categoryId === question.value.categoryId && q.id !== question.value.id)
        .slice(0, 4)
    })

    const learnLink = computed(() => {
      if (!question.value) return '/learn/js-types'
      const chapterId = question.value.chapterId || question.value.categoryId
      const section = allSections.find((s) => s.chapterId === chapterId)
      return section ? `/learn/${section.slug}` : '/learn/js-types'
    })

    const index = computed(() => questionBank.findIndex((q) => q.id === route.params.id))
    const prevQuestion = computed(() => (index.value > 0 ? questionBank[index.value - 1] : null))
    const nextQuestion = computed(() =>
      index.value >= 0 && index.value < questionBank.length - 1 ? questionBank[index.value + 1] : null
    )

    async function ensureAnswer() {
      if (!question.value) return
      if (question.value.answer) {
        answerText.value = question.value.answer
        return
      }
      answerLoading.value = true
      answerText.value = await getAnswer(question.value)
      answerLoading.value = false
    }

    function toggleAnswer() {
      showAnswer.value = !showAnswer.value
      if (showAnswer.value) ensureAnswer()
    }

    watch(
      () => route.params.id,
      () => {
        showAnswer.value = false
        answerText.value = ''
        window.scrollTo({ top: 0 })
        // 预取同类模块，减少下一次展开的等待
        if (question.value) prefetchAnswers([question.value.categoryId])
      },
      { immediate: true }
    )

    return {
      FREQ_CLASS,
      question,
      renderedQuestion,
      related,
      learnLink,
      prevQuestion,
      nextQuestion,
      showAnswer,
      answerText,
      answerLoading,
      toggleAnswer
    }
  }
}
</script>

<style scoped>
.question-page {
  max-width: 1140px;
  margin: 0 auto;
  padding: 34px 24px 70px;
  display: grid;
  grid-template-columns: 216px minmax(0, 1fr);
  gap: 44px;
  align-items: start;
}

.side {
  position: sticky;
  top: calc(var(--header-h) + 26px);
  font-size: 13px;
}

.back {
  display: block;
  margin-bottom: 22px;
  font-size: 13px;
  color: var(--text-soft);
}

.side-block {
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px dashed var(--border);
}

.side-label {
  font-size: 11px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-mute);
  font-weight: 600;
  margin: 0 0 6px;
}

.side-value {
  margin: 0;
  font-size: 13.5px;
  font-weight: 550;
}

.related-link {
  display: block;
  font-size: 12.8px;
  padding: 4px 0;
  color: var(--text-soft);
  line-height: 1.5;
}

.related-link:hover {
  color: var(--brand);
}

.side-btn {
  width: 100%;
  justify-content: center;
}

.q-head h1 {
  font-size: 30px;
  margin: 12px 0 10px;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.q-meta {
  display: flex;
  align-items: center;
  gap: 7px;
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

.q-trend {
  margin: 0 0 10px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text-mute);
  border-left: 3px solid var(--border-strong);
  padding-left: 10px;
}

.q-tags {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: var(--text-mute);
  margin-bottom: 26px;
}

.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 22px 26px;
  margin-bottom: 18px;
  background: var(--surface);
}

.panel h2 {
  font-size: 15px;
  letter-spacing: 0.02em;
  color: var(--text-mute);
  font-weight: 600;
  text-transform: uppercase;
  margin: 0 0 12px;
}

.question-panel {
  background: linear-gradient(180deg, #fbfcff, #fff);
  border-color: #e2e7ff;
}

.question-text {
  font-size: 15.5px;
  line-height: 1.72;
}

.question-text :deep(p) {
  margin: 0 0 10px;
}

.question-text :deep(p:last-child) {
  margin-bottom: 0;
}

.answer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.answer-head h2 {
  margin: 0;
}

.collapsed-hint,
.loading-hint {
  margin: 0;
  color: var(--text-mute);
  font-size: 13.5px;
}

.followup-panel ul {
  margin: 0;
  padding-left: 1.2em;
  font-size: 14px;
  color: var(--text-soft);
}

.followup-panel li {
  margin: 5px 0;
}

.pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 30px;
}

.pager-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 13px 17px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
}

.pager-card:hover {
  border-color: #c3cbf7;
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

.pager-card span {
  font-size: 12px;
  color: var(--text-mute);
}

.pager-card strong {
  font-size: 13.8px;
  font-weight: 600;
}

.pager-card.next {
  text-align: right;
  align-items: flex-end;
}

.not-found {
  max-width: 620px;
  margin: 110px auto;
  text-align: center;
  padding: 0 24px;
}

@media (max-width: 940px) {
  .question-page {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 22px 16px 50px;
  }
  .side {
    position: static;
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    align-items: center;
    padding-bottom: 18px;
    margin-bottom: 22px;
    border-bottom: 1px solid var(--border);
  }
  .back,
  .side-block {
    margin: 0;
    padding: 0;
    border: none;
  }
  .side-btn {
    width: auto;
  }
  .q-head h1 {
    font-size: 24px;
  }
  .panel {
    padding: 18px;
  }
  .pager {
    grid-template-columns: 1fr;
  }
}
</style>