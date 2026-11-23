<template>
  <div v-if="section" class="chapter-page">
    <aside class="sidebar">
      <div class="sidebar-inner">
        <p class="sidebar-label">教材目录</p>

        <div v-for="chapter in chapters" :key="chapter.id" class="nav-group">
          <p class="group-title" :class="{ current: chapter.id === section.chapterId }">
            <span class="group-dot" :style="{ background: chapter.accent }" />
            {{ chapter.title }}
          </p>
          <RouterLink
            v-for="item in chapter.sections"
            :key="item.slug"
            :to="`/learn/${item.slug}`"
            class="nav-item"
            :class="{ active: item.slug === section.slug }"
          >
            <span class="nav-check" :class="{ done: isRead(item.slug) }" />
            <span class="nav-text">{{ item.title }}</span>
            <span class="nav-min">{{ item.minutes }}′</span>
          </RouterLink>
        </div>
      </div>
    </aside>

    <main class="content">
      <div class="breadcrumb">
        <RouterLink to="/">首页</RouterLink>
        <span>/</span>
        <span>{{ section.chapterTitle }}</span>
        <span>/</span>
        <strong>{{ section.title }}</strong>
      </div>

      <header class="chapter-head">
        <div class="head-meta">
          <span class="pill pill-brand">{{ section.chapterIcon }}</span>
          <span class="meta-item">约 {{ section.minutes }} 分钟</span>
          <span v-if="isRead(section.slug)" class="pill pill-green">已读</span>
          <span v-if="quizScore" class="pill pill-amber">
            自测 {{ quizScore.correct }} / {{ quizScore.total }}
          </span>
        </div>
        <h1>{{ section.title }}</h1>
        <p class="chapter-summary">{{ section.summary }}</p>
        <div class="tag-row">
          <span v-for="tag in section.tags" :key="tag" class="pill">{{ tag }}</span>
        </div>
      </header>

      <MarkdownView :source="doc" @toc="onToc" />

      <!-- 章末自测 -->
      <section v-if="quiz.length" class="quiz-section">
        <div class="quiz-head">
          <h2>章末自测</h2>
          <p>共 {{ quiz.length }} 题，答完立刻看解析。结果会保存在本地。</p>
        </div>
        <QuizBlock :questions="quiz" :slug="section.slug" />
      </section>

      <nav class="chapter-nav">
        <RouterLink v-if="neighbors.prev" :to="`/learn/${neighbors.prev.slug}`" class="nav-card">
          <span class="nav-dir">← 上一篇</span>
          <strong>{{ neighbors.prev.title }}</strong>
        </RouterLink>
        <span v-else class="nav-card disabled">
          <span class="nav-dir">← 上一篇</span>
          <strong>已经是第一篇</strong>
        </span>

        <RouterLink v-if="neighbors.next" :to="`/learn/${neighbors.next.slug}`" class="nav-card next">
          <span class="nav-dir">下一篇 →</span>
          <strong>{{ neighbors.next.title }}</strong>
        </RouterLink>
        <RouterLink v-else to="/questions" class="nav-card next">
          <span class="nav-dir">下一步 →</span>
          <strong>去题库巩固</strong>
        </RouterLink>
      </nav>
    </main>

    <aside class="toc">
      <div class="toc-inner">
        <p class="sidebar-label">本页目录</p>
        <a
          v-for="item in toc"
          :key="item.id"
          :href="`#${item.id}`"
          class="toc-item"
          :class="{ sub: item.level === 3 }"
          @click.prevent="scrollTo(item.id)"
        >
          {{ item.text }}
        </a>
        <p v-if="!toc.length" class="toc-empty">本章暂无小节</p>
      </div>
    </aside>
  </div>

  <div v-else class="not-found">
    <h1>未找到该专题</h1>
    <p>链接可能已失效，或该专题尚未发布。</p>
    <RouterLink to="/" class="btn btn-primary">返回首页</RouterLink>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import MarkdownView from '@/components/MarkdownView.vue'
import QuizBlock from '@/components/QuizBlock.vue'
import { chapters, getSection, getNeighbors, getDoc } from '@/data/curriculum'
import { getQuiz } from '@/data/quizzes'
import { progress, markRead, isRead } from '@/utils/progress'

export default {
  name: 'ChapterView',
  components: { MarkdownView, QuizBlock },
  setup() {
    const route = useRoute()
    const toc = ref([])
    const doc = ref('')
    let readTimer = null

    const section = computed(() => getSection(route.params.slug))
    const neighbors = computed(() => getNeighbors(route.params.slug))
    const quiz = computed(() => getQuiz(route.params.slug))
    const quizScore = computed(() => (section.value ? progress.quiz[section.value.slug] : null))

    function onToc(items) {
      toc.value = items
    }

    function scrollTo(id) {
      const el = document.getElementById(id)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 84
        window.scrollTo({ top, behavior: 'smooth' })
        history.replaceState(null, '', `#${id}`)
      }
    }

    // 阅读超过 25 秒或滚动到 60% 即记为已读
    function cleanupReadTimer() {
      if (readTimer) {
        clearTimeout(readTimer)
        readTimer = null
      }
    }

    function startReadTimer(slug) {
      cleanupReadTimer()
      readTimer = setTimeout(() => markRead(slug), 25000)
    }

    function onScroll() {
      if (!section.value || isRead(section.value.slug)) return
      const ratio =
        (window.scrollY + window.innerHeight) / Math.max(document.body.scrollHeight, window.innerHeight)
      if (ratio > 0.6) markRead(section.value.slug)
    }

    watch(
      () => route.params.slug,
      (slug) => {
        const target = getSection(slug)
        doc.value = target ? getDoc(slug) : ''
        toc.value = []
            if (target) {
              document.title = `${target.title} · 前端面试进阶手册`
            }
        nextTick(() => {
          if (target) startReadTimer(slug)
        })
      },
      { immediate: true }
    )

    onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
    onBeforeUnmount(() => {
      window.removeEventListener('scroll', onScroll)
      cleanupReadTimer()
    })

    return { chapters, section, neighbors, quiz, quizScore, toc, doc, onToc, scrollTo, isRead }
  }
}
</script>

<style scoped>
.chapter-page {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 252px minmax(0, 1fr) 210px;
  gap: 40px;
  align-items: start;
}

.sidebar {
  position: sticky;
  top: var(--header-h);
  max-height: calc(100vh - var(--header-h));
  overflow-y: auto;
  padding: 26px 0 40px;
}

.sidebar-inner {
  padding-right: 8px;
}

.sidebar-label {
  font-size: 11.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-mute);
  font-weight: 600;
  margin: 0 0 14px 8px;
}

.nav-group + .nav-group {
  margin-top: 18px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-mute);
  margin: 0 0 6px 8px;
}

.group-title.current {
  color: var(--text);
}

.group-dot {
  width: 7px;
  height: 7px;
  border-radius: 2px;
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 9px;
  border-radius: 7px;
  font-size: 13.5px;
  color: var(--text-soft);
  line-height: 1.45;
}

.nav-item:hover {
  background: var(--bg-muted);
  color: var(--text);
}

.nav-item.active {
  background: var(--brand-soft);
  color: var(--brand-dark);
  font-weight: 600;
}

.nav-check {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid var(--border-strong);
  flex-shrink: 0;
}

.nav-check.done {
  border-color: var(--green);
  background: var(--green);
}

.nav-text {
  flex: 1;
  min-width: 0;
}

.nav-min {
  font-size: 11px;
  color: var(--text-mute);
  font-variant-numeric: tabular-nums;
}

.content {
  padding: 26px 0 60px;
  min-width: 0;
}

.breadcrumb {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12.5px;
  color: var(--text-mute);
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.breadcrumb strong {
  color: var(--text-soft);
  font-weight: 500;
}

.chapter-head {
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 30px;
}

.head-meta {
  display: flex;
  gap: 9px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 12.5px;
  color: var(--text-mute);
}

.chapter-head h1 {
  font-size: 31px;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.chapter-summary {
  font-size: 15px;
  color: var(--text-soft);
  margin: 0 0 16px;
  line-height: 1.7;
}

.tag-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.quiz-section {
  margin-top: 52px;
  padding-top: 32px;
  border-top: 1px solid var(--border);
}

.quiz-head h2 {
  font-size: 20px;
  margin: 0 0 4px;
}

.quiz-head p {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--text-mute);
}

.chapter-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 44px;
}

.nav-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  transition: 0.16s ease;
}

.nav-card:hover {
  border-color: #c3cbf7;
  box-shadow: var(--shadow-sm);
  color: var(--text);
}

.nav-card.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.nav-card.next {
  text-align: right;
  align-items: flex-end;
}

.nav-dir {
  font-size: 12px;
  color: var(--text-mute);
}

.nav-card strong {
  font-size: 14px;
  font-weight: 600;
}

.toc {
  position: sticky;
  top: var(--header-h);
  max-height: calc(100vh - var(--header-h));
  overflow-y: auto;
  padding: 26px 0;
}

.toc-item {
  display: block;
  font-size: 13px;
  color: var(--text-mute);
  padding: 4px 8px;
  border-left: 2px solid transparent;
  line-height: 1.5;
}

.toc-item:hover {
  color: var(--brand);
  border-left-color: var(--brand);
}

.toc-item.sub {
  padding-left: 18px;
  font-size: 12.5px;
}

.toc-empty {
  font-size: 12.5px;
  color: var(--text-mute);
  padding-left: 8px;
}

.not-found {
  max-width: 620px;
  margin: 100px auto;
  text-align: center;
  padding: 0 24px;
}

.not-found h1 {
  font-size: 24px;
}

.not-found p {
  color: var(--text-soft);
  margin-bottom: 22px;
}

@media (max-width: 1200px) {
  .chapter-page {
    grid-template-columns: 232px minmax(0, 1fr);
  }
  .toc {
    display: none;
  }
}

@media (max-width: 900px) {
  .chapter-page {
    grid-template-columns: minmax(0, 1fr);
    padding: 0 16px;
  }
  .sidebar {
    display: none;
  }
  .content {
    padding-top: 20px;
  }
  .chapter-head h1 {
    font-size: 25px;
  }
  .chapter-nav {
    grid-template-columns: 1fr;
  }
}
</style>