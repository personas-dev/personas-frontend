import type { Candidate } from '../../types/domain'
import { Button } from 'antd'
import { SendOutlined, RobotOutlined } from '@ant-design/icons'

interface CandidateDetailPanelProps {
	candidate: Candidate | null
	isInvited: boolean
	onInvite: (candidateId: number) => void
	onOpenAssistant: () => void
}

export function CandidateDetailPanel({ candidate, isInvited, onInvite, onOpenAssistant }: CandidateDetailPanelProps) {
	if (!candidate) {
		return (
			<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex items-center justify-center" data-testid="candidate-detail-panel">
				<p className="text-slate-400 text-sm">请选择一个候选人查看详情</p>
			</div>
		)
	}

	return (
		<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6" data-testid="candidate-detail-panel">
			<div className="flex items-start justify-between mb-4">
				<div className="flex items-center gap-3">
					<div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold shadow-sm">
						{candidate.avatar}
					</div>
					<div>
						<h2 className="text-xl font-bold text-slate-800">
							{candidate.name}
							<span className={`ml-2 text-sm ${candidate.gender === '男' ? 'text-blue-500' : 'text-pink-500'}`}>
								{candidate.gender === '男' ? '♂' : '♀'}
							</span>
						</h2>
						<p className="text-sm text-slate-500">{candidate.city}</p>
					</div>
				</div>
				<span className="shrink-0 bg-green-50 text-green-600 text-xs px-2.5 py-1 rounded font-medium border border-green-200/50">
					匹配度 {candidate.match}%
				</span>
			</div>

			<div className="grid grid-cols-2 gap-3 mb-4">
				<div className="bg-slate-50 p-3 rounded-lg">
					<div className="text-xs text-slate-400 mb-1">当前单位</div>
					<div className="text-sm font-medium text-slate-700">{candidate.current}</div>
				</div>
				<div className="bg-slate-50 p-3 rounded-lg">
					<div className="text-xs text-slate-400 mb-1">年龄 / 学历 / 经验</div>
					<div className="text-sm font-medium text-slate-700">{candidate.age}岁 · {candidate.degree} · {candidate.years}年</div>
				</div>
				<div className="bg-slate-50 p-3 rounded-lg">
					<div className="text-xs text-slate-400 mb-1">期望薪资</div>
					<div className="text-sm font-bold text-orange-500">{candidate.salary}</div>
				</div>
				<div className="bg-slate-50 p-3 rounded-lg">
					<div className="text-xs text-slate-400 mb-1">目标岗位</div>
					<div className="text-sm font-medium text-slate-700">{candidate.targetRoles.join('、')}</div>
				</div>
			</div>

			<div className="flex flex-wrap gap-2 mb-4">
				{candidate.tags.map((tag) => (
					<span key={tag} className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md">{tag}</span>
				))}
			</div>

			<div className="bg-green-50/50 p-3 rounded-lg border border-green-50 mb-4">
				<p className="text-sm text-slate-600 leading-relaxed">
					<strong className="text-slate-700 font-medium mr-1">AI 推荐理由：</strong>{candidate.reason}
				</p>
			</div>

			<div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
				<Button
					data-testid="invite-candidate-button"
					icon={<SendOutlined />}
					onClick={() => onInvite(candidate.id)}
					disabled={isInvited}
					type={isInvited ? 'default' : 'primary'}
				>
					{isInvited ? '已模拟邀约' : '模拟邀约'}
				</Button>
				<Button
					data-testid="open-assistant-modal-button"
					icon={<RobotOutlined />}
					onClick={onOpenAssistant}
					type="default"
				>
					咨询智能助手
				</Button>
			</div>
		</div>
	)
}
