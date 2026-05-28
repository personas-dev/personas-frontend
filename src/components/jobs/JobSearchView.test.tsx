import { ConfigProvider, App as AntdApp } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { JobSearchView } from './JobSearchView'
import { server } from '../../test/server'
import {
	TEST_API_PREFIX,
	createFilterPayload,
	createJobDto,
	createJobSearchPayload,
	defaultJobDtos,
} from '../../test/handlers'

function renderJobSearchView() {
	return render(
		<StyleProvider layer>
			<ConfigProvider>
				<AntdApp message={{ maxCount: 3 }} notification={{ placement: 'topRight' }}>
					<JobSearchView />
				</AntdApp>
			</ConfigProvider>
		</StyleProvider>,
	)
}

describe('JobSearchView', () => {
	it('renders initial remote filters and jobs', async () => {
		renderJobSearchView()

		expect(await screen.findByTestId('job-card-101')).toHaveTextContent('远程 Java 平台工程师')
		expect(screen.getByText('SaaS 后端研发工程师')).toBeInTheDocument()
		expect(screen.getByText('共找到 2 个匹配岗位')).toBeInTheDocument()
		expect(screen.getByTestId('job-filter-chip-industry-ai-saas')).toBeInTheDocument()
		expect(screen.getByTestId('job-detail-panel')).toHaveTextContent('远程 Java 平台工程师')
	})

	it('requests remote jobs with the selected filter and renders updated result', async () => {
		let observedFilters = ''
		server.use(
			http.get(`${TEST_API_PREFIX}/jobs/search`, ({ request }) => {
				const url = new URL(request.url)
				observedFilters = url.searchParams.get('filters') ?? ''

				if (observedFilters === 'industry-ai-saas') {
					return HttpResponse.json(createJobSearchPayload([
						createJobDto({
							id: 201,
							title: 'AI SaaS 推荐工程师',
							company: '棱镜智能',
							filterTags: ['AI / SaaS'],
							keywords: ['ai', 'saas'],
						}),
					]))
				}

				return HttpResponse.json(createJobSearchPayload(defaultJobDtos))
			}),
		)

		renderJobSearchView()

		await screen.findAllByText('远程 Java 平台工程师')
		await userEvent.click(screen.getByTestId('job-filter-chip-industry-ai-saas'))

		expect(await screen.findByTestId('job-card-201')).toHaveTextContent('AI SaaS 推荐工程师')
		expect(screen.queryByTestId('job-card-101')).not.toBeInTheDocument()
		expect(screen.getByText('共找到 1 个匹配岗位')).toBeInTheDocument()
		expect(observedFilters).toBe('industry-ai-saas')
	})

	it('shows backend error without local fallback and retries successfully', async () => {
		let searchCalls = 0
		server.use(
			http.get(`${TEST_API_PREFIX}/jobs/search`, () => {
				searchCalls += 1

				if (searchCalls === 1) {
					return HttpResponse.json(
						{ code: 50001, message: '后端推荐服务不可用', details: 'service unavailable' },
						{ status: 500 },
					)
				}

				return HttpResponse.json(createJobSearchPayload([
					createJobDto({ id: 301, title: '重试恢复岗位', company: '恢复科技' }),
				]))
			}),
			http.get(`${TEST_API_PREFIX}/filters`, () => {
				return HttpResponse.json(createFilterPayload())
			}),
		)

		renderJobSearchView()

		expect(await screen.findByTestId('job-search-error')).toHaveTextContent('后端推荐服务不可用')
		expect(screen.queryByText('远程 Java 平台工程师')).not.toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: /重\s*试/ }))

		expect(await screen.findByTestId('job-card-301')).toHaveTextContent('重试恢复岗位')
		expect(screen.queryByTestId('job-search-error')).not.toBeInTheDocument()
	})

	it('keeps favorite and application local state after remote render', async () => {
		renderJobSearchView()

		await screen.findAllByText('远程 Java 平台工程师')
		const detailPanel = screen.getByTestId('job-detail-panel')

		await userEvent.click(within(detailPanel).getByTestId('favorite-job-button'))
		expect(within(detailPanel).getByTestId('favorite-job-button')).toHaveTextContent('已收藏')

		await userEvent.click(within(detailPanel).getByTestId('apply-job-button'))
		expect(within(detailPanel).getByTestId('apply-job-button')).toHaveTextContent('已模拟投递')
		expect(within(detailPanel).getByTestId('apply-job-button')).toBeDisabled()

		await waitFor(() => {
			expect(screen.getByText('已收藏职位')).toBeInTheDocument()
			expect(screen.getByText('已模拟提交申请')).toBeInTheDocument()
		})
	})

	it('submits search text, resets filters, and passes current context to assistant modal', async () => {
		let observedKeyword = ''
		let observedFilters = ''

		server.use(
			http.get(`${TEST_API_PREFIX}/jobs/search`, ({ request }) => {
				const url = new URL(request.url)
				observedKeyword = url.searchParams.get('keyword') ?? ''
				observedFilters = url.searchParams.get('filters') ?? ''

				if (observedKeyword === 'Java 上海') {
					return HttpResponse.json(createJobSearchPayload([
						createJobDto({ id: 402, title: '上海 Java 搜索结果', company: '检索科技' }),
					]))
				}

				if (observedFilters === 'salary-range') {
					return HttpResponse.json(createJobSearchPayload([
						createJobDto({ id: 401, title: '薪资优先 Java 工程师', company: '薪图科技' }),
					]))
				}

				return HttpResponse.json(createJobSearchPayload(defaultJobDtos))
			}),
		)

		renderJobSearchView()

		await screen.findAllByText('远程 Java 平台工程师')
		await userEvent.click(screen.getByTestId('job-filter-chip-salary-range'))
		expect(await screen.findByTestId('job-card-401')).toHaveTextContent('薪资优先 Java 工程师')
		expect(observedFilters).toBe('salary-range')

		await userEvent.clear(screen.getByRole('searchbox'))
		await userEvent.type(screen.getByRole('searchbox'), 'Java 上海')
		await userEvent.click(screen.getByRole('button', { name: /搜\s*索/ }))
		expect(await screen.findByTestId('job-card-402')).toHaveTextContent('上海 Java 搜索结果')
		expect(observedKeyword).toBe('Java 上海')

		await userEvent.click(screen.getByTestId('job-reset-filters-button'))
		expect(await screen.findByTestId('job-card-101')).toHaveTextContent('远程 Java 平台工程师')
		expect(screen.getByRole('searchbox')).toHaveValue('')
		expect(observedFilters).toBe('')

		await userEvent.click(screen.getByTestId('job-card-101'))
		await userEvent.click(screen.getByTestId('open-assistant-modal-button'))

		const assistantContext = await screen.findByTestId('assistant-context')
		expect(assistantContext).toHaveAttribute('data-search-keyword', '')
		expect(assistantContext).toHaveAttribute('data-active-filter-ids', '')
		expect(assistantContext).toHaveAttribute('data-selected-id', '101')
		expect(assistantContext).toHaveAttribute('data-total', '2')
	})
})
