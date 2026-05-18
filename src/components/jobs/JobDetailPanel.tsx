import type { Job } from '../../types/domain'
import { Button } from 'antd'
import { StarOutlined, StarFilled, SendOutlined, RobotOutlined } from '@ant-design/icons'

interface JobDetailPanelProps {
  job: Job | null
  isFavorited: boolean
  isApplied: boolean
  onToggleFavorite: (jobId: number) => void
  onApply: (jobId: number) => void
  onOpenAssistant: () => void
}

export function JobDetailPanel({ job, isFavorited, isApplied, onToggleFavorite, onApply, onOpenAssistant }: JobDetailPanelProps) {
  if (!job) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 flex items-center justify-center" data-testid="job-detail-panel">
        <p className="text-slate-400 text-sm">请选择一个职位查看详情</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6" data-testid="job-detail-panel">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 pr-2">{job.title}</h2>
        <span className={`shrink-0 text-xs px-2.5 py-1 rounded font-medium ${job.level === '高匹配' ? 'bg-green-50 text-green-600 border border-green-200/50' : 'bg-blue-50 text-blue-600 border border-blue-200/50'}`}>
          {job.level} {job.match}%
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mb-4">
        <span>{job.company}</span>
        <span>{job.city} {job.district}</span>
        <span>{job.education}</span>
        <span>{job.experience}</span>
      </div>

      <div className="mb-4">
        <span className="text-2xl font-bold text-orange-500">{job.salary}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {job.filterTags.map((tag) => (
          <span key={tag} className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md">{tag}</span>
        ))}
      </div>

      <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-50 mb-4">
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-700 font-medium mr-1">岗位职责：</strong>{job.duty}
        </p>
      </div>

      {job.detailBullets.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-700 mb-2">职位亮点</h3>
          <ul className="list-disc list-inside space-y-1">
            {job.detailBullets.map((bullet) => (
              <li key={bullet} className="text-sm text-slate-600">{bullet}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
        <Button
          data-testid="favorite-job-button"
          icon={isFavorited ? <StarFilled /> : <StarOutlined />}
          onClick={() => onToggleFavorite(job.id)}
          type={isFavorited ? 'primary' : 'default'}
        >
          {isFavorited ? '已收藏' : '收藏职位'}
        </Button>
        <Button
          data-testid="apply-job-button"
          icon={<SendOutlined />}
          onClick={() => onApply(job.id)}
          disabled={isApplied}
          type={isApplied ? 'default' : 'primary'}
        >
          {isApplied ? '已模拟投递' : '模拟投递'}
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
