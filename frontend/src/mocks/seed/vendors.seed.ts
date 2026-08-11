import type { Vendor } from '@/types/entities/vendor'
import { createSeededRandom, seededFloat, seededInt, seededPick, daysAgoISO } from '../generators/seedRandom'
import { VENDOR_IDS } from './vendorIds'
import { rawMaterials } from './rawMaterials.seed'

const rand = createSeededRandom(2002)

const INDIAN_CONTACTS = [
  'Priya Nair',
  'Aarav Sharma',
  'Ananya Iyer',
  'Rohan Mehta',
  'Kavya Reddy',
  'Vikram Singh',
  'Sneha Patel',
  'Arjun Rao',
  'Divya Krishnan',
  'Karan Malhotra',
]

const IMPORT_CONTACTS = ['Jean-Baptiste Kouassi', 'Rina Andriamana', 'Nuwan Perera', 'Thi Minh Tran']

interface VendorSeed {
  id: string
  name: string
  category: string
  city: string
  state: string
  country: string
  status?: Vendor['status']
  imported?: boolean
}

// Most suppliers are domestic Indian vendors clustered near where each ingredient is actually
// produced in India; a few (cocoa, vanilla, true cinnamon) are realistically imported, since
// those aren't commercially grown at scale domestically.
const DEFINITIONS: VendorSeed[] = [
  { id: VENDOR_IDS.goldenFieldsGrain, name: 'Golden Fields Grain Co.', category: 'Grains', city: 'Karnal', state: 'Haryana', country: 'India' },
  { id: VENDOR_IDS.prairieDairyCoop, name: 'Prairie Dairy Cooperative', category: 'Dairy', city: 'Anand', state: 'Gujarat', country: 'India' },
  { id: VENDOR_IDS.sweetSourceIngredients, name: 'SweetSource Ingredients', category: 'Sweeteners', city: 'Kanpur', state: 'Uttar Pradesh', country: 'India' },
  { id: VENDOR_IDS.ecoPackPackaging, name: 'EcoPack Packaging Solutions', category: 'Packaging', city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
  { id: VENDOR_IDS.purefreshOils, name: 'PureFresh Oils Ltd.', category: 'Oils', city: 'Indore', state: 'Madhya Pradesh', country: 'India' },
  { id: VENDOR_IDS.atlanticFruitCo, name: 'Atlantic Fruit Co.', category: 'Fruits', city: 'Nashik', state: 'Maharashtra', country: 'India' },
  { id: VENDOR_IDS.cocoalineTraders, name: 'Cocoaline Traders', category: 'Flavorings', city: 'Abidjan', state: 'Abidjan', country: "Côte d'Ivoire", imported: true },
  { id: VENDOR_IDS.spiceRouteImports, name: 'Spice Route Imports', category: 'Flavorings', city: 'Colombo', state: 'Western Province', country: 'Sri Lanka', imported: true },
  { id: VENDOR_IDS.crystalSaltWorks, name: 'Crystal Salt Works', category: 'Additives', city: 'Kutch', state: 'Gujarat', country: 'India' },
  { id: VENDOR_IDS.nutshellSupply, name: 'Nutshell Supply Partners', category: 'Additives', city: 'Nagpur', state: 'Maharashtra', country: 'India', status: 'under-review' },
  { id: VENDOR_IDS.bluewaterBeverageCo, name: 'Bluewater Beverage Supply', category: 'Beverages', city: 'Pune', state: 'Maharashtra', country: 'India' },
  { id: VENDOR_IDS.heritageGrainMill, name: 'Heritage Grain Mill', category: 'Grains', city: 'Ludhiana', state: 'Punjab', country: 'India' },
  { id: VENDOR_IDS.freshfieldsFarms, name: 'Freshfields Farms Collective', category: 'Fruits', city: 'Shimla', state: 'Himachal Pradesh', country: 'India' },
  { id: VENDOR_IDS.glassAndGlazeContainers, name: 'Glass & Glaze Containers', category: 'Packaging', city: 'Firozabad', state: 'Uttar Pradesh', country: 'India' },
  { id: VENDOR_IDS.premiumAdditivesLtd, name: 'Premium Additives Ltd.', category: 'Additives', city: 'Vadodara', state: 'Gujarat', country: 'India' },
  { id: VENDOR_IDS.sunriseYeastCo, name: 'Sunrise Yeast Co.', category: 'Additives', city: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  { id: VENDOR_IDS.metroColdChainLogistics, name: 'Metro Cold Chain Logistics', category: 'Logistics', city: 'Bengaluru', state: 'Karnataka', country: 'India', status: 'inactive' },
  { id: VENDOR_IDS.greenLeafFlavors, name: 'Green Leaf Flavors', category: 'Flavorings', city: 'Antananarivo', state: 'Analamanga', country: 'Madagascar', imported: true },
  { id: VENDOR_IDS.ironclad_Preservatives, name: 'Ironclad Preservatives Inc.', category: 'Additives', city: 'Surat', state: 'Gujarat', country: 'India' },
  { id: VENDOR_IDS.westcoastCartonWorks, name: 'Westcoast Carton Works', category: 'Packaging', city: 'Rajkot', state: 'Gujarat', country: 'India' },
  { id: VENDOR_IDS.royalHoneyCooperative, name: 'Royal Honey Cooperative', category: 'Sweeteners', city: 'Jaipur', state: 'Rajasthan', country: 'India' },
  { id: VENDOR_IDS.clearstreamWaterCo, name: 'Clearstream Water Co.', category: 'Additives', city: 'Bhopal', state: 'Madhya Pradesh', country: 'India' },
]

function contactHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 14)
}

function indianPhone(rand: () => number): string {
  return `+91-${seededInt(rand, 70000, 99999)}-${seededInt(rand, 10000, 99999)}`
}

function internationalPhone(rand: () => number): string {
  return `+${seededInt(rand, 20, 95)}-${seededInt(rand, 200, 999)}-${seededInt(rand, 1000, 9999)}`
}

export const vendors: Vendor[] = DEFINITIONS.map((def) => {
  const materialsSupplied = rawMaterials.filter((rm) => rm.primaryVendorId === def.id).map((rm) => rm.id)
  const status = def.status ?? 'active'
  const contactName = def.imported ? seededPick(rand, IMPORT_CONTACTS) : seededPick(rand, INDIAN_CONTACTS)

  return {
    id: def.id,
    name: def.name,
    category: def.category,
    contactName,
    email: `sales@${contactHandle(def.name)}.com`,
    phone: def.imported ? internationalPhone(rand) : indianPhone(rand),
    city: def.city,
    country: def.country,
    rating: seededFloat(rand, status === 'under-review' ? 2.4 : 3.4, 5, 1),
    onTimeDeliveryPct: seededFloat(rand, status === 'under-review' ? 55 : 82, 99, 0),
    qualityScorePct: seededFloat(rand, status === 'under-review' ? 58 : 84, 99, 0),
    leadTimeDays: seededInt(rand, def.imported ? 12 : 2, def.imported ? 35 : 14),
    activeContracts: seededInt(rand, 1, 6),
    materialsSupplied,
    status,
    createdAt: daysAgoISO(seededInt(rand, 90, 900)),
  }
})

export function getVendorById(id: string): Vendor | undefined {
  return vendors.find((v) => v.id === id)
}
