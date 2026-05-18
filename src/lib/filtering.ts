import type { SearchFilter } from '../types/domain'

export function normalizeText(value: string): string {
	return value.replace(/\s+/g, ' ').trim().toLowerCase()
}

export function matchesQuery(searchText: string, query: string): boolean {
	const q = normalizeText(query)
	if (q === '') return true
	return normalizeText(searchText).includes(q)
}

export function matchesActiveFilters(
	itemFilterTags: string[],
	activeFilterIds: string[],
	filters: SearchFilter[]
): boolean {
	const activeLabels = new Set(
		filters
			.filter((f) => activeFilterIds.includes(f.id))
			.map((f) => f.label)
	)
	if (activeLabels.size === 0) return true
	return [...activeLabels].every((label) => itemFilterTags.includes(label))
}
