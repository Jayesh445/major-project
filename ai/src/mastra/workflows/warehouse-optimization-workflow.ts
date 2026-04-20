import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { minimaxHTTP } from '../models/minimax-http.js';
import { getActiveWarehouses, getAllInventory, saveWarehouseOptimization } from '../api-client.js';

// ── Step 1: Fetch warehouse data directly via backend API ─────────────────────
const fetchWarehousesStep = createStep({
  id: 'fetch-warehouses',
  description: 'Fetches all active warehouses with capacity data',
  inputSchema: z.object({}),
  outputSchema: z.object({
    warehouses: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        code: z.string(),
        totalCapacity: z.number(),
        usedCapacity: z.number(),
        utilizationPercent: z.number(),
        location: z.object({ city: z.string(), state: z.string() }),
      })
    ),
  }),
  execute: async () => {
    console.log('Step 1: Fetching warehouse data...');

    const raw = await getActiveWarehouses();

    if (raw.length < 2) {
      throw new Error('Insufficient warehouses: need at least 2 for optimization');
    }

    const warehouses = raw.map((wh) => ({
      id: wh._id.toString(),
      name: wh.name,
      code: wh.code,
      totalCapacity: wh.totalCapacity,
      usedCapacity: wh.usedCapacity,
      utilizationPercent:
        wh.totalCapacity > 0 ? (wh.usedCapacity / wh.totalCapacity) * 100 : 0,
      location: { city: wh.location.city, state: wh.location.state },
    }));

    console.log(`✓ Fetched ${warehouses.length} active warehouses`);
    return { warehouses };
  },
});

// ── Step 2: Fetch inventory data directly via backend API ─────────────────────
const fetchInventoryStep = createStep({
  id: 'fetch-inventory',
  description: 'Fetches inventory data for all warehouses',
  inputSchema: z.object({
    warehouses: z.array(z.any()),
  }),
  outputSchema: z.object({
    warehouses: z.array(z.any()),
    inventoryData: z.array(
      z.object({
        warehouseId: z.string(),
        warehouseName: z.string(),
        products: z.array(
          z.object({
            productId: z.string(),
            productName: z.string(),
            sku: z.string(),
            currentStock: z.number(),
            availableStock: z.number(),
            reorderPoint: z.number(),
            safetyStock: z.number(),
          })
        ),
      })
    ),
  }),
  execute: async ({ inputData }) => {
    console.log('Step 2: Fetching inventory data...');

    const inventories = await getAllInventory();

    // Filter for active products and warehouses, group by warehouse
    const active = inventories.filter(
      (inv: any) => inv.product?.isActive && inv.warehouse?.isActive
    );

    if (active.length === 0) {
      throw new Error('No inventory data available');
    }

    const warehouseMap = new Map<string, any>();
    active.forEach((inv: any) => {
      const whId = inv.warehouse._id.toString();
      if (!warehouseMap.has(whId)) {
        warehouseMap.set(whId, {
          warehouseId: whId,
          warehouseName: inv.warehouse.name,
          products: [],
        });
      }
      warehouseMap.get(whId).products.push({
        productId: inv.product._id.toString(),
        productName: inv.product.name,
        sku: inv.product.sku,
        currentStock: inv.currentStock,
        availableStock: inv.availableStock,
        reorderPoint: inv.reorderPoint,
        safetyStock: inv.safetyStock,
      });
    });

    const inventoryData = Array.from(warehouseMap.values());
    console.log(`✓ Fetched inventory data for ${inventoryData.length} warehouses`);

    return { warehouses: inputData.warehouses, inventoryData };
  },
});

// ── Step 3: Generate optimization recommendations using the LLM agent ─────────
const generateOptimizationStep = createStep({
  id: 'generate-optimization',
  description: 'Analyzes distribution and generates transfer recommendations',
  inputSchema: z.object({
    warehouses: z.array(z.any()),
    inventoryData: z.array(z.any()),
  }),
  outputSchema: z.object({
    optimization: z.object({
      analysis: z.object({
        overstockedWarehouses: z.array(z.string()),
        understockedWarehouses: z.array(z.string()),
        imbalancedProducts: z.array(z.string()),
        insights: z.array(z.string()),
      }),
      recommendations: z.array(
        z.object({
          productSku: z.string(),
          fromWarehouseCode: z.string(),
          toWarehouseCode: z.string(),
          quantity: z.number(),
          reason: z.string(),
          estimatedCostSaving: z.number().optional(),
        })
      ),
      summary: z.string(),
      predictedCostReduction: z.number(),
      predictedCapacityImprovement: z.number(),
    }),
    warehouses: z.array(z.any()),
    inventoryData: z.array(z.any()),
  }),
  execute: async ({ inputData }) => {
    console.log('Step 3: Generating optimization recommendations...');

    const warehousesSummary = inputData.warehouses
      .map(
        (wh: any) =>
          `${wh.code} (${wh.name}): ${wh.utilizationPercent.toFixed(1)}% capacity, ${wh.location.city}, ${wh.location.state}`
      )
      .join('\n');

    const inventorySummary = inputData.inventoryData
      .map((inv: any) => {
        const productList = inv.products
          .slice(0, 5)
          .map(
            (p: any) =>
              `  - ${p.sku}: ${p.currentStock} units (available: ${p.availableStock}, safety: ${p.safetyStock})`
          )
          .join('\n');
        return `${inv.warehouseName}:\n${productList}${inv.products.length > 5 ? '\n  ... and more' : ''}`;
      })
      .join('\n\n');

    const prompt = `Analyze the following warehouse and inventory data to generate optimization recommendations:

**Warehouses (${inputData.warehouses.length} total):**
${warehousesSummary}

**Inventory Distribution:**
${inventorySummary}

**Task:**
1. Analyze the distribution patterns
2. Identify overstocked (>80% capacity) and understocked (<60% capacity) warehouses
3. Find imbalanced products (concentrated in one location)
4. Generate 3-5 specific transfer recommendations that will:
   - Balance warehouse utilization
   - Improve geographic distribution
   - Reduce logistics costs
   - Maintain safety stock levels

Return ONLY valid JSON following your instructions. No markdown, no code blocks.`;

    let optimizationData;
    try {
      const message = await minimaxHTTP.chat(
        [
          {
            role: 'system',
            content: `You are an expert warehouse optimization AI. Analyze warehouse distribution and generate specific, actionable transfer recommendations.

Output format MUST be valid JSON only:
{
  "analysis": {
    "overstockedWarehouses": ["code1", "code2"],
    "understockedWarehouses": ["code3"],
    "imbalancedProducts": ["SKU1", "SKU2"],
    "insights": ["insight1", "insight2"]
  },
  "recommendations": [
    {"productSku": "SKU", "fromWarehouseCode": "FROM", "toWarehouseCode": "TO", "quantity": number, "reason": "reason", "estimatedCostSaving": number}
  ],
  "summary": "summary of improvements",
  "predictedCostReduction": number,
  "predictedCapacityImprovement": number
}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        { temperature: 0, max_tokens: 2048 }
      );

      const jsonMatch = message.match(/\{[\s\S]*\}/);
      optimizationData = JSON.parse(jsonMatch ? jsonMatch[0] : message);
    } catch (err) {
      throw new Error(`Failed to generate recommendations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    console.log(`✓ Generated ${optimizationData.recommendations.length} transfer recommendations`);

    return {
      optimization: optimizationData,
      warehouses: inputData.warehouses,
      inventoryData: inputData.inventoryData,
    };
  },
});

// ── Step 4: Validate and save recommendations via backend API ─────────────────
const saveRecommendationsStep = createStep({
  id: 'save-recommendations',
  description: 'Validates and saves recommendations to database via backend',
  inputSchema: z.object({
    optimization: z.any(),
    warehouses: z.array(z.any()),
    inventoryData: z.array(z.any()),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    recommendationId: z.string().optional(),
    validatedCount: z.number(),
  }),
  execute: async ({ inputData }) => {
    console.log('Step 4: Validating and saving recommendations...');

    const startTime = Date.now();
    const validatedRecommendations = [];

    for (const rec of inputData.optimization.recommendations) {
      const fromWarehouse = inputData.warehouses.find((wh: any) => wh.code === rec.fromWarehouseCode);
      const toWarehouse = inputData.warehouses.find((wh: any) => wh.code === rec.toWarehouseCode);

      if (!fromWarehouse || !toWarehouse) {
        console.warn(`⚠ Skipping: warehouse not found for recommendation`);
        continue;
      }

      const sourceInventory = inputData.inventoryData.find(
        (inv: any) => inv.warehouseId === fromWarehouse.id
      );
      const product = sourceInventory?.products.find((p: any) => p.sku === rec.productSku);

      if (!product) {
        console.warn(`⚠ Skipping: product ${rec.productSku} not found in ${rec.fromWarehouseCode}`);
        continue;
      }

      const maxTransfer = Math.max(0, product.availableStock - product.safetyStock);
      const validQuantity = Math.min(rec.quantity, maxTransfer);

      if (validQuantity <= 0) {
        console.warn(`⚠ Skipping: insufficient stock for transfer`);
        continue;
      }

      validatedRecommendations.push({
        product: product.productId,
        fromWarehouse: fromWarehouse.id,
        toWarehouse: toWarehouse.id,
        quantity: validQuantity,
        reason: rec.reason,
        estimatedCostSaving: rec.estimatedCostSaving,
      });
    }

    console.log(`✓ Validated ${validatedRecommendations.length} recommendations`);

    const endTime = Date.now();
    const saved = await saveWarehouseOptimization({
      generatedAt: new Date(startTime),
      generationDurationSeconds: (endTime - startTime) / 1000,
      warehousesAnalysed: inputData.warehouses.map((wh: any) => wh.id),
      transferRecommendations: validatedRecommendations,
      reallocationSummary: inputData.optimization.summary || 'Optimization recommendations generated',
      predictedLogisticsCostReductionPercent: inputData.optimization.predictedCostReduction,
      predictedCapacityUtilizationImprovement: inputData.optimization.predictedCapacityImprovement,
      status: 'pending',
      agentVersion: 'mastra-v1.0',
    });

    console.log(`✓ Recommendations saved: ${saved._id}`);
    return { success: true, recommendationId: saved._id, validatedCount: validatedRecommendations.length };
  },
});

// ── Workflow definition ───────────────────────────────────────────────────────
export const warehouseOptimizationWorkflow = createWorkflow({
  id: 'warehouse-optimization-workflow',
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    recommendationId: z.string().optional(),
    validatedCount: z.number(),
  }),
})
  .then(fetchWarehousesStep)
  .then(fetchInventoryStep)
  .then(generateOptimizationStep)
  .then(saveRecommendationsStep);

warehouseOptimizationWorkflow.commit();
