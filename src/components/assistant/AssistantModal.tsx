import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Input, Button, App, Alert } from 'antd'

import { RobotOutlined, SendOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'
import type { AssistantMessage, AssistantMode } from '../../types/domain'
import { openChatStream, type ChatStreamHandle } from '../../lib/chatStream'

interface AssistantModalProps {
	open: boolean
	mode: AssistantMode
	contextTitle: string
	contextStats: { total: number; high: number }
	context?: {
		searchKeyword: string
		activeFilterIds: string[]
		selectedId: number | null
		stats: { total: number; high: number }
	}
	initialMessages: AssistantMessage[]
	onClose: () => void
}

function getCurrentTime(): string {
	const now = new Date()
	return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function AssistantModal({
	open,
	mode,
	contextStats,
	context,
	initialMessages,
	onClose,
}: AssistantModalProps) {
	const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages)
	const [inputValue, setInputValue] = useState('')
	const [nextId, setNextId] = useState(() => initialMessages.reduce((max, m) => Math.max(max, m.id), 0) + 1)
	const [conversationId, setConversationId] = useState('')
	const [isStreaming, setIsStreaming] = useState(false)
	const [streamStatus, setStreamStatus] = useState<string | null>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const streamRef = useRef<ChatStreamHandle | null>(null)
	const activeAssistantMessageRef = useRef<{ streamMessageId: string; localMessageId: number } | null>(null)

	const { message: messageApi } = App.useApp()
	const closeCurrentStream = useCallback(() => {
		streamRef.current?.close()
		streamRef.current = null
	}, [])

	useEffect(() => {
		if (!open) {
			closeCurrentStream()
		}

		return () => closeCurrentStream()
	}, [open, closeCurrentStream])

	function handleSend() {
		const trimmed = inputValue.trim()
		if (trimmed === '') {
			messageApi.warning('请输入问题')
			return
		}

		closeCurrentStream()
		activeAssistantMessageRef.current = null

		const userMsg: AssistantMessage = {
			id: nextId,
			from: 'user',
			text: trimmed,
			time: getCurrentTime(),
		}

		setMessages((prev) => [...prev, userMsg])
		setInputValue('')
		setIsStreaming(true)
		setStreamStatus('')
		setErrorMessage(null)
		setNextId((prev) => prev + 2)

		const localAssistantId = nextId + 1
		const stream = openChatStream({
			message: trimmed,
			mode,
			conversationId,
			selectedId: context?.selectedId ?? null,
			searchKeyword: context?.searchKeyword ?? '',
			activeFilters: context?.activeFilterIds ?? [],
		}, {
			onMessageDelta: (event) => {
				setConversationId(event.conversationId)
				appendAssistantDelta(event.messageId, localAssistantId, event.delta)
				setStreamStatus('助手正在生成回答')
			},
			onMessageCompleted: (event) => {
				setConversationId(event.conversationId)
				completeAssistantMessage(event.messageId, localAssistantId, event.content)
				setStreamStatus('回答生成完成，正在结束连接')
			},
			onToolCallStarted: (event) => {
				setConversationId(event.conversationId)
				setStreamStatus('正在更新推荐结果')
			},
			onToolCallCompleted: (event) => {
				setConversationId(event.conversationId)
				setStreamStatus('推荐结果已更新')
			},
			onError: (event) => {
				if (event.conversationId !== null) {
					setConversationId(event.conversationId)
				}

				stopStreamWithError(event.message)
			},
			onConnectionError: () => {
				stopStreamWithError('对话连接已中断，请重试')
			},
			onDone: (event) => {
				setConversationId(event.conversationId)
				setIsStreaming(false)
				setStreamStatus(null)
				activeAssistantMessageRef.current = null
				closeCurrentStream()
			},
		})

		streamRef.current = stream
	}

	function handleClear() {
		closeCurrentStream()
		setMessages([])
		setNextId(1)
		setInputValue('')
		setConversationId('')
		setIsStreaming(false)
		setStreamStatus(null)
		setErrorMessage(null)
		activeAssistantMessageRef.current = null
	}

	function handleClose() {
		closeCurrentStream()
		onClose()
	}

	function appendAssistantDelta(streamMessageId: string, localMessageId: number, delta: string) {
		activeAssistantMessageRef.current ??= { streamMessageId, localMessageId }
		const currentLocalId = activeAssistantMessageRef.current.localMessageId

		setMessages((prev) => {
			const existing = prev.find((msg) => msg.id === currentLocalId)
			if (existing === undefined) {
				return [...prev, { id: currentLocalId, from: 'assistant', text: delta, time: getCurrentTime() }]
			}

			return prev.map((msg) => msg.id === currentLocalId ? { ...msg, text: msg.text + delta } : msg)
		})
	}

	function completeAssistantMessage(streamMessageId: string, localMessageId: number, content: string) {
		activeAssistantMessageRef.current ??= { streamMessageId, localMessageId }
		const currentLocalId = activeAssistantMessageRef.current.localMessageId

		setMessages((prev) => {
			const existing = prev.find((msg) => msg.id === currentLocalId)
			if (existing === undefined) {
				return [...prev, { id: currentLocalId, from: 'assistant', text: content, time: getCurrentTime() }]
			}

			return prev.map((msg) => msg.id === currentLocalId ? { ...msg, text: content } : msg)
		})
	}

	function stopStreamWithError(rawMessage: string) {
		const sanitizedMessage = sanitizeErrorMessage(rawMessage)
		setIsStreaming(false)
		setStreamStatus(null)
		setErrorMessage(sanitizedMessage)
		activeAssistantMessageRef.current = null
		closeCurrentStream()
		messageApi.error(sanitizedMessage)
	}

	function sanitizeErrorMessage(rawMessage: string): string {
		const trimmed = rawMessage.trim()
		if (trimmed === '') {
			return '对话服务暂时不可用，请稍后重试'
		}

		if (/traceback|\.env|api[_-]?key|[a-zA-Z]:\\|\/app\/|\.py/i.test(trimmed)) {
			return '对话服务暂时不可用，请稍后重试'
		}

		return trimmed
	}

	return (
		<Modal
			data-testid="assistant-modal"
			title={mode === 'job' ? '求职智能助手' : 'HR 招聘助手'}
			open={open}
			onCancel={handleClose}
			width={720}
			centered
			footer={null}
			destroyOnHidden={false}
		>
			{context !== undefined && (
				<div
					data-testid="assistant-context"
					data-search-keyword={context.searchKeyword}
					data-active-filter-ids={context.activeFilterIds.join(',')}
					data-selected-id={context.selectedId ?? ''}
					data-total={context.stats.total}
					data-high={context.stats.high}
					hidden
				/>
			)}
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
						<div
							key={msg.id}
							className={`flex items-start gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
						>
							{msg.from === 'assistant' ? (
								<Avatar
									size={32}
									icon={<RobotOutlined />}
									className="shrink-0 bg-blue-500"
								/>
							) : (
								<Avatar
									size={32}
									icon={<UserOutlined />}
									className="shrink-0 bg-slate-400"
								/>
							)}

							<div
								className={`max-w-3/4 px-4 py-2.5 text-sm ${msg.from === 'user'
										? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
										: 'bg-slate-100 text-slate-700 rounded-2xl rounded-tl-sm'
									}`}
							>
								<p className="leading-relaxed whitespace-pre-wrap m-0">{msg.text}</p>
							</div>
						</div>
				))}

				{streamStatus !== null && (
					<div className="flex items-start gap-2 flex-row">
						<Avatar
							size={32}
							icon={<RobotOutlined />}
							className="shrink-0 bg-blue-500 opacity-70"
						/>
						<div
							data-testid="assistant-stream-status"
							className="max-w-3/4 px-4 py-2.5 text-sm bg-slate-100 text-slate-500 rounded-2xl rounded-tl-sm flex items-center gap-2"
						>
							<span className="flex gap-1 items-center h-4">
								<span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
								<span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
								<span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
							</span>
							{streamStatus}
						</div>
					</div>
				)}
			</div>

			{errorMessage !== null && (
				<div className="shrink-0 mb-3">
					<Alert data-testid="assistant-stream-error" type="error" showIcon title={errorMessage} />
				</div>
			)}

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
						loading={isStreaming}
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
