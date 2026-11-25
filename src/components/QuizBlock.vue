<template>
  <div class="quiz">
    <div v-for="(item, qi) in questions" :key="qi" class="quiz-item">
      <div class="quiz-question">
        <span class="quiz-no">{{ qi + 1 }}</span>
        <span class="quiz-text" v-html="inline(item.q)" />
      </div>

      <div class="quiz-options">
        <button
          v-for="(opt, oi) in item.options"
          :key="oi"
          type="button"
          class="option"
          :class="optionClass(qi, oi)"
          :disabled="picked[qi] !== undefined"
          @click="choose(qi, oi)"
        >
          <span class="option-key">{{ String.fromCharCode(65 + oi) }}</span>
          <span class="option-text" v-html="inline(opt)" />
        </button>
      </div>

      <div v-if="picked[qi] !== undefined" class="quiz-explain">
        <span class="verdict" :class="isCorrect(qi) ? 'ok' : 'bad'">
          {{ isCorrect(qi) ? '回答正确' : '回答错误' }}
        </span>
        <p>
          <strong>正确答案：</strong>{{ String.fromCharCode(65 + item.answer) }}
        </p>
        <p v-html="inline(item.explain)" />
      </div>
    </div>

    <div class="quiz-footer">
      <div class="quiz-score">
        已答 {{ answeredCount }} / {{ questions.length }}
        <span v-if="answeredCount === questions.length" class="pill pill-green">
          得分 {{ correctCount }} / {{ questions.length }}
        </span>
      </div>
      <button class="btn btn-sm" type="button" :disabled="!answeredCount" @click="reset">重做本组</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { saveQuizResult } from '@/utils/progress'
import { renderMarkdown } from '@/utils/markdown'

export default {
  name: 'QuizBlock',
  props: {
    questions: { type: Array, required: true },
    slug: { type: String, required: true }
  },
  setup(props) {
    const picked = ref({})
    // 作答所属章节：防止切换章节的瞬间把旧作答记到新章节名下
    const pickedSlug = ref(props.slug)

    const answeredCount = computed(() => Object.keys(picked.value).length)
    const correctCount = computed(() =>
      props.questions.reduce((sum, item, index) => (picked.value[index] === item.answer ? sum + 1 : sum), 0)
    )

    function inline(text) {
      // 支持题目中的行内代码与加粗
      const { html } = renderMarkdown(text)
      return html.replace(/^<p>|<\/p>\n?$/g, '')
    }

    function choose(qi, oi) {
      if (picked.value[qi] !== undefined) return
      pickedSlug.value = props.slug
      picked.value = { ...picked.value, [qi]: oi }
    }

    function optionClass(qi, oi) {
      const pick = picked.value[qi]
      if (pick === undefined) return ''
      const isAnswer = props.questions[qi].answer === oi
      if (isAnswer) return 'correct'
      if (pick === oi) return 'wrong'
      return 'muted'
    }

    function isCorrect(qi) {
      return picked.value[qi] === props.questions[qi].answer
    }

    function reset() {
      picked.value = {}
    }

    // 章节切换时组件实例会被复用，必须清空作答，否则上一章的选项会串到下一章
    watch(
      () => props.slug,
      (slug) => {
        picked.value = {}
        pickedSlug.value = slug
      }
    )

    watch([picked, correctCount], () => {
      const answered = Object.keys(picked.value).length
      // 只在「当前这道题属于当前章节」且全部作答后才记录成绩
      if (answered === props.questions.length && pickedSlug.value === props.slug) {
        saveQuizResult(props.slug, correctCount.value, props.questions.length)
      }
    })

    return { picked, answeredCount, correctCount, inline, choose, optionClass, isCorrect, reset }
  }
}
</script>

<style scoped>
.quiz-item + .quiz-item {
  margin-top: 26px;
  padding-top: 26px;
  border-top: 1px dashed var(--border);
}

.quiz-question {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.quiz-no {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--text);
  color: #fff;
  font-size: 11.5px;
  font-weight: 600;
  display: grid;
  place-items: center;
  margin-top: 3px;
}

.quiz-text {
  font-size: 15px;
  font-weight: 550;
  line-height: 1.6;
}

.quiz-text :deep(p),
.quiz-text :deep(code) {
  display: inline;
}

.quiz-text :deep(p) {
  margin: 0;
}

.quiz-options {
  display: grid;
  gap: 8px;
  padding-left: 30px;
}

.option {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  text-align: left;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  line-height: 1.55;
  transition: 0.14s ease;
}

.option:hover:not(:disabled) {
  border-color: var(--brand);
  background: var(--brand-soft);
}

.option:disabled {
  cursor: default;
}

.option-key {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 1px solid var(--border-strong);
  font-size: 11.5px;
  font-weight: 600;
  display: grid;
  place-items: center;
  color: var(--text-soft);
}

.option-text :deep(p) {
  margin: 0;
}

.option.correct {
  border-color: #35b37e;
  background: var(--green-soft);
}

.option.correct .option-key {
  border-color: #35b37e;
  background: #35b37e;
  color: #fff;
}

.option.wrong {
  border-color: #e08894;
  background: var(--red-soft);
}

.option.wrong .option-key {
  border-color: #d8637a;
  background: #d8637a;
  color: #fff;
}

.option.muted {
  opacity: 0.62;
}

.quiz-explain {
  margin: 14px 0 0 30px;
  padding: 14px 16px;
  border-radius: var(--radius);
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  font-size: 13.8px;
  color: var(--text-soft);
}

.quiz-explain p {
  margin: 0 0 6px;
}

.quiz-explain p:last-child {
  margin-bottom: 0;
}

.verdict {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  margin-bottom: 8px;
}

.verdict.ok {
  background: var(--green-soft);
  color: var(--green);
}

.verdict.bad {
  background: var(--red-soft);
  color: var(--red);
}

.quiz-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-soft);
}

.quiz-score {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 640px) {
  .quiz-options,
  .quiz-explain {
    padding-left: 0;
    margin-left: 0;
  }
}
</style>