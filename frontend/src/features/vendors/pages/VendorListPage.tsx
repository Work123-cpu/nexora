import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, MapPin, Phone, Plus, Truck } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { SearchInput } from '@/shared/ui/SearchInput'
import { FilterBar, FilterChip } from '@/shared/ui/FilterBar'
import { Card, CardContent } from '@/shared/ui/Card'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { IconButton } from '@/shared/ui/IconButton'
import { Select } from '@/shared/ui/Select'
import { StatCard } from '@/shared/ui/StatCard'
import { RoleGuard } from '@/app/router/RoleGuard'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { formatNumber } from '@/shared/lib/formatters'
import { useVendors } from '../hooks/useVendors'
import { VendorRatingStars } from '../components/VendorRatingStars'

const STATUS_TONE = { active: 'success', 'under-review': 'warning', inactive: 'neutral' } as const

const SORT_OPTIONS = [
  { label: 'Name', value: 'name' },
  { label: 'Category', value: 'category' },
  { label: 'City', value: 'city' },
  { label: 'Rating', value: 'rating' },
  { label: 'Lead time', value: 'leadTimeDays' },
]

export function VendorListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const debouncedSearch = useDebounce(search)
  const { data } = useVendors({ search: debouncedSearch, category, pageSize: 50, sortBy, sortDir })
  // Stat cards and category filter chips summarize every vendor, not just this page's results.
  const { data: allData } = useVendors({ pageSize: 10000 })

  const allVendors = allData?.items ?? []
  const CATEGORIES = Array.from(new Set(allVendors.map((v) => v.category)))
  const activeCount = allVendors.filter((v) => v.status === 'active').length
  const avgRating = allVendors.length > 0 ? allVendors.reduce((sum, v) => sum + v.rating, 0) / allVendors.length : 0

  return (
    <div>
      <PageHeader
        title="Vendors"
        description="Manage supplier relationships, performance, and lead times."
        actions={
          <RoleGuard resource="vendors" action="create">
            <Button leftIcon={<Plus className="size-4" />} onClick={() => navigate('/app/vendors/new')}>
              Add Vendor
            </Button>
          </RoleGuard>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Vendors" value={formatNumber(allVendors.length)} icon={<Truck className="size-5" />} tone="primary" />
        <StatCard label="Active Vendors" value={formatNumber(activeCount)} tone="success" />
        <StatCard label="Average Rating" value={avgRating.toFixed(1)} tone="warning" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search vendors by name, category, or city…" className="sm:max-w-sm" />
        <div className="flex items-center gap-2">
          <Select className="h-9 w-36" value={sortBy} onChange={(e) => setSortBy(e.target.value)} options={SORT_OPTIONS} />
          <IconButton
            icon={sortDir === 'asc' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
            variant="default"
            aria-label={sortDir === 'asc' ? 'Sorted ascending — click for descending' : 'Sorted descending — click for ascending'}
            onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          />
        </div>
      </div>

      <div className="mb-4">
        <FilterBar>
          <FilterChip active={!category} onClick={() => setCategory(undefined)}>
            All categories
          </FilterChip>
          {CATEGORIES.map((cat) => (
            <FilterChip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
              {cat}
            </FilterChip>
          ))}
        </FilterBar>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.items.map((vendor) => (
          <Link key={vendor.id} to={`/app/vendors/${vendor.id}`}>
            <Card interactive tilt className="h-full">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{vendor.category}</p>
                  </div>
                  <Badge tone={STATUS_TONE[vendor.status]} className="capitalize">
                    {vendor.status.replace('-', ' ')}
                  </Badge>
                </div>

                <div className="mt-2">
                  <VendorRatingStars rating={vendor.rating} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" /> {vendor.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" /> {vendor.leadTimeDays}d lead
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-xs">
                  <span className="text-muted-foreground">
                    On-time <strong className="text-foreground">{vendor.onTimeDeliveryPct}%</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Quality <strong className="text-foreground">{vendor.qualityScorePct}%</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
