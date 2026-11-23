/* eslint-disable */
/** TypeScript：第 93–96 题 */

export const tsQuestions = [
  {
    id: 'ts-01',
    code: 93,
    title: 'type 与 interface 的区别与选型',
    categoryId: 'ts',
    level: '中级',
    freq: '高',
    tags: ['type', 'interface', '声明合并'],
    question:
      'type 和 interface 有什么区别？什么场景用哪个？为什么团队规范通常会区分使用？',
    answerId: 'ts-01',
    followups: ['declare module 与 declare global 的使用场景', 'interface extends 与 type & 在冲突时的行为差异']
  },
  {
    id: 'ts-02',
    code: 94,
    title: '常用工具类型与手写 Partial / Required / Pick',
    categoryId: 'ts',
    level: '中级',
    freq: '高',
    tags: ['工具类型', '映射类型', '手写'],
    question:
      '常用的工具类型有哪些？请手写实现 Partial、Required、Readonly、Pick、Omit、Record、Exclude、ReturnType，并说明关键语法。',
    answerId: 'ts-02',
    followups: ['infer 在多个位置出现时的推断规则', '如何实现 DeepPartial 与 DeepReadonly']
  },
  {
    id: 'ts-03',
    code: 95,
    title: '类型收窄（Type Narrowing）的全部方式',
    categoryId: 'ts',
    level: '中级',
    freq: '中高',
    tags: ['收窄', '类型守卫'],
    question:
      'TypeScript 的类型收窄有哪些方式？自定义类型守卫与断言函数怎么写？收窄在闭包中会失效吗？',
    answerId: 'ts-03',
    followups: ['satisfies 与 as 在收窄中的差异', '如何为 JSON 数据写运行时校验（zod / 手写 guard）']
  },
  {
    id: 'ts-04',
    code: 96,
    title: '条件类型与 infer 的用法',
    categoryId: 'ts',
    level: '高级',
    freq: '中高',
    tags: ['条件类型', 'infer', '分布式'],
    question:
      '条件类型（Conditional Types）与 infer 关键字的用法是什么？分布式条件类型在什么条件下触发？请给出三个实用例子。',
    answerId: 'ts-04',
    followups: ['协变与逆变位置对 infer 的影响', '递归条件类型如何避免"类型实例化过深"']
  }
]