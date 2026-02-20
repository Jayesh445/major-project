import { z } from 'zod';

// State schema for warehouse optimization agent
export const OptimizationStateSchema = z.object({
  // Warehouse data
  warehouses: z.array(z.object({
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
  })).default([]),

  // Inventory data per warehouse
  inventoryData: z.array(z.object({
    warehouseId: z.string(),
    warehouseName: z.string(),
    products: z.array(z.object({
      productId: z.string(),
      productName: z.string(),
      sku: z.string(),
      currentStock: z.number(),
      availableStock: z.number(),
      reorderPoint: z.number(),
      safetyStock: z.number(),
    })),
  })).default([]),

  // Analysis results
  analysis: z.object({
    overstockedWarehouses: z.array(z.string()).optional(),
    understockedWarehouses: z.array(z.string()).optional(),
    imbalancedProducts: z.array(z.string()).optional(),
    insights: z.array(z.string()).optional(),
  }).optional(),

  // Transfer recommendations
  recommendations: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    fromWarehouseId: z.string(),
    fromWarehouseName: z.string(),
    toWarehouseId: z.string(),
    toWarehouseName: z.string(),
    quantity: z.number(),
    reason: z.string(),
    estimatedCostSaving: z.number().optional(),
  })).default([]),

  // Summary and metrics
  summary: z.string().optional(),
  predictedCostReduction: z.number().optional(),
  predictedCapacityImprovement: z.number().optional(),

  // Metadata
  startTime: z.number().optional(),
  endTime: z.number().optional(),
  durationSeconds: z.number().optional(),
  agentVersion: z.string().default('v1.0'),

  // Error handling
  errors: z.array(z.string()).default([]),
});

export type OptimizationState = z.infer<typeof OptimizationStateSchema>;
