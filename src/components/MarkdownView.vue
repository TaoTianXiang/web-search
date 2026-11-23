<template>
  <article class="markdown-body prose" v-html="html" />
</template>

<script>
import { ref, watch } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

export default {
  name: 'MarkdownView',
  props: {
    source: { type: String, default: '' }
  },
  emits: ['toc'],
  setup(props, { emit }) {
    const html = ref('')

    watch(
      () => props.source,
      (source) => {
        const { html: out, toc } = renderMarkdown(source)
        html.value = out
        emit('toc', toc)
      },
      { immediate: true }
    )

    return { html }
  }
}
</script>

<style scoped>
.markdown-body {
  max-width: 100%;
}

.markdown-body :deep(> *:last-child) {
  margin-bottom: 0;
}
</style>