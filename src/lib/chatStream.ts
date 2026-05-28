import { env } from '../env'
import type { AssistantMode } from '../types/domain'

const API_PREFIX = '/api/v1'
const CHAT_STREAM_PATH = '/chat/stream'

interface ChatStreamRequest {
	message: string
	mode: AssistantMode
	conversationId: string
	selectedId: number | null
	searchKeyword: string
	activeFilters: string[]
}

interface MessageDeltaEvent {
	conversationId: string
	messageId: string
	delta: string
}

interface MessageCompletedEvent {
	conversationId: string
	messageId: string
	content: string
}

/** tool.call.started 携带的工具调用参数摘要（与 FilterDTO 语义一致） */
export interface ToolCallArguments {
	mode?: string
	query?: string
	city?: string
	salary_range?: string
	education?: string
	experience?: string
	industry?: string
	role?: string
	keywords?: string
	top_k?: number
	[key: string]: unknown
}

/** tool.call.completed 中单条推荐摘要 */
interface ToolCallResultItem {
	id: number
	/** 岗位标题或候选人姓名 */
	name?: string
	title?: string
	match?: number
	tags?: string[]
}

/** tool.call.completed 的 result 字段 */
export interface ToolCallResult {
	source: string
	items: ToolCallResultItem[]
}

interface ToolCallStartedEvent {
	conversationId: string
	messageId: string
	toolCallId: string
	toolName: string
	/** LLM 传入工具的结构化参数 */
	arguments: ToolCallArguments
}

interface ToolCallCompletedEvent {
	conversationId: string
	messageId: string
	toolCallId: string
	toolName: string
	/** 工具执行后的推荐摘要 */
	result: ToolCallResult
}

interface ChatErrorEvent {
	conversationId: string | null
	messageId: string | null
	code: number
	message: string
}

interface DoneEvent {
	conversationId: string
	messageId: string
	status: string
}

export interface ChatStreamCallbacks {
	onMessageDelta: (event: MessageDeltaEvent) => void
	onMessageCompleted: (event: MessageCompletedEvent) => void
	onToolCallStarted: (event: ToolCallStartedEvent) => void
	onToolCallCompleted: (event: ToolCallCompletedEvent) => void
	onError: (event: ChatErrorEvent) => void
	onConnectionError: () => void
	onDone: (event: DoneEvent) => void
}

export interface ChatStreamHandle {
	url: string
	close: () => void
}

export function buildChatStreamUrl(request: ChatStreamRequest): string {
	const normalizedBase = env.apiBaseUrl.replace(/\/+$/, '')
	const url = new URL(`${normalizedBase}${API_PREFIX}${CHAT_STREAM_PATH}`)

	url.search = buildChatStreamParams(request).toString()

	return url.toString()
}

export function openChatStream(request: ChatStreamRequest, callbacks: ChatStreamCallbacks): ChatStreamHandle {
	const url = buildChatStreamUrl(request)
	const source = new EventSource(url)
	let closed = false

	function closeSource() {
		if (!closed) {
			closed = true
			source.close()
		}
	}

	function handleErrorEvent(event: Event) {
		if (closed) {
			return
		}

		const payload = parseEventPayload(event, isChatErrorPayload)
		closeSource()

		if (payload === null) {
			callbacks.onConnectionError()
			return
		}

		callbacks.onError(payload)
	}

	source.addEventListener('message.delta', (event) => {
		const payload = parseEventPayload(event, isMessageDeltaPayload)
		if (payload === null) {
			closeSource()
			callbacks.onError(createInvalidPayloadError())
			return
		}

		callbacks.onMessageDelta(payload)
	})

	source.addEventListener('message.completed', (event) => {
		const payload = parseEventPayload(event, isMessageCompletedPayload)
		if (payload === null) {
			closeSource()
			callbacks.onError(createInvalidPayloadError())
			return
		}

		callbacks.onMessageCompleted(payload)
	})

	source.addEventListener('tool.call.started', (event) => {
		const payload = parseEventPayload(event, isToolCallStartedPayload)
		if (payload === null) {
			closeSource()
			callbacks.onError(createInvalidPayloadError())
			return
		}

		callbacks.onToolCallStarted(payload)
	})

	source.addEventListener('tool.call.completed', (event) => {
		const payload = parseEventPayload(event, isToolCallCompletedPayload)
		if (payload === null) {
			closeSource()
			callbacks.onError(createInvalidPayloadError())
			return
		}

		callbacks.onToolCallCompleted(payload)
	})

	source.addEventListener('error', handleErrorEvent)

	source.addEventListener('done', (event) => {
		const payload = parseEventPayload(event, isDonePayload)
		if (payload === null) {
			closeSource()
			callbacks.onError(createInvalidPayloadError())
			return
		}

		closeSource()
		callbacks.onDone(payload)
	})

	source.onerror = handleErrorEvent

	return {
		url,
		close: closeSource,
	}
}

function buildChatStreamParams(request: ChatStreamRequest): URLSearchParams {
	const params = new URLSearchParams()

	params.set('message', request.message.trim())
	params.set('mode', request.mode)
	params.set('conversation_id', request.conversationId)
	params.set('selected_id', request.selectedId === null ? '' : String(request.selectedId))
	params.set('search_keyword', request.searchKeyword.trim())
	params.set('active_filters', request.activeFilters.join(','))

	return params
}

function parseEventPayload<T>(event: Event, guard: (value: unknown) => value is T): T | null {
	if (!(event instanceof MessageEvent) || typeof event.data !== 'string') {
		return null
	}

	try {
		const value = JSON.parse(event.data) as unknown
		const record = toRecord(value)
		return guard(record) ? record : null
	} catch {
		return null
	}
}

function createInvalidPayloadError(): ChatErrorEvent {
	return {
		conversationId: null,
		messageId: null,
		code: 50010,
		message: '对话响应格式无效，请稍后重试',
	}
}

function isMessageDeltaPayload(value: unknown): value is MessageDeltaEvent {
	const record = toRecord(value)
	return record !== null
		&& typeof record.conversationId === 'string'
		&& typeof record.messageId === 'string'
		&& typeof record.delta === 'string'
}

function isMessageCompletedPayload(value: unknown): value is MessageCompletedEvent {
	const record = toRecord(value)
	return record !== null
		&& typeof record.conversationId === 'string'
		&& typeof record.messageId === 'string'
		&& typeof record.content === 'string'
}

function isToolCallStartedPayload(value: unknown): value is ToolCallStartedEvent {
	const record = toRecord(value)
	return record !== null
		&& typeof record.conversationId === 'string'
		&& typeof record.messageId === 'string'
		&& typeof record.toolCallId === 'string'
		&& typeof record.toolName === 'string'
		&& typeof record.arguments === 'object' && record.arguments !== null
}

function isToolCallCompletedPayload(value: unknown): value is ToolCallCompletedEvent {
	const record = toRecord(value)
	return record !== null
		&& typeof record.conversationId === 'string'
		&& typeof record.messageId === 'string'
		&& typeof record.toolCallId === 'string'
		&& typeof record.toolName === 'string'
		&& typeof record.result === 'object' && record.result !== null
}

function isChatErrorPayload(value: unknown): value is ChatErrorEvent {
	const record = toRecord(value)
	return record !== null
		&& (typeof record.conversationId === 'string' || record.conversationId === null)
		&& (typeof record.messageId === 'string' || record.messageId === null)
		&& typeof record.code === 'number'
		&& typeof record.message === 'string'
}

function isDonePayload(value: unknown): value is DoneEvent {
	const record = toRecord(value)
	return record !== null
		&& typeof record.conversationId === 'string'
		&& typeof record.messageId === 'string'
		&& typeof record.status === 'string'
}

function toRecord(value: unknown): Record<string, unknown> | null {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return null
	}

	const input = value as Record<string, unknown>
	const mapped: Record<string, unknown> = { ...input }

	mapSnakeCaseField(input, mapped, 'conversation_id', 'conversationId')
	mapSnakeCaseField(input, mapped, 'message_id', 'messageId')
	mapSnakeCaseField(input, mapped, 'tool_call_id', 'toolCallId')
	mapSnakeCaseField(input, mapped, 'tool_name', 'toolName')
	delete mapped.conversation_id
	delete mapped.message_id
	delete mapped.tool_call_id
	delete mapped.tool_name

	return mapped
}

function mapSnakeCaseField(
	input: Record<string, unknown>,
	mapped: Record<string, unknown>,
	sourceKey: string,
	targetKey: string,
): void {
	if (!(targetKey in mapped) && sourceKey in input) {
		mapped[targetKey] = input[sourceKey]
	}
}
