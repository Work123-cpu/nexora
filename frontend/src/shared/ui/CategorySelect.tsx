import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { getCategories, addCategory } from '@/shared/lib/categoryStore'

interface CategorySelectProps {
  label?: string
  storageKey: string
  defaults: readonly string[]
  value: string
  onChange: (category: string) => void
  error?: string
}

/**
 * A category combobox: type to filter existing categories, or just keep typing something
 * that isn't in the list and it's created on commit (Enter, blur, or clicking the "Add"
 * suggestion) — no separate "new category" mode to find first. Replaces the old two-step
 * select-or-add-new-input toggle, which buried free text entry behind a small link.
 */
export function CategorySelect({ label = 'Category', storageKey, defaults, value, onChange, error }: CategorySelectProps) {
  const [categories, setCategories] = useState(() => getCategories(storageKey, defaults))
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setQuery(value)
  }, [value])

  const filtered = categories.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()))
  const exactMatch = categories.some((c) => c.toLowerCase() === query.trim().toLowerCase())

  const commit = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setQuery(value)
      return
    }
    if (!categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategories(addCategory(storageKey, trimmed, defaults))
    }
    onChange(trimmed)
    setQuery(trimmed)
  }

  const select = (category: string) => {
    onChange(category)
    setQuery(category)
    setOpen(false)
  }

  return (
    <div className="relative space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground" htmlFor={`category-${storageKey}`}>
          {label}
        </label>
      )}
      <input
        id={`category-${storageKey}`}
        className={cn(
          'h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground transition-colors focus-ring focus:border-primary',
          error && 'border-danger focus:border-danger',
        )}
        value={query}
        placeholder="Type to search or add a category…"
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit(query)
            setOpen(false)
            e.currentTarget.blur()
          } else if (e.key === 'Escape') {
            setQuery(value)
            setOpen(false)
            e.currentTarget.blur()
          }
        }}
        onBlur={() => {
          blurTimeout.current = setTimeout(() => {
            commit(query)
            setOpen(false)
          }, 150)
        }}
      />

      {open && (
        <div
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-surface py-1 card-shadow-lg"
          onMouseDown={(e) => {
            // Prevent the input's onBlur from committing/closing before a click below registers.
            e.preventDefault()
            if (blurTimeout.current) clearTimeout(blurTimeout.current)
          }}
        >
          {filtered.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                'block w-full px-3.5 py-2 text-left text-sm text-foreground hover:bg-surface-elevated',
                c === value && 'text-primary',
              )}
              onClick={() => select(c)}
            >
              {c}
            </button>
          ))}
          {query.trim() && !exactMatch && (
            <button
              type="button"
              className="flex w-full items-center gap-1.5 border-t border-border px-3.5 py-2 text-left text-sm font-medium text-primary hover:bg-surface-elevated"
              onClick={() => {
                commit(query)
                setOpen(false)
              }}
            >
              <Plus className="size-3.5" /> Add "{query.trim()}"
            </button>
          )}
          {filtered.length === 0 && !query.trim() && <div className="px-3.5 py-2 text-sm text-muted-foreground">Start typing to add a category</div>}
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
