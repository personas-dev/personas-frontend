import { ConfigProvider, App as AntdApp } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { TalentSearchView } from './TalentSearchView'
import { server } from '../../test/server'
import {
	TEST_API_PREFIX,
	createCandidateDto,
	createCandidateSearchPayload,
	createFilterPayload,
	defaultCandidateDtos,
} from '../../test/handlers'

function renderTalentSearchView() {
	return render(
		<StyleProvider layer>
			<ConfigProvider>
				<AntdApp message={{ maxCount: 3 }} notification={{ placement: 'topRight' }}>
					<TalentSearchView />
				</AntdApp>
			</ConfigProvider>
		</StyleProvider>,
	)
}

describe('TalentSearchView', () => {
	it('renders initial remote filters and candidates with page parameters', async () => {
		let observedCandidateQueryEntries: [string, string][] = []
		let observedFilterType = ''

		server.use(
			http.get(`${TEST_API_PREFIX}/candidates/search`, ({ request }) => {
				const url = new URL(request.url)
				observedCandidateQueryEntries = Array.from(url.searchParams.entries())

				return HttpResponse.json(createCandidateSearchPayload(defaultCandidateDtos))
			}),
			http.get(`${TEST_API_PREFIX}/filters`, ({ request }) => {
				const url = new URL(request.url)
				observedFilterType = url.searchParams.get('type') ?? ''

				return HttpResponse.json(createFilterPayload())
			}),
		)

		renderTalentSearchView()

		expect(await screen.findByTestId('candidate-card-501')).toHaveTextContent('远程土建候选人')
		expect(screen.getByText('成本管理候选人')).toBeInTheDocument()
		expect(screen.getByText('共找到 2 位匹配人才')).toBeInTheDocument()
		expect(screen.getByTestId('talent-filter-chip-city-shanghai')).toBeInTheDocument()
		expect(screen.getByTestId('candidate-detail-panel')).toHaveTextContent('远程土建候选人')
		expect(observedFilterType).toBe('candidate')
		expect(observedCandidateQueryEntries).toEqual([
			['keyword', '土建造价师'],
			['page', '1'],
			['page_size', '50'],
		])
	})

	it('requests candidates with selected position keyword when position changes', async () => {
		let observedKeyword = ''

		server.use(
			http.get(`${TEST_API_PREFIX}/candidates/search`, ({ request }) => {
				const url = new URL(request.url)
				observedKeyword = url.searchParams.get('keyword') ?? ''

				if (observedKeyword.includes('安装造价师')) {
					return HttpResponse.json(createCandidateSearchPayload([
						createCandidateDto({
							id: 601,
							name: '安装造价候选人',
							current: '机电安装咨询公司',
							targetRoles: ['安装造价师'],
							keywords: ['安装造价师', '机电安装'],
						}),
					]))
				}

				return HttpResponse.json(createCandidateSearchPayload(defaultCandidateDtos))
			}),
		)

		renderTalentSearchView()

		await screen.findByTestId('candidate-card-501')
		await userEvent.click(screen.getByTestId('position-option-安装造价师'))

		expect(await screen.findByTestId('candidate-card-601')).toHaveTextContent('安装造价候选人')
		expect(observedKeyword).toContain('安装造价师')
		expect(screen.queryByTestId('candidate-card-501')).not.toBeInTheDocument()
	})

	it('combines selected position and typed query for search keyword', async () => {
		let observedKeyword = ''

		server.use(
			http.get(`${TEST_API_PREFIX}/candidates/search`, ({ request }) => {
				const url = new URL(request.url)
				observedKeyword = url.searchParams.get('keyword') ?? ''

				if (observedKeyword === '安装造价师 广联达 8年') {
					return HttpResponse.json(createCandidateSearchPayload([
						createCandidateDto({
							id: 602,
							name: '广联达安装造价专家',
							current: '华南机电造价咨询',
							targetRoles: ['安装造价师'],
							keywords: ['安装造价师', '广联达', '8年'],
						}),
					]))
				}

				if (observedKeyword.includes('安装造价师')) {
					return HttpResponse.json(createCandidateSearchPayload([
						createCandidateDto({ id: 601, name: '安装造价候选人', targetRoles: ['安装造价师'] }),
					]))
				}

				return HttpResponse.json(createCandidateSearchPayload(defaultCandidateDtos))
			}),
		)

		renderTalentSearchView()

		await screen.findByTestId('candidate-card-501')
		await userEvent.click(screen.getByTestId('position-option-安装造价师'))
		await screen.findByTestId('candidate-card-601')
		await userEvent.type(screen.getByRole('searchbox'), '广联达 8年')
		await userEvent.click(screen.getByRole('button', { name: /搜\s*索/ }))

		expect(await screen.findByTestId('candidate-card-602')).toHaveTextContent('广联达安装造价专家')
		expect(observedKeyword).toBe('安装造价师 广联达 8年')
	})

	it('sends filter query parameter and reset clears query and filters', async () => {
		let observedKeyword = ''
		let observedFilters = 'not-called'

		server.use(
			http.get(`${TEST_API_PREFIX}/candidates/search`, ({ request }) => {
				const url = new URL(request.url)
				observedKeyword = url.searchParams.get('keyword') ?? ''
				observedFilters = url.searchParams.get('filters') ?? ''

				if (observedFilters === 'city-shanghai') {
					return HttpResponse.json(createCandidateSearchPayload([
						createCandidateDto({ id: 603, name: '上海筛选候选人', filterTags: ['上海'] }),
					]))
				}

				return HttpResponse.json(createCandidateSearchPayload(defaultCandidateDtos))
			}),
		)

		renderTalentSearchView()

		await screen.findByTestId('candidate-card-501')
		await userEvent.type(screen.getByRole('searchbox'), '稳定')
		await userEvent.click(screen.getByTestId('talent-filter-chip-city-shanghai'))

		expect(await screen.findByTestId('candidate-card-603')).toHaveTextContent('上海筛选候选人')
		expect(observedKeyword).toBe('土建造价师 稳定')
		expect(observedFilters).toBe('city-shanghai')

		await userEvent.click(screen.getByTestId('talent-reset-filters-button'))

		expect(await screen.findByTestId('candidate-card-501')).toHaveTextContent('远程土建候选人')
		expect(screen.getByRole('searchbox')).toHaveValue('')
		expect(observedKeyword).toBe('土建造价师')
		expect(observedFilters).toBe('')
	})

	it('shows loading then empty state when backend returns no candidates', async () => {
		server.use(
			http.get(`${TEST_API_PREFIX}/candidates/search`, async () => {
				await new Promise((resolve) => setTimeout(resolve, 30))

				return HttpResponse.json(createCandidateSearchPayload([]))
			}),
		)

		renderTalentSearchView()

		expect(await screen.findByTestId('talent-search-loading')).toBeInTheDocument()
		expect(await screen.findByTestId('talent-search-empty')).toHaveTextContent('暂无匹配结果')
		expect(screen.getByText('共找到 0 位匹配人才')).toBeInTheDocument()
	})

	it('shows backend error without local fallback and retries successfully', async () => {
		let searchCalls = 0

		server.use(
			http.get(`${TEST_API_PREFIX}/candidates/search`, () => {
				searchCalls += 1

				if (searchCalls === 1) {
					return HttpResponse.json(
						{ code: 50001, message: '候选人推荐服务不可用', details: 'service unavailable' },
						{ status: 500 },
					)
				}

				return HttpResponse.json(createCandidateSearchPayload([
					createCandidateDto({ id: 604, name: '重试恢复候选人' }),
				]))
			}),
			http.get(`${TEST_API_PREFIX}/filters`, () => {
				return HttpResponse.json(createFilterPayload())
			}),
		)

		renderTalentSearchView()

		expect(await screen.findByTestId('talent-search-error')).toHaveTextContent('候选人推荐服务不可用')
		expect(screen.queryByRole('option')).not.toBeInTheDocument()
		expect(screen.queryByText('远程土建候选人')).not.toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: /重\s*试/ }))

		expect(await screen.findByTestId('candidate-card-604')).toHaveTextContent('重试恢复候选人')
		expect(screen.queryByTestId('talent-search-error')).not.toBeInTheDocument()
	})

	it('keeps invitation local state after remote render', async () => {
		renderTalentSearchView()

		await screen.findByTestId('candidate-card-501')
		const detailPanel = screen.getByTestId('candidate-detail-panel')

		await userEvent.click(within(detailPanel).getByTestId('invite-candidate-button'))
		expect(within(detailPanel).getByTestId('invite-candidate-button')).toHaveTextContent('已模拟邀约')
		expect(within(detailPanel).getByTestId('invite-candidate-button')).toBeDisabled()

		await waitFor(() => {
			expect(screen.getByText('已模拟发送邀约')).toBeInTheDocument()
		})
	})
})
