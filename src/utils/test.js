Function.prototype.myBind = function (context, ...args) {
  // this 是调用 myBind 的函数，也就是目标函数 fn
  const fn = this

  // 空函数，作为原型桥接的中间层
  const noop = function () {}

  // 返回的绑定函数
  const bound = function (...rest) {
    // 判断是否通过 new bound() 调用
    const isNew = this instanceof bound

    // new 调用时用新对象 this，忽略 context
    // 普通调用时用绑定的 context
    // 参数：bind 时预置的 args 在前，调用时传入的 rest 在后
    return fn.apply(isNew ? this : context, [...args, ...rest])
  }

  // 只有普通函数才有 prototype；箭头函数、对象方法简写通常没有
  if (fn.prototype) {
    // 让 noop.prototype 指向原函数原型
    noop.prototype = fn.prototype
    // bound.prototype 是一个新对象，它的原型是 fn.prototype
    bound.prototype = new noop()
  }

  return bound
}