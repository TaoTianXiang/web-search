## 核心机制：内容寻址存储 + 链接

```
全局存储（~/.pnpm-store）
  └── 按内容哈希存放每个包的文件（只存一份）

项目 node_modules
  ├── .pnpm/            ← 真实文件（硬链接到全局存储）
  │   ├── react@18.3.1/node_modules/react
  │   └── vue@3.4.0/node_modules/vue
  └── react             ← 符号链接 → .pnpm/react@18.3.1/node_modules/react
```

## 三个优势

### 1. 磁盘占用大幅降低

```
npm：10 个项目各有一份 react → 10 份文件
pnpm：全局存 1 份，10 个项目各自硬链接 → 1 份物理占用
```

### 2. 严格依赖（无幽灵依赖）

```js
// package.json 只声明了 vue
import _ from 'lodash'   // ❌ pnpm 直接报错（npm 下可能可用）
```

npm 会把所有依赖"提升"到顶层 node_modules，导致你能引用未声明在 `dependencies` 里的包（幽灵依赖）。pnpm 的链接结构只暴露声明的依赖，**更符合语义**。

### 3. 安装更快

硬链接几乎零成本，且已有缓存时几乎秒装。

## 幽灵依赖的真实危害

```js
// 代码里 import 了 A，但 A 是 B 的依赖（B 才是你声明的）
import { helper } from 'A'

// B 升级后不再依赖 A → 你的代码突然报错
```

pnpm 会让这个问题在**开发时就暴露**，而不是等线上事故。

## 迁移时会遇到的问题

| 问题 | 处理 |
| --- | --- |
| 幽灵依赖报错 | 在 `package.json` 补全实际使用的依赖 |
| peer dependency 警告 | 用 `peerDependencyRules` 或调整版本 |
| 某些包假设"提升结构" | 用 `public-hoist-pattern` 白名单 |
| 老 CI 脚本用 npm | 改为 `pnpm install --frozen-lockfile` |

```ini
# .npmrc
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
shamefully-hoist=true   # 兜底：完全模拟 npm 的提升（不推荐长期使用）
```

## Monorepo 中的 workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
{
  "dependencies": {
    "@acme/ui": "workspace:*"
  }
}
```

`workspace:*` 会被替换为实际版本号发布，本地开发时直接链接到源码，改组件库立刻在所有应用生效。

## 命令对照

| 操作 | npm | pnpm |
| --- | --- | --- |
| 安装 | `npm i` | `pnpm i` |
| 添加 | `npm i pkg` | `pnpm add pkg` |
| 工作区添加 | — | `pnpm add pkg --filter app-a` |
| 运行脚本 | `npm run dev` | `pnpm dev` |
| 严格安装 | `npm ci` | `pnpm i --frozen-lockfile` |

## 与其他方案对比

| 维度 | npm | yarn classic | pnpm |
| --- | --- | --- | --- |
| 磁盘 | 每个项目一份 | 每个项目一份 | 全局共享 |
| 幽灵依赖 | 有 | 有 | 无 |
| 安装速度 | 中 | 中 | 快 |
| Monorepo | workspaces | workspaces | workspace 协议更强 |
| 严格性 | 低 | 低 | 高 |

::: warn 迁移成本要提前评估
若项目依赖了大量"依赖提升"才工作的老包（如某些 webpack loader 插件），切到 pnpm 会立刻失败。这类问题通常需要逐个补全依赖或用 `public-hoist-pattern`，成本可能不小。
:::

::: interview 面试视角
能说清"硬链接 + 符号链接的双层结构"和"严格依赖暴露幽灵依赖"，并指出迁移的真实成本，比只说"pnpm 快"有深度。
:::
