## 作用

```html
<!DOCTYPE html>
```

告诉浏览器**用哪种文档模式解析页面**。它不是 HTML 标签，而是给解析器的指令。

HTML5 的 DOCTYPE 极简，只保留 `html` 这一个值（因为不再需要 DTD 声明）。

## 三种模式

| 模式 | 触发条件 | 行为 |
| --- | --- | --- |
| **标准模式（standards）** | 完整的现代 DOCTYPE | 遵循 W3C 规范 |
| **怪异模式（quirks）** | 无 DOCTYPE，或旧的不完整 DOCTYPE | 兼容 IE5 的历史行为 |
| 几乎标准（almost standards） | 特定 DOCTYPE（含过渡 DTD） | 标准模式 + 图片行盒行为 |

```js
// 检查当前模式
document.compatMode
// 'CSS1Compat'   → 标准模式
// 'BackCompat'   → 怪异模式
```

## 怪异模式的主要差异

| 行为 | 标准模式 | 怪异模式 |
| --- | --- | --- |
| 盒模型 | `content-box` | `border-box` |
| 行高计算 | 按规范 | 旧式（影响 inline 元素间距） |
| 百分比高度 | 需父元素有高度 | 可相对视口 |
| 表格字号继承 | 继承 | 不继承（用默认 small） |
| `img` 底部空隙 | 有 | 无 |

```js
// 怪异模式下：width 包含 padding 与 border
document.compatMode // 'BackCompat'
```

这是最致命的差异：同一份 CSS 在两种模式下布局完全不同。

## 为什么会有怪异模式

1990 年代末，IE 与 Netscape 的实现各有偏差，且已有大量页面依赖这些行为。W3C 引入 DOCTYPE 切换机制：**声明 DOCTYPE 就按标准渲染，不声明就保持旧行为**，以此保证老页面不崩。

```html
<!-- HTML 4.01 严格 -->
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<!-- HTML5（现代统一写法） -->
<!DOCTYPE html>
```

## 实际影响

```html
<!-- ❌ 忘了 DOCTYPE：进入怪异模式 -->
<html>
  <head>...</head>
</html>
```

后果：

- 所有元素变成 border-box 语义（与设计稿不一致）
- 行高、基线对齐异常
- 某些 flex / grid 布局表现异常
- 第三方组件库样式错位

排查方法：

```js
if (document.compatMode === 'BackCompat') {
  console.warn('页面处于怪异模式，请检查 DOCTYPE')
}
```

## 现代项目的保障

1. 构建工具（html-webpack-plugin、Vite）默认注入 `<!DOCTYPE html>`
2. 用模板（如 `public/index.html`）时确保首行就是 DOCTYPE
3. 服务端渲染时手写 HTML 要格外注意（拼接字符串容易漏）
4. 某些邮件模板、老 CMS 输出可能不带 DOCTYPE

::: warn DOCTYPE 必须在最前
```html
<!-- ❌ 前面有任何内容（包括注释、空行之外的字符）都会触发怪异模式 -->
<!-- 注释是允许的，但不要有其他元素或文本 -->
<!DOCTYPE html>
```
规范允许 DOCTYPE 之前有注释与空白，但很多老浏览器解析器比较脆弱，最安全的做法是让 DOCTYPE 位于文件最开头。
:::

::: interview 面试视角
能说清"怪异模式下盒模型变成 border-box"这一具体差异，并给出 `document.compatMode` 的检查方法，就超过了"DOCTYPE 是声明文档类型"的表面回答。
:::
