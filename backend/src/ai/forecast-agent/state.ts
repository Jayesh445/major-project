import { z } from 'zod';

// State schema following LangGraph v1 StateSchema pattern
export const ForecastStateSchema = z.object({
  // Input
  productId: z.string().describe('MongoDB Product ID'),
  warehouseId: z.string().describe('MongoDB Warehouse ID'),

  // Historical data
  historicalData: z.array(z.object({
    date: z.string(),  // ISO date string
    demand: z.number(),
    dayOfWeek: z.number().optional(),
    isWeekend: z.boolean().optional(),
  })).optional(),

  // Pattern analysis
  patterns: z.object({
    trend: z.enum(['increasing', 'decreasing', 'stable']).optional(),
    seasonality: z.string().optional(),
    averageDemand: z.number().optional(),
    stdDeviation: z.number().optional(),
  }).optional(),

  // Predictions
  predictions: z.array(z.object({
    date: z.string(),
    predictedDemand: z.number(),
    confidenceLow: z.number(),
    confidenceHigh: z.number(),
  })).optional(),

  // Metrics
  mape: z.number().optional(),
  recommendedReorderQty: z.number().optional(),
  recommendedOrderDate: z.string().optional(),

  // Metadata
  modelVersion: z.string().default('gemini-2.0-flash'),
  generatedAt: z.string().optional(),

  // Error handling
  errors: z.array(z.string()).default([]),
});

export type ForecastState = z.infer<typeof ForecastStateSchema>;
