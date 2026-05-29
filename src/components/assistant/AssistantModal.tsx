import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Modal, App, Alert } from 'antd'
import { Bubble, Sender } from '@ant-design/x'
import type { BubbleItemType } from '@ant-design/x'
import { RobotOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'
import type { AssistantMessage, AssistantMode } from '../../types/domain'
import {
	openChatStream,
	type ChatStreamHandle,
	type ToolCallArguments,
	type ToolCallResult,
} from '../../lib/chatStream'
import { ToolCallCard, type ToolCallCardStatus } from './ToolCallCard'

interface AssistantModalProps {
	open: boolean
	mode: AssistantMode
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

interface ToolCallEntry {
	kind: 'tool-call'
	toolCallId: string
	toolName: string
	status: ToolCallCardStatus
	arguments: ToolCallArguments
	result?: ToolCallResult
}

/** 对话流消息条目（普通消息或工具调用卡片） */
type ChatEntry = (AssistantMessage & { kind: 'message' }) | ToolCallEntry

function getCurrentTime(): string {
	const now = new Date()
	return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

/** 将 ChatEntry 转换为 Bubble.List 可用的 BubbleItemType */
function entriesToBubbleItems(entries: ChatEntry[]): BubbleItemType[] {
	return entries.map((entry) => {
		if (entry.kind === 'tool-call') {
			return {
				key: entry.toolCallId,
				role: 'assistant',
				content: entry.toolCallId, // 实际内容通过 contentRender 渲染
				// 传递工具调用数据到 extraInfo
				extraInfo: {
					toolCall: entry,
				},
			}
		}

		// 普通消息
		const msg = entry
		return {
			key: msg.id,
			role: msg.from === 'user' ? 'user' : 'assistant',
			content: msg.text,
		}
	})
}

export function AssistantModal({
	open,
	mode,
	contextStats,
	context,
	initialMessages,
	onClose,
}: AssistantModalProps) {
	const [entries, setEntries] = useState<ChatEntry[]>(() =>
		initialMessages.map((m) => ({ ...m, kind: 'message' as const })),
	)
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

	// 转换为 Bubble.List 可用的 items
	const bubbleItems = useMemo(() => entriesToBubbleItems(entries), [entries])

	// 添加流状态条目
	const allBubbleItems = useMemo(() => {
		if (streamStatus === null) {
			return bubbleItems
		}

		return [
			...bubbleItems,
			{
				key: 'stream-status',
				role: 'assistant',
				content: streamStatus,
				extraInfo: {
					isStreamStatus: true,
				},
			},
		]
	}, [bubbleItems, streamStatus])

	function handleSend(message: string) {
		const trimmed = message.trim()
		if (trimmed === '') {
			messageApi.warning('请输入问题')
			return
		}

		closeCurrentStream()
		activeAssistantMessageRef.current = null

		const userEntry: ChatEntry = {
			kind: 'message',
			id: nextId,
			from: 'user',
			text: trimmed,
			time: getCurrentTime(),
		}

		setEntries((prev) => [...prev, userEntry])
		setInputValue('')
		setIsStreaming(true)
		setStreamStatus('')
		setErrorMessage(null)
		setNextId((prev) => prev + 2)

		const localAssistantId = nextId + 1
		const stream = openChatStream(
			{
				message: trimmed,
				mode,
				conversationId,
				selectedId: context?.selectedId ?? null,
				searchKeyword: context?.searchKeyword ?? '',
				activeFilters: context?.activeFilterIds ?? [],
			},
			{
				onMessageDelta: (event) => {
					setConversationId(event.conversationId)
					appendAssistantDelta(event.messageId, localAssistantId, event.delta)
					// 收到第一个 token 时，删除流状态气泡
					setStreamStatus(null)
				},
				onMessageCompleted: (event) => {
					setConversationId(event.conversationId)
					completeAssistantMessage(event.messageId, localAssistantId, event.content)
					setStreamStatus('回答生成完成，正在结束连接')
				},
				onToolCallStarted: (event) => {
					setConversationId(event.conversationId)
					setNextId((prev) => {
						activeAssistantMessageRef.current = { streamMessageId: event.messageId, localMessageId: prev }
						return prev + 1
					})
					setEntries((prev) => [
						...prev,
						{
							kind: 'tool-call',
							toolCallId: event.toolCallId,
							toolName: event.toolName,
							status: 'running',
							arguments: event.arguments,
						},
					])
					setStreamStatus(null)
				},
				onToolCallCompleted: (event) => {
					setConversationId(event.conversationId)
					setEntries((prev) =>
						prev.map((entry) =>
							entry.kind === 'tool-call' && entry.toolCallId === event.toolCallId
								? { ...entry, status: 'completed' as const, result: event.result }
								: entry,
						),
					)
					setStreamStatus('推荐已更新，正在生成解释')
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
			},
		)

		streamRef.current = stream
	}

	function handleClear() {
		closeCurrentStream()
		setEntries([])
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

		setEntries((prev) => {
			const existing = prev.find((e) => e.kind === 'message' && e.id === currentLocalId)
			if (existing === undefined) {
				return [
					...prev,
					{ kind: 'message', id: currentLocalId, from: 'assistant', text: delta, time: getCurrentTime() },
				]
			}

			return prev.map((e) =>
				e.kind === 'message' && e.id === currentLocalId ? { ...e, text: e.text + delta } : e,
			)
		})
	}

	function completeAssistantMessage(streamMessageId: string, localMessageId: number, content: string) {
		activeAssistantMessageRef.current ??= { streamMessageId, localMessageId }
		const currentLocalId = activeAssistantMessageRef.current.localMessageId

		setEntries((prev) => {
			const existing = prev.find((e) => e.kind === 'message' && e.id === currentLocalId)
			if (existing === undefined) {
				return [
					...prev,
					{ kind: 'message', id: currentLocalId, from: 'assistant', text: content, time: getCurrentTime() },
				]
			}

			return prev.map((e) =>
				e.kind === 'message' && e.id === currentLocalId ? { ...e, text: content } : e,
			)
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

	// Bubble.List 的 role 配置
	const bubbleRoles = useMemo(
		() => ({
			user: {
				placement: 'end' as const,
				avatar: <Avatar size={32} icon={<UserOutlined />} className="shrink-0 bg-slate-400" />,
				variant: 'filled' as const,
				shape: 'corner' as const,
				styles: {
					content: {
						backgroundColor: '#2563eb',
						color: '#ffffff',
						borderRadius: '16px 16px 4px 16px',
						paddingBlock: '10px',
						paddingInline: '16px',
						fontSize: '14px',
						minHeight: 'auto',
					},
				},
			},
			assistant: {
				placement: 'start' as const,
				avatar: <Avatar size={32} icon={<RobotOutlined />} className="shrink-0 bg-blue-500" />,
				variant: 'filled' as const,
				shape: 'corner' as const,
				styles: {
					content: {
						backgroundColor: '#f1f5f9',
						color: '#334155',
						borderRadius: '16px 16px 16px 4px',
						paddingBlock: '10px',
						paddingInline: '16px',
						fontSize: '14px',
						minHeight: 'auto',
					},
				},
				contentRender: (content: string, info: { extraInfo?: Record<string, unknown> }) => {
					// 检查是否是流状态
					if (info.extraInfo?.isStreamStatus) {
						return (
							<div data-testid="assistant-stream-status" className="flex items-center gap-2">
								<span className="flex gap-1 items-center h-4">
									<span
										className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
										style={{ animationDelay: '0ms' }}
									/>
									<span
										className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
										style={{ animationDelay: '150ms' }}
									/>
									<span
										className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
										style={{ animationDelay: '300ms' }}
									/>
								</span>
								{content}
							</div>
						)
					}

					// 检查是否是工具调用
					if (info.extraInfo?.toolCall) {
						const toolCall = info.extraInfo.toolCall as ToolCallEntry
						return (
							<ToolCallCard
								toolName={toolCall.toolName}
								status={toolCall.status}
								arguments={toolCall.arguments}
								result={toolCall.result}
							/>
						)
					}

					// 普通文本
					return <p className="leading-relaxed whitespace-pre-wrap m-0">{content}</p>
				},
			},
		}),
		[],
	)

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

				<div data-testid="assistant-message-list" className="flex-1 overflow-hidden mb-3">
					<Bubble.List
						items={allBubbleItems}
						autoScroll
						role={bubbleRoles}
						style={{ height: '100%' }}
					/>
				</div>

				{errorMessage !== null && (
					<div className="shrink-0 mb-3">
						<Alert data-testid="assistant-stream-error" type="error" showIcon title={errorMessage} />
					</div>
				)}

				<div className="shrink-0">
					<Sender
						data-testid="assistant-input"
						value={inputValue}
						onChange={setInputValue}
						onSubmit={handleSend}
						loading={isStreaming}
						onCancel={() => {
							closeCurrentStream()
							setIsStreaming(false)
							setStreamStatus(null)
						}}
						placeholder="输入您的问题，Enter 发送，Shift+Enter 换行"
						autoSize={{ minRows: 1, maxRows: 4 }}
						submitType="enter"
					/>
				</div>

				<div className="shrink-0 mt-2 flex justify-end">
					<button
						type="button"
						data-testid="assistant-clear-button"
						className="text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
						onClick={handleClear}
					>
						清空对话
					</button>
				</div>
			</div>
		</Modal>
	)
}
