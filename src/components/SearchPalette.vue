<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="palette-overlay" @click.self="close">
        <div class="palette" role="dialog" aria-label="全站搜索">
          <div class="palette-input">
            <span class="icon">⌕</span>
            <input
              ref="inputEl"
              v-model="keyword"
              type="text"
              placeholder="搜索章节、知识点、面试题…"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="openActive"
              @keydown.esc="close"
            />
            <button class="btn btn-ghost btn-sm" type="button" @click="close">Esc</button>
          </div>

          <div v-if="!keyword.trim()" class="palette-body">
            <p class="section-label">常用入口</p>
            <button
              v-for="item in quickLinks"
              :key="item.to"
              class="result-row"
              type="button"
              @click="go(item.to)"
            >
              <span class="result-kind">{{ item.kind }}</span>
              <span class="result-title">{{ item.title }}</span>
            </button>
          </div>

          <div v-else class="palette-body">
            <template v-if="results.length">
              <p class="section-label">
                找到 {{ results.length }} 条结果
              </p>
              <button
                v-for="(item, index) in results"
                :key="item.to + item.title"
                class="result-row"
                :class="{ active: index === activeIndex }"
                type="button"
                @click="go(item.to)"
              >
                <span class="result-kind" :data-kind="item.kind">{{ item.kind }}</span>
                <span class="result-text">
                  <span class="result-title">{{ item.title }}</span>
                  <span v-if="item.desc" class="result-desc">{{ item.desc }}</span>
                </span>
              </button>
            </template>
            <p v-else class="empty">没有匹配内容，换个关键词试试。</p>
          </div>

          <div class="palette-footer">
            <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
            <span><kbd>Enter</kbd> 打开</span>
            <span><kbd>Esc</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { getDocs } from '@/data/curriculum'
import { questionSearchEntries } from '@/data/questions'
import { cheatSheets } from '@/data/cheatsheet'
import { stripMarkdown } from '@/utils/markdown'

const MAX_RESULTS = 12

let index = null

function buildIndex() {
  if (index) return index

  const docs = getDocs().map((doc) => {
    const plain = stripMarkdown(doc.content)
    return {
      kind: '专题',
      title: doc.title,
      desc: doc.summary,
      to: `/learn/${doc.slug}`,
      haystack: `${doc.title} ${doc.summary} ${(doc.tags || []).join(' ')} ${plain}`.toLowerCase()
    }
  })

  const cheats = cheatSheets.map((card) => ({
    kind: '速查',
    title: card.title,
    desc: card.points[0],
    to: '/cheatsheet',
    haystack: `${card.title} ${card.points.join(' ')}`.toLowerCase()
  }))

  index = [...docs, ...questionSearchEntries, ...cheats]
  return index
}

export default {
  name: 'SearchPalette',
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const router = useRouter()
    const keyword = ref('')
    const inputEl = ref(null)
    const activeIndex = ref(0)

    const quickLinks = [
      { kind: '学习', title: '从「类型、转换与相等性」开始', to: '/learn/js-types' },
      { kind: '题库', title: '浏览全部面试题', to: '/questions' },
      { kind: '速查', title: '知识点速查手册', to: '/cheatsheet' },
      { kind: '练习', title: '进入模拟面试模式', to: '/mock' }
    ]

    const results = computed(() => {
      const kw = keyword.value.trim().toLowerCase()
      if (!kw) return []
      const terms = kw.split(/\s+/).filter(Boolean)
      return buildIndex()
        .map((item) => {
          let score = 0
          terms.forEach((term) => {
            const titleHit = item.title.toLowerCase().includes(term)
            if (titleHit) score += 10
            else if (item.haystack.includes(term)) score += 2
          })
          return { ...item, score }
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RESULTS)
    })

    watch(results, () => {
      activeIndex.value = 0
    })

    watch(
      () => props.modelValue,
      (open) => {
        if (open) {
          keyword.value = ''
          nextTick(() => inputEl.value && inputEl.value.focus())
        }
      }
    )

    function move(step) {
      const size = results.value.length
      if (!size) return
      activeIndex.value = (activeIndex.value + step + size) % size
    }

    function openActive() {
      const target = results.value[activeIndex.value]
      if (target) go(target.to)
    }

    function go(to) {
      close()
      if (router.currentRoute.value.path !== to) router.push(to)
    }

    function close() {
      emit('update:modelValue', false)
    }

    onBeforeUnmount(() => {
      index = null
    })

    return { keyword, inputEl, activeIndex, quickLinks, results, move, openActive, go, close }
  }
}
</script>

<style scoped>
.palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(18, 21, 28, 0.38);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  padding-top: 12vh;
}

.palette {
  width: min(680px, 92vw);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 14px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--border);
}

.palette-input {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.palette-input .icon {
  font-size: 18px;
  color: var(--text-mute);
}

.palette-input input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15.5px;
  font-family: inherit;
  color: var(--text);
  background: transparent;
}

.palette-body {
  overflow-y: auto;
  padding: 8px;
}

.section-label {
  margin: 8px 10px 6px;
  font-size: 11.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-mute);
  font-weight: 600;
}

.result-row {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  width: 100%;
  text-align: left;
  padding: 9px 11px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: var(--text);
}

.result-row:hover,
.result-row.active {
  background: var(--brand-soft);
}

.result-kind {
  flex-shrink: 0;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 5px;
  background: var(--bg-muted);
  color: var(--text-soft);
  margin-top: 2px;
  font-weight: 600;
}

.result-kind[data-kind='面试题'] {
  background: var(--green-soft);
  color: var(--green);
}

.result-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-desc {
  font-size: 12px;
  color: var(--text-mute);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  padding: 32px 10px;
  text-align: center;
  color: var(--text-mute);
  font-size: 13.5px;
}

.palette-footer {
  display: flex;
  gap: 16px;
  padding: 9px 16px;
  border-top: 1px solid var(--border);
  background: var(--bg-subtle);
  font-size: 11.5px;
  color: var(--text-mute);
}

.palette-footer kbd {
  border: 1px solid var(--border-strong);
  background: #fff;
  border-radius: 4px;
  padding: 0 4px;
  margin-right: 3px;
  font-size: 10.5px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.14s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>