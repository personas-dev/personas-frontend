import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, App, Button, Empty, Spin } from 'antd'
import { ApiError, getCandidatesSearch, getFilters } from '../../lib/api'
import type { AssistantMessage, Candidate, SearchFilter } from '../../types/domain'
import { SearchToolbar } from '../search/SearchToolbar'
import { PositionSidebar } from './PositionSidebar'
import { CandidateCard } from './CandidateCard'
import { CandidateDetailPanel } from './CandidateDetailPanel'
import { AssistantModal } from '../assistant/AssistantModal'

const TALENT_SEARCH_PAGE_SIZE = 50
const talentPositions = ['土建造价师', '安装造价师', '成本主管', 'BIM造价工程师', '造价工程师（市政）']

const talentAssistantInitialMessages: AssistantMessage[] = [
	{ id: 1, from: 'assistant', text: '请补充岗位技能、项目类型或到岗时间，我会继续优化候选人推荐。', time: '10:21' },
	{ id: 2, from: 'user', text: '优先关注造价经验和稳定性。', time: '10:21' },
	{ id: 3, from: 'assistant', text: '已记录偏好，将结合当前岗位与筛选条件分析候选人。', time: '10:22' },
]

interface LoadTalentSearchOptions {
	query: string
	activeFilterIds: string[]
	selectedPos: string
	refreshFilters: boolean
}

function buildTalentKeyword(selectedPos: string, query: string): string {
	return `${selectedPos} ${query}`.trim()
}

function getErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		return error.message
	}

	if (error instanceof Error && error.message.trim() !== '') {
		return error.message
	}

	return '人才推荐暂时不可用'
}

function getNextCandidateId(nextCandidates: Candidate[], currentCandidateId: number | null): number | null {
	if (nextCandidates.length === 0) {
		return null
	}

	if (currentCandidateId !== null && nextCandidates.some((candidate) => candidate.id === currentCandidateId)) {
		return currentCandidateId
	}

	return nextCandidates[0].id
}

export function TalentSearchView() {
	const [selectedPos, setSelectedPos] = useState(talentPositions[0])
	const [query, setQuery] = useState('')
	const [activeFilterIds, setActiveFilterIds] = useState<string[]>([])
	const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null)
	const [searchFilters, setSearchFilters] = useState<SearchFilter[]>([])
	const [candidateResults, setCandidateResults] = useState<Candidate[]>([])
	const [resultTotal, setResultTotal] = useState(0)
	const [isLoading, setIsLoading] = useState(false)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const requestSequenceRef = useRef(0)

	const [invitedCandidateIds, setInvitedCandidateIds] = useState<number[]>([])
	const [assistantOpen, setAssistantOpen] = useState(false)

	const { message } = App.useApp()

	const loadRemoteCandidates = useCallback(async ({
		query: nextQuery,
		activeFilterIds: nextFilterIds,
		selectedPos: nextSelectedPos,
		refreshFilters,
	}: LoadTalentSearchOptions) => {
		// 生成单调递增的请求编号，避免较早响应覆盖最新搜索结果。
		const requestId = requestSequenceRef.current + 1
		requestSequenceRef.current = requestId

		setIsLoading(true)
		setErrorMessage(null)

		try {
			const keyword = buildTalentKeyword(nextSelectedPos, nextQuery)
			const candidatesRequest = getCandidatesSearch({
				keyword,
				page: 1,
				pageSize: TALENT_SEARCH_PAGE_SIZE,
				filters: nextFilterIds,
			})

			if (refreshFilters) {
				const [filterResult, candidateResult] = await Promise.all([
					getFilters({ type: 'candidate' }),
					candidatesRequest,
				])

				if (requestSequenceRef.current !== requestId) {
					return
				}

				setSearchFilters(filterResult.talentFilters)
				setCandidateResults(candidateResult.items)
				setResultTotal(candidateResult.pagination.total)
				setSelectedCandidateId((current) => getNextCandidateId(candidateResult.items, current))
			} else {
				const candidateResult = await candidatesRequest

				if (requestSequenceRef.current !== requestId) {
					return
				}

				setCandidateResults(candidateResult.items)
				setResultTotal(candidateResult.pagination.total)
				setSelectedCandidateId((current) => getNextCandidateId(candidateResult.items, current))
			}
		} catch (error) {
			if (requestSequenceRef.current !== requestId) {
				return
			}

			setCandidateResults([])
			setResultTotal(0)
			setSelectedCandidateId(null)
			setErrorMessage(getErrorMessage(error))
		} finally {
			if (requestSequenceRef.current === requestId) {
				setIsLoading(false)
			}
		}
	}, [])

	useEffect(() => {
		queueMicrotask(() => {
			void loadRemoteCandidates({
				query: '',
				activeFilterIds: [],
				selectedPos: talentPositions[0],
				refreshFilters: true,
			})
		})

		return () => {
			requestSequenceRef.current += 1
		}
	}, [loadRemoteCandidates])

	const highMatchCount = useMemo(() => {
		return candidateResults.reduce((count, candidate) => count + (candidate.match >= 90 ? 1 : 0), 0)
	}, [candidateResults])

	const selectedCandidate = useMemo(() => {
		return candidateResults.find((candidate) => candidate.id === selectedCandidateId) ?? null
	}, [candidateResults, selectedCandidateId])

	const assistantStats = useMemo(() => {
		return { total: resultTotal, high: highMatchCount }
	}, [highMatchCount, resultTotal])

	const effectiveKeyword = useMemo(() => {
		return buildTalentKeyword(selectedPos, query)
	}, [query, selectedPos])

	function handleSearch() {
		void loadRemoteCandidates({
			query,
			activeFilterIds,
			selectedPos,
			refreshFilters: searchFilters.length === 0,
		})
	}

	function handleToggleFilter(filterId: string) {
		const nextFilterIds = activeFilterIds.includes(filterId)
			? activeFilterIds.filter((id) => id !== filterId)
			: [...activeFilterIds, filterId]

		setActiveFilterIds(nextFilterIds)
		void loadRemoteCandidates({
			query,
			activeFilterIds: nextFilterIds,
			selectedPos,
			refreshFilters: searchFilters.length === 0,
		})
	}

	function handleReset() {
		setQuery('')
		setActiveFilterIds([])
		void loadRemoteCandidates({
			query: '',
			activeFilterIds: [],
			selectedPos,
			refreshFilters: searchFilters.length === 0,
		})
	}

	function handlePositionSelect(pos: string) {
		if (pos !== selectedPos) {
			setQuery('')
			setActiveFilterIds([])
			setSelectedCandidateId(null)
			setSelectedPos(pos)
			void loadRemoteCandidates({
				query: '',
				activeFilterIds: [],
				selectedPos: pos,
				refreshFilters: searchFilters.length === 0,
			})
		}
	}

	function handleRetry() {
		void loadRemoteCandidates({
			query,
			activeFilterIds,
			selectedPos,
			refreshFilters: true,
		})
	}

	function handleSelectCandidate(candidateId: number) {
		setSelectedCandidateId(candidateId)
	}

	function handleInvite(candidateId: number) {
		if (invitedCandidateIds.includes(candidateId)) return
		setInvitedCandidateIds((prev) => [...prev, candidateId])
		message.success('已模拟发送邀约')
	}

	function handleOpenAssistant() {
		setAssistantOpen(true)
	}

	return (
		<main className="flex-1 max-w-content-max w-full mx-auto px-4 py-6 flex gap-6">
			<PositionSidebar positions={talentPositions} selected={selectedPos} onSelect={handlePositionSelect} />

			<div className="flex-1 flex flex-col gap-4">
				<SearchToolbar
					testIdPrefix="talent"
					placeholder="搜索相关人才（例如：5年经验，熟练使用广联达）"
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
						<p className="text-sm text-green-600 font-medium mb-1">岗找人模块</p>
						<h2 className="text-2xl font-bold text-slate-800">
							正在为「{selectedPos}」推荐人才
						</h2>
						<p className="text-sm text-slate-500 mt-1">共找到 {resultTotal} 位匹配人才</p>
					</div>
				</div>

				{errorMessage !== null && (
					<Alert
						data-testid="talent-search-error"
						type="error"
						showIcon
						title="人才数据加载失败"
						description={errorMessage}
						action={<Button onClick={handleRetry}>重试</Button>}
					/>
				)}

				{isLoading ? (
					<div data-testid="talent-search-loading" className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 flex items-center justify-center">
						<Spin description="正在加载人才推荐" />
					</div>
				) : errorMessage !== null ? null : candidateResults.length === 0 ? (
					<div className="flex items-center justify-center py-20">
						<Empty data-testid="talent-search-empty" description="暂无匹配结果" />
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{candidateResults.map((candidate) => (
							<CandidateCard
								key={candidate.id}
								candidate={candidate}
								active={selectedCandidate !== null && candidate.id === selectedCandidate.id}
								onSelect={() => handleSelectCandidate(candidate.id)}
							/>
						))}
					</div>
				)}
			</div>

			<div className="w-80 shrink-0">
				<CandidateDetailPanel
					candidate={selectedCandidate}
					isInvited={selectedCandidate ? invitedCandidateIds.includes(selectedCandidate.id) : false}
					onInvite={handleInvite}
					onOpenAssistant={handleOpenAssistant}
				/>
			</div>

			<AssistantModal
				open={assistantOpen}
				mode="talent"
				contextTitle={selectedCandidate?.name ?? ''}
				contextStats={assistantStats}
				context={{
					searchKeyword: effectiveKeyword,
					activeFilterIds,
					selectedId: selectedCandidate?.id ?? null,
					stats: assistantStats,
				}}
				initialMessages={talentAssistantInitialMessages}
				onClose={() => setAssistantOpen(false)}
			/>
		</main>
	)
}
