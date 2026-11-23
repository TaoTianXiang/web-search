## 三维权重

```
(A, B, C)
A = ID 选择器数量
B = class / 属性 / 伪类数量
C = 元素 / 伪元素数量
```

```css
#id .cls div      /* (1, 1, 1) */
.cls div div      /* (0, 1, 2) */
div               /* (0, 0, 1) */
*                 /* (0, 0, 0) */
```

比较规则：从左到右逐位比较，高位决定胜负（不是十进制求和）。

```css
/* (0, 11, 0) 仍小于 (1, 0, 0) —— 11 个 class 打不过 1 个 id */
.a.b.c.d.e.f.g.h.i.j.k { color: red; }
#id { color: blue; }   /* 胜出 */
```

## 特殊伪类的权重

| 选择器 | 权重计算 |
| --- | --- |
| `:not(.a)` | 取内部最高权重 → (0, 1, 0) |
| `:is(.a, #b)` | 取内部最高 → (1, 0, 0) |
| `:where(...)` | **恒为 0** |
| `:has(.a)` | 取内部权重 |
| `:nth-child(2n)` | (0, 1, 0)（伪类本身） |

```css
/* 用 :where 写零权重的重置样式 */
:where(h1, h2, h3) { margin: 0; }
/* 任何其他样式都能覆盖它 */
```

## 完整层叠顺序（低 → 高）

1. 用户代理样式（浏览器默认）
2. 用户普通样式
3. **作者普通样式**
   - 按 `@layer` 层顺序
   - 层内按选择器权重
   - 同权重按源码顺序
4. 作者 `!important`
5. 用户 `!important`
6. 浏览器 `!important`

行内样式的普通声明位于作者普通层之上，但作者 `!important` 仍可覆盖它。

## @layer 的影响

```css
@layer reset, base, components, utilities;

@layer base {
  #main .card { color: blue; }   /* 权重高但层低 */
}

@layer utilities {
  .text-red { color: red; }      /* 权重低但层高，胜出 */
}
```

**层顺序优先于选择器权重**，这是 @layer 的核心价值：设计系统不必靠堆叠选择器来保证覆盖。

```css
/* 未分层样式 > 所有分层样式 */
.card { color: green; }   /* 不在任何 layer 中 */
```

注意 `!important` 在层中的顺序是**反转**的：先声明的层中的 `!important` 优先级更高。

## 实践建议

```css
/* 1. 避免使用 ID 选择器写样式（除非必要） */
/* 2. 选择器层级不超过 3 层 */
/* 3. 用 @layer 管理基础/组件/工具类 */
/* 4. 用 :where() 写零权重重置 */
/* 5. !important 只作为逃生舱 */
```

## 常见误判

```css
/* 权重相同 (0,1,0)，后者胜出（源码顺序） */
.a { color: red; }
.b { color: blue; }

/* 继承来的样式权重为 0，比任何直接选择器都低 */
.parent { color: red; }
.child { }               /* child 继承到 red */
* { color: blue; }       /* 但 * 有权重 (0,0,0)，会覆盖继承值 */
```

::: tip CSS Modules / Scoped 的隔离
两者都是通过**增加属性选择器**提高特异性实现的：
```css
/* Vue scoped */
.a[data-v-abc123] { color: red; }   /* (0, 2, 0) */
```
所以 scoped 样式更容易被外部样式覆盖失败（反过来也成立）。
:::

::: interview 面试视角
能说清"权重是逐位比较不是求和"、"@layer 的层顺序优先于权重"、":where 权重为 0"，说明你理解层叠的计算模型而非只背三元组。
:::
