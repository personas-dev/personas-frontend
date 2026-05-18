import type { Job } from '../../types/domain'

interface JobCardProps {
  job: Job
  active: boolean
  onSelect: () => void
}

export function JobCard({ job, active, onSelect }: JobCardProps) {
  return (
    <div
      role="option"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      data-testid={`job-card-${job.id}`}
      aria-selected={active}
      className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${active ? 'border-blue-500 shadow-sm ring-1 ring-blue-500' : 'border-slate-200'
        }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 text-blue-600 flex items-center justify-center text-xl font-bold shadow-sm">
            {job.company.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
              <span className="bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded font-medium border border-amber-200/50">
                {job.highlight}
              </span>
            </div>
            <div className="text-sm text-slate-500 font-medium">
              {job.company} · {job.city} {job.district}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-lg font-bold text-orange-500">{job.salary}</span>
          <span className={`text-xs px-2.5 py-1 rounded font-medium ${job.level === '高匹配' ? 'bg-green-50 text-green-600 border border-green-200/50' : 'bg-blue-50 text-blue-600 border border-blue-200/50'
            }`}>
            {job.level} {job.match}%
          </span>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="bg-slate-50 px-3 py-1.5 rounded-md text-sm text-slate-600 border border-slate-100 flex-1 flex items-center">
          <span className="text-slate-400 mr-2 text-xs font-bold">经验</span>{job.experience}
        </div>
        <div className="bg-slate-50 px-3 py-1.5 rounded-md text-sm text-slate-600 border border-slate-100 flex-1 flex items-center">
          <span className="text-slate-400 mr-2 text-xs font-bold">学历</span>{job.education}
        </div>
        <div className="bg-slate-50 px-3 py-1.5 rounded-md text-sm text-slate-600 border border-slate-100 flex-1 flex items-center">
          <span className="text-slate-400 mr-2 text-xs font-bold">类别</span>{job.category}
        </div>
      </div>

      <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-50">
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-700 font-medium mr-1">岗位职责：</strong>{job.duty}
        </p>
      </div>
    </div>
  )
}
