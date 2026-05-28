import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/server'
import { ApiError, getCandidatesSearch, getFilters, getHealth, getJobsSearch } from './api'

const TEST_API_PREFIX = 'http://localhost:8000/api/v1'

describe('api client', () => {
  it('serializes job search query deterministically and maps successful responses', async () => {
    let queryEntries: [string, string][] = []

    server.use(
      http.get(`${TEST_API_PREFIX}/jobs/search`, ({ request }) => {
        const url = new URL(request.url)
        queryEntries = Array.from(url.searchParams.entries())

        return HttpResponse.json({
          code: 0,
          message: 'ok',
          data: {
            source: 'mock',
            items: [
              {
                id: 1,
                title: '高级 Java 后端工程师',
                company: '智谱科技',
                category: '后端开发',
                salary: '30K-40K',
                city: '上海',
                district: '徐汇区',
                education: '本科及以上',
                experience: '5-10 年',
                match: 96,
                level: '高匹配',
                highlight: '优势推荐',
                duty: '负责核心业务系统开发。',
                filter_tags: ['后端开发', '上海'],
                keywords: ['java', 'spring cloud'],
                detail_bullets: ['技术栈：Spring Cloud、Redis'],
              },
            ],
            filters_applied: {
              keyword: '上海 后端',
              filters: 'city-shanghai,degree-bachelor',
              sort_by: 'salary',
            },
            pagination: {
              page: 1,
              page_size: 50,
              total: 1,
              total_pages: 1,
            },
          },
        })
      }),
    )

    const result = await getJobsSearch({
      keyword: ' 上海 后端 ',
      page: 1,
      pageSize: 50,
      sortBy: 'salary',
      filters: ['city-shanghai', 'degree-bachelor'],
    })

    expect(queryEntries).toEqual([
      ['keyword', '上海 后端'],
      ['page', '1'],
      ['page_size', '50'],
      ['sort_by', 'salary'],
      ['filters', 'city-shanghai,degree-bachelor'],
    ])
    expect(result.items[0].filterTags).toEqual(['后端开发', '上海'])
    expect(result.items[0].detailBullets).toEqual(['技术栈：Spring Cloud、Redis'])
    expect(result.filtersApplied.sortBy).toBe('salary')
    expect(result.pagination.pageSize).toBe(50)
  })

  it('exposes candidates, filters and health endpoints with camelCase results', async () => {
    server.use(
      http.get(`${TEST_API_PREFIX}/candidates/search`, () => {
        return HttpResponse.json({
          code: 0,
          message: 'ok',
          data: {
            source: 'mock',
            items: [
              {
                id: 1,
                name: '张伟',
                gender: '男',
                age: 28,
                degree: '本科',
                years: 5,
                current: '中建三局（造价工程师）',
                salary: '18K-22K',
                match: 92,
                tags: ['经验吻合'],
                reason: '候选人具备土建造价经验。',
                avatar: '张',
                filter_tags: ['土建造价', '上海'],
                keywords: ['张伟', '造价工程师'],
                target_roles: ['土建造价师'],
                city: '上海',
              },
            ],
            filters_applied: {
              keyword: '造价 上海',
              filters: 'city-shanghai',
            },
            pagination: {
              page: 1,
              page_size: 20,
              total: 1,
              total_pages: 1,
            },
          },
        })
      }),
      http.get(`${TEST_API_PREFIX}/filters`, ({ request }) => {
        const url = new URL(request.url)

        return HttpResponse.json({
          code: 0,
          message: 'ok',
          data: {
            source: 'mock',
            job_filters: [{ id: 'salary-range', label: '薪资 30K-40K' }],
            talent_filters: url.searchParams.get('type') === 'candidate'
              ? [{ id: 'city-shanghai', label: '上海' }]
              : [],
          },
        })
      }),
      http.get(`${TEST_API_PREFIX}/health`, () => {
        return HttpResponse.json({
          code: 0,
          message: 'ok',
          data: {
            status: 'ok',
            service: 'personas-backend',
            version: '0.1.0',
            source: 'mock',
            mock_mode: true,
          },
        })
      }),
    )

    const candidates = await getCandidatesSearch({ page_size: 20, sort_by: 'match' })
    const filters = await getFilters({ type: 'candidate' })
    const health = await getHealth()

    expect(candidates.items[0].filterTags).toEqual(['土建造价', '上海'])
    expect(candidates.items[0].targetRoles).toEqual(['土建造价师'])
    expect(filters.jobFilters).toEqual([{ id: 'salary-range', label: '薪资 30K-40K' }])
    expect(filters.talentFilters).toEqual([{ id: 'city-shanghai', label: '上海' }])
    expect(health.mockMode).toBe(true)
  })

  it('throws ApiError for backend business error code 40001', async () => {
    server.use(
      http.get(`${TEST_API_PREFIX}/jobs/search`, () => {
        return HttpResponse.json(
          {
            code: 40001,
            message: '请求参数不符合协议约定',
            details: 'page_size 必须小于或等于 50',
          },
          { status: 400 },
        )
      }),
    )

    let thrown: unknown
    try {
      await getJobsSearch({ pageSize: 999 })
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ApiError)
    expect(thrown).toMatchObject({
      code: 40001,
      message: '请求参数不符合协议约定',
      details: 'page_size 必须小于或等于 50',
      status: 400,
    })
  })

  it('throws ApiError for HTTP errors without falling back to local data', async () => {
    server.use(
      http.get(`${TEST_API_PREFIX}/health`, () => {
        return HttpResponse.json(
          {
            code: 50001,
            message: '服务端未预期错误',
            details: 'backend unavailable',
          },
          { status: 500 },
        )
      }),
    )

    let thrown: unknown
    try {
      await getHealth()
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(ApiError)
    expect(thrown).toMatchObject({
      code: 50001,
      message: '服务端未预期错误',
      details: 'backend unavailable',
      status: 500,
    })
  })
})
