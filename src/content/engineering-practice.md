工程化的本质是**把个人习惯变成团队约束**。面试考的是"你如何让十个开发者的代码像一个团队写的"。

## 仓库形态

| 形态 | 优点 | 代价 |
| --- | --- | --- |
| 单仓库单应用 | 简单直接 | 无法复用，独立部署困难 |
| Monorepo | 原子提交、统一依赖、代码复用 | 工具链复杂、CI 时间长 |
| Multi-repo | 独立性强、权限清晰 | 跨仓修改困难、依赖版本漂移 |

### pnpm workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// package.json
{
  "dependencies": {
    "@acme/ui": "workspace:*"
  }
}
```

优势：

1. **硬链接节省磁盘**：同一版本依赖全局只存一份
2. **严格依赖**：未声明在 `package.json` 的依赖无法 import（消除幽灵依赖）
3. **原子改动**：改一个组件库，所有应用同时生效

::: warn pnpm 的严格性会带来迁移成本
很多老项目依赖了"幽灵依赖"（从别的包间接获得），切到 pnpm 会立刻构建失败。需要显式补全 `dependencies`。这不是 pnpm 的问题，而是暴露了原有隐患。
:::

## Lint 体系

三层职责要分清：

| 工具 | 职责 |
| --- | --- |
| ESLint | 代码质量与潜在错误 |
| Prettier | 纯格式（引号、缩进、换行） |
| Stylelint | CSS 规范 |

不要让 ESLint 管格式，也不要用 Prettier 管正确性。

```js
// eslint.config.js (flat config)
export default [
  { files: ['**/*.{js,ts,vue}'], languageOptions: { ecmaVersion: 2022 } },
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-implicit-coercion': 'error',
      eqeqeq: ['error', 'smart'],
      'no-restricted-globals': ['error', { name: 'event', message: '使用原生事件参数' }]
    }
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  }
]
```

### 用规则守护架构

除了语法，ESLint 能约束**依赖方向**：

```js
'no-restricted-imports': ['error', {
  patterns: [{
    group: ['../../**/features/*'],
    message: '基础设施层不能依赖业务层'
  }]
}]
```

或者用 `eslint-plugin-boundaries` 声明分层规则，让架构约束自动化。

## 提交规范

```
<type>(<scope>): <subject>

feat(auth): 支持手机号登录
fix(table): 修复虚拟滚动错位
```

配合 tooling：

```json
{
  "scripts": {
    "prepare": "husky",
    "commit-msg": "commitlint --edit"
  }
}
```

```js
// .husky/commit-msg
npx --no -- commitlint --edit $1
```

价值：自动生成 CHANGELOG、语义化版本发布、从 git log 就能看出变更类型。

::: tip 不要为了规范而规范
提交规范的价值在于**可自动化**（生成 changelog、触发发布）。如果团队没有自动化需求，强制规范只会增加摩擦。先问"这些信息会被谁消费"。
:::

## CI 流水线

```
push
  │
  ├─ install（pnpm 缓存）
  ├─ typecheck（tsc --noEmit）
  ├─ lint（eslint + stylelint）
  ├─ test（unit + e2e）
  ├─ build（产物体积检查）
  └─ deploy（灰度 / 全量）
```

### 关键设计

1. **缓存依赖**：`actions/cache` 缓存 pnpm store，install 从 2 分钟降到 10 秒
2. **并行**：typecheck / lint / test 互不依赖，可并行
3. **只跑受影响的包**：`turbo run build --filter=...[HEAD^]` 大幅缩短时间
4. **必要检查必须阻断合并**：typecheck 失败不允许 merge

```yaml
# .github/workflows/ci.yml
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck & pnpm lint & pnpm test
      - run: pnpm build
```

## 灰度与回滚

### 三层能力

| 能力 | 实现 |
| --- | --- |
| 版本并行 | 前端资源带版本号，旧版本仍可访问 |
| 流量切分 | 网关 / CDN / 边缘按用户或比例路由 |
| 快速回滚 | 切换入口 HTML 指向旧版本资源，秒级生效 |

```nginx
# 按 Cookie 灰度
map $cookie_gray $target_version {
  "1"     "v2";
  default "v1";
}

location / {
  root /var/www/$target_version;
  try_files $uri /index.html;
}
```

### 前端灰度的难点

- **静态资源必须长期保留**：回滚意味着旧版本要能用
- **接口兼容**：新旧前端共用同一套 API，需要向后兼容
- **本地存储结构**：新版本写入的数据，回滚后旧版本可能读不懂（需要版本号 + 迁移逻辑）

::: warn 最常见的回滚失败
只回滚了 HTML，但旧版本的 JS/CSS 已被清理。正确做法是**保留至少 N 个历史版本的静态资源**，过期后再清理。
:::

## 可观测性

```
用户行为 ──► 埋点 SDK ──► 采集网关 ──► 存储 ──► 看板 / 告警
                 ▲
错误/性能 ───────┘
```

### 采集内容

| 类型 | 数据 |
| --- | --- |
| 错误 | message、stack、路由、版本、用户 ID |
| 性能 | Web Vitals、长任务、资源瀑布 |
| 行为 | PV、点击、路由切换、停留时长 |
| 业务 | 关键成功率、下单转化 |

### 上报设计

```js
// 1. 批量 + 卸载可靠发送
const buffer = []
let timer = null

function report(event) {
  buffer.push(event)
  if (buffer.length >= 10) flush()
  else if (!timer) timer = setTimeout(flush, 3000)
}

function flush() {
  clearTimeout(timer)
  timer = null
  if (!buffer.length) return
  const data = JSON.stringify(buffer.splice(0))
  navigator.sendBeacon('/collect', data)
}

window.addEventListener('pagehide', flush)
```

`sendBeacon` 在页面卸载时仍能可靠发送，是埋点的标准方案。

### 去重与采样

```js
// 错误指纹：message + 首帧 stack + 版本
const fingerprint = hash(`${err.message}|${err.stack?.split('\n')[1]}|${version}`)

// 采样：错误全量，性能按比例
const sample = Math.random() < 0.1
```

### 与发布联动

```
新版本发布
   │
   ├─ 错误率突增 → 自动告警 → 一键回滚
   ├─ LCP 恶化 → 阻断继续放量
   └─ 白屏率上升 → 立即回滚
```

这是"可观测性"真正的价值：**让发布变成可逆操作**。

## 依赖治理

```bash
# 检查过期与漏洞
pnpm outdated
pnpm audit

# 找出重复版本
pnpm why react

# 强制统一版本
# pnpm-workspace.yaml
overrides:
  react: ^18.3.1
```

原则：

1. **lockfile 必须提交**，保证可复现构建
2. **生产依赖最小化**，工具类库放 `devDependencies`
3. **升级分批**，一次只升一个 major
4. **新依赖要评估**：维护活跃度、体积、许可证

::: interview 面试视角
被问"你如何保证代码质量"，答"我们有 code review"太泛。要具体到**哪些检查是自动阻断的**（typecheck、lint、体积预算、单测覆盖关键路径），以及**失败时怎么处理**。
:::

## 文档与知识沉淀

- **README**：项目怎么跑起来（三个命令内）
- **ADR**（架构决策记录）：为什么这么选，替代方案是什么
- **组件文档**：Storybook / 自动生成的 API 表
- **故障复盘**：现象 → 定位 → 根因 → 改进项

::: tip 最容易被忽略的一点
文档的价值不在"写得多"，而在**新人能否在半天内跑起项目**。CI 脚本、`.nvmrc`、`.env.example` 的完整度，比一篇长文档更有用。
:::