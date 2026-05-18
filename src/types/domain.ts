// 领域类型定义 —— 人岗匹配系统核心数据模型

/** 匹配等级 */
export type MatchLevel = '高匹配' | '优先推荐' | '匹配'

/** 筛选项 */
export interface SearchFilter {
  id: string
  label: string
}

/** 职位 */
export interface Job {
  id: number
  title: string
  company: string
  category: string
  salary: string
  city: string
  district: string
  education: string
  experience: string
  match: number
  level: MatchLevel
  highlight: string
  duty: string
  filterTags: string[]
  keywords: string[]
  detailBullets: string[]
}

export interface Candidate {
  id: number
  name: string
  gender: '男' | '女'
  age: number
  degree: string
  years: number
  current: string
  salary: string
  match: number
  tags: string[]
  reason: string
  avatar: string
  filterTags: string[]
  keywords: string[]
  targetRoles: string[]
  city: string
}

/** 助手消息 */
export interface AssistantMessage {
  id: number
  from: 'assistant' | 'user'
  text: string
  time: string
}

/** 助手模式 */
export type AssistantMode = 'job' | 'talent'


