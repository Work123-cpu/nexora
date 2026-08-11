import type { Product } from '@/types/entities/product'
import { createSeededRandom, seededFloat, seededInt, seededBool, daysAgoISO } from '../generators/seedRandom'
import { makeIdFactory } from '../generators/idGenerator'

const rand = createSeededRandom(3003)
const nextId = makeIdFactory('prod')

interface ProductSeed {
  name: string
  category: string
  unit: string
  priceRange: [number, number]
}

const ACCENT_COLORS = ['#4f46e5', '#0891b2', '#d97706', '#16a34a', '#db2777', '#7c3aed', '#0ea5e9', '#ea580c']

// Price ranges are realistic INR retail prices for the Indian packaged-goods market, not a blind USD relabel.
const DEFINITIONS: ProductSeed[] = [
  { name: 'Classic White Sandwich Bread', category: 'Bakery', unit: 'loaf', priceRange: [40, 55] },
  { name: 'Whole Wheat Loaf', category: 'Bakery', unit: 'loaf', priceRange: [45, 62] },
  { name: 'Multigrain Artisan Bread', category: 'Bakery', unit: 'loaf', priceRange: [65, 95] },
  { name: 'Cinnamon Raisin Bread', category: 'Bakery', unit: 'loaf', priceRange: [60, 85] },
  { name: 'Dinner Rolls (12-pack)', category: 'Bakery', unit: 'pack', priceRange: [55, 78] },
  { name: 'Chocolate Chip Cookies', category: 'Bakery', unit: 'pack', priceRange: [60, 90] },
  { name: 'Oatmeal Raisin Cookies', category: 'Bakery', unit: 'pack', priceRange: [55, 82] },
  { name: 'Blueberry Muffins (6-pack)', category: 'Bakery', unit: 'pack', priceRange: [90, 130] },
  { name: 'Vanilla Pound Cake', category: 'Bakery', unit: 'unit', priceRange: [120, 170] },
  { name: 'Glazed Donuts (6-pack)', category: 'Bakery', unit: 'pack', priceRange: [100, 140] },
  { name: 'Sparkling Lemonade', category: 'Beverages', unit: 'bottle', priceRange: [35, 55] },
  { name: 'Classic Cola', category: 'Beverages', unit: 'bottle', priceRange: [30, 45] },
  { name: 'Orange Juice (1L)', category: 'Beverages', unit: 'bottle', priceRange: [90, 130] },
  { name: 'Iced Tea — Peach', category: 'Beverages', unit: 'bottle', priceRange: [35, 55] },
  { name: 'Sparkling Mineral Water', category: 'Beverages', unit: 'bottle', priceRange: [25, 40] },
  { name: 'Energy Drink — Citrus Burst', category: 'Beverages', unit: 'can', priceRange: [60, 90] },
  { name: 'Cold Brew Coffee (Bottled)', category: 'Beverages', unit: 'bottle', priceRange: [90, 130] },
  { name: 'Potato Chips — Original', category: 'Snacks', unit: 'bag', priceRange: [40, 65] },
  { name: 'Potato Chips — Salt & Vinegar', category: 'Snacks', unit: 'bag', priceRange: [40, 65] },
  { name: 'Tortilla Corn Chips', category: 'Snacks', unit: 'bag', priceRange: [40, 60] },
  { name: 'Roasted Mixed Nuts', category: 'Snacks', unit: 'bag', priceRange: [180, 260] },
  { name: 'Pretzel Sticks', category: 'Snacks', unit: 'bag', priceRange: [40, 60] },
  { name: 'Granola Bars (8-pack)', category: 'Snacks', unit: 'pack', priceRange: [150, 210] },
  { name: 'Cheese Crackers', category: 'Snacks', unit: 'box', priceRange: [70, 100] },
  { name: 'Popcorn — Butter', category: 'Snacks', unit: 'bag', priceRange: [35, 55] },
  { name: 'Vanilla Yogurt (4-pack)', category: 'Dairy', unit: 'pack', priceRange: [110, 150] },
  { name: 'Strawberry Yogurt (4-pack)', category: 'Dairy', unit: 'pack', priceRange: [110, 150] },
  { name: 'Greek Yogurt — Plain', category: 'Dairy', unit: 'unit', priceRange: [45, 70] },
  { name: 'Mild Cheddar Block', category: 'Dairy', unit: 'unit', priceRange: [280, 380] },
  { name: 'Whipped Butter Spread', category: 'Dairy', unit: 'unit', priceRange: [130, 180] },
  { name: 'Cream Cheese Spread', category: 'Dairy', unit: 'unit', priceRange: [110, 150] },
  { name: 'Whole Milk (1 Gallon)', category: 'Dairy', unit: 'unit', priceRange: [220, 290] },
  { name: 'Strawberry Jam', category: 'Condiments', unit: 'jar', priceRange: [110, 160] },
  { name: 'Honey Mustard Sauce', category: 'Condiments', unit: 'bottle', priceRange: [90, 130] },
  { name: 'Classic Ketchup', category: 'Condiments', unit: 'bottle', priceRange: [75, 110] },
  { name: 'Mayonnaise', category: 'Condiments', unit: 'jar', priceRange: [100, 140] },
  { name: 'Barbecue Sauce', category: 'Condiments', unit: 'bottle', priceRange: [100, 140] },
  { name: 'Vanilla Extract (Retail Pack)', category: 'Condiments', unit: 'bottle', priceRange: [280, 380] },
  { name: 'Salsa — Medium Heat', category: 'Condiments', unit: 'jar', priceRange: [110, 150] },
  { name: 'Pancake Syrup', category: 'Condiments', unit: 'bottle', priceRange: [150, 200] },
]

export const products: Product[] = DEFINITIONS.map((def, index) => {
  const unitPrice = seededFloat(rand, def.priceRange[0], def.priceRange[1], 2)
  const marginPct = seededFloat(rand, 0.32, 0.52, 2)
  const unitCost = Number((unitPrice * (1 - marginPct)).toFixed(2))
  const isDiscontinued = index === DEFINITIONS.length - 1 && seededBool(rand, 0.5)

  return {
    id: nextId(),
    sku: `SKU-${String(index + 1).padStart(4, '0')}`,
    name: def.name,
    category: def.category,
    description: `${def.name} — produced in-house and distributed across all regional warehouses.`,
    unitOfMeasure: def.unit,
    unitPrice,
    unitCost,
    status: isDiscontinued ? 'discontinued' : seededBool(rand, 0.94) ? 'active' : 'inactive',
    hasBOM: false,
    accentColor: ACCENT_COLORS[index % ACCENT_COLORS.length]!,
    createdAt: daysAgoISO(seededInt(rand, 30, 500)),
    updatedAt: daysAgoISO(seededInt(rand, 0, 29)),
  }
})

export const PRODUCT_CATEGORIES = Array.from(new Set(products.map((p) => p.category)))

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}
