/**
 * Per-browser custom category taxonomy, layered on top of the seed defaults.
 *
 * Category lists (product categories, raw material categories) were previously
 * hardcoded arrays derived from the bakery seed data, which meant a company in a
 * different industry had no way to add a category that fits their business. This
 * persists additions in localStorage per `storageKey` so any company can extend the
 * list from the form itself, without needing a backend.
 */

const STORAGE_PREFIX = 'nexora.custom-categories.'

function readCustom(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + storageKey)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeCustom(storageKey: string, categories: string[]): void {
  localStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(categories))
}

export function getCategories(storageKey: string, defaults: readonly string[]): string[] {
  return Array.from(new Set([...defaults, ...readCustom(storageKey)]))
}

export function addCategory(storageKey: string, category: string, defaults: readonly string[]): string[] {
  const trimmed = category.trim()
  if (!trimmed) return getCategories(storageKey, defaults)

  const custom = readCustom(storageKey)
  if (!custom.includes(trimmed) && !defaults.includes(trimmed)) {
    writeCustom(storageKey, [...custom, trimmed])
  }
  return getCategories(storageKey, defaults)
}
