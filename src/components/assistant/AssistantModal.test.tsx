import { ConfigProvider, App as AntdApp } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AssistantModal } from './AssistantModal'
import type { AssistantMessage } from '../../types/domain'

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
		const event = new MessageEvent(type, { data: JSON.stringify(payload) })
		for (const listener of this.listeners.get(type) ?? []) {
			listener(event)
		}
	}

	fail(): void {
		this.onerror?.(new Event('error'))
	}
}

const initialMessages: AssistantMessage[] = [
	{ id: 1, from: 'assistant', text: '请补充偏好。', time: '10:21' },
]

function renderAssistantModal(onClose = vi.fn()) {
	return {
		onClose,
		...render(
			<StyleProvider layer>
				<ConfigProvider>
					<AntdApp message={{ maxCount: 3 }} notification={{ placement: 'topRight' }}>
						<AssistantModal
							open
							mode="job"
							contextTitle="Java 后端工程师"
							contextStats={{ total: 2, high: 1 }}
							context={{
								searchKeyword: 'Java 上海',
								activeFilterIds: ['city-shanghai', 'salary-range'],
								selectedId: 101,
								stats: { total: 2, high: 1 },
							}}
							initialMessages={initialMessages}
							onClose={onClose}
						/>
					</AntdApp>
				</ConfigProvider>
			</StyleProvider>,
		),
	}
}

async function sendMessage(text: string): Promise<MockEventSource> {
	await userEvent.type(screen.getByTestId('assistant-input'), text)
	await userEvent.click(screen.getByTestId('assistant-send-button'))

	return MockEventSource.instances.at(-1) as MockEventSource
}

describe('AssistantModal stream runtime', () => {
	beforeEach(() => {
		MockEventSource.instances = []
		vi.stubGlobal('EventSource', MockEventSource)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('opens EventSource with current assistant context query', async () => {
		renderAssistantModal()

		const source = await sendMessage('请推荐岗位')
		const url = new URL(source.url)

		expect(url.pathname).toBe('/api/v1/chat/stream')
		expect(Array.from(url.searchParams.entries())).toEqual([
			['message', '请推荐岗位'],
			['mode', 'job'],
			['conversation_id', ''],
			['selected_id', '101'],
			['search_keyword', 'Java 上海'],
			['active_filters', 'city-shanghai,salary-range'],
		])
		expect(screen.getByTestId('assistant-stream-status')).toBeInTheDocument()
	})

	it('appends deltas to one assistant bubble and corrects content on completion', async () => {
		renderAssistantModal()
		const source = await sendMessage('分析匹配原因')

		source.emit('message.delta', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			delta: '第一段',
		})
		source.emit('message.delta', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			delta: '第二段',
		})

		expect(await screen.findByText('第一段第二段')).toBeInTheDocument()
		expect(within(screen.getByTestId('assistant-message-list')).getAllByText(/第一段第二段/)).toHaveLength(1)

		source.emit('message.completed', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			content: '最终完整回答',
		})

		expect(await screen.findByText('最终完整回答')).toBeInTheDocument()
		expect(screen.queryByText('第一段第二段')).not.toBeInTheDocument()
		expect(screen.getByTestId('assistant-stream-status')).toHaveTextContent('回答生成完成，正在结束连接')
	})

	it('shows compact tool status and closes stream on done', async () => {
		renderAssistantModal()
		const source = await sendMessage('更新推荐')

		source.emit('tool.call.started', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			tool_call_id: 'tool_001',
			tool_name: 'recommend_jobs',
		})
		await waitFor(() => {
			expect(screen.getByTestId('assistant-stream-status')).toHaveTextContent('正在更新推荐结果')
		})

		source.emit('tool.call.completed', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			tool_call_id: 'tool_001',
			tool_name: 'recommend_jobs',
		})
		await waitFor(() => {
			expect(screen.getByTestId('assistant-stream-status')).toHaveTextContent('推荐结果已更新')
		})

		source.emit('done', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			status: 'completed',
		})

		await waitFor(() => {
			expect(screen.queryByTestId('assistant-stream-status')).not.toBeInTheDocument()
		})
		expect(source.closed).toBe(true)
	})

	it('sanitizes server errors and handles browser connection errors', async () => {
		renderAssistantModal()
		const source = await sendMessage('触发错误')

		source.emit('error', {
			conversation_id: 'conv_001',
			message_id: 'msg_001',
			code: 50010,
			message: 'Traceback C:\\secret\\app.py API_KEY=.env',
		})

		expect(await screen.findByTestId('assistant-stream-error')).toHaveTextContent('对话服务暂时不可用，请稍后重试')
		expect(screen.queryByText(/Traceback/)).not.toBeInTheDocument()
		expect(source.closed).toBe(true)

		const secondSource = await sendMessage('再次发送')
		secondSource.fail()

		expect(await screen.findByTestId('assistant-stream-error')).toHaveTextContent('对话连接已中断，请重试')
		expect(secondSource.closed).toBe(true)
	})

	it('closes stale streams on clear, close and new send', async () => {
		const { onClose } = renderAssistantModal()
		const firstSource = await sendMessage('第一轮')

		await userEvent.click(screen.getByTestId('assistant-clear-button'))
		expect(firstSource.closed).toBe(true)
		expect(screen.queryByText('第一轮')).not.toBeInTheDocument()

		const secondSource = await sendMessage('第二轮')
		await userEvent.type(screen.getByTestId('assistant-input'), '第三轮')
		await userEvent.keyboard('{Enter}')
		const thirdSource = MockEventSource.instances.at(-1) as MockEventSource

		expect(secondSource.closed).toBe(true)
		expect(thirdSource).not.toBe(secondSource)

		await userEvent.click(screen.getByRole('button', { name: /close/i }))
		expect(thirdSource.closed).toBe(true)
		expect(onClose).toHaveBeenCalledTimes(1)
	})
})
