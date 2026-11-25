<template>
  <div class="glossary-page">
    <header class="page-head">
      <span class="pill pill-brand">术语词条</span>
      <h1>概念词典</h1>
      <p>
        正文里带虚线下划线的词都可以点开。这里收录 {{ glossaryTerms.length }} 条词条，按模块分组，
        适合在读完一章后回头确认"这个词到底是什么"。
      </p>
      <div class="search-box">
        <input v-model="keyword" type="search" placeholder="搜索术语，如 隐藏类 / CORS / LCP" />
        <span v-if="keyword" class="clear" @click="keyword = ''">✕</span>
      </div>
    </header>

    <div class="group-bar">
      <button
        v-for="group in glossaryGroups"
        :key="group.id"
        type="button"
        class="group-chip"
        :class="{ active: activeGroup === group.id }"
        @click="activeGroup = group.id"
      >
        <span class="chip-dot" :style="{ background: group.accent }" />
        {{ group.title }}
        <span class="chip-count">{{ countOf(group.id) }}</span>
      </button>
    </div>

    <div class="term-list">
      <section
        v-for="group in visibleGroups"
        :key="group.id"
        class="group-block"
      >
        <h2 class="group-title">
          <span class="chip-dot" :style="{ background: group.accent }" />
          {{ group.title }}
        </h2>

        <article
          v-for="term in group.items"
          :id="term.id"
          :key="term.id"
          class="card term-card"
          :class="{ flash: flashId === term.id }"
        >
          <div class="term-head">
            <h3>{{ term.term }}</h3>
            <span v-if="term.aka && term.aka.length" class="term-aka">
              {{ term.aka.join(' / ') }}
            </span>
          </div>
          <p class="term-short">{{ term.short }}</p>
          <details class="term-detail">
            <summary>展开详解</summary>
            <MarkdownView :source="term.detail" />
          </details>
          <div v-if="term.refs && term.refs.length" class="term-refs">
            <span>相关章节</span>
            <RouterLink v-for="slug in term.refs" :key="slug" :to="`/learn/${slug}`" class="ref-link">
              {{ sectionTitle(slug) }}
            </RouterLink>
          </div>
        </article>
      </section>
    </div>

    <p v-if="!visibleGroups.length" class="empty">没有匹配的术语。</p>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownView from '@/components/MarkdownView.vue'
import { glossaryTerms, glossaryGroups } from '@/data/glossary'
import { getSection } from '@/data/curriculum'

export default {
  name: 'GlossaryView',
  components: { MarkdownView },
  setup() {
    const route = useRoute()
    const keyword = ref('')
    const activeGroup = ref('all')
    const flashId = ref('')

    const kw = computed(() => keyword.value.trim().toLowerCase())

    function matches(term) {
      if (!kw.value) return true
      const hay = `${term.term} ${(term.aka || []).join(' ')} ${term.short} ${term.detail}`.toLowerCase()
      return hay.includes(kw.value)
    }

    function countOf(groupId) {
      return glossaryTerms.filter((t) => t.group === groupId).length
    }

    const visibleGroups = computed(() =>
      glossaryGroups
        .filter((g) => activeGroup.value === 'all' || activeGroup.value === g.id)
        .map((g) => ({ ...g, items: glossaryTerms.filter((t) => t.group === g.id && matches(t)) }))
        .filter((g) => g.items.length)
    )

    function sectionTitle(slug) {
      const section = getSection(slug)
      return section ? section.title : slug
    }

    // 支持 /glossary#hidden-class 直达
    function scrollToHash() {
      const id = (route.hash || '').replace(/^#/, '')
      if (!id) return
      const term = glossaryTerms.find((t) => t.id === id)
      if (!term) return
      activeGroup.value = 'all'
      keyword.value = ''
      nextTick(() => {
        const el = document.getElementById(id)
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 84
          window.scrollTo({ top, behavior: 'smooth' })
          flashId.value = id
          setTimeout(() => {
            flashId.value = ''
          }, 1600)
        }
      })
    }

    onMounted(scrollToHash)
    watch(() => route.hash, scrollToHash)

    return {
      glossaryTerms,
      glossaryGroups,
      keyword,
      activeGroup,
      visibleGroups,
      countOf,
      sectionTitle,
      flashId
    }
  }
}
</script>

<style scoped>
.glossary-page {
  max-width: 1040px;
  margin: 0 auto;
  padding: 40px 24px 70px;
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
  line-height: 1.75;
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

.group-bar {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  margin: 20px 0 26px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.group-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 999px;
  padding: 5px 12px;
  font-size: 12.5px;
  color: var(--text-soft);
  transition: 0.14s ease;
}

.group-chip:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.group-chip.active {
  background: var(--text);
  border-color: var(--text);
  color: #fff;
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.chip-count {
  font-size: 11px;
  color: var(--text-mute);
  font-variant-numeric: tabular-nums;
}

.group-chip.active .chip-count {
  color: rgba(255, 255, 255, 0.7);
}

.group-block + .group-block {
  margin-top: 34px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  margin: 0 0 14px;
  color: var(--text-soft);
}

.term-card {
  padding: 18px 20px;
  scroll-margin-top: 84px;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.term-card + .term-card {
  margin-top: 12px;
}

.term-card.flash {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(51, 85, 255, 0.12);
}

.term-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.term-head h3 {
  font-size: 16px;
  margin: 0;
}

.term-aka {
  font-size: 12px;
  color: var(--text-mute);
}

.term-short {
  margin: 0 0 12px;
  font-size: 13.8px;
  color: var(--text-soft);
  line-height: 1.7;
}

.term-detail summary {
  cursor: pointer;
  font-size: 12.5px;
  color: var(--brand);
  list-style: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 0;
}

.term-detail summary::-webkit-details-marker {
  display: none;
}

.term-detail summary::before {
  content: '▸';
  font-size: 10px;
  transition: transform 0.16s ease;
}

.term-detail[open] summary::before {
  transform: rotate(90deg);
}

.term-detail :deep(.prose) {
  margin-top: 12px;
  font-size: 14px;
  color: var(--text-soft);
}

.term-detail :deep(.prose pre) {
  margin: 12px 0;
}

.term-detail :deep(.prose table) {
  font-size: 13px;
}

.term-refs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
  font-size: 12px;
  color: var(--text-mute);
}

.ref-link {
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--brand-soft);
  color: var(--brand-dark);
  font-size: 12px;
}

.ref-link:hover {
  background: #e2e7ff;
}

.empty {
  padding: 60px 0;
  text-align: center;
  color: var(--text-mute);
}

@media (max-width: 720px) {
  .glossary-page {
    padding: 26px 14px 50px;
  }
  .page-head h1 {
    font-size: 23px;
  }
}
</style>
