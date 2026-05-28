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
    </div>
  )
}
