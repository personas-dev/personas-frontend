import type { Candidate } from '../../types/domain'

interface CandidateCardProps {
	candidate: Candidate
	active: boolean
	onSelect: () => void
}

export function CandidateCard({ candidate, active, onSelect }: CandidateCardProps) {
	return (
		<div
			role="option"
			tabIndex={0}
			onClick={onSelect}
			onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
			data-testid={`candidate-card-${candidate.id}`}
			aria-selected={active}
			className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${active ? 'border-blue-500 shadow-sm ring-1 ring-blue-500' : 'border-slate-200'
				}`}
		>
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-4">
					<div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold shadow-sm">
						{candidate.avatar}
					</div>
					<div>
						<div className="flex items-center gap-2 mb-1">
							<h3 className="text-lg font-bold text-slate-800">
								{candidate.name}
								<span className={`ml-2 text-sm ${candidate.gender === '男' ? 'text-blue-500' : 'text-pink-500'}`}>
									{candidate.gender === '男' ? '♂' : '♀'}
								</span>
							</h3>
							<span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded font-medium border border-green-200/50">
								匹配度 {candidate.match}%
							</span>
						</div>
						<div className="text-sm text-slate-500 font-medium">
							{candidate.current} · {candidate.age}岁 · {candidate.degree} · {candidate.years}年经验
						</div>
					</div>
				</div>
				<div className="flex flex-col items-end gap-1.5">
					<span className="text-lg font-bold text-slate-800">{candidate.salary}</span>
					<span className="text-xs text-slate-400 font-medium">期望薪资</span>
				</div>
			</div>

			<div className="flex flex-wrap gap-2 mb-4">
				{candidate.tags.map((tag) => (
					<span key={tag} className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium">
						{tag}
					</span>
				))}
			</div>

			<div className="bg-green-50/50 p-3 rounded-lg border border-green-50">
				<p className="text-sm text-slate-600 leading-relaxed">
					<strong className="text-slate-700 font-medium mr-1">AI 推荐理由：</strong>{candidate.reason}
				</p>
			</div>
		</div>
	)
}
