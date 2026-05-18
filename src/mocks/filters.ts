import type { SearchFilter } from '../types/domain'

export const jobFilters: SearchFilter[] = [
  { id: 'salary-range', label: '薪资 30K-40K' },
  { id: 'industry-ai-saas', label: 'AI / SaaS' },
  { id: 'company-size', label: '100-500人' },
  { id: 'full-time', label: '全职' },
]

export const talentFilters: SearchFilter[] = [
  { id: 'city-shanghai', label: '上海' },
  { id: 'degree-bachelor', label: '本科及以上' },
  { id: 'salary-max-25k', label: '薪资 ≤25K' },
]
