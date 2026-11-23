## 前端路由的本质

**不刷新页面地改变 URL，并根据 URL 渲染对应组件**。

两种实现方式：

| 模式 | URL 形态 | 监听方式 |
| --- | --- | --- |
| hash | `/#/user/1` | `hashchange` 事件 |
| history | `/user/1` | `popstate` + `pushState` |

## hash 模式

```js
window.addEventListener('hashchange', () => {
  const path = location.hash.slice(1) || '/'
  render(path)
})
```

特点：

- 改变 `#` 后的部分**不会触发页面请求**
- 兼容性最好（可支持到 IE9）
- URL 带 `#` 不美观
- 不会被服务端看到（`#` 后的内容不发送到服务器）
- 对 SEO 不友好

## history 模式

```js
history.pushState({}, '', '/user/1')   // 改变 URL 但不刷新
window.addEventListener('popstate', () => render(location.pathname))
```

特点：

- URL 干净
- 使用 HTML5 History API
- **刷新或直接访问会请求服务端**，服务端必须把所有前端路由回退到 `index.html`，否则 404

```nginx
# Nginx 配置
location / {
  try_files $uri $uri/ /index.html;
}
```

::: warn history 模式的常见事故
```
用户直接访问 /user/1 → 服务端找不到该文件 → 404
```
上线前必须在网关/服务器配置 fallback，这是最常见的部署事故之一。
:::

## 导航解析流程（完整顺序）

```
1. 导航被触发（router.push / 点击 link / 浏览器前进后退）
2. 调用失活组件的 beforeRouteLeave
3. 调用全局 beforeEach
4. 调用重用组件的 beforeRouteUpdate
5. 调用路由配置里的 beforeEnter
6. 解析异步路由组件
7. 调用被激活组件的 beforeRouteEnter（此时无 this）
8. 调用全局 beforeResolve
9. 导航被确认
10. 调用全局 afterEach
11. 触发 DOM 更新
12. 调用 beforeRouteEnter 中传给 next 的回调（可访问 this）
```

记忆方法：**离开 → 全局前置 → 更新 → 独享 → 进入 → 全局解析 → 确认 → 全局后置**。

## 路由守卫的典型用法

```js
router.beforeEach((to, from, next) => {
  const token = getToken()

  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  // 权限校验
  if (to.meta.role && !hasRole(to.meta.role)) {
    next('/403')
    return
  }

  next()
})
```

```js
// 动态标题
router.afterEach((to) => {
  document.title = to.meta.title || '默认标题'
})
```

## 懒加载与分包

```js
const routes = [
  { path: '/', component: () => import('@/views/Home.vue') },
  {
    path: '/admin',
    component: () => import('@/views/Admin.vue'),
    children: [
      { path: 'users', component: () => import('@/views/admin/Users.vue') }
    ]
  }
]
```

每个 `import()` 会生成独立的 chunk，按需加载。这是路由级代码分割的标准做法。

```js
// 预加载：鼠标悬停时提前拉取
const Users = () => import('@/views/admin/Users.vue')
<RouterLink to="/admin/users" @mouseenter="Users()">
```

## 常见问题

```js
// 1. 重复导航报错（Vue Router 3）
router.push('/same').catch(() => {})
// Vue Router 4 已内置处理，不再抛错

// 2. 参数变化但组件不重建（复用同一组件）
watch(() => route.params.id, fetchData)
// 或用 beforeRouteUpdate

// 3. history 模式下 base 路径未配置
createRouter({ history: createWebHistory('/app/') })
```

::: interview 面试视角
能完整背出 12 步导航流程的人不多。通常只要求说清"hashchange vs pushState + popstate"、"history 需要服务端 fallback"、"beforeRouteEnter 中拿不到 this"，就已经超过平均线。
:::
