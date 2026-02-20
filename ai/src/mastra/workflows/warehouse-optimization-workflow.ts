import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Step 1: Fetch warehouse data
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
        location: z.object({
          city: z.string(),
          state: z.string(),
        }),
      })
    ),
  }),
  execute: async ({ mastra, requestContext }) => {
    const agent = mastra?.getAgent('warehouseOptimizationAgent');
    if (!agent) {
      throw new Error('Warehouse optimization agent not found');
    }

    console.log('Step 1: Fetching warehouse data...');

    const result = await agent.generate(
      [
        {
          role: 'user',
          content: 'Fetch all active warehouses with capacity information using the fetchWarehouses tool.',
        },
      ],
      { requestContext }
    );

    const toolResults = (result as any).toolResults || [];
    const warehousesResult = toolResults.find((tr: any) => tr.toolName === 'fetchWarehouses');

    if (!warehousesResult) {
      throw new Error('fetchWarehouses tool was not called');
    }

    if (warehousesResult.result.count < 2) {
      throw new Error('Insufficient warehouses: need at least 2 warehouses for optimization');
    }

    console.log(`✓ Fetched ${warehousesResult.result.count} active warehouses`);

    return {
      warehouses: warehousesResult.result.warehouses,
    };
  },
});

// Step 2: Fetch inventory data
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
  execute: async ({ inputData, mastra, requestContext }) => {
    const agent = mastra?.getAgent('warehouseOptimizationAgent');
    if (!agent) {
      throw new Error('Warehouse optimization agent not found');
    }

    console.log('Step 2: Fetching inventory data...');

    const result = await agent.generate(
      [
        {
          role: 'user',
          content:
            'Fetch inventory levels for all products across all active warehouses using the fetchInventoryData tool.',
        },
      ],
      { requestContext }
    );

    const toolResults = (result as any).toolResults || [];
    const inventoryResult = toolResults.find((tr: any) => tr.toolName === 'fetchInventoryData');

    if (!inventoryResult) {
      throw new Error('fetchInventoryData tool was not called');
    }

    if (inventoryResult.result.count === 0) {
      throw new Error('No inventory data available');
    }

    console.log(`✓ Fetched inventory data for ${inventoryResult.result.count} warehouses`);

    return {
      warehouses: inputData.warehouses,
      inventoryData: inventoryResult.result.inventoryData,
    };
  },
});

// Step 3: Generate optimization recommendations
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
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('warehouseOptimizationAgent');
    if (!agent) {
      throw new Error('Warehouse optimization agent not found');
    }

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

Return your analysis and recommendations as a JSON object following the structure defined in your instructions.`;

    const result = await agent.generate([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Parse JSON from the agent's response
    let optimizationData;
    try {
      const textResult = result.text || '';
      // Try to extract JSON from the response
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        optimizationData = JSON.parse(jsonMatch[0]);
      } else {
        optimizationData = JSON.parse(textResult);
      }
    } catch (error) {
      console.error('Failed to parse optimization JSON:', error);
      throw new Error('Agent did not return valid JSON recommendations');
    }

    console.log(`✓ Generated ${optimizationData.recommendations.length} transfer recommendations`);

    return {
      optimization: optimizationData,
      warehouses: inputData.warehouses,
      inventoryData: inputData.inventoryData,
    };
  },
});

// Step 4: Validate and save recommendations
const saveRecommendationsStep = createStep({
  id: 'save-recommendations',
  description: 'Validates and saves recommendations to database',
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
  execute: async ({ inputData, requestContext }) => {
    console.log('Step 4: Validating and saving recommendations...');

    const { WarehouseOptimizationRecommendation } = requestContext as any;
    const startTime = Date.now();

    // Validate recommendations
    const validatedRecommendations = [];

    for (const rec of inputData.optimization.recommendations) {
      // Find actual product and warehouse IDs
      const fromWarehouse = inputData.warehouses.find((wh: any) => wh.code === rec.fromWarehouseCode);
      const toWarehouse = inputData.warehouses.find((wh: any) => wh.code === rec.toWarehouseCode);

      if (!fromWarehouse || !toWarehouse) {
        console.warn(`⚠ Skipping recommendation: warehouse not found`);
        continue;
      }

      // Find product in source warehouse inventory
      const sourceInventoryData = inputData.inventoryData.find(
        (inv: any) => inv.warehouseId === fromWarehouse.id
      );

      const product = sourceInventoryData?.products.find((p: any) => p.sku === rec.productSku);

      if (!product) {
        console.warn(
          `⚠ Skipping recommendation: product ${rec.productSku} not found in ${rec.fromWarehouseCode}`
        );
        continue;
      }

      // Validate quantity doesn't exceed available stock
      const maxTransfer = Math.max(0, product.availableStock - product.safetyStock);
      const validQuantity = Math.min(rec.quantity, maxTransfer);

      if (validQuantity <= 0) {
        console.warn(`⚠ Skipping recommendation: insufficient stock for transfer`);
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

    // Save to database
    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;

    const recommendation = new WarehouseOptimizationRecommendation({
      generatedAt: new Date(startTime),
      generationDurationSeconds: durationSeconds,
      warehousesAnalysed: inputData.warehouses.map((wh: any) => wh.id),
      transferRecommendations: validatedRecommendations,
      reallocationSummary:
        inputData.optimization.summary || 'Optimization recommendations generated',
      predictedLogisticsCostReductionPercent: inputData.optimization.predictedCostReduction,
      predictedCapacityUtilizationImprovement:
        inputData.optimization.predictedCapacityImprovement,
      status: 'pending',
      agentVersion: 'mastra-v1.0',
    });

    await recommendation.save();
    console.log(`✓ Recommendations saved to database: ${recommendation._id}`);

    return {
      success: true,
      recommendationId: recommendation._id.toString(),
      validatedCount: validatedRecommendations.length,
    };
  },
});

// Create the workflow
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
