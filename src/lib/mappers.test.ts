import { describe, expect, it } from 'vitest'
import type { CandidateSearchDataDTO, FilterSearchDataDTO, HealthDataDTO, JobSearchDataDTO } from '../types/api'
import {
  mapCandidateSearchDataDto,
  mapFilterSearchDataDto,
  mapHealthDataDto,
  mapJobSearchDataDto,
} from './mappers'

describe('mappers', () => {
  it('maps job DTO fields and search metadata to camelCase domain models', () => {
    const dto: JobSearchDataDTO = {
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
        keyword: 'Java 上海',
        filters: 'city-shanghai',
        sort_by: 'salary',
      },
      pagination: {
        page: 1,
        page_size: 50,
        total: 1,
        total_pages: 1,
      },
    }

    const result = mapJobSearchDataDto(dto)

    expect(result.items[0].filterTags).toEqual(['后端开发', '上海'])
    expect(result.items[0].detailBullets).toEqual(['技术栈：Spring Cloud、Redis'])
    expect(result.filtersApplied).toEqual({
      keyword: 'Java 上海',
      filters: 'city-shanghai',
      sortBy: 'salary',
    })
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 50,
      total: 1,
      totalPages: 1,
    })
  })

  it('maps candidate DTO fields to camelCase domain models', () => {
    const dto: CandidateSearchDataDTO = {
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
        page: 2,
        page_size: 20,
        total: 21,
        total_pages: 2,
      },
    }

    const result = mapCandidateSearchDataDto(dto)

    expect(result.items[0].filterTags).toEqual(['土建造价', '上海'])
    expect(result.items[0].targetRoles).toEqual(['土建造价师'])
    expect(result.pagination.pageSize).toBe(20)
    expect(result.pagination.totalPages).toBe(2)
  })

  it('maps filter and health DTO metadata to camelCase fields', () => {
    const filtersDto: FilterSearchDataDTO = {
      source: 'mock',
      job_filters: [{ id: 'salary-range', label: '薪资 30K-40K' }],
      talent_filters: [{ id: 'city-shanghai', label: '上海' }],
    }
    const healthDto: HealthDataDTO = {
      status: 'ok',
      service: 'personas-backend',
      version: '0.1.0',
      source: 'mock',
      mock_mode: true,
    }

    expect(mapFilterSearchDataDto(filtersDto)).toEqual({
      source: 'mock',
      jobFilters: [{ id: 'salary-range', label: '薪资 30K-40K' }],
      talentFilters: [{ id: 'city-shanghai', label: '上海' }],
    })
    expect(mapHealthDataDto(healthDto)).toEqual({
      status: 'ok',
      service: 'personas-backend',
      version: '0.1.0',
      source: 'mock',
      mockMode: true,
    })
  })
})
