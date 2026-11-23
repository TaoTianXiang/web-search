<template>
  <div class="questions-page">
    <header class="page-head">
      <span class="pill pill-brand">2026 高频 100 题</span>
      <h1>{{ questionBank.length }} 道结构化面试题</h1>
      <p>
        按 2026 年真实面经统计整理，覆盖 {{ categoryStats.length }} 个模块、四级出现频率。每题含结论、原理推导与面试视角；
        答案默认折叠，先自述再对照。
      </p>
      <div class="head-stats">
        <div v-for="item in categoryStats" :key="item.id" class="stat-cell">
          <span class="stat-dot" :style="{ background: item.accent }" />
          <span class="stat-name">{{ item.title }}</span>
          <strong>{{ item.count }}</strong>
          <span class="stat-weight">{{ item.weight }}</span>
        </div>
      </div>

            <details class="trend-note">
              <summary>2026 面试权重变化提示</summary>
              <ul>
                <li>手写排序等纯算法题权重大幅下降 —— AI 一秒生成，失去区分度</li>
                <li>八股背诵权重整体下降，部分大厂校招已明确"告别八股背诵"</li>
                <li>取而代之的是系统设计、AI 工具运用与工程实践能力的考察</li>
                <li>
                  复习优先级：React Fiber / RSC、Vue 3 响应式、事件循环、性能优化 —— 要求能讲清原理、能画图、能结合项目实例
                </li>
              </ul>
            </details>
    </header>

    <div class="filters">
      <div class="filter-group">
        <span class="filter-label">频率</span>
        <button
          v-for="item in freqOptions"
          :key="item"
          type="button"
          class="chip"
          :class="{ active: freq === item }"
          @click="freq = item"
        >
          {{ item }}
          <span v-if="item !== '全部'" class="chip-count">{{ freqCount(item) }}</span>
        </button>
      </div>

      <div class="filter-group">
        <span class="filter-label">难度</span>
        <button
          v-for="item in levelOptions"
          :key="item"
          type="button"
          class="chip"
          :class="{ active: level === item }"
          @click="level = item"
        >
          {{ item }}
        </button>
      </div>

      <div class="filter-group">
        <span class="filter-label">模块</span>
        <button
          v-for="item in chapterOptions"
          :key="item.id"
          type="button"
          class="chip"
          :class="{ active: categoryId === item.id }"
          @click="categoryId = item.id"
        >
          {{ item.title }}
          <span class="chip-count">{{ item.count }}</span>
        </button>
      </div>

      <div class="filter-group filter-search">
        <span class="filter-label">关键词</span>
        <input v-model="keyword" type="search" placeholder="搜索题目或标签，如 缓存 / 闭包 / RSC" />
      </div>
    </div>

    <div class="result-bar">
      <span>{{ filtered.length }} 道题目</span>
      <div class="result-actions">
        <button type="button" class="sort-btn" :class="{ active: order === 'freq' }" @click="order = 'freq'">
          按频率
        </button>
        <button type="button" class="sort-btn" :class="{ active: order === 'order' }" @click="order = 'order'">
          按题号
        </button>
        <span
          v-if="hasFilter"
          class="reset"
          role="button"
          tabindex="0"
          @click="clearFilters"
          @keydown.enter="clearFilters"
        >
          清除筛选
        </span>
      </div>
    </div>

    <div class="question-list">
      <RouterLink
        v-for="item in filtered"
        :key="item.id"
        :to="`/questions/${item.id}`"
        class="card card-hover question-card"
      >
        <div class="question-top">
          <span class="q-code" :style="{ background: item.accent + '14', color: item.accent }">
            Q{{ item.code || item.order }}
          </span>
          <span class="pill freq-pill" :class="'freq-' + FREQ_CLASS[item.freq]">{{ item.freq }}</span>
          <span class="pill" :class="item.level === '高级' ? 'pill-amber' : 'pill-brand'">{{ item.level }}</span>
          <span class="question-chapter">{{ item.categoryTitle }}</span>
        </div>
        <h3>{{ item.title }}</h3>
        <p v-if="item.trend" class="trend-line">{{ item.trend }}</p>
        <div class="question-tags">
          <span v-for="tag in item.tags" :key="tag" class="mini-tag">#{{ tag }}</span>
        </div>
      </RouterLink>
    </div>

    <p v-if="!filtered.length" class="empty">没有符合条件的题目，试着放宽筛选。</p>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { questionBank, levelOptions, freqOptions, categoryStats, sortByFrequency } from '@/data/questions'

const FREQ_CLASS = { 极高: 'hot', 高: 'high', 中高: 'mid', 中: 'normal' }

export default {
  name: 'QuestionsView',
  setup() {
    const level = ref('全部')
    const freq = ref('全部')
    const categoryId = ref('all')
    const keyword = ref('')
    const order = ref('order')

    const chapterOptions = computed(() => [{ id: 'all', title: '全部', count: questionBank.length }, ...categoryStats])

    const freqCount = (f) => questionBank.filter((q) => q.freq === f).length

    const filtered = computed(() => {
      const kw = keyword.value.trim().toLowerCase()
      const list = questionBank.filter((item) => {
        if (level.value !== '全部' && item.level !== level.value) return false
        if (freq.value !== '全部' && item.freq !== freq.value) return false
        if (categoryId.value !== 'all' && item.categoryId !== categoryId.value) return false
        if (!kw) return true
        const haystack = `${item.title} ${item.tags.join(' ')} ${item.question} ${item.trend || ''}`.toLowerCase()
        return haystack.includes(kw)
      })
      return order.value === 'freq' ? sortByFrequency(list) : list
    })

    const hasFilter = computed(
      () =>
        level.value !== '全部' ||
        freq.value !== '全部' ||
        categoryId.value !== 'all' ||
        Boolean(keyword.value.trim())
    )

    function clearFilters() {
      level.value = '全部'
      freq.value = '全部'
      categoryId.value = 'all'
      keyword.value = ''
    }

    return {
      FREQ_CLASS,
      questionBank,
      levelOptions,
      freqOptions,
      categoryStats,
      chapterOptions,
      level,
      freq,
      categoryId,
      keyword,
      order,
      filtered,
      hasFilter,
      freqCount,
      clearFilters
    }
  }
}
</script>

<style scoped>
.questions-page {
  max-width: 1340px;
  margin: 0 auto;
  padding: 40px 24px 70px;
}

.page-head {
  margin-bottom: 26px;
}

.page-head h1 {
  font-size: 30px;
  margin: 12px 0 10px;
  letter-spacing: -0.02em;
}

.page-head p {
  margin: 0 0 18px;
  color: var(--text-soft);
  font-size: 14.5px;
  max-width: 760px;
}

.head-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(205px, 1fr));
  gap: 8px 14px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-subtle);
}

.stat-cell {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.8px;
  color: var(--text-soft);
}

.stat-dot {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  flex-shrink: 0;
}

.stat-name {
  min-width: 0;
}

.stat-cell strong {
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.stat-weight {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--text-mute);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 16px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-subtle);
  margin-top: 14px;
}

.trend-note {
  margin-top: 12px;
  border: 1px solid #f3dfbd;
  background: var(--amber-soft);
  border-radius: var(--radius);
  padding: 10px 16px;
  font-size: 13px;
  color: #7a4700;
}

.trend-note summary {
  cursor: pointer;
  font-weight: 600;
  outline: none;
}

.trend-note ul {
  margin: 10px 0 2px;
  padding-left: 1.2em;
  line-height: 1.75;
}

.trend-note li + li {
  margin-top: 4px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 12px;
  color: var(--text-mute);
  font-weight: 600;
  letter-spacing: 0.03em;
  min-width: 44px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
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

.chip-count {
  font-size: 11px;
  opacity: 0.72;
  font-variant-numeric: tabular-nums;
}

.filter-search input {
  flex: 1;
  min-width: 220px;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  background: #fff;
}

.filter-search input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(51, 85, 255, 0.12);
}

.result-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin: 20px 0 14px;
  font-size: 12.5px;
  color: var(--text-mute);
  flex-wrap: wrap;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-btn {
  border: 1px solid var(--border);
  background: #fff;
  color: var(--text-soft);
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
}

.sort-btn.active {
  border-color: var(--brand);
  color: var(--brand);
  background: var(--brand-soft);
}

.reset {
  color: var(--brand);
  cursor: pointer;
  margin-left: 6px;
}

.question-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 14px;
}

.question-card {
  padding: 17px 19px;
  color: inherit;
  display: flex;
  flex-direction: column;
}

.question-card:hover {
  color: inherit;
}

.question-top {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 9px;
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

.question-chapter {
  font-size: 11.8px;
  color: var(--text-mute);
}

.question-card h3 {
  font-size: 15.2px;
  margin: 0 0 8px;
  line-height: 1.5;
}

.trend-line {
  margin: 0 0 9px;
  font-size: 12.2px;
  line-height: 1.6;
  color: var(--text-mute);
  border-left: 2px solid var(--border-strong);
  padding-left: 8px;
}

.question-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
}

.mini-tag {
  font-size: 11.4px;
  color: var(--text-mute);
}

.empty {
  padding: 50px 0;
  text-align: center;
  color: var(--text-mute);
}

@media (max-width: 720px) {
  .questions-page {
    padding: 26px 14px 50px;
  }
  .page-head h1 {
    font-size: 23px;
  }
  .question-list {
    grid-template-columns: 1fr;
  }
  .head-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>