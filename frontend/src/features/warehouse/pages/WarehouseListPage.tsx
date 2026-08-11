import { Link, useNavigate } from 'react-router-dom'
import { Boxes, MapPin, Plus, User, Warehouse as WarehouseIcon } from 'lucide-react'
import { PageHeader } from '@/shared/ui/layout/PageHeader'
import { Card, CardContent } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { StatCard } from '@/shared/ui/StatCard'
import { Badge } from '@/shared/ui/Badge'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { RoleGuard } from '@/app/router/RoleGuard'
import { formatNumber, formatPercent } from '@/shared/lib/formatters'
import { useWarehouses } from '../hooks/useWarehouses'

const TYPE_LABEL: Record<string, string> = {
  'raw-material': 'Raw Material',
  'finished-goods': 'Finished Goods',
  mixed: 'Mixed Use',
  'cold-storage': 'Cold Storage',
}

export function WarehouseListPage() {
  const navigate = useNavigate()
  const { data } = useWarehouses({ pageSize: 20 })
  const warehouses = data?.items ?? []

  const totalCapacity = warehouses.reduce((sum, w) => sum + w.capacityUnits, 0)
  const totalUsed = warehouses.reduce((sum, w) => sum + w.usedUnits, 0)
  const avgUtilization = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0
  const operational = warehouses.filter((w) => w.status === 'operational').length

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="Manage warehouse locations, capacity, and operational status."
        actions={
          <RoleGuard resource="warehouses" action="create">
            <Button leftIcon={<Plus className="size-4" />} onClick={() => navigate('/app/inventory/warehouses/new')}>
              Add Warehouse
            </Button>
          </RoleGuard>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Warehouses" value={formatNumber(warehouses.length)} icon={<WarehouseIcon className="size-5" />} tone="primary" />
        <StatCard label="Average Utilization" value={formatPercent(avgUtilization, 0)} icon={<Boxes className="size-5" />} tone="warning" />
        <StatCard label="Operational" value={`${operational} / ${warehouses.length}`} icon={<Boxes className="size-5" />} tone="success" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((wh) => {
          const pct = (wh.usedUnits / wh.capacityUnits) * 100
          return (
            <Link key={wh.id} to={`/app/inventory/warehouses/${wh.id}`}>
              <Card interactive tilt className="h-full">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <WarehouseIcon className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{wh.name}</p>
                        <p className="text-xs text-muted-foreground">{wh.code}</p>
                      </div>
                    </div>
                    <Badge tone={wh.status === 'operational' ? 'success' : wh.status === 'at-capacity' ? 'danger' : 'warning'} className="capitalize">
                      {wh.status.replace('-', ' ')}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="size-3.5" /> {wh.city}, {wh.state}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <User className="size-3.5" /> {wh.managerName}
                    </p>
                    <Badge tone="neutral">{TYPE_LABEL[wh.type]}</Badge>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>{formatNumber(wh.usedUnits)} used</span>
                      <span>{formatNumber(wh.capacityUnits)} capacity</span>
                    </div>
                    <ProgressBar value={pct} tone={pct > 90 ? 'danger' : pct > 75 ? 'warning' : 'success'} showLabel />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
