"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastStateSchema = void 0;
const zod_1 = require("zod");
// State schema following LangGraph v1 StateSchema pattern
exports.ForecastStateSchema = zod_1.z.object({
    // Input
    productId: zod_1.z.string().describe('MongoDB Product ID'),
    warehouseId: zod_1.z.string().describe('MongoDB Warehouse ID'),
    // Historical data
    historicalData: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string(), // ISO date string
        demand: zod_1.z.number(),
        dayOfWeek: zod_1.z.number().optional(),
        isWeekend: zod_1.z.boolean().optional(),
    })).optional(),
    // Pattern analysis
    patterns: zod_1.z.object({
        trend: zod_1.z.enum(['increasing', 'decreasing', 'stable']).optional(),
        seasonality: zod_1.z.string().optional(),
        averageDemand: zod_1.z.number().optional(),
        stdDeviation: zod_1.z.number().optional(),
    }).optional(),
    // Predictions
    predictions: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string(),
        predictedDemand: zod_1.z.number(),
        confidenceLow: zod_1.z.number(),
        confidenceHigh: zod_1.z.number(),
    })).optional(),
    // Metrics
    mape: zod_1.z.number().optional(),
    recommendedReorderQty: zod_1.z.number().optional(),
    recommendedOrderDate: zod_1.z.string().optional(),
    // Metadata
    modelVersion: zod_1.z.string().default('gemini-2.0-flash'),
    generatedAt: zod_1.z.string().optional(),
    // Error handling
    errors: zod_1.z.array(zod_1.z.string()).default([]),
});
