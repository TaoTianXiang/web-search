<template>
  <div class="cheat-page">
    <header class="page-head">
      <span class="pill pill-brand">速查手册</span>
      <h1>面试前的最后一页</h1>
      <p>{{ totalCards }} 张速查卡，覆盖高频考点。用于间隔复习与临场回忆，不适合首次学习。</p>
      <div class="search-box">
        <input v-model="keyword" type="search" placeholder="搜索知识点，如 min-width / TDZ / LCP" />
        <span v-if="keyword" class="clear" @click="keyword = ''">✕</span>
      </div>
    </header>

    <div class="category-bar">
      <button
        v-for="item in cheatCategories"
        :key="item.id"
        type="button"
        class="cat-chip"
        :class="{ active: activeCategory === item.id }"
        @click="activeCategory = item.id"
      >
        <span class="cat-dot" :style="{ background: item.accent }" />
        {{ item.title }}
      </button>
    </div>

    <div class="cheat-grid">
      <section v-for="card in visibleCards" :key="card.id" class="card cheat-card">
        <div class="cheat-head">
          <h3>{{ card.title }}</h3>
          <span class="cheat-count">{{ matchCount(card) }}/{{ card.points.length }}</span>
        </div>
        <ul>
          <li v-for="(point, i) in card.points" :key="i" :class="{ dim: !matches(point) }" v-html="inline(point)" />
        </ul>
      </section>
    </div>

    <p v-if="!visibleCards.length" class="empty">没有匹配的知识点。</p>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { cheatCategories, cheatSheets } from '@/data/cheatsheet'
import { renderMarkdown } from '@/utils/markdown'

export default {
  name: 'CheatsheetView',
  setup() {
    const keyword = ref('')
    const activeCategory = ref('all')
      const totalCards = cheatSheets.length

    const kw = computed(() => keyword.value.trim().toLowerCase())

    function matches(point) {
      if (!kw.value) return true
      return point.toLowerCase().includes(kw.value)
    }

    function matchCount(card) {
      return card.points.filter(matches).length
    }

    const visibleCards = computed(() =>
      cheatSheets.filter((card) => {
        if (activeCategory.value !== 'all' && card.category !== activeCategory.value) return false
        if (!kw.value) return true
        return matchCount(card) > 0 || card.title.toLowerCase().includes(kw.value)
      })
    )

    function inline(text) {
      const { html } = renderMarkdown(text)
      return html.replace(/^<p>|<\/p>\n?$/g, '')
    }

    return { cheatCategories, cheatSheets, keyword, activeCategory, visibleCards, matches, matchCount, inline, totalCards }
  }
}
</script>

<style scoped>
.cheat-page {
  max-width: 1200px;
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
}

.search-box {
  position: relative;
  max-width: 420px;
}

.search-box input {
  width: 100%;
  padding: 9px 34px 9px 14px;
  border: 1px solid var(--border-strong);
  border-radius: 9px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  background: var(--bg-subtle);
}

.search-box input:focus {
  border-color: var(--brand);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(51, 85, 255, 0.1);
}

.clear {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-mute);
  cursor: pointer;
  font-size: 12px;
}

.category-bar {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.cat-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 999px;
  padding: 5px 13px;
  font-size: 12.5px;
  color: var(--text-soft);
  transition: 0.14s ease;
}

.cat-chip:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.cat-chip.active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

.cat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.cheat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 16px;
  align-items: start;
}

.cheat-card {
  padding: 20px 22px;
}

.cheat-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--border);
}

.cheat-head h3 {
  font-size: 15px;
  margin: 0;
}

.cheat-count {
  font-size: 11.5px;
  color: var(--text-mute);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.cheat-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.cheat-card li {
  position: relative;
  padding-left: 14px;
  font-size: 13.5px;
  color: var(--text-soft);
  line-height: 1.65;
  margin: 8px 0;
}

.cheat-card li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 9px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--border-strong);
}

.cheat-card li :deep(p) {
  margin: 0;
}

.cheat-card li.dim {
  display: none;
}

.empty {
  padding: 60px 0;
  text-align: center;
  color: var(--text-mute);
}

@media (max-width: 720px) {
  .cheat-page {
    padding: 26px 14px 50px;
  }
  .page-head h1 {
    font-size: 23px;
  }
  .cheat-grid {
    grid-template-columns: 1fr;
  }
}
</style>