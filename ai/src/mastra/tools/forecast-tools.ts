import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// These imports will need to be accessible from the Mastra app
// You'll need to set up database connection in the Mastra app
interface InventoryModel {
  findOne: (query: any) => Promise<any>;
}

interface ProductModel {
  findById: (id: string) => Promise<any>;
}

interface WarehouseModel {
  findById: (id: string) => Promise<any>;
}

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
    product: z.object({
      name: z.string(),
      sku: z.string(),
    }),
    warehouse: z.object({
      name: z.string(),
      code: z.string(),
    }),
  }),
  execute: async (inputData, { requestContext }) => {
    // Access models from request context (will be passed from backend)
    const { Product, Warehouse } = requestContext as {
      Product: ProductModel;
      Warehouse: WarehouseModel;
    };

    const [product, warehouse] = await Promise.all([
      Product.findById(inputData.productId),
      Warehouse.findById(inputData.warehouseId),
    ]);

    if (!product) throw new Error(`Product ${inputData.productId} not found`);
    if (!warehouse) throw new Error(`Warehouse ${inputData.warehouseId} not found`);
    if (!(product as any).isActive) throw new Error(`Product ${(product as any).sku} is inactive`);
    if (!(warehouse as any).isActive) throw new Error(`Warehouse ${(warehouse as any).code} is inactive`);

    return {
      valid: true,
      product: { name: (product as any).name, sku: (product as any).sku },
      warehouse: { name: (warehouse as any).name, code: (warehouse as any).code },
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
  execute: async (inputData, { requestContext }) => {
    const { Inventory } = requestContext as { Inventory: InventoryModel };

    const inventory = await Inventory.findOne({
      product: inputData.productId,
      warehouse: inputData.warehouseId,
    });

    if (!inventory) {
      throw new Error(
        `No inventory record found for product ${inputData.productId} in warehouse ${inputData.warehouseId}`
      );
    }

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - inputData.days);

    // Aggregate transactions by day
    const dailyDemand = new Map<string, number>();

    // Filter for outbound transactions that represent demand (sale, transfer_out)
    inventory.transactions
      .filter(
        (t: any) => t.timestamp >= startDate && ['sale', 'transfer_out'].includes(t.type)
      )
      .forEach((t: any) => {
        const dateKey = t.timestamp.toISOString().split('T')[0];
        const demand = Math.abs(t.quantity);
        dailyDemand.set(dateKey, (dailyDemand.get(dateKey) || 0) + demand);
      });

    // Convert to array and add metadata
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
      productName: inventory.product.name,
      sku: inventory.product.sku,
      dataPoints: result.length,
      data: result,
    };
  },
});
