interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const navItems = ['人找岗', '岗找人', '报表中心', '系统管理']
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-content-max mx-auto px-4 h-16 flex items-center justify-between">
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
