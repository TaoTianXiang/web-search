/* eslint-disable */
/** AI 与新趋势：第 97–100 题（2026 新增必考模块） */

export const aiQuestions = [
  {
    id: 'ai-01',
    code: 97,
    title: '日常 AI 工作流与工具选型',
    categoryId: 'ai',
    level: '中级',
    freq: '极高',
    trend: '2026 几乎每家必问，考察是否真的把 AI 融入工程实践',
    tags: ['AI', '工作流', '工具'],
    question:
      '你的日常 AI 工作流是什么？使用哪些 AI 工具？请举一个具体例子说明 AI 如何改变了你的开发方式，以及你如何验证 AI 的输出。',
    answerId: 'ai-01',
    followups: ['如何在团队中推行 AI 使用规范', '如何处理 AI 生成代码的版权与合规问题']
  },
  {
    id: 'ai-02',
    code: 98,
    title: '如何保证 AI 生成代码的质量',
    categoryId: 'ai',
    level: '高级',
    freq: '极高',
    trend: '增长最快的题型，考察工程化的质量控制能力',
    tags: ['AI', '代码质量', '评审'],
    question:
      '如何保证 AI 生成代码的质量？如何进行 AI 代码审查？请给出可落地的机制，而不只是"仔细检查"。',
    answerId: 'ai-02',
    followups: ['如何在 CI 中检测"AI 引入的未声明依赖"', 'AI 生成代码的测试覆盖率应该如何要求']
  },
  {
    id: 'ai-03',
    code: 99,
    title: '用 AI 重构遗留项目的流程设计',
    categoryId: 'ai',
    level: '高级',
    freq: '高',
    tags: ['AI', '重构', '遗留系统'],
    question:
      '如果让你用 AI 重构一个遗留项目，你会怎么设计流程？如何控制风险？如何验证重构没有破坏功能？',
    answerId: 'ai-03',
    followups: ['如何为没有测试的遗留代码建立"特征测试"（characterization tests）', '重构与技术升级（如 Vue 2 → 3）的流程差异']
  },
  {
    id: 'ai-04',
    code: 100,
    title: '如何看待 AI 与程序员的关系',
    categoryId: 'ai',
    level: '中级',
    freq: '高',
    tags: ['AI', '职业发展', '软技能'],
    question:
      '如何看待 AI 与程序员的关系？你的核心竞争力是什么？在 AI 时代，前端工程师应该提升哪些能力？',
    answerId: 'ai-04',
    followups: ['AI 时代前端工程师的技术深度应该往哪个方向走', '如何在团队中推动 AI 工具的规范化使用']
  }
]