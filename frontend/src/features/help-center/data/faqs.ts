export interface FAQ {
  question: string
  answer: string
}

export const FAQS: FAQ[] = [
  {
    question: 'How does Nexora decide what to reorder?',
    answer:
      'Nexora compares current inventory levels against safety stock and reorder points calculated from your usage history and supplier lead times. A recommendation only appears when stock is projected to run low before the next delivery could arrive.',
  },
  {
    question: 'Why don\'t I see a recommendation for a commodity in the news?',
    answer:
      'Nexora only surfaces market events that affect raw materials your business actually uses — determined by your Products → BOM → Raw Materials chain. If an event has no linked material, it\'s filtered out automatically.',
  },
  {
    question: 'Can the AI place orders automatically?',
    answer:
      'No. Nexora can prepare a recommended purchase order, but every action requires your explicit approval in the AI Action Center before anything is created or submitted.',
  },
  {
    question: 'How is my confidence score calculated?',
    answer:
      'Confidence scores reflect how far current data deviates from safe thresholds — for example, how far below the reorder point an item has fallen, combined with supplier lead time.',
  },
  {
    question: 'What happens if I don\'t set up a Bill of Materials for a product?',
    answer:
      'Products without a BOM won\'t generate raw-material requirement calculations or scrap-adjusted cost estimates, but they still work fully across Inventory, Procurement, and Reports.',
  },
  {
    question: 'Is my data connected to a real database yet?',
    answer:
      'This build runs on a realistic mock data layer designed so a real backend can be connected later with minimal changes — no functionality will need to be rebuilt.',
  },
]
