import type { AssistantMessage } from '../types/domain'

export const jobAssistantMessages: AssistantMessage[] = [
  { id: 1, from: 'assistant', text: '为了更精准推荐，请补充期望薪资和行业偏好。', time: '10:21' },
  { id: 2, from: 'user', text: '30K-40K，偏好 AI 或 SaaS。', time: '10:21' },
  { id: 3, from: 'assistant', text: '是否接受混合办公？', time: '10:21' },
  { id: 4, from: 'user', text: '可以。', time: '10:22' },
]

export const talentAssistantMessages: AssistantMessage[] = [
  { id: 1, from: 'assistant', text: '已为您筛选匹配「土建造价师」的候选人。', time: '14:20' },
  { id: 2, from: 'user', text: '有没有沟通能力比较突出的？', time: '14:21' },
  { id: 3, from: 'assistant', text: '李娜 和 陈雨欣 的项目评价中均提到较好的协同沟通能力，已为您高亮。', time: '14:21' },
]
