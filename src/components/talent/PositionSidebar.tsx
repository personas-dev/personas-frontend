interface PositionSidebarProps {
  positions: string[]
  selected: string
  onSelect: (pos: string) => void
}

export function PositionSidebar({ positions, selected, onSelect }: PositionSidebarProps) {
  return (
    <div className="w-64 shrink-0 flex flex-col gap-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h2 className="font-bold text-slate-800 mb-4">企业发布岗位</h2>
        <div className="flex flex-col gap-2">
          {positions.map((pos) => (
            <button
              key={pos}
              type="button"
              data-testid={`position-option-${pos}`}
              onClick={() => onSelect(pos)}
              className={`text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${selected === pos
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
  )
}
