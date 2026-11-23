# 前端面试进阶手册

面向**中级及以上**前端工程师的体系化面试教材站点。全部内容为可检索的文档（无视频）。

题库按 **2026 高频 100 题**清单整理：覆盖 9 个模块、四级出现频率（极高 / 高 / 中高 / 中），并标注 2026 趋势变化。

## 内容规模

| 项目 | 数量 |
| --- | --- |
| 教材模块 | 10（JS / TS / CSS / 浏览器网络 / React / Vue / 工程性能 / HTML / 架构表达 / AI） |
| 教材专题 | 29 篇 Markdown 正文 |
| 面试题 | 100 道，每题含结论、推导与「面试视角」 |
| 章末自测 | 每篇专题 2–3 道单选题 |
| 速查卡 | 14 张，覆盖 7 个分类 |

## 功能

- **教材**：目录锚点、右侧大纲、代码高亮、`::: tip / warn / danger / interview` 容器
- **题库**：按频率 / 难度 / 模块筛选，支持「按频率」与「按题号」排序；答案默认折叠，先自述再对照
- **速查手册**：按模块分类 + 关键词过滤
- **章末自测**：即时判分与解析，结果写入 localStorage
- **模拟面试**：按模块 / 频率 / 难度随机抽题，自评后给出错题模块的复习建议
- **全站搜索**：`Ctrl/Cmd + K`，索引专题正文、面试题、速查卡
- **学习进度**：已读专题、自测正确率、模拟面试正确率，全部仅存本地

## 目录结构

```
src/
├── content/
│   ├── *.md                      # 教材正文（29 篇）
│   └── questions/<category>/     # 题库答案正文（100 篇，按模块分组）
│       └── index.js              # 每模块的 md 映射（require.context）
├── data/
│   ├── curriculum.js             # 章节 / 专题大纲
│   ├── quizzes.js                # 章末自测题
│   ├── cheatsheet.js             # 速查手册
│   └── questions/
│       ├── index.js              # 题库聚合、筛选与懒加载 API
│       ├── qa.js                 # 按模块动态 import 答案
│       ├── js.js / react.js / vue.js / browser.js / css.js
│       └── html.js / engineering.js / ts.js / ai.js
├── utils/
│   ├── markdown.js               # markdown-it + highlight.js + 容器 + 锚点
│   └── progress.js               # localStorage 进度
├── components/                   # MarkdownView / QuizBlock / SearchPalette
├── views/                        # Home / Chapter / Questions / Question / Cheatsheet / Mock
├── router/
└── styles/base.css
```

## 本地开发

```bash
npm install
npm run serve      # http://localhost:8080
npm run build
npm run lint
```

## 新增内容

- **新增专题**：在 `src/content/<slug>.md` 写正文，并在 `src/data/curriculum.js` 对应模块的 `sections` 中登记；如需自测，在 `src/data/quizzes.js` 按 slug 添加题目。
- **新增面试题**：
  1. 在 `src/data/questions/<category>.js` 中追加条目（字段：`id` / `code` / `title` / `categoryId` / `level` / `freq` / `trend` / `tags` / `question` / `answerId` / `followups`）
  2. 在 `src/content/questions/<category>/<answerId>.md` 写答案正文
- **新增速查卡**：在 `src/data/cheatsheet.js` 的 `cheatSheets` 中追加。

> 答案正文刻意放在独立 `.md` 文件中：避免在 JS 模板字符串里转义代码块的反引号与 `${}`，同时支持按模块懒加载（首屏只加载当前模块的答案）。

Markdown 容器语法：

```md
::: tip 标题
正文
:::

::: warn
正文
:::

::: interview 面试视角
正文
:::
```