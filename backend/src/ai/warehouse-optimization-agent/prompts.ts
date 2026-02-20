export const ANALYSIS_PROMPT = (warehouses: any[], inventoryData: any[]) => `
You are a warehouse optimization expert analyzing multi-warehouse inventory distribution.

**Warehouse Capacity Information:**
${warehouses.map(wh => `
- ${wh.name} (${wh.code}) - ${wh.location.city}, ${wh.location.state}
  Capacity: ${wh.usedCapacity}/${wh.totalCapacity} units (${wh.utilizationPercent.toFixed(1)}% utilized)
`).join('\n')}

**Inventory Distribution:**
${inventoryData.map(invData => `
${invData.warehouseName}:
${invData.products.slice(0, 10).map((p: any) =>
  `  - ${p.productName} (${p.sku}): Stock=${p.currentStock}, Reorder Point=${p.reorderPoint}`
).join('\n')}
${invData.products.length > 10 ? `  ... and ${invData.products.length - 10} more products` : ''}
`).join('\n')}

**Task:** Analyze the warehouse distribution and identify optimization opportunities.

**IMPORTANT:** You must return ONLY valid JSON with no additional text or explanation. Do not wrap the JSON in markdown code blocks.

Return this exact JSON structure:
{
  "overstockedWarehouses": ["warehouse codes that have excess capacity usage"],
  "understockedWarehouses": ["warehouse codes that are underutilized"],
  "imbalancedProducts": ["product SKUs that have poor distribution across warehouses"],
  "insights": [
    "insight 1: specific observation about capacity imbalance",
    "insight 2: specific observation about product distribution",
    "insight 3: specific observation about optimization potential"
  ]
}

Consider:
- Capacity utilization balance (target: 60-80% per warehouse)
- Product availability across multiple locations for redundancy
- Stock levels vs reorder points (overstocked = significantly above reorder point)
- Geographic distribution efficiency
`;

export const OPTIMIZATION_PROMPT = (
  warehouses: any[],
  inventoryData: any[],
  analysis: any
) => `
You are a warehouse optimization expert. Generate specific transfer recommendations to optimize inventory distribution.

**Current Analysis:**
- Overstocked: ${analysis.overstockedWarehouses?.join(', ') || 'None'}
- Understocked: ${analysis.understockedWarehouses?.join(', ') || 'None'}
- Imbalanced products: ${analysis.imbalancedProducts?.join(', ') || 'None'}

**Key Insights:**
${analysis.insights?.map((insight: string) => `- ${insight}`).join('\n')}

**Available Warehouses:**
${warehouses.map(wh => `
${wh.name} (${wh.code}) - ${wh.location.city}, ${wh.location.state}
Utilization: ${wh.utilizationPercent.toFixed(1)}%
`).join('\n')}

**Task:** Generate 3-5 high-impact transfer recommendations.

**IMPORTANT:** You must return ONLY valid JSON with no additional text or explanation. Do not wrap the JSON in markdown code blocks.

Return this exact JSON structure:
{
  "recommendations": [
    {
      "productSku": "SKU code",
      "fromWarehouseCode": "source warehouse code",
      "toWarehouseCode": "destination warehouse code",
      "quantity": number (must be positive integer),
      "reason": "Clear explanation of why this transfer optimizes distribution",
      "estimatedCostSaving": number (estimated annual savings in dollars)
    }
  ],
  "summary": "2-3 sentence executive summary of the optimization strategy",
  "predictedCostReduction": number (percentage, 0-100),
  "predictedCapacityImprovement": number (percentage, 0-100)
}

**Guidelines:**
- Prioritize transfers that balance capacity utilization
- Consider geographic redundancy (spread inventory across locations)
- Move excess stock from overstocked warehouses to understocked ones
- Ensure transfers don't drop source warehouse below safety stock
- Estimate cost savings based on reduced storage costs and improved distribution
- Keep recommendations practical (3-5 transfers, not too many)
- Generate realistic quantity recommendations based on actual stock levels
`;
