/**
 * 通用工具方法
 * 使用方式：
 *   1. 按需引入： import { debounce, throttle } from '@/utils/common'
 *   2. 全局挂载： main.js 中 app.use(commonUtils)
 *      之后在模板/实例中可通过 $debounce / $throttle 使用，
 *      或在任意组件中 import { debounce } from '@/utils/common'
 */

/**
 * 防抖：事件触发后等待 wait 毫秒，若期间再次触发则重新计时，只执行最后一次
 * @param {Function} fn 需要执行的函数
 * @param {number} [wait=300] 等待时间(ms)
 * @param {boolean} [immediate=false] 是否立即执行一次（首次触发立即执行，之后需等待停止触发 wait 毫秒后才能再次执行）
 * @returns {Function} 包装后的函数，附带 cancel() 方法用于取消挂起的调用
 */
export function debounce(fn, wait = 300, immediate = false) {
  if (typeof fn !== 'function') {
    throw new TypeError('[debounce] 第一个参数必须是函数')
  }

  let timer = null
  let lastArgs = null
  let lastThis = null

  function invoke() {
    timer = null
    if (!immediate && lastArgs) {
      fn.apply(lastThis, lastArgs)
      lastArgs = null
      lastThis = null
    }
  }

  function debounced(...args) {
    const callNow = immediate && !timer

    if (timer) clearTimeout(timer)
    lastArgs = args
    lastThis = this
    timer = setTimeout(invoke, wait)

    if (callNow) {
      fn.apply(this, args)
      lastArgs = null
      lastThis = null
    }
  }

  // 取消挂起中的执行
  debounced.cancel = function () {
    if (timer) clearTimeout(timer)
    timer = null
    lastArgs = null
    lastThis = null
  }

  return debounced
}

/**
 * 节流：在 wait 毫秒内最多执行一次（默认首次立即执行，末次补执行）
 * @param {Function} fn 需要执行的函数
 * @param {number} [wait=300] 间隔时间(ms)
 * @param {{leading?: boolean, trailing?: boolean}} [options] leading 首次是否立即执行，trailing 停止触发后是否补执行最后一次
 * @returns {Function} 包装后的函数，附带 cancel() 方法用于取消挂起的调用
 */
export function throttle(fn, wait = 300, options = {}) {
  if (typeof fn !== 'function') {
    throw new TypeError('[throttle] 第一个参数必须是函数')
  }

  const { leading = true, trailing = true } = options

  let timer = null
  let lastTime = 0
  let lastArgs = null
  let lastThis = null

  function invoke(time) {
    lastTime = leading === false ? 0 : time
    timer = null
    if (lastArgs) {
      fn.apply(lastThis, lastArgs)
      lastArgs = null
      lastThis = null
    }
  }

  function throttled(...args) {
    const now = Date.now()

    if (!lastTime && leading === false) {
      lastTime = now
    }

    const remaining = wait - (now - lastTime)

    lastArgs = args
    lastThis = this

    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      invoke(now)
    } else if (!timer && trailing) {
      timer = setTimeout(() => invoke(Date.now()), remaining)
    }
  }

  // 取消挂起中的执行
  throttled.cancel = function () {
    if (timer) clearTimeout(timer)
    timer = null
    lastTime = 0
    lastArgs = null
    lastThis = null
  }

  return throttled
}

/**
 * Vue 3 插件：支持 app.use(commonUtils) 全局注册
 * 注册后可通过 this.$debounce / this.$throttle 使用（Options API），
 * 也可通过 getCurrentInstance().proxy.$debounce 使用（Composition API）
 */
export default {
  install(app) {
    app.config.globalProperties.$debounce = debounce
    app.config.globalProperties.$throttle = throttle
  }
}
