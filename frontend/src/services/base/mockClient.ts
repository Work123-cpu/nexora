import type { PaginatedResponse, QueryParams } from './types'
import { ApiError } from './types'

const DEFAULT_LATENCY_MS = Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 350)

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface MockRequestOptions {
  latencyMs?: number
  errorRate?: number
  signal?: AbortSignal
}

/**
 * Every feature service routes through here so latency/error simulation and the
 * eventual backend swap both happen in one place instead of per-call.
 */
async function request<T>(resolver: () => T, options?: MockRequestOptions): Promise<T> {
  const jitter = Math.random() * 150
  await delay((options?.latencyMs ?? DEFAULT_LATENCY_MS) + jitter)

  if (options?.signal?.aborted) {
    throw new ApiError(0, 'Request aborted')
  }

  if (options?.errorRate && Math.random() < options.errorRate) {
    throw new ApiError(500, 'Simulated mock service error')
  }

  const result = resolver()
  return typeof result === 'object' && result !== null ? structuredClone(result) : result
}

function matchesSearch<T>(item: T, search: string, keys: (keyof T)[]): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return keys.some((key) => String(item[key] ?? '').toLowerCase().includes(needle))
}

interface PaginateOptions<T> extends QueryParams {
  searchKeys?: (keyof T)[]
  filter?: (item: T) => boolean
}

export function paginateFilterSort<T>(
  source: readonly T[],
  options: PaginateOptions<T> = {},
): PaginatedResponse<T> {
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

export function findOrThrow<T extends { id: string }>(source: readonly T[], id: string): T {
  const found = source.find((item) => item.id === id)
  if (!found) throw new ApiError(404, `Resource with id "${id}" not found`)
  return found
}

export function insertMock<T>(source: T[], item: T): T {
  source.unshift(item)
  return item
}

export function updateMock<T extends { id: string }>(source: T[], id: string, patch: Partial<T>): T {
  const index = source.findIndex((item) => item.id === id)
  if (index === -1) throw new ApiError(404, `Resource with id "${id}" not found`)
  source[index] = { ...source[index], ...patch } as T
  return source[index]
}

export function removeMock<T extends { id: string }>(source: T[], id: string): void {
  const index = source.findIndex((item) => item.id === id)
  if (index === -1) throw new ApiError(404, `Resource with id "${id}" not found`)
  source.splice(index, 1)
}

export const mockClient = { request }
