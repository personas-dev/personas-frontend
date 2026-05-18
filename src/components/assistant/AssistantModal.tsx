import { useState } from 'react'
import { Modal, Input, Button, App } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import type { AssistantMessage, AssistantMode } from '../../types/domain'

interface AssistantModalProps {
	open: boolean
	mode: AssistantMode
	contextTitle: string
	contextStats: { total: number; high: number }
	initialMessages: AssistantMessage[]
	onClose: () => void
}

function getCurrentTime(): string {
	const now = new Date()
	return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function generateAssistantReply(userInput: string, contextTitle: string, mode: AssistantMode): string {
	const input = userInput.toLowerCase()

	if (input.includes('薪资') || input.includes('工资') || input.includes('薪水')) {
		return `根据当前市场数据，「${contextTitle}」的薪资在行业中处于合理区间。建议您在面试中基于自身经验和技能进行薪资谈判，通常有 5%-10% 的上浮空间。`
	}

	if (input.includes('匹配') || input.includes('适合') || input.includes('推荐')) {
		if (mode === 'job') {
			return `针对「${contextTitle}」这个岗位，系统基于您的技能标签和项目经验进行了匹配分析。您具备该岗位所需的核心技术能力，匹配度较高。建议重点关注该岗位的职责描述中提到的微服务架构设计部分。`
		}
		return `候选人「${contextTitle}」与当前岗位的匹配分析显示：其项目经验与技能标签与岗位要求高度吻合。特别是在相关领域的实操经验方面表现突出，建议将其纳入推荐候选人的优先关注列表。`
	}

	return '这是基于 mock 数据的模拟回答：我会结合当前筛选条件继续优化推荐结果。'
}

export function AssistantModal({
	open,
	mode,
	contextTitle,
	contextStats,
	initialMessages,
	onClose,
}: AssistantModalProps) {
	const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages)
	const [inputValue, setInputValue] = useState('')
	const [nextId, setNextId] = useState(() => initialMessages.reduce((max, m) => Math.max(max, m.id), 0) + 1)

	const { message } = App.useApp()

	function handleSend() {
		const trimmed = inputValue.trim()
		if (trimmed === '') {
			message.warning('请输入问题')
			return
		}

		const userMsg: AssistantMessage = {
			id: nextId,
			from: 'user',
			text: trimmed,
			time: getCurrentTime(),
		}

		setMessages((prev) => [...prev, userMsg])
		setInputValue('')

		const assistantMsg: AssistantMessage = {
			id: nextId + 1,
			from: 'assistant',
			text: generateAssistantReply(trimmed, contextTitle, mode),
			time: getCurrentTime(),
		}

		setTimeout(() => {
			setMessages((prev) => [...prev, assistantMsg])
		}, 600)

		setNextId((prev) => prev + 2)
	}

	function handleClear() {
		setMessages(initialMessages)
		setNextId(initialMessages.reduce((max, m) => Math.max(max, m.id), 0) + 1)
		setInputValue('')
	}

	return (
		<Modal
			data-testid="assistant-modal"
			title={mode === 'job' ? '求职智能助手' : 'HR 招聘助手'}
			open={open}
			onCancel={onClose}
			width={720}
			centered
			footer={null}
			destroyOnHidden={false}
		>
			<div className="flex flex-col" style={{ height: '60vh', maxHeight: '600px' }}>
				<div className="shrink-0 p-3 mb-3 bg-blue-50/80 border border-blue-100 rounded-xl">
					<p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5">
						<span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
						已根据意向更新推荐：
					</p>
					<div className="flex gap-3">
						<div className="flex-1 bg-white/60 px-3 py-1.5 rounded text-xs">
							<span className="text-slate-600">匹配{mode === 'job' ? '岗位' : '人才'}</span>
							<span className="font-bold text-blue-600 ml-2">{contextStats.total}</span>
						</div>
						<div className="flex-1 bg-white/60 px-3 py-1.5 rounded text-xs">
							<span className="text-slate-600">高匹配</span>
							<span className="font-bold text-green-600 ml-2">{contextStats.high}</span>
						</div>
					</div>
				</div>

				<div data-testid="assistant-message-list" className="flex-1 overflow-y-auto mb-3 space-y-3">
					{messages.map((msg) => (
						<div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
							<div
								className={`max-w-3/4 px-4 py-2.5 text-sm ${
									msg.from === 'user'
										? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
										: 'bg-slate-100 text-slate-700 rounded-2xl rounded-tl-sm'
								}`}
							>
								<p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
								<div
									className={`text-2xs mt-1 text-right ${
										msg.from === 'user' ? 'text-blue-200' : 'text-slate-400'
									}`}
								>
									{msg.time}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="shrink-0 flex gap-2 items-end">
					<Input.TextArea
						data-testid="assistant-input"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onPressEnter={(e) => {
							if (!e.shiftKey) {
								e.preventDefault()
								handleSend()
							}
						}}
						placeholder="输入您的问题，Enter 发送，Shift+Enter 换行"
						autoSize={{ minRows: 1, maxRows: 4 }}
						className="flex-1"
					/>
					<Button
						data-testid="assistant-send-button"
						type="primary"
						onClick={handleSend}
						icon={<SendOutlined />}
					>
						发送
					</Button>
				</div>

				<div className="shrink-0 mt-2 flex justify-end">
					<Button data-testid="assistant-clear-button" size="small" type="text" onClick={handleClear}>
						清空对话
					</Button>
				</div>
			</div>
		</Modal>
	)
}
