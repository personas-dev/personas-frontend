import { useState } from 'react'
import { Header } from './components/layout/Header'
import { JobSearchView } from './components/jobs/JobSearchView'
import { TalentSearchView } from './components/talent/TalentSearchView'

export default function App() {
  const [activeTab, setActiveTab] = useState('人找岗')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === '人找岗' && <JobSearchView />}
      {activeTab === '岗找人' && <TalentSearchView />}
      {(activeTab !== '人找岗' && activeTab !== '岗找人') && (
        <main className="flex-1 max-w-content-max w-full mx-auto px-4 py-6 flex items-center justify-center">
          <div className="text-slate-500 bg-white p-12 rounded-xl border border-slate-200 shadow-sm">
            该模块仍在开发中...
          </div>
        </main>
      )}
    </div>
  )
}
