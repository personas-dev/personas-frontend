import type { Candidate, Job, SearchFilter } from './domain'

export type ApiSource = 'mock' | 'core'
export type SortBy = 'match' | 'salary' | 'experience'
export type FilterScope = 'job' | 'candidate'
export type MetadataValue = string | number | boolean | null

export interface ApiResponseDTO<TData> {
  code: number
  message: string
  data: TData
}

export interface ApiErrorDTO {
  code: number
  message: string
  details?: unknown
}

export interface PaginationDTO {
  page: number
  page_size: number
  total: number
  total_pages: number
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface FiltersAppliedDTO {
  [field: string]: MetadataValue | undefined
  keyword?: string | null
  filters?: string | null
}

export type FiltersApplied = Record<string, MetadataValue>

export interface JobDTO {
  id: number
  title: string
  company: string
  category: string
  salary: string
  city: string
  district?: string | null
  education: string
  experience: string
  match: number
  level: string
  highlight: string
  duty: string
  filter_tags: string[]
  keywords: string[]
  detail_bullets: string[]
}

export interface CandidateDTO {
  id: number
  name: string
  gender: string
  age: number
  degree: string
  years: number
  current: string
  salary: string
  match: number
  tags: string[]
  reason: string
  avatar: string
  filter_tags: string[]
  keywords: string[]
  target_roles: string[]
  city: string
}

export interface FilterDTO {
  id: string
  label: string
}

export interface JobSearchDataDTO {
  source: ApiSource
  items: JobDTO[]
  filters_applied: FiltersAppliedDTO
  pagination: PaginationDTO
}

export interface CandidateSearchDataDTO {
  source: ApiSource
  items: CandidateDTO[]
  filters_applied: FiltersAppliedDTO
  pagination: PaginationDTO
}

export interface FilterSearchDataDTO {
  source: ApiSource
  job_filters: FilterDTO[]
  talent_filters: FilterDTO[]
}

export interface HealthDataDTO {
  status: string
  service: string
  version: string
  source: ApiSource
  mock_mode: boolean
}

export interface SearchQueryParams {
  keyword?: string
  page?: number
  pageSize?: number
  page_size?: number
  sortBy?: SortBy
  sort_by?: SortBy
  filters?: string | string[]
}

export interface FiltersQueryParams {
  type?: FilterScope
}

export interface SearchResultMeta {
  source: ApiSource
  filtersApplied: FiltersApplied
  pagination: Pagination
}

export interface JobSearchResult extends SearchResultMeta {
  items: Job[]
}

export interface CandidateSearchResult extends SearchResultMeta {
  items: Candidate[]
}

export interface FilterSearchResult {
  source: ApiSource
  jobFilters: SearchFilter[]
  talentFilters: SearchFilter[]
}

export interface HealthResult {
  status: string
  service: string
  version: string
  source: ApiSource
  mockMode: boolean
}
