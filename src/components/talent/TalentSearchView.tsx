import { useMemo, useState } from 'react'
import { Empty, App } from 'antd'
import { candidates } from '../../mocks/candidates'
import { talentFilters } from '../../mocks/filters'
import { talentAssistantMessages } from '../../mocks/assistant'
import { matchesQuery, matchesActiveFilters } from '../../lib/filtering'
import { SearchToolbar } from '../search/SearchToolbar'
import { PositionSidebar } from './PositionSidebar'
import { CandidateCard } from './CandidateCard'
import { CandidateDetailPanel } from './CandidateDetailPanel'
import { AssistantModal } from '../assistant/AssistantModal'

export function TalentSearchView() {
	const talentPositions = ['土建造价师', '安装造价师', '成本主管', 'BIM造价工程师', '造价工程师（市政）']
	const [selectedPos, setSelectedPos] = useState(talentPositions[0])

	const [query, setQuery] = useState('')
	const [activeFilterIds, setActiveFilterIds] = useState<string[]>([])

	const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null)
	const [invitedCandidateIds, setInvitedCandidateIds] = useState<number[]>([])

	const [assistantOpen, setAssistantOpen] = useState(false)

	const { message } = App.useApp()

	const filteredCandidates = useMemo(() => {
		return candidates.filter((candidate) => {
			if (!candidate.targetRoles.includes(selectedPos)) return false
			const searchText = candidate.keywords.join(' ')
			if (!matchesQuery(searchText, query)) return false
			if (!matchesActiveFilters(candidate.filterTags, activeFilterIds, talentFilters)) return false
			return true
		})
	}, [query, activeFilterIds, selectedPos])

	const highMatchCount = useMemo(() => {
		return filteredCandidates.filter(c => c.match >= 90).length
	}, [filteredCandidates])

	const selectedCandidate = useMemo(
		() => filteredCandidates.find((c) => c.id === selectedCandidateId) ?? filteredCandidates[0] ?? null,
		[filteredCandidates, selectedCandidateId]
	)

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

	function handlePositionSelect(pos: string) {
		if (pos !== selectedPos) {
			setQuery('')
			setActiveFilterIds([])
			setSelectedCandidateId(null)
			setSelectedPos(pos)
		}
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
					filters={talentFilters}
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
					</div>
				</div>

				{filteredCandidates.length === 0 ? (
					<div className="flex items-center justify-center py-20">
						<Empty description="暂无匹配结果" />
					</div>
				) : (
					<div className="flex flex-col gap-4">
						{filteredCandidates.map((candidate) => (
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
				contextStats={{ total: filteredCandidates.length, high: highMatchCount }}
				initialMessages={talentAssistantMessages}
				onClose={() => setAssistantOpen(false)}
			/>
		</main>
	)
}
