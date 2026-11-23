<template>
  <div class="home">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="pill pill-brand">面向中级 → 高级前端工程师</span>
          <h1>
            把面试题背后的
            <em>原理与取舍</em>
            讲透
          </h1>
          <p class="hero-desc">
            {{ allSections.length }} 个专题、{{ questionCount }} 道结构化面试题、{{ cheatCount }} 张速查卡、一套可自测的模拟面试流程。全部为可检索的文档，没有视频，适合作为日常复盘的常备手册。
          </p>
          <div class="hero-actions">
            <RouterLink to="/learn/js-types" class="btn btn-primary">从第一章开始</RouterLink>
            <RouterLink to="/questions" class="btn">浏览题库</RouterLink>
            <RouterLink to="/mock" class="btn btn-ghost">试试模拟面试 →</RouterLink>
          </div>
          <div class="hero-stats">
            <div class="stat">
              <strong>{{ chapters.length }}</strong>
              <span>知识模块</span>
            </div>
            <div class="stat">
              <strong>{{ allSections.length }}</strong>
              <span>专题章节</span>
            </div>
            <div class="stat">
              <strong>{{ questionCount }}</strong>
              <span>面试题</span>
            </div>
            <div class="stat">
                          <strong>{{ cheatCount }}</strong>
                          <span>速查卡</span>
                        </div>
                        <div class="stat">
              <strong>~{{ totalMinutes }}min</strong>
              <span>预计精读时长</span>
            </div>
          </div>
        </div>

        <div class="hero-panel">
          <div class="panel-head">
            <span class="panel-title">你的学习进度</span>
            <RouterLink to="/mock" class="panel-link">模拟面试 →</RouterLink>
          </div>
          <div class="progress-row">
            <div class="progress-info">
              <span>已读专题</span>
              <strong>{{ stats.readCount }} / {{ stats.totalSections }}</strong>
            </div>
            <div class="bar">
              <i :style="{ width: stats.readPercent + '%' }" />
            </div>
          </div>
          <div class="progress-row">
            <div class="progress-info">
              <span>自测正确率</span>
              <strong>{{ stats.quizCorrect }} / {{ stats.quizTotal || '—' }}</strong>
            </div>
            <div class="bar bar-green">
              <i :style="{ width: stats.quizPercent + '%' }" />
            </div>
          </div>
          <div class="progress-row">
            <div class="progress-info">
              <span>模拟面试作答</span>
              <strong>{{ stats.mock.answered }} 题</strong>
            </div>
            <div class="bar bar-amber">
              <i :style="{ width: mockAccuracy + '%' }" />
            </div>
          </div>
          <div class="panel-actions">
            <RouterLink :to="continueTarget" class="btn btn-primary btn-sm">
              {{ stats.readCount ? '继续上次进度' : '开始第一课' }}
            </RouterLink>
            <button class="btn btn-sm" type="button" @click="handleReset">重置进度</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>知识地图</h2>
        <p>按"语言 → 类型 → 布局 → 运行时 → 框架 → 工程 → 架构"的顺序推进，每一层都为下一层提供依据。</p>
      </div>

      <div class="chapter-grid">
        <RouterLink
          v-for="chapter in chapters"
          :key="chapter.id"
          :to="`/learn/${chapter.sections[0].slug}`"
          class="card card-hover chapter-card"
        >
          <div class="chapter-top">
            <span class="chapter-icon" :style="{ background: chapter.accent + '1a', color: chapter.accent }">
              {{ chapter.icon }}
            </span>
            <span class="chapter-count">{{ chapter.sections.length }} 个专题</span>
          </div>
          <h3>{{ chapter.title }}</h3>
          <p class="chapter-sub">{{ chapter.subtitle }}</p>
          <ul class="chapter-list">
            <li v-for="section in chapter.sections.slice(0, 3)" :key="section.slug">
              <span class="dot" :class="{ done: isRead(section.slug) }" />
              {{ section.title }}
            </li>
            <li v-if="chapter.sections.length > 3" class="more">
              还有 {{ chapter.sections.length - 3 }} 个专题…
            </li>
          </ul>
        </RouterLink>
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>怎么用这套材料</h2>
        <p>它不是题库速成，而是一套"能讲出为什么"的训练路径。</p>
      </div>
      <div class="usage-grid">
        <div v-for="(item, index) in usage" :key="item.title" class="card usage-card">
          <span class="usage-index">0{{ index + 1 }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </section>

        <section class="section">
          <div class="section-head">
            <h2>2026 权重变化</h2>
            <p>按真实面经统计，考察重心已经从"背结论"转向"讲取舍"。</p>
          </div>
          <div class="trend-grid">
            <div class="card trend-card down">
              <h3>权重下降</h3>
              <ul>
                <li>纯算法题（AI 一秒生成，失去区分度）</li>
                <li>八股式背诵（部分大厂校招已明确"告别八股"）</li>
                <li>孤立的 API 记忆</li>
              </ul>
            </div>
            <div class="card trend-card up">
              <h3>权重上升</h3>
              <ul>
                <li>系统设计与架构取舍</li>
                <li>AI 工具运用与代码质量治理</li>
                <li>工程实践：监控、灰度、可观测</li>
                <li>能把原理画出来、能结合项目实例</li>
              </ul>
            </div>
          </div>
          <p class="trend-foot">
            高频优先级：React Fiber / RSC、Vue 3 响应式、事件循环、性能优化 —— 这五类题目的出现频率与区分度在 2026 年均为最高。
          </p>
        </section>

    <section class="section section-last">
      <div class="cta card">
        <div>
          <h2>准备好了就开始</h2>
          <p>建议先做一轮模拟面试，把不会的题记下来，再回到对应专题精读。</p>
        </div>
        <div class="cta-actions">
          <RouterLink to="/mock" class="btn btn-primary">开始模拟面试</RouterLink>
          <RouterLink to="/cheatsheet" class="btn">打开速查手册</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { computed } from 'vue'
import { chapters, allSections, totalMinutes } from '@/data/curriculum'
import { questionBank } from '@/data/questions'
import { cheatSheets } from '@/data/cheatsheet'
import { progress, useStats, resetProgress, isRead } from '@/utils/progress'

export default {
  name: 'HomeView',
  setup() {
    // eslint-disable-next-line no-unused-vars
    const statsRef = useStats(allSections.length)
    const stats = computed(() => statsRef.value)

    const mockAccuracy = computed(() =>
      progress.mock.answered ? Math.round((progress.mock.correct / progress.mock.answered) * 100) : 0
    )

    const continueTarget = computed(() => {
      const nextSection = allSections.find((s) => !isRead(s.slug))
      return `/learn/${(nextSection || allSections[0]).slug}`
    })

    const usage = [
      {
        title: '先测后学',
        desc: '用模拟面试随机抽题，暴露盲区；再回到对应专题，带着问题读原理。'
      },
      {
        title: '每章自测',
        desc: '读完正文立刻做题。做错的题会记录在本地，方便二轮只刷错题。'
      },
      {
        title: '速查与复述',
        desc: '用速查手册做间隔复习，并尝试用自己的话复述结论与取舍，而不是背原文。'
      }
    ]

    function handleReset() {
      if (window.confirm('确定要清空本地学习进度吗？该操作不可恢复。')) {
        resetProgress()
      }
    }

    return {
      chapters,
      allSections,
      totalMinutes,
      questionCount: questionBank.length,
      cheatCount: cheatSheets.length,
      stats,
      mockAccuracy,
      continueTarget,
      usage,
      isRead,
      handleReset
    }
  }
}
</script>

<style scoped>
.home {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0 24px 60px;
}

.hero {
  padding: 56px 0 44px;
  border-bottom: 1px solid var(--border);
}

.hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 48px;
  align-items: center;
}

.hero-copy h1 {
  font-size: 44px;
  line-height: 1.22;
  margin: 18px 0 16px;
  letter-spacing: -0.02em;
}

.hero-copy h1 em {
  font-style: normal;
  background: linear-gradient(120deg, #3355ff, #7c4dff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-desc {
  font-size: 15.5px;
  color: var(--text-soft);
  max-width: 560px;
  margin: 0 0 26px;
}

.hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.hero-stats {
  display: flex;
  gap: 32px;
  margin-top: 34px;
  padding-top: 24px;
  border-top: 1px dashed var(--border);
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat strong {
  font-size: 21px;
  font-weight: 680;
  letter-spacing: -0.01em;
}

.stat span {
  font-size: 12px;
  color: var(--text-mute);
  margin-top: 2px;
}

.hero-panel {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px 22px 18px;
  background: linear-gradient(180deg, #fbfcff, #fff);
  box-shadow: var(--shadow);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-mute);
}

.panel-link {
  font-size: 12.5px;
}

.progress-row + .progress-row {
  margin-top: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-soft);
  margin-bottom: 7px;
}

.progress-info strong {
  color: var(--text);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.bar {
  height: 7px;
  border-radius: 999px;
  background: var(--bg-muted);
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #3355ff, #6f7bff);
  transition: width 0.4s ease;
}

.bar-green i {
  background: linear-gradient(90deg, #12a06d, #35c48f);
}

.bar-amber i {
  background: linear-gradient(90deg, #d98324, #f0a94a);
}

.panel-actions {
  display: flex;
  gap: 8px;
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.section {
  padding: 52px 0 0;
}

.section-last {
  padding-bottom: 20px;
}

.section-head {
  margin-bottom: 26px;
}

.section-head h2 {
  font-size: 24px;
  margin: 0 0 6px;
}

.section-head p {
  margin: 0;
  color: var(--text-soft);
  font-size: 14px;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.chapter-card {
  display: flex;
  flex-direction: column;
  padding: 20px 22px;
  color: inherit;
}

.chapter-card:hover {
  color: inherit;
}

.chapter-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.chapter-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.chapter-count {
  font-size: 12px;
  color: var(--text-mute);
}

.chapter-card h3 {
  font-size: 17px;
  margin: 0 0 6px;
}

.chapter-sub {
  font-size: 13px;
  color: var(--text-mute);
  margin: 0 0 14px;
  line-height: 1.6;
}

.chapter-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px dashed var(--border);
  padding-top: 12px;
}

.chapter-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-soft);
  padding: 3px 0;
}

.chapter-list li.more {
  color: var(--text-mute);
  font-size: 12px;
  padding-left: 16px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border-strong);
  flex-shrink: 0;
}

.dot.done {
  background: var(--green);
}

.usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.trend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.trend-card {
  padding: 20px 22px;
}

.trend-card h3 {
  font-size: 14px;
  margin: 0 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 3px 10px;
  border-radius: 999px;
}

.trend-card.down h3 {
  background: var(--red-soft);
  color: var(--red);
}

.trend-card.up h3 {
  background: var(--green-soft);
  color: var(--green);
}

.trend-card ul {
  margin: 0;
  padding-left: 1.2em;
  font-size: 13.5px;
  color: var(--text-soft);
  line-height: 1.75;
}

.trend-card li + li {
  margin-top: 6px;
}

.trend-foot {
  margin: 16px 0 0;
  padding: 12px 18px;
  border-left: 3px solid var(--brand);
  background: var(--bg-subtle);
  border-radius: 0 8px 8px 0;
  font-size: 13.5px;
  color: var(--text-soft);
}

.usage-card {
  padding: 22px 24px;
  position: relative;
}

.usage-index {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--brand);
  letter-spacing: 0.1em;
}

.usage-card h3 {
  font-size: 16px;
  margin: 8px 0 8px;
}

.usage-card p {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-soft);
}

.cta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 28px 30px;
  background: linear-gradient(120deg, #f6f8ff, #fdfbff);
  border-color: #e1e6ff;
  flex-wrap: wrap;
}

.cta h2 {
  font-size: 20px;
  margin: 0 0 6px;
}

.cta p {
  margin: 0;
  color: var(--text-soft);
  font-size: 13.5px;
}

.cta-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 1000px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  .hero-copy h1 {
    font-size: 34px;
  }
  .hero-panel {
    max-width: 520px;
  }
}

@media (max-width: 720px) {
  .home {
    padding: 0 14px 40px;
  }
  .hero {
    padding: 32px 0 28px;
  }
  .hero-copy h1 {
    font-size: 27px;
  }
  .hero-stats {
    gap: 18px;
    flex-wrap: wrap;
  }
  .cta {
    padding: 22px;
  }
}
</style>