import { Input, Button } from 'antd'
import type { SearchFilter } from '../../types/domain'

const { Search } = Input

interface SearchToolbarProps {
	testIdPrefix: string
	placeholder: string
	query: string
	filters: SearchFilter[]
	activeFilterIds: string[]
	onQueryChange: (query: string) => void
	onSearch: () => void
	onToggleFilter: (filterId: string) => void
	onReset: () => void
}

export function SearchToolbar({
	testIdPrefix,
	placeholder,
	query,
	filters,
	activeFilterIds,
	onQueryChange,
	onSearch,
	onToggleFilter,
	onReset,
}: SearchToolbarProps) {
	return (
		<div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
			<div className="flex gap-2">
				<div className="flex-1">
					<Search
						data-testid={`${testIdPrefix}-search-input`}
						placeholder={placeholder}
						value={query}
						allowClear
						enterButton={<Button type="primary">搜索</Button>}
						onChange={(e) => onQueryChange(e.target.value)}
						onSearch={() => onSearch()}
					/>
				</div>
				<Button
					data-testid={`${testIdPrefix}-reset-filters-button`}
					onClick={onReset}
				>
					重置
				</Button>
			</div>

			<div className="flex items-center justify-between">
				<div className="flex gap-2 flex-wrap">
					{filters.map((filter) => {
						const active = activeFilterIds.includes(filter.id)
						return (
							<button
								key={filter.id}
								type="button"
								data-testid={`${testIdPrefix}-filter-chip-${filter.id}`}
								aria-pressed={active}
								onClick={() => onToggleFilter(filter.id)}
								className={`inline-flex items-center gap-1 border text-xs px-2.5 py-1 rounded-md cursor-pointer transition-colors ${active
									? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
									: 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
									}`}
							>
								{filter.label}
								<span className={`font-bold ${active ? 'text-blue-500' : 'text-slate-400'}`}>
									{active ? '✓' : '×'}
								</span>
							</button>
						)
					})}
				</div>
				<button type="button" className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors">
					更多筛选 ⌄
				</button>
			</div>
		</div>
	)
}
