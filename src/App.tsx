import { useMemo, useState } from 'react'

type MatchLevel = '高匹配' | '优先推荐' | '匹配'

type Job = {
  id: number
  title: string
  company: string
  category: string
  salary: string
  city: string
  district: string
  education: string
  experience: string
  match: number
  level: MatchLevel
  highlight: string
  duty: string
}

type Candidate = {
  id: number
  name: string
  gender: '男' | '女'
  age: number
  degree: string
  years: number
  current: string
  salary: string
  match: number
  tags: string[]
  reason: string
  avatar: string
}

type Message = {
  id: number
  from: 'assistant' | 'user'
  text: string
  time: string
}

const jobs: Job[] = [
  {
    id: 1,
    title: '高级 Java 后端工程师',
    company: '智谱科技',
    category: '后端开发',
    salary: '30K-40K',
    city: '上海',
    district: '徐汇区',
    education: '本科及以上',
    experience: '5-10 年',
    match: 96,
    level: '高匹配',
    highlight: '优势推荐',
    duty: '负责核心业务系统的设计与开发，基于 Spring Cloud 微服务架构优化系统性能与稳定性。',
  },
  {
    id: 2,
    title: '平台研发工程师',
    company: '商汤科技',
    category: '后端开发',
    salary: '32K-40K',
    city: '上海',
    district: '闵行区',
    education: '本科及以上',
    experience: '5-10 年',
    match: 92,
    level: '高匹配',
    highlight: '高稳定性',
    duty: '负责 AI 平台后端服务研发与维护，设计高性能接口并推进工程效率提升。',
  },
  {
    id: 3,
    title: '后端开发工程师（AI 应用）',
    company: 'MiniMax',
    category: 'AI 应用',
    salary: '28K-38K',
    city: '上海',
    district: '浦东新区',
    education: '本科及以上',
    experience: '3-6 年',
    match: 89,
    level: '高匹配',
    highlight: '方向匹配',
    duty: '参与 AI 应用产品后端架构设计与开发，构建稳定 API 服务与业务系统。',
  },
  {
    id: 4,
    title: 'SaaS 系统工程师',
    company: '致远互联',
    category: '后端开发',
    salary: '30K-40K',
    city: '上海',
    district: '静安区',
    education: '本科及以上',
    experience: '5-10 年',
    match: 86,
    level: '优先推荐',
    highlight: '业务契合',
    duty: '负责 SaaS 产品后端开发与迭代，参与权限体系、租户架构与数据安全设计。',
  },
]

const candidates: Candidate[] = [
  {
    id: 1,
    name: '张伟',
    gender: '男',
    age: 28,
    degree: '本科',
    years: 5,
    current: '中建三局（造价工程师）',
    salary: '18K-22K',
    match: 92,
    tags: ['经验吻合', '地域匹配', '薪资匹配'],
    reason: '候选人具备 4 年土建造价经验，主导过多个住宅与商业综合体项目，熟悉使用广联达，算量校准与成本控制能力突出。',
    avatar: '张',
  },
  {
    id: 2,
    name: '李娜',
    gender: '女',
    age: 31,
    degree: '本科',
    years: 6,
    current: '万科（造价工程师）',
    salary: '15K-18K',
    match: 87,
    tags: ['经验吻合', '地域匹配', '薪资接近'],
    reason: '候选人 3 年土建造价经验，参与过大型商业及住宅项目，熟悉采购与清单计价，沟通能力强，学习能力佳。',
    avatar: '李',
  },
  {
    id: 3,
    name: '王磊',
    gender: '男',
    age: 29,
    degree: '硕士',
    years: 6,
    current: '绿地中国（造价工程师）',
    salary: '22K-25K',
    match: 78,
    tags: ['经验丰富', '地域匹配', '薪资偏高'],
    reason: '候选人 5 年经验且学历更高，具备 EPC 项目全过程造价管理经验，专业能力扎实，但薪资期望略高于预算。',
    avatar: '王',
  },
  {
    id: 4,
    name: '陈雨欣',
    gender: '女',
    age: 27,
    degree: '本科',
    years: 5,
    current: '华润置地（造价工程师）',
    salary: '16K-20K',
    match: 72,
    tags: ['项目匹配', '行业接近'],
    reason: '综合体项目经验较强，协同沟通良好，发展潜力高，适合作为次优补充人选进入复核。',
    avatar: '陈',
  },
]

const assistantMessages: Message[] = [
  { id: 1, from: 'assistant', text: '为了更精准推荐，请补充期望薪资和行业偏好。', time: '10:21' },
  { id: 2, from: 'user', text: '30K-40K，偏好 AI 或 SaaS。', time: '10:21' },
  { id: 3, from: 'assistant', text: '是否接受混合办公？', time: '10:21' },
  { id: 4, from: 'user', text: '可以。', time: '10:22' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('人找岗')

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === '人找岗' && <JobSearchView />}
      {activeTab === '岗找人' && <TalentSearchView />}
      {(activeTab !== '人找岗' && activeTab !== '岗找人') && (
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-6 flex items-center justify-center">
          <div className="text-slate-500 bg-white p-12 rounded-xl border border-slate-200 shadow-sm">
            该模块仍在开发中...
          </div>
        </main>
      )}
    </div>
  )
}

function Header({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) {
  const navItems = ['人找岗', '岗找人', '报表中心', '系统管理']
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold" aria-hidden="true">▦</div>
            <span className="text-xl font-bold text-slate-800">人岗匹配系统</span>
          </div>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <button
                type="button"
                onClick={() => onTabChange(item)}
                key={item}
                className={`text-sm font-medium h-16 flex items-center border-b-2 transition-colors ${activeTab === item
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-600 border-transparent hover:text-blue-600'
                  }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
          <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center font-bold">6</span>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">张</div>
          <span className="text-sm font-medium text-slate-700">张伟 · HR / 求职者</span>
        </div>
      </div>
    </header>
  )
}

function JobSearchView() {
  const [selectedJobId, setSelectedJobId] = useState(jobs[0].id)
  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) ?? jobs[0], [selectedJobId])

  return (
    <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-6 flex gap-6">
      <div className="flex-1 flex flex-col gap-4">
        <SearchToolbar placeholder="5年 Java后端开发｜上海｜本科" tags={['期望薪资：30K-40K', '行业偏好：AI / SaaS', '公司规模：100-500人', '办公方式：全职']} />

        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="text-sm text-blue-600 font-medium mb-1">人找岗模块</p>
            <h2 className="text-2xl font-bold text-slate-800">共找到 128 个匹配岗位</h2>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              active={job.id === selectedJob.id}
              onSelect={() => setSelectedJobId(job.id)}
            />
          ))}
        </div>
      </div>

      <div className="w-80 shrink-0">
        <AssistantPanel messages={assistantMessages} title="求职智能助手" stats={{ total: 128, high: 42 }} entity="岗位" />
      </div>
    </main>
  )
}

function TalentSearchView() {
  const talentPositions = ['土建造价师', '安装造价师', '成本主管', 'BIM造价工程师', '造价工程师（市政）']
  const [selectedPos, setSelectedPos] = useState(talentPositions[0])

  return (
    <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 py-6 flex gap-6">
      <div className="w-64 shrink-0 flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-bold text-slate-800 mb-4">企业发布岗位</h2>
          <div className="flex flex-col gap-2">
            {talentPositions.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setSelectedPos(pos)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedPos === pos
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
              >
                {pos}
              </button>
            ))}
          </div>
          <button type="button" className="mt-4 w-full py-2 border border-dashed border-slate-300 text-slate-500 rounded-lg text-sm font-medium hover:border-blue-400 hover:text-blue-600 transition-colors">
            + 发布新岗位
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <SearchToolbar placeholder="搜索相关人才（例如：5年经验，熟练使用广联达）" tags={['当前城市：上海', '最低学历：本科', '最高薪资预算：25K']} />

        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="text-sm text-green-600 font-medium mb-1">岗找人模块</p>
            <h2 className="text-2xl font-bold text-slate-800">正在为「{selectedPos}」推荐人才</h2>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      </div>

      <div className="w-80 shrink-0">
        <AssistantPanel messages={[
          { id: 1, from: 'assistant', text: `已为您筛选匹配「${selectedPos}」的候选人。`, time: '14:20' },
          { id: 2, from: 'user', text: '有没有沟通能力比较突出的？', time: '14:21' },
          { id: 3, from: 'assistant', text: '李娜 和 陈雨欣 的项目评价中均提到较好的协同沟通能力，已为您高亮。', time: '14:21' },
        ]} title="HR 招聘助手" stats={{ total: 24, high: 8 }} entity="人才" />
      </div>
    </main>
  )
}


function SearchToolbar({ placeholder, tags }: { placeholder: string, tags: string[] }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">⌕</span>
          <input
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            readOnly
            value={placeholder}
          />
        </div>
        <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">搜索</button>
        <button type="button" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">重置</button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md cursor-pointer hover:bg-slate-100 transition-colors">
              {tag} <span className="text-slate-400 hover:text-slate-600 font-bold">×</span>
            </span>
          ))}
        </div>
        <button type="button" className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">更多筛选 ⌄</button>
      </div>
    </div>
  )
}

function JobCard({ job, active, onSelect }: { job: Job; active: boolean; onSelect: () => void }) {
  return (
    <article
      onClick={onSelect}
      className={`bg-white rounded-xl border p-5 cursor-pointer transition-all hover:shadow-md ${active ? 'border-blue-500 shadow-sm ring-1 ring-blue-500' : 'border-slate-200'
        }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 text-blue-600 flex items-center justify-center text-xl font-bold shadow-sm">
            {job.company.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
              <span className="bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded font-medium border border-amber-200/50">
                {job.highlight}
              </span>
            </div>
            <div className="text-sm text-slate-500 font-medium">
              {job.company} · {job.city} {job.district}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-lg font-bold text-orange-500">{job.salary}</span>
          <span className={`text-xs px-2.5 py-1 rounded font-medium ${job.level === '高匹配' ? 'bg-green-50 text-green-600 border border-green-200/50' : 'bg-blue-50 text-blue-600 border border-blue-200/50'
            }`}>
            {job.level} {job.match}%
          </span>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="bg-slate-50 px-3 py-1.5 rounded-md text-sm text-slate-600 border border-slate-100 flex-1 flex items-center">
          <span className="text-slate-400 mr-2 text-xs font-bold">经验</span>{job.experience}
        </div>
        <div className="bg-slate-50 px-3 py-1.5 rounded-md text-sm text-slate-600 border border-slate-100 flex-1 flex items-center">
          <span className="text-slate-400 mr-2 text-xs font-bold">学历</span>{job.education}
        </div>
        <div className="bg-slate-50 px-3 py-1.5 rounded-md text-sm text-slate-600 border border-slate-100 flex-1 flex items-center">
          <span className="text-slate-400 mr-2 text-xs font-bold">类别</span>{job.category}
        </div>
      </div>

      <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-50">
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-700 font-medium mr-1">岗位职责：</strong>{job.duty}
        </p>
      </div>
    </article>
  )
}

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <article className="bg-white rounded-xl border border-slate-200 p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold shadow-sm">
            {candidate.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-slate-800">
                {candidate.name}
                <span className={`ml-2 text-sm ${candidate.gender === '男' ? 'text-blue-500' : 'text-pink-500'}`}>
                  {candidate.gender === '男' ? '♂' : '♀'}
                </span>
              </h3>
              <span className="bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded font-medium border border-green-200/50">
                匹配度 {candidate.match}%
              </span>
            </div>
            <div className="text-sm text-slate-500 font-medium">
              {candidate.current} · {candidate.age}岁 · {candidate.degree} · {candidate.years}年经验
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-lg font-bold text-slate-800">{candidate.salary}</span>
          <span className="text-xs text-slate-400 font-medium">期望薪资</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {candidate.tags.map((tag) => (
          <span key={tag} className="bg-slate-50 border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium">
            {tag}
          </span>
        ))}
      </div>

      <div className="bg-green-50/50 p-3 rounded-lg border border-green-50">
        <p className="text-sm text-slate-600 leading-relaxed">
          <strong className="text-slate-700 font-medium mr-1">AI 推荐理由：</strong>{candidate.reason}
        </p>
      </div>
    </article>
  )
}

function AssistantPanel({ messages, title, stats, entity }: { messages: Message[], title: string, stats: { total: number, high: number }, entity: string }) {
  return (
    <aside className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-6rem)] sticky top-20">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
            ☻
          </div>
          <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
        </div>
        <button type="button" className="text-slate-400 hover:text-slate-600 font-bold">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-4 py-2.5 text-sm shadow-sm ${message.from === 'user'
                ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                : 'bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-sm'
              }`}>
              <p className="leading-relaxed">{message.text}</p>
              <div className={`text-[10px] mt-1 text-right ${message.from === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {message.time}
              </div>
            </div>
          </div>
        ))}

        <div className="mt-2 p-3 bg-blue-50/80 border border-blue-100 rounded-xl">
          <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            已根据意向更新推荐：
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs bg-white/60 px-2 py-1.5 rounded">
              <span className="text-slate-600 font-medium">匹配{entity}</span>
              <span className="font-bold text-blue-600">{stats.total}</span>
            </div>
            <div className="flex justify-between text-xs bg-white/60 px-2 py-1.5 rounded">
              <span className="text-slate-600 font-medium">高匹配</span>
              <span className="font-bold text-green-600">{stats.high}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/80 rounded-b-xl">
        <div className="flex gap-2 mb-3">
          <button type="button" className="flex-1 bg-white shadow-sm border border-slate-200 text-slate-600 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">调整核心期望</button>
          <button type="button" className="flex-1 bg-white shadow-sm border border-slate-200 text-slate-600 text-xs font-medium py-2 rounded-lg hover:bg-slate-50 transition-colors">换个推荐方向</button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="告诉助手您的新想法..."
            className="w-full bg-white border border-slate-300 shadow-sm rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
          />
          <button type="button" className="absolute right-2 top-2 w-7 h-7 bg-blue-600 text-white rounded font-medium flex items-center justify-center hover:bg-blue-700 transition-colors shadow-sm">
            ➤
          </button>
        </div>
      </div>
    </aside>
  )
}