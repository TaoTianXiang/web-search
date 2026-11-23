<template>
  <div class="app-shell">
    <header class="site-header">
      <div class="header-inner">
        <RouterLink to="/" class="brand">
          <span class="brand-mark">FE</span>
          <span class="brand-text">
            <strong>陶天祥的面试进阶手册</strong>
            <em>中级 → 高级工程师的知识地图</em>
          </span>
        </RouterLink>

        <nav class="site-nav">
          <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-link">
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="header-actions">
          <button class="search-trigger" type="button" @click="searchOpen = true">
            <span class="search-icon">⌕</span>
            <span class="search-hint">搜索知识点、题目</span>
            <kbd>Ctrl K</kbd>
          </button>
          <RouterLink to="/mock" class="btn btn-primary btn-sm">开始模拟</RouterLink>
        </div>
      </div>
    </header>

    <main class="site-main">
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <span>前端面试进阶手册 · 面向中级及以上工程师的体系化教材</span>
        <span class="footer-meta">{{ sectionCount }} 个专题 · {{ questionCount }} 道面试题 · 纯文档，无视频</span>
      </div>
    </footer>

    <SearchPalette v-model="searchOpen" />
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SearchPalette from '@/components/SearchPalette.vue'
import { allSections } from '@/data/curriculum'
import { questionBank } from '@/data/questions'

export default {
  name: 'App',
  components: { SearchPalette },
  setup() {
    const searchOpen = ref(false)
    const navItems = [
      { to: '/', label: '首页' },
      { to: '/learn/js-types', label: '教材' },
      { to: '/questions', label: '题库' },
      { to: '/cheatsheet', label: '速查' },
      { to: '/mock', label: '模拟面试' }
    ]

    function onKeydown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchOpen.value = true
      }
      if (event.key === 'Escape') searchOpen.value = false
    }

    onMounted(() => window.addEventListener('keydown', onKeydown))
    onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

    return {
      searchOpen,
      navItems,
      sectionCount: allSections.length,
      questionCount: questionBank.length
    }
  }
}
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: saturate(160%) blur(12px);
  border-bottom: 1px solid var(--border);
}

.header-inner {
  max-width: var(--maxw);
  height: var(--header-h);
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--text);
  flex-shrink: 0;
}

.brand:hover {
  color: var(--text);
}

.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, #3355ff, #6f4dff);
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  display: grid;
  place-items: center;
  box-shadow: 0 4px 12px rgba(51, 85, 255, 0.3);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.brand-text strong {
  font-size: 14.5px;
  font-weight: 650;
}

.brand-text em {
  font-style: normal;
  font-size: 11.5px;
  color: var(--text-mute);
}

.site-nav {
  display: flex;
  gap: 2px;
  margin-left: auto;
}

.nav-link {
  padding: 7px 13px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-soft);
  font-weight: 500;
}

.nav-link:hover {
  background: var(--bg-muted);
  color: var(--text);
}

.nav-link.router-link-active {
  color: var(--brand);
  background: var(--brand-soft);
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  background: var(--bg-subtle);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  color: var(--text-mute);
  min-width: 220px;
  transition: 0.16s ease;
}

.search-trigger:hover {
  border-color: var(--border-strong);
  background: #fff;
  color: var(--text-soft);
}

.search-icon {
  font-size: 15px;
  line-height: 1;
}

.search-hint {
  flex: 1;
  text-align: left;
}

.search-trigger kbd {
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid var(--border-strong);
  background: #fff;
  color: var(--text-mute);
}

.site-main {
  flex: 1;
}

.site-footer {
  border-top: 1px solid var(--border);
  background: var(--bg-subtle);
}

.footer-inner {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12.5px;
  color: var(--text-mute);
}

@media (max-width: 1080px) {
  .search-trigger {
    min-width: 0;
  }
  .search-hint,
  .search-trigger kbd {
    display: none;
  }
}

@media (max-width: 860px) {
  .header-inner {
    gap: 12px;
    padding: 0 14px;
  }
  .brand-text em,
  .site-nav .nav-link:nth-child(n + 4),
  .header-actions .btn {
    display: none;
  }
  .nav-link {
    padding: 6px 9px;
    font-size: 13px;
  }
}
</style>