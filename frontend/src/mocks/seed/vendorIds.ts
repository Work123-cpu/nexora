/**
 * Vendor identifiers live here (separate from vendors.seed.ts) so raw material
 * seed data can reference a `primaryVendorId` without creating a circular
 * import between vendors.seed.ts <-> rawMaterials.seed.ts.
 */
export const VENDOR_IDS = {
  goldenFieldsGrain: 'vendor-0001',
  prairieDairyCoop: 'vendor-0002',
  sweetSourceIngredients: 'vendor-0003',
  ecoPackPackaging: 'vendor-0004',
  purefreshOils: 'vendor-0005',
  atlanticFruitCo: 'vendor-0006',
  cocoalineTraders: 'vendor-0007',
  spiceRouteImports: 'vendor-0008',
  crystalSaltWorks: 'vendor-0009',
  nutshellSupply: 'vendor-0010',
  bluewaterBeverageCo: 'vendor-0011',
  heritageGrainMill: 'vendor-0012',
  freshfieldsFarms: 'vendor-0013',
  glassAndGlazeContainers: 'vendor-0014',
  premiumAdditivesLtd: 'vendor-0015',
  sunriseYeastCo: 'vendor-0016',
  metroColdChainLogistics: 'vendor-0017',
  greenLeafFlavors: 'vendor-0018',
  ironclad_Preservatives: 'vendor-0019',
  westcoastCartonWorks: 'vendor-0020',
  royalHoneyCooperative: 'vendor-0021',
  clearstreamWaterCo: 'vendor-0022',
} as const
