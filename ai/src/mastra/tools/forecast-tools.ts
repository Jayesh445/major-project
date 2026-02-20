import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getProductById,
  getWarehouseById,
  getInventoryByProductWarehouse,
} from '../api-client.js';

// Tool: Validate product and warehouse exist
export const validateInputTool = createTool({
  id: 'validate-product-warehouse',
  description: 'Validates that product and warehouse exist and are active',
  inputSchema: z.object({
    productId: z.string().describe('MongoDB Product ObjectId'),
    warehouseId: z.string().describe('MongoDB Warehouse ObjectId'),
  }),
  outputSchema: z.object({
    valid: z.boolean(),
    product: z.object({ name: z.string(), sku: z.string() }),
    warehouse: z.object({ name: z.string(), code: z.string() }),
  }),
  execute: async (inputData) => {
    const [product, warehouse] = await Promise.all([
      getProductById(inputData.productId),
      getWarehouseById(inputData.warehouseId),
    ]);

    if (!product.isActive) throw new Error(`Product ${product.sku} is inactive`);
    if (!warehouse.isActive) throw new Error(`Warehouse ${warehouse.code} is inactive`);

    return {
      valid: true,
      product: { name: product.name, sku: product.sku },
      warehouse: { name: warehouse.name, code: warehouse.code },
    };
  },
});

// Tool: Fetch historical demand data
export const fetchHistoricalDataTool = createTool({
  id: 'fetch-historical-demand-data',
  description: 'Fetches historical daily demand data from inventory transactions for forecasting',
  inputSchema: z.object({
    productId: z.string().describe('MongoDB Product ObjectId'),
    warehouseId: z.string().describe('MongoDB Warehouse ObjectId'),
    days: z.number().default(90).describe('Number of days of historical data to fetch'),
  }),
  outputSchema: z.object({
    productName: z.string(),
    sku: z.string(),
    dataPoints: z.number(),
    data: z.array(
      z.object({
        date: z.string(),
        demand: z.number(),
        dayOfWeek: z.number(),
        isWeekend: z.boolean(),
      })
    ),
  }),
  execute: async (inputData) => {
    const inventory = await getInventoryByProductWarehouse(
      inputData.productId,
      inputData.warehouseId
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - inputData.days);

    const dailyDemand = new Map<string, number>();

    (inventory.transactions as any[])
      .filter(
        (t) =>
          new Date(t.timestamp) >= startDate && ['sale', 'transfer_out'].includes(t.type)
      )
      .forEach((t) => {
        const dateKey = new Date(t.timestamp).toISOString().split('T')[0];
        dailyDemand.set(dateKey, (dailyDemand.get(dateKey) || 0) + Math.abs(t.quantity));
      });

    const result = Array.from(dailyDemand.entries())
      .map(([date, demand]) => {
        const dateObj = new Date(date);
        return {
          date,
          demand,
          dayOfWeek: dateObj.getDay(),
          isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      productName: (inventory.product as any).name,
      sku: (inventory.product as any).sku,
      dataPoints: result.length,
      data: result,
    };
  },
});
