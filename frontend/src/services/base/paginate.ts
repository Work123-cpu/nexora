import type { PaginatedResponse, QueryParams } from './types'

function matchesSearch<T>(item: T, search: string, keys: (keyof T)[]): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return keys.some((key) => String(item[key] ?? '').toLowerCase().includes(needle))
}

interface PaginateOptions<T> extends QueryParams {
  searchKeys?: (keyof T)[]
  filter?: (item: T) => boolean
}

/** Client-side pagination/filter/sort over a full list — the backend's list endpoints return
 * everything, so every service applies this the same way regardless of which entity it's for. */
export function paginateFilterSort<T>(source: readonly T[], options: PaginateOptions<T> = {}): PaginatedResponse<T> {
  const { page = 1, pageSize = 10, search, searchKeys = [], filter, sortBy, sortDir = 'asc' } = options

  let items = [...source]

  if (filter) items = items.filter(filter)
  if (search && searchKeys.length > 0) items = items.filter((item) => matchesSearch(item, search, searchKeys))

  if (sortBy) {
    items.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortBy]
      const bv = (b as Record<string, unknown>)[sortBy]
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)

  return { items: pageItems, page, pageSize, total, totalPages }
}
