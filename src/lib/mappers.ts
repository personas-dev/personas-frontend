import type { Candidate, Job, MatchLevel, SearchFilter } from '../types/domain'
import type {
  CandidateDTO,
  CandidateSearchDataDTO,
  CandidateSearchResult,
  FilterDTO,
  FilterSearchDataDTO,
  FilterSearchResult,
  FiltersApplied,
  FiltersAppliedDTO,
  HealthDataDTO,
  HealthResult,
  JobDTO,
  JobSearchDataDTO,
  JobSearchResult,
  Pagination,
  PaginationDTO,
} from '../types/api'

function toMatchLevel(value: string): MatchLevel {
  if (value === '高匹配' || value === '优先推荐' || value === '匹配') {
    return value
  }

  return '匹配'
}

function toCandidateGender(value: string): Candidate['gender'] {
  return value === '女' ? '女' : '男'
}

export function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase())
}

export function mapPaginationDto(dto: PaginationDTO): Pagination {
  return {
    page: dto.page,
    pageSize: dto.page_size,
    total: dto.total,
    totalPages: dto.total_pages,
  }
}

export function mapFiltersAppliedDto(dto: FiltersAppliedDTO): FiltersApplied {
  const mapped: FiltersApplied = {}

  for (const [key, value] of Object.entries(dto)) {
    if (value !== undefined) {
      mapped[snakeToCamel(key)] = value
    }
  }

  return mapped
}

export function mapJobDto(dto: JobDTO): Job {
  return {
    id: dto.id,
    title: dto.title,
    company: dto.company,
    category: dto.category,
    salary: dto.salary,
    city: dto.city,
    district: dto.district ?? '',
    education: dto.education,
    experience: dto.experience,
    match: dto.match,
    level: toMatchLevel(dto.level),
    highlight: dto.highlight,
    duty: dto.duty,
    filterTags: dto.filter_tags,
    keywords: dto.keywords,
    detailBullets: dto.detail_bullets,
  }
}

export function mapCandidateDto(dto: CandidateDTO): Candidate {
  return {
    id: dto.id,
    name: dto.name,
    gender: toCandidateGender(dto.gender),
    age: dto.age,
    degree: dto.degree,
    years: dto.years,
    current: dto.current,
    salary: dto.salary,
    match: dto.match,
    tags: dto.tags,
    reason: dto.reason,
    avatar: dto.avatar,
    filterTags: dto.filter_tags,
    keywords: dto.keywords,
    targetRoles: dto.target_roles,
    city: dto.city,
  }
}

export function mapFilterDto(dto: FilterDTO): SearchFilter {
  return {
    id: dto.id,
    label: dto.label,
  }
}

export function mapJobSearchDataDto(dto: JobSearchDataDTO): JobSearchResult {
  return {
    source: dto.source,
    items: dto.items.map(mapJobDto),
    filtersApplied: mapFiltersAppliedDto(dto.filters_applied),
    pagination: mapPaginationDto(dto.pagination),
  }
}

export function mapCandidateSearchDataDto(dto: CandidateSearchDataDTO): CandidateSearchResult {
  return {
    source: dto.source,
    items: dto.items.map(mapCandidateDto),
    filtersApplied: mapFiltersAppliedDto(dto.filters_applied),
    pagination: mapPaginationDto(dto.pagination),
  }
}

export function mapFilterSearchDataDto(dto: FilterSearchDataDTO): FilterSearchResult {
  return {
    source: dto.source,
    jobFilters: dto.job_filters.map(mapFilterDto),
    talentFilters: dto.talent_filters.map(mapFilterDto),
  }
}

export function mapHealthDataDto(dto: HealthDataDTO): HealthResult {
  return {
    status: dto.status,
    service: dto.service,
    version: dto.version,
    source: dto.source,
    mockMode: dto.mock_mode,
  }
}
