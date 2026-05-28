import { http, HttpResponse, type RequestHandler } from 'msw'
import type {
	ApiResponseDTO,
	CandidateDTO,
	CandidateSearchDataDTO,
	FilterSearchDataDTO,
	JobDTO,
	JobSearchDataDTO,
} from '../types/api'

export const TEST_API_PREFIX = 'http://localhost:8000/api/v1'

export const defaultJobFilters = [
	{ id: 'salary-range', label: '薪资 30K-40K' },
	{ id: 'industry-ai-saas', label: 'AI / SaaS' },
	{ id: 'full-time', label: '全职' },
]

export const defaultTalentFilters = [
	{ id: 'city-shanghai', label: '上海' },
	{ id: 'experience-5plus', label: '5年以上经验' },
	{ id: 'cost-software', label: '熟练使用广联达' },
]

export const defaultJobDtos: JobDTO[] = [
	createJobDto({
		id: 101,
		title: '远程 Java 平台工程师',
		company: '云帆科技',
		match: 94,
		level: '高匹配',
		filterTags: ['后端开发', '远程', 'AI / SaaS'],
		keywords: ['java', '平台工程师', '远程'],
	}),
	createJobDto({
		id: 102,
		title: 'SaaS 后端研发工程师',
		company: '星河数据',
		match: 86,
		level: '优先推荐',
		filterTags: ['后端开发', '上海', 'AI / SaaS'],
		keywords: ['saas', '后端', '上海'],
	}),
]

export const defaultCandidateDtos: CandidateDTO[] = [
	createCandidateDto({
		id: 501,
		name: '远程土建候选人',
		current: '华东建设咨询（造价工程师）',
		match: 93,
		filterTags: ['土建造价', '上海', '5年以上经验'],
		keywords: ['土建造价师', '广联达', '上海'],
		targetRoles: ['土建造价师'],
	}),
	createCandidateDto({
		id: 502,
		name: '成本管理候选人',
		gender: '女',
		current: '星河地产成本部',
		match: 88,
		filterTags: ['成本管理', '上海'],
		keywords: ['成本主管', '招投标'],
		targetRoles: ['成本主管'],
	}),
]

interface CreateJobDtoOptions {
	id: number
	title: string
	company: string
	match?: number
	level?: string
	filterTags?: string[]
	keywords?: string[]
}

interface CreateCandidateDtoOptions {
	id: number
	name: string
	gender?: string
	age?: number
	degree?: string
	years?: number
	current?: string
	salary?: string
	match?: number
	tags?: string[]
	reason?: string
	avatar?: string
	filterTags?: string[]
	keywords?: string[]
	targetRoles?: string[]
	city?: string
}

export function createJobDto({
	id,
	title,
	company,
	match = 90,
	level = '高匹配',
	filterTags = ['后端开发'],
	keywords = ['后端开发'],
}: CreateJobDtoOptions): JobDTO {
	return {
		id,
		title,
		company,
		category: '后端开发',
		salary: '30K-40K',
		city: '上海',
		district: '徐汇区',
		education: '本科及以上',
		experience: '5-10 年',
		match,
		level,
		highlight: '远程优先',
		duty: '负责推荐系统后端服务开发与接口稳定性建设。',
		filter_tags: filterTags,
		keywords,
		detail_bullets: ['技术栈：Java、Spring Boot、Redis'],
	}
}

export function createJobSearchPayload(items: JobDTO[]): ApiResponseDTO<JobSearchDataDTO> {
	return {
		code: 0,
		message: 'ok',
		data: {
			source: 'mock',
			items,
			filters_applied: {},
			pagination: {
				page: 1,
				page_size: 50,
				total: items.length,
				total_pages: items.length > 0 ? 1 : 0,
			},
		},
	}
}

export function createCandidateDto({
	id,
	name,
	gender = '男',
	age = 31,
	degree = '本科',
	years = 7,
	current = '中建三局（造价工程师）',
	salary = '18K-24K',
	match = 90,
	tags = ['经验吻合', '稳定性较高'],
	reason = '候选人具备完整项目造价经验，技能标签与当前岗位要求一致。',
	avatar,
	filterTags = ['土建造价', '上海'],
	keywords = ['造价工程师'],
	targetRoles = ['土建造价师'],
	city = '上海',
}: CreateCandidateDtoOptions): CandidateDTO {
	return {
		id,
		name,
		gender,
		age,
		degree,
		years,
		current,
		salary,
		match,
		tags,
		reason,
		avatar: avatar ?? name.slice(0, 1),
		filter_tags: filterTags,
		keywords,
		target_roles: targetRoles,
		city,
	}
}

export function createCandidateSearchPayload(items: CandidateDTO[]): ApiResponseDTO<CandidateSearchDataDTO> {
	return {
		code: 0,
		message: 'ok',
		data: {
			source: 'mock',
			items,
			filters_applied: {},
			pagination: {
				page: 1,
				page_size: 50,
				total: items.length,
				total_pages: items.length > 0 ? 1 : 0,
			},
		},
	}
}

export function createFilterPayload(): ApiResponseDTO<FilterSearchDataDTO> {
	return {
		code: 0,
		message: 'ok',
		data: {
			source: 'mock',
			job_filters: defaultJobFilters,
			talent_filters: defaultTalentFilters,
		},
	}
}

export const handlers: RequestHandler[] = [
	http.get(`${TEST_API_PREFIX}/jobs/search`, () => {
		return HttpResponse.json(createJobSearchPayload(defaultJobDtos))
	}),
	http.get(`${TEST_API_PREFIX}/candidates/search`, () => {
		return HttpResponse.json(createCandidateSearchPayload(defaultCandidateDtos))
	}),
	http.get(`${TEST_API_PREFIX}/filters`, () => {
		return HttpResponse.json(createFilterPayload())
	}),
]
