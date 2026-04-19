"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationStateSchema = void 0;
const zod_1 = require("zod");
// State schema for warehouse optimization agent
exports.OptimizationStateSchema = zod_1.z.object({
    // Warehouse data
    warehouses: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string(),
        code: zod_1.z.string(),
        totalCapacity: zod_1.z.number(),
        usedCapacity: zod_1.z.number(),
        utilizationPercent: zod_1.z.number(),
        location: zod_1.z.object({
            city: zod_1.z.string(),
            state: zod_1.z.string(),
        }),
    })).default([]),
    // Inventory data per warehouse
    inventoryData: zod_1.z.array(zod_1.z.object({
        warehouseId: zod_1.z.string(),
        warehouseName: zod_1.z.string(),
        products: zod_1.z.array(zod_1.z.object({
            productId: zod_1.z.string(),
            productName: zod_1.z.string(),
            sku: zod_1.z.string(),
            currentStock: zod_1.z.number(),
            availableStock: zod_1.z.number(),
            reorderPoint: zod_1.z.number(),
            safetyStock: zod_1.z.number(),
        })),
    })).default([]),
    // Analysis results
    analysis: zod_1.z.object({
        overstockedWarehouses: zod_1.z.array(zod_1.z.string()).optional(),
        understockedWarehouses: zod_1.z.array(zod_1.z.string()).optional(),
        imbalancedProducts: zod_1.z.array(zod_1.z.string()).optional(),
        insights: zod_1.z.array(zod_1.z.string()).optional(),
    }).optional(),
    // Transfer recommendations
    recommendations: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string(),
        productName: zod_1.z.string(),
        fromWarehouseId: zod_1.z.string(),
        fromWarehouseName: zod_1.z.string(),
        toWarehouseId: zod_1.z.string(),
        toWarehouseName: zod_1.z.string(),
        quantity: zod_1.z.number(),
        reason: zod_1.z.string(),
        estimatedCostSaving: zod_1.z.number().optional(),
    })).default([]),
    // Summary and metrics
    summary: zod_1.z.string().optional(),
    predictedCostReduction: zod_1.z.number().optional(),
    predictedCapacityImprovement: zod_1.z.number().optional(),
    // Metadata
    startTime: zod_1.z.number().optional(),
    endTime: zod_1.z.number().optional(),
    durationSeconds: zod_1.z.number().optional(),
    agentVersion: zod_1.z.string().default('v1.0'),
    // Error handling
    errors: zod_1.z.array(zod_1.z.string()).default([]),
});
