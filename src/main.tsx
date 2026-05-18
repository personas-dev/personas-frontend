import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, App as AntdApp } from 'antd'
import { StyleProvider } from '@ant-design/cssinjs'
import zhCN from 'antd/locale/zh_CN'
import type { AliasToken } from 'antd/es/theme/interface'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'

const themeToken: Partial<AliasToken> = {
  colorPrimary: '#1769ff',
  colorSuccess: '#12a66a',
  borderRadius: 10,
  fontFamily: "'Microsoft YaHei UI', 'PingFang SC', 'HarmonyOS Sans SC', 'Noto Sans CJK SC', sans-serif",
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyleProvider layer>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: themeToken,
          cssVar: {},
        }}
      >
        <AntdApp message={{ maxCount: 3 }} notification={{ placement: 'topRight' }}>
          <App />
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  </StrictMode>,
)
