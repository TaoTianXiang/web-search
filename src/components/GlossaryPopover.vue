<template>
  <Teleport to="body">
    <Transition name="gloss-fade">
      <div v-if="open" class="gloss-overlay" @click.self="close">
        <div
          ref="cardRef"
          class="gloss-card"
          role="dialog"
          aria-modal="true"
          :aria-label="`术语：${term.term}`"
          :style="cardStyle"
          @keydown.esc="close"
        >
          <div class="gloss-head">
            <div>
              <span class="gloss-label">术语</span>
              <h3>{{ term.term }}</h3>
            </div>
            <button class="gloss-close" type="button" aria-label="关闭" @click="close">✕</button>
          </div>

          <p class="gloss-short">{{ term.short }}</p>

          <div class="gloss-actions">
            <RouterLink :to="`/glossary#${term.id}`" class="btn btn-primary btn-sm" @click="close">
              查看完整词条
            </RouterLink>
            <button class="btn btn-sm" type="button" @click="close">知道了</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { getTermById } from '@/data/glossary'

export default {
  name: 'GlossaryPopover',
  setup() {
    const open = ref(false)
    const termId = ref('')
    const anchor = ref(null)
    const cardRef = ref(null)

    const term = computed(() => getTermById(termId.value) || { term: '', short: '', id: '' })

    const cardStyle = computed(() => {
      const rect = anchor.value
      if (!rect) return {}
      const width = 340
      const margin = 12
      const vw = window.innerWidth
      const vh = window.innerHeight
      let left = rect.left + rect.width / 2 - width / 2
      left = Math.max(margin, Math.min(left, vw - width - margin))
      // 优先放在锚点下方，空间不足则放上方
      const below = rect.bottom + 10
      const estimated = 200
      const top = below + estimated > vh - margin ? Math.max(margin, rect.top - estimated - 10) : below
      return {
        width: `${Math.min(width, vw - margin * 2)}px`,
        left: `${left}px`,
        top: `${top}px`
      }
    })

    function onDocClick(event) {
      const trigger = event.target.closest && event.target.closest('[data-gloss-id]')
      if (trigger) {
        event.preventDefault()
        const rect = trigger.getBoundingClientRect()
        anchor.value = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width }
        termId.value = trigger.dataset.glossId
        open.value = true
        return
      }
      if (!open.value) return
      if (cardRef.value && cardRef.value.contains(event.target)) return
      close()
    }

    function onKeydown(event) {
      if (event.key === 'Escape') close()
    }

    function close() {
      open.value = false
    }

    onMounted(() => {
      document.addEventListener('click', onDocClick, true)
      document.addEventListener('keydown', onKeydown)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('click', onDocClick, true)
      document.removeEventListener('keydown', onKeydown)
    })

    return { open, term, cardRef, cardStyle, close }
  }
}
</script>

<style scoped>
.gloss-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(18, 21, 28, 0.18);
  /* 遮罩只负责视觉，不拦截点击；关闭由 document 监听处理 */
  pointer-events: none;
}

.gloss-card {
  position: fixed;
  pointer-events: auto;
  padding: 16px 18px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
}

.gloss-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.gloss-label {
  display: block;
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-mute);
  font-weight: 600;
  margin-bottom: 2px;
}

.gloss-head h3 {
  margin: 0;
  font-size: 16px;
}

.gloss-close {
  border: none;
  background: transparent;
  color: var(--text-mute);
  font-size: 13px;
  padding: 2px 4px;
  border-radius: 5px;
  line-height: 1;
}

.gloss-close:hover {
  background: var(--bg-muted);
  color: var(--text);
}

.gloss-short {
  margin: 0 0 14px;
  font-size: 13.5px;
  color: var(--text-soft);
  line-height: 1.7;
}

.gloss-actions {
  display: flex;
  gap: 8px;
}

.gloss-fade-enter-active,
.gloss-fade-leave-active {
  transition: opacity 0.14s ease;
}

.gloss-fade-enter-from,
.gloss-fade-leave-to {
  opacity: 0;
}
</style>
