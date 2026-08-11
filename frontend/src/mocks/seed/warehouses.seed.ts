import type { Warehouse } from '@/types/entities/warehouse'
import { createSeededRandom, seededInt, seededPick } from '../generators/seedRandom'
import { makeIdFactory } from '../generators/idGenerator'

const rand = createSeededRandom(5005)
const nextId = makeIdFactory('wh')

interface WarehouseSeed {
  name: string
  code: string
  type: Warehouse['type']
  city: string
  state: string
  country: string
}

const DEFINITIONS: WarehouseSeed[] = [
  { name: 'Main Distribution Center', code: 'WH-MH-01', type: 'mixed', city: 'Pune', state: 'Maharashtra', country: 'India' },
  { name: 'West Zone Fulfillment Hub', code: 'WH-GJ-02', type: 'finished-goods', city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
  { name: 'Raw Material Depot', code: 'WH-HR-03', type: 'raw-material', city: 'Karnal', state: 'Haryana', country: 'India' },
  { name: 'Cold Storage Facility', code: 'WH-KA-04', type: 'cold-storage', city: 'Bengaluru', state: 'Karnataka', country: 'India' },
  { name: 'South Zone Regional Hub', code: 'WH-TN-05', type: 'mixed', city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
]

const MANAGERS = ['Meera Krishnan', 'Rohan Deshmukh', 'Priya Subramaniam', 'Sanjay Kulkarni', 'Ritu Bansal']

export const warehouses: Warehouse[] = DEFINITIONS.map((def, i) => {
  const capacityUnits = seededInt(rand, 40000, 120000)
  const usedUnits = Math.round(capacityUnits * seededInt(rand, 55, 96) / 100)
  return {
    id: nextId(),
    name: def.name,
    code: def.code,
    type: def.type,
    city: def.city,
    state: def.state,
    country: def.country,
    managerName: MANAGERS[i]!,
    capacityUnits,
    usedUnits,
    status: usedUnits / capacityUnits > 0.93 ? 'at-capacity' : seededPick(rand, ['operational', 'operational', 'operational', 'maintenance']),
  }
})

export function getWarehouseById(id: string): Warehouse | undefined {
  return warehouses.find((w) => w.id === id)
}
