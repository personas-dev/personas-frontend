import { env } from '../env'
import type {
  CandidateSearchDataDTO,
  CandidateSearchResult,
  FilterSearchDataDTO,
  FilterSearchResult,
  FiltersQueryParams,
  HealthDataDTO,
  HealthResult,
  JobSearchDataDTO,
  JobSearchResult,
  SearchQueryParams,
} from '../types/api'
import {
  mapCandidateSearchDataDto,
  mapFilterSearchDataDto,
  mapHealthDataDto,
  mapJobSearchDataDto,
} from './mappers'

const API_PREFIX = '/api/v1'

interface ApiErrorOptions {
  message: string
  code?: number
  details?: unknown
  status?: number
}

export class ApiError extends Error {
  readonly code?: number
  readonly details?: unknown
  readonly status?: number

  constructor(options: ApiErrorOptions) {
    super(options.message)
    this.name = 'ApiError'
    this.code = options.code
    this.details = options.details
    this.status = options.status
  }
}

export async function getJobsSearch(query: SearchQueryParams = {}): Promise<JobSearchResult> {
  const data = await getApiData<JobSearchDataDTO>('/jobs/search', buildSearchParams(query))
  return mapJobSearchDataDto(data)
}

export async function getCandidatesSearch(query: SearchQueryParams = {}): Promise<CandidateSearchResult> {
  const data = await getApiData<CandidateSearchDataDTO>('/candidates/search', buildSearchParams(query))
  return mapCandidateSearchDataDto(data)
}

export async function getFilters(query: FiltersQueryParams = {}): Promise<FilterSearchResult> {
  const params = new URLSearchParams()
  appendStringParam(params, 'type', query.type)

  const data = await getApiData<FilterSearchDataDTO>('/filters', params)
  return mapFilterSearchDataDto(data)
}

export async function getHealth(): Promise<HealthResult> {
  const data = await getApiData<HealthDataDTO>('/health')
  return mapHealthDataDto(data)
}

async function getApiData<TData>(path: string, params?: URLSearchParams): Promise<TData> {
  const response = await fetchJson(path, params)
  const payload = await readResponsePayload(response)

  if (!response.ok) {
    throw createApiError(payload, response.status, `HTTP ${response.status} 请求失败`)
  }

  const record = toRecord(payload)
  if (record === null) {
    throw new ApiError({
      message: '接口响应格式无效',
      details: payload,
      status: response.status,
    })
  }

  if (typeof record.code !== 'number') {
    throw new ApiError({
      message: '接口响应缺少状态码',
      details: payload,
      status: response.status,
    })
  }

  if (record.code !== 0) {
    throw createApiError(payload, response.status, '接口返回业务错误')
  }

  if (!('data' in record)) {
    throw new ApiError({
      message: '接口响应缺少数据字段',
      details: payload,
      status: response.status,
    })
  }

  return record.data as TData
}

async function fetchJson(path: string, params?: URLSearchParams): Promise<Response> {
  const url = buildApiUrl(path, params)

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch (error) {
    throw new ApiError({
      message: '网络请求失败',
      details: getThrownMessage(error),
      status: 0,
    })
  }
}

function buildApiUrl(path: string, params?: URLSearchParams): URL {
  const normalizedBase = env.apiBaseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${normalizedBase}${API_PREFIX}${normalizedPath}`)
  const query = params?.toString() ?? ''

  if (query !== '') {
    url.search = query
  }

  return url
}

function buildSearchParams(query: SearchQueryParams): URLSearchParams {
  const params = new URLSearchParams()
  const pageSize = query.pageSize ?? query.page_size
  const sortBy = query.sortBy ?? query.sort_by

  appendStringParam(params, 'keyword', query.keyword)
  appendNumberParam(params, 'page', query.page)
  appendNumberParam(params, 'page_size', pageSize)
  appendStringParam(params, 'sort_by', sortBy)
  appendStringParam(params, 'filters', normalizeFilters(query.filters))

  return params
}

function appendStringParam(params: URLSearchParams, key: string, value: string | undefined): void {
  const normalizedValue = value?.trim()
  if (normalizedValue !== undefined && normalizedValue !== '') {
    params.append(key, normalizedValue)
  }
}

function appendNumberParam(params: URLSearchParams, key: string, value: number | undefined): void {
  if (value !== undefined && Number.isFinite(value)) {
    params.append(key, String(value))
  }
}

function normalizeFilters(filters: string | string[] | undefined): string | undefined {
  if (Array.isArray(filters)) {
    const normalizedFilters = filters.map((filter) => filter.trim()).filter((filter) => filter !== '')
    return normalizedFilters.length > 0 ? normalizedFilters.join(',') : undefined
  }

  return filters
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const text = await response.text()

  if (text.trim() === '') {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function createApiError(payload: unknown, status: number, fallbackMessage: string): ApiError {
  const record = toRecord(payload)
  const code = typeof record?.code === 'number' ? record.code : undefined
  const message = readErrorMessage(payload, record, fallbackMessage)
  const details = record !== null && 'details' in record ? record.details : payload

  return new ApiError({
    message,
    code,
    details,
    status,
  })
}

function readErrorMessage(
  payload: unknown,
  record: Record<string, unknown> | null,
  fallbackMessage: string,
): string {
  if (typeof record?.message === 'string' && record.message.trim() !== '') {
    return record.message
  }

  if (typeof payload === 'string' && payload.trim() !== '') {
    return payload
  }

  return fallbackMessage
}

function getThrownMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知网络错误'
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}
