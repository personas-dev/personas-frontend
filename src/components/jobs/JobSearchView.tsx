import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, App, Button, Empty, Spin } from 'antd'
import { ApiError, getFilters, getJobsSearch } from '../../lib/api'
import type { AssistantMessage, Job, SearchFilter } from '../../types/domain'
import { SearchToolbar } from '../search/SearchToolbar'
import { JobCard } from './JobCard'
import { JobDetailPanel } from './JobDetailPanel'
import { AssistantModal } from '../assistant/AssistantModal'

const JOB_SEARCH_PAGE_SIZE = 50

const jobAssistantInitialMessages: AssistantMessage[] = [
	{ id: 1, from: 'assistant', text: '为了更精准推荐，请补充期望薪资和行业偏好。', time: '10:21' },
	{ id: 2, from: 'user', text: '30K-40K，偏好 AI 或 SaaS。', time: '10:21' },
	{ id: 3, from: 'assistant', text: '是否接受混合办公？', time: '10:21' },
	{ id: 4, from: 'user', text: '可以。', time: '10:22' },
]

interface LoadJobSearchOptions {
	query: string
	activeFilterIds: string[]
	refreshFilters: boolean
}

function getErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		return error.message
	}

	if (error instanceof Error && error.message.trim() !== '') {
		return error.message
	}

	return '岗位推荐接口暂时不可用'
}

function getNextTargetJobId(nextJobs: Job[], currentTargetJobId: number | null): number | null {
	if (nextJobs.length === 0) {
		return null
	}

	if (currentTargetJobId !== null && nextJobs.some((job) => job.id === currentTargetJobId)) {
		return currentTargetJobId
	}

	return nextJobs[0].id
}

export function JobSearchView() {
	const [query, setQuery] = useState('')
	const [activeFilterIds, setActiveFilterIds] = useState<string[]>([])
	const [targetJobId, setTargetJobId] = useState<number | null>(null)
	const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([])
	const [jobResults, setJobResults] = useState<Job[]>([])
	const [resultTotal, setResultTotal] = useState(0)
	const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const requestSequenceRef = useRef(0)

	const [favoriteJobIds, setFavoriteJobIds] = useState<number[]>([])
	const [appliedJobIds, setAppliedJobIds] = useState<number[]>([])
	const [assistantOpen, setAssistantOpen] = useState(false)

	const { message } = App.useApp()

	const loadRemoteJobs = useCallback(async ({
		query: nextQuery,
		activeFilterIds: nextFilterIds,
		refreshFilters,
	}: LoadJobSearchOptions) => {
		const requestId = requestSequenceRef.current + 1
		requestSequenceRef.current = requestId

		setIsLoading(true)
		setErrorMessage(null)

		try {
			const jobsRequest = getJobsSearch({
				keyword: nextQuery,
				page: 1,
				pageSize: JOB_SEARCH_PAGE_SIZE,
				filters: nextFilterIds,
			})

			if (refreshFilters) {
				const [filterResult, jobResult] = await Promise.all([
					getFilters({ type: 'job' }),
					jobsRequest,
				])

				if (requestSequenceRef.current !== requestId) {
					return
				}

				setSearchFilters(filterResult.jobFilters)
				setJobResults(jobResult.items)
				setResultTotal(jobResult.pagination.total)
				setTargetJobId((current) => getNextTargetJobId(jobResult.items, current))
			} else {
				const jobResult = await jobsRequest

				if (requestSequenceRef.current !== requestId) {
					return
				}

				setJobResults(jobResult.items)
				setResultTotal(jobResult.pagination.total)
				setTargetJobId((current) => getNextTargetJobId(jobResult.items, current))
			}
		} catch (error) {
			if (requestSequenceRef.current !== requestId) {
				return
			}

			setJobResults([])
			setResultTotal(0)
			setTargetJobId(null)
			setErrorMessage(getErrorMessage(error))
		} finally {
			if (requestSequenceRef.current === requestId) {
				setIsLoading(false)
			}
		}
	}, [])

	useEffect(() => {
		queueMicrotask(() => {
			void loadRemoteJobs({ query: '', activeFilterIds: [], refreshFilters: true })
		})

		return () => {
			requestSequenceRef.current += 1
		}
	}, [loadRemoteJobs])

	const highMatchCount = useMemo(() => {
		return jobResults.reduce((count, job) => count + (job.level === '高匹配' ? 1 : 0), 0)
	}, [jobResults])

	const selectedJob = useMemo(() => {
		return jobResults.find((job) => job.id === targetJobId) ?? null
	}, [jobResults, targetJobId])

	const assistantStats = useMemo(() => {
		return { total: resultTotal, high: highMatchCount }
	}, [highMatchCount, resultTotal])

	function handleToggleFavorite(jobId: number) {
		const isFavorited = favoriteJobIds.includes(jobId)

		setFavoriteJobIds((prev) => (isFavorited ? prev.filter((id) => id !== jobId) : [...prev, jobId]))
		message.success(isFavorited ? '已取消收藏' : '已收藏职位')
	}

	function handleApply(jobId: number) {
		if (appliedJobIds.includes(jobId)) return
		setAppliedJobIds((prev) => [...prev, jobId])
		message.success('已模拟提交申请')
	}

	function handleSearch() {
		void loadRemoteJobs({
			query,
			activeFilterIds,
			refreshFilters: searchFilters.length === 0,
		})
	}

	function handleToggleFilter(filterId: string) {
		const nextFilterIds = activeFilterIds.includes(filterId)
			? activeFilterIds.filter((id) => id !== filterId)
			: [...activeFilterIds, filterId]

		setActiveFilterIds(nextFilterIds)
		void loadRemoteJobs({
			query,
			activeFilterIds: nextFilterIds,
			refreshFilters: searchFilters.length === 0,
		})
	}

	function handleReset() {
		setQuery('')
		setActiveFilterIds([])
		void loadRemoteJobs({ query: '', activeFilterIds: [], refreshFilters: searchFilters.length === 0 })
	}

	function handleRetry() {
		void loadRemoteJobs({ query, activeFilterIds, refreshFilters: true })
	}

	function handleOpenAssistant() {
		setAssistantOpen(true)
	}

	return (
		<main className="flex-1 max-w-content-max w-full mx-auto px-4 py-6 flex gap-6">
			<div className="flex-1 flex flex-col gap-4">
				<SearchToolbar
					testIdPrefix="job"
					placeholder="5年 Java后端开发｜上海｜本科"
					query={query}
					filters={searchFilters}
					activeFilterIds={activeFilterIds}
					onQueryChange={setQuery}
					onSearch={handleSearch}
					onToggleFilter={handleToggleFilter}
					onReset={handleReset}
				/>

				<div className="flex justify-between items-end mt-2">
					<div>
						<p className="text-sm text-blue-600 font-medium mb-1">人找岗模块</p>
						<h2 className="text-2xl font-bold text-slate-800">
							共找到 {resultTotal} 个匹配岗位
						</h2>
					</div>
				</div>

				{errorMessage !== null && (
					<Alert
						data-testid="job-search-error"
						type="error"
						showIcon
						title="岗位数据加载失败"
						description={errorMessage}
						action={<Button onClick={handleRetry}>重试</Button>}
					/>
				)}

				{isLoading ? (
					<div data-testid="job-search-loading" className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 flex items-center justify-center">
						<Spin description="正在从后端加载岗位推荐" />
					</div>
				) : errorMessage !== null ? null : jobResults.length === 0 ? (
					<div className="flex items-center justify-center py-20">
						<Empty data-testid="job-search-empty" description="暂无匹配结果" />
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{jobResults.map((job) => (
							<JobCard
								key={job.id}
								job={job}
								active={selectedJob !== null && job.id === selectedJob.id}
								onSelect={() => setTargetJobId(job.id)}
							/>
						))}
					</div>
				)}
			</div>

			<div className="w-80 shrink-0">
				<JobDetailPanel
					job={selectedJob}
					isFavorited={selectedJob ? favoriteJobIds.includes(selectedJob.id) : false}
					isApplied={selectedJob ? appliedJobIds.includes(selectedJob.id) : false}
					onToggleFavorite={handleToggleFavorite}
					onApply={handleApply}
					onOpenAssistant={handleOpenAssistant}
				/>
			</div>

			<AssistantModal
				open={assistantOpen}
				mode="job"
				contextTitle={selectedJob?.title ?? ''}
				contextStats={assistantStats}
				context={{
					searchKeyword: query,
					activeFilterIds,
					selectedId: selectedJob?.id ?? null,
					stats: assistantStats,
				}}
				initialMessages={jobAssistantInitialMessages}
				onClose={() => setAssistantOpen(false)}
			/>
		</main>
	)
}
