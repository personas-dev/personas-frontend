import { useMemo, useState } from 'react'
import { Empty, App } from 'antd'
import { jobs } from '../../mocks/jobs'
import { jobFilters } from '../../mocks/filters'
import { jobAssistantMessages } from '../../mocks/assistant'
import { matchesQuery, matchesActiveFilters } from '../../lib/filtering'
import { SearchToolbar } from '../search/SearchToolbar'
import { JobCard } from './JobCard'
import { JobDetailPanel } from './JobDetailPanel'
import { AssistantModal } from '../assistant/AssistantModal'

export function JobSearchView() {
	const [query, setQuery] = useState('')
	const [activeFilterIds, setActiveFilterIds] = useState<string[]>([])
	const [targetJobId, setTargetJobId] = useState<number>(jobs[0].id)

	const [favoriteJobIds, setFavoriteJobIds] = useState<number[]>([])
	const [appliedJobIds, setAppliedJobIds] = useState<number[]>([])

	const [assistantOpen, setAssistantOpen] = useState(false)

	const { message } = App.useApp()

	const filteredJobs = useMemo(() => {
		return jobs.filter((job) => {
			const searchText = job.keywords.join(' ')
			if (!matchesQuery(searchText, query)) return false
			if (!matchesActiveFilters(job.filterTags, activeFilterIds, jobFilters)) return false
			return true
		})
	}, [query, activeFilterIds])

	const highMatchCount = useMemo(() => {
		return filteredJobs.filter(job => job.level === '高匹配').length
	}, [filteredJobs])

	const selectedJobId = useMemo(() => {
		if (filteredJobs.length === 0) return null
		if (filteredJobs.find((j) => j.id === targetJobId)) return targetJobId
		return filteredJobs[0].id
	}, [filteredJobs, targetJobId])

	const selectedJob = useMemo(
		() => filteredJobs.find((job) => job.id === selectedJobId) ?? null,
		[filteredJobs, selectedJobId]
	)

	function handleToggleFavorite(jobId: number) {
		setFavoriteJobIds((prev) => {
			if (prev.includes(jobId)) {
				message.success('已取消收藏')
				return prev.filter((id) => id !== jobId)
			} else {
				message.success('已收藏职位')
				return [...prev, jobId]
			}
		})
	}

	function handleApply(jobId: number) {
		if (appliedJobIds.includes(jobId)) return
		setAppliedJobIds((prev) => [...prev, jobId])
		message.success('已模拟提交申请')
	}

	function handleSearch() {
	}

	function handleToggleFilter(filterId: string) {
		setActiveFilterIds((prev) =>
			prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
		)
	}

	function handleReset() {
		setQuery('')
		setActiveFilterIds([])
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
					filters={jobFilters}
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
							共找到 {filteredJobs.length} 个匹配岗位
						</h2>
					</div>
				</div>

				{filteredJobs.length === 0 ? (
					<div className="flex items-center justify-center py-20">
						<Empty description="暂无匹配结果" />
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{filteredJobs.map((job) => (
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
				contextStats={{ total: filteredJobs.length, high: highMatchCount }}
				initialMessages={jobAssistantMessages}
				onClose={() => setAssistantOpen(false)}
			/>
		</main>
	)
}
