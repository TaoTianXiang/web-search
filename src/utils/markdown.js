import MarkdownIt from 'markdown-it'
import mdContainer from 'markdown-it-container'
import hljs from 'highlight.js/lib/core'

import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import diff from 'highlight.js/lib/languages/diff'
import ini from 'highlight.js/lib/languages/ini'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('vue', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('diff', diff)
hljs.registerLanguage('ini', ini)
hljs.registerLanguage('nginx', ini)

const ALIAS = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  html: 'xml',
  vue: 'xml',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml'
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=|\\{}[\]:;"'<>,.?/]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function createRenderer(toc) {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
    highlight(code, lang) {
      const key = ALIAS[lang] || lang
      const label = lang || 'text'
      if (key && hljs.getLanguage(key)) {
        try {
          const html = hljs.highlight(code, { language: key, ignoreIllegals: true }).value
          return `<pre data-lang="${label}"><code class="hljs">${html}</code></pre>`
        } catch {
          /* 降级到纯文本 */
        }
      }
      return `<pre data-lang="${label}"><code class="hljs">${md.utils.escapeHtml(code)}</code></pre>`
    }
  })

  // 标题锚点 + 目录收集
  md.core.ruler.push('collect_toc', (state) => {
    const tokens = state.tokens
    const used = new Map()
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i]
      if (token.type !== 'heading_open') continue
      const level = Number(token.tag.slice(1))
      if (level < 2 || level > 3) continue
      const inline = tokens[i + 1]
      const text = inline.content.replace(/`/g, '')
      let id = slugify(text) || `section-${i}`
      if (used.has(id)) {
        const count = used.get(id) + 1
        used.set(id, count)
        id = `${id}-${count}`
      } else {
        used.set(id, 0)
      }
      token.attrSet('id', id)
      toc.push({ level, text, id })
    }
  })

  const containers = [
    ['tip', 'md-tip', '要点'],
    ['warn', 'md-warn', '注意'],
    ['danger', 'md-danger', '陷阱'],
    ['interview', 'md-interview', '面试视角'],
    ['note', 'md-note', '补充']
  ]

  containers.forEach(([name, cls, label]) => {
    md.use(mdContainer, name, {
      render(tokens, idx) {
        if (tokens[idx].nesting === 1) {
          const custom = tokens[idx].info.trim().slice(name.length).trim()
          const title = custom || label
          return `<div class="${cls}"><span class="md-container-title">${md.utils.escapeHtml(title)}</span>\n`
        }
        return '</div>\n'
      }
    })
  })

  // 表格外层包滚动容器（table 自身保持 display: table，避免列宽被压缩）
    md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n'
    md.renderer.rules.table_close = () => '</table></div>\n'

    return md
}

export function renderMarkdown(source) {
  const toc = []
  const md = createRenderer(toc)
  const html = md.render(source || '')
  return { html, toc }
}

/** 纯文本抽取，用于搜索索引与摘要 */
export function stripMarkdown(source) {
  return (source || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/:::\s*\w+/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}