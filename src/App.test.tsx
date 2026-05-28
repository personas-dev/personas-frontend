import { ConfigProvider, App as AntdApp } from 'antd'
import type { AliasToken } from 'antd/es/theme/interface'
import zhCN from 'antd/locale/zh_CN'
import { StyleProvider } from '@ant-design/cssinjs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

const themeToken: Partial<AliasToken> = {
	colorPrimary: '#1769ff',
	colorSuccess: '#12a66a',
	borderRadius: 10,
	fontFamily: "'Microsoft YaHei UI', 'PingFang SC', 'HarmonyOS Sans SC', 'Noto Sans CJK SC', sans-serif",
}

function renderApp() {
	return render(
		<StyleProvider layer>
			<ConfigProvider
				locale={zhCN}
				theme={{
					token: themeToken,
					components: {
						Button: {
							primaryColor: '#ffffff',
						},
					},
					cssVar: {},
				}}
			>
				<AntdApp message={{ maxCount: 3 }} notification={{ placement: 'topRight' }}>
					<App />
				</AntdApp>
			</ConfigProvider>
		</StyleProvider>,
	)
}

describe('App', () => {
	it('renders the default job search workspace with production providers', () => {
		renderApp()

		expect(screen.getByText('人岗匹配系统')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: '人找岗' })).toBeInTheDocument()
		expect(screen.getByText(/共找到 \d+ 个匹配岗位/)).toBeInTheDocument()
	})
})
