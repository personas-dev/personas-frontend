import { LoadingOutlined, CheckCircleOutlined, ToolOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import type { ToolCallArguments, ToolCallResult } from '../../lib/chatStream'

const TOOL_LABEL: Record<string, string> = {
	recommend_jobs: '岗位推荐',
	recommend_candidates: '候选人推荐',
}

/** 将 FilterDTO 风格的 arguments 转换为可读的参数标签列表 */
function formatArguments(args: ToolCallArguments): { label: string; value: string }[] {
	const entries: { label: string; value: string }[] = []

	const labelMap: Record<string, string> = {
		query: '关键词',
		city: '城市',
		salary_range: '薪资',
		education: '学历',
		experience: '经验',
		industry: '行业',
		role: '岗位',
		keywords: '技能',
		top_k: '推荐数量',
	}

	for (const [key, label] of Object.entries(labelMap)) {
		const val = args[key]
		if (val !== undefined && val !== null && val !== '') {
			entries.push({ label, value: String(val) })
		}
	}

	return entries
}

/** 推荐摘要单行：展示名称/标题与匹配度 */
function ResultItem({ item }: { item: ToolCallResult['items'][number] }) {
	const displayName = item.title ?? item.name ?? `#${item.id}`
	const matchScore = item.match

	return (
		<div className="flex items-center gap-2 py-0.5">
			<span className="text-slate-700 text-xs truncate flex-1">{displayName}</span>
			{matchScore !== undefined && (
				<Tag
					color={matchScore >= 90 ? 'green' : matchScore >= 75 ? 'blue' : 'default'}
					className="shrink-0 text-xs"
				>
					{matchScore}%
				</Tag>
			)}
			{/* 来自后端的额外标签（取前两个，避免过多） */}
			{item.tags?.slice(0, 2).map((tag) => (
				<Tag key={tag} className="shrink-0 text-xs">{tag}</Tag>
			))}
		</div>
	)
}

export type ToolCallCardStatus = 'running' | 'completed'

export interface ToolCallCardProps {
	toolName: string
	/** 工具调用阶段 */
	status: ToolCallCardStatus
	/** tool.call.started 事件携带的参数（进行中时展示） */
	arguments: ToolCallArguments
	/** tool.call.completed 事件携带的结果（完成时展示） */
	result?: ToolCallResult
}

/**
 * 嵌入对话流的工具调用可视化卡片。
 *
 * 进行中：展示参数摘要 + 加载动画。
 * 完成后：切换为推荐结果摘要列表。
 */
export function ToolCallCard({ toolName, status, arguments: args, result }: ToolCallCardProps) {
	const toolLabel = TOOL_LABEL[toolName] ?? toolName
	const argEntries = formatArguments(args)

	return (
		<div
			data-testid="tool-call-card"
			data-tool-name={toolName}
			data-status={status}
			className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs w-full max-w-sm"
		>
			<div className="flex items-center gap-2 mb-2">
				<ToolOutlined className="text-blue-500 text-sm" />
				<span className="font-semibold text-blue-700 flex-1">{toolLabel}</span>
				{status === 'running' ? (
					<span className="flex items-center gap-1 text-slate-400">
						<LoadingOutlined spin />
						<span>查询中</span>
					</span>
				) : (
					<span className="flex items-center gap-1 text-green-600">
						<CheckCircleOutlined />
						<span>已完成</span>
					</span>
				)}
			</div>

			{argEntries.length > 0 && (
				<div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
					{argEntries.map(({ label, value }) => (
						<span key={label} className="text-slate-500">
							<span className="text-slate-400">{label}：</span>
							<span className="text-slate-600">{value}</span>
						</span>
					))}
				</div>
			)}

			{status === 'completed' && result !== undefined && (
				<div className="border-t border-blue-100 pt-2 mt-1">
					{result.items.length === 0 ? (
						<p className="text-slate-400 text-center py-1">暂无推荐结果</p>
					) : (
						<div className="space-y-0.5">
							{result.items.map((item) => (
								<ResultItem key={item.id} item={item} />
							))}
						</div>
					)}
					<p className="text-right text-slate-300 mt-1.5">
						来源：{result.source}
					</p>
				</div>
			)}
		</div>
	)
}
