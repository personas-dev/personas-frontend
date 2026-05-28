import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildChatStreamUrl, openChatStream, type ChatStreamCallbacks } from './chatStream'

type MockListener = (event: Event) => void

class MockEventSource {
	static instances: MockEventSource[] = []

	readonly url: string
	closed = false
	onerror: ((event: Event) => void) | null = null
	private readonly listeners = new Map<string, MockListener[]>()

	constructor(url: string) {
		this.url = url
		MockEventSource.instances.push(this)
	}

	addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
		const wrapped = typeof listener === 'function' ? listener : (event: Event) => listener.handleEvent(event)
		const listeners = this.listeners.get(type) ?? []
		listeners.push(wrapped)
		this.listeners.set(type, listeners)
	}

	close(): void {
		this.closed = true
	}

	emit(type: string, payload: unknown): void {
		this.emitRaw(type, JSON.stringify(payload))
	}

	emitRaw(type: string, data: string): void {
		this.dispatch(new MessageEvent(type, { data }))
	}

	emitConnectionError(): void {
		this.dispatch(new Event('error'))
	}

	private dispatch(event: Event): void {
		for (const listener of this.listeners.get(event.type) ?? []) {
			listener(event)
		}

		if (event.type === 'error') {
			this.onerror?.(event)
		}
	}
}

function createCallbacks(): ChatStreamCallbacks {
	return {
		onMessageDelta: vi.fn(),
		onMessageCompleted: vi.fn(),
		onToolCallStarted: vi.fn(),
		onToolCallCompleted: vi.fn(),
		onError: vi.fn(),
		onConnectionError: vi.fn(),
		onDone: vi.fn(),
	}
}

describe('chatStream', () => {
	beforeEach(() => {
		MockEventSource.instances = []
		vi.stubGlobal('EventSource', MockEventSource)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('builds an encoded stream URL with all required query keys', () => {
		const url = new URL(buildChatStreamUrl({
			message: '  上海 Java 后端  ',
			mode: 'job',
			conversationId: 'conv_001',
			selectedId: 42,
			searchKeyword: ' Java 上海 ',
			activeFilters: ['city-shanghai', 'salary-range'],
		}))

		expect(url.origin).toBe('http://localhost:8000')
		expect(url.pathname).toBe('/api/v1/chat/stream')
		expect(Array.from(url.searchParams.entries())).toEqual([
			['message', '上海 Java 后端'],
			['mode', 'job'],
			['conversation_id', 'conv_001'],
			['selected_id', '42'],
			['search_keyword', 'Java 上海'],
			['active_filters', 'city-shanghai,salary-range'],
		])
	})

	it('parses stream events and closes on done', () => {
		const callbacks = createCallbacks()
		const handle = openChatStream({
			message: '推荐岗位',
			mode: 'job',
			conversationId: '',
			selectedId: null,
			searchKeyword: '',
			activeFilters: [],
		}, callbacks)
		const source = MockEventSource.instances[0]

		expect(handle.url).toContain('/api/v1/chat/stream')
		source.emit('tool.call.started', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			tool_call_id: 'tool_001',
			tool_name: 'recommend_jobs',
		})
		source.emit('message.delta', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			delta: '您好，',
		})
		source.emit('message.completed', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			content: '您好，已完成。',
		})
		source.emit('done', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			status: 'completed',
		})

		expect(callbacks.onToolCallStarted).toHaveBeenCalledWith({
			conversationId: 'conv_001',
			messageId: 'msg_001',
			toolCallId: 'tool_001',
			toolName: 'recommend_jobs',
		})
		expect(callbacks.onMessageDelta).toHaveBeenCalledWith({
			conversationId: 'conv_001',
			messageId: 'msg_001',
			delta: '您好，',
		})
		expect(callbacks.onMessageCompleted).toHaveBeenCalledWith({
			conversationId: 'conv_001',
			messageId: 'msg_001',
			content: '您好，已完成。',
		})
		expect(callbacks.onDone).toHaveBeenCalledWith({
			conversationId: 'conv_001',
			messageId: 'msg_001',
			status: 'completed',
		})
		expect(source.closed).toBe(true)
	})

	it('reports malformed event data and connection errors with deterministic closure', () => {
		const callbacks = createCallbacks()
		openChatStream({
			message: '推荐岗位',
			mode: 'job',
			conversationId: '',
			selectedId: null,
			searchKeyword: '',
			activeFilters: [],
		}, callbacks)
		const source = MockEventSource.instances[0]

		source.emitRaw('message.delta', '{')

		expect(callbacks.onError).toHaveBeenCalledWith({
			conversationId: null,
			messageId: null,
			code: 50010,
			message: '对话响应格式无效，请稍后重试',
		})
		expect(source.closed).toBe(true)

		const secondCallbacks = createCallbacks()
		openChatStream({
			message: '继续推荐',
			mode: 'talent',
			conversationId: '',
			selectedId: null,
			searchKeyword: '',
			activeFilters: [],
		}, secondCallbacks)
		const secondSource = MockEventSource.instances[1]

		secondSource.emitConnectionError()

		expect(secondCallbacks.onConnectionError).toHaveBeenCalledTimes(1)
		expect(secondCallbacks.onError).not.toHaveBeenCalled()
		expect(secondSource.closed).toBe(true)
	})

	it('handles server business error once when EventTarget also invokes onerror', () => {
		const callbacks = createCallbacks()
		openChatStream({
			message: '推荐岗位',
			mode: 'job',
			conversationId: '',
			selectedId: null,
			searchKeyword: '',
			activeFilters: [],
		}, callbacks)
		const source = MockEventSource.instances[0]

		source.emit('error', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			code: 50302,
			message: 'LLM 暂时不可用',
		})

		expect(callbacks.onError).toHaveBeenCalledTimes(1)
		expect(callbacks.onError).toHaveBeenCalledWith({
			conversationId: 'conv_001',
			messageId: 'msg_001',
			code: 50302,
			message: 'LLM 暂时不可用',
		})
		expect(callbacks.onConnectionError).not.toHaveBeenCalled()
		expect(source.closed).toBe(true)
	})
})
