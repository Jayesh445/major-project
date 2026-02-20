import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import Inventory from '@/modules/inventory/model';
import Product from '@/modules/product/model';
import Warehouse from '@/modules/warehouse/model';

// Tool: Fetch historical demand data
export const fetchHistoricalDataTool = tool(
  async ({ productId, warehouseId, days }) => {
    const inventory = await Inventory.findOne({
      product: productId,
      warehouse: warehouseId,
    }).populate('product', 'name sku category');

    if (!inventory) {
      throw new Error(`No inventory record found for product ${productId} in warehouse ${warehouseId}`);
    }

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Aggregate transactions by day
    const dailyDemand = new Map<string, number>();

    // Filter for outbound transactions that represent demand (sale, transfer_out)
    inventory.transactions
      .filter(t =>
        t.timestamp >= startDate &&
        ['sale', 'transfer_out'].includes(t.type)
      )
      .forEach(t => {
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
      productName: (inventory.product as any).name,
      sku: (inventory.product as any).sku,
      dataPoints: result.length,
      data: result,
    };
  },
  {
    name: 'fetch_historical_demand_data',
    description: 'Fetches historical daily demand data from inventory transactions for forecasting',
    schema: z.object({
      productId: z.string().describe('MongoDB Product ObjectId'),
      warehouseId: z.string().describe('MongoDB Warehouse ObjectId'),
      days: z.number().default(90).describe('Number of days of historical data to fetch'),
    }),
  }
);

// Tool: Validate product and warehouse exist
export const validateInputTool = tool(
  async ({ productId, warehouseId }) => {
    const [product, warehouse] = await Promise.all([
      Product.findById(productId).select('name sku isActive'),
      Warehouse.findById(warehouseId).select('name code isActive'),
    ]);

    if (!product) throw new Error(`Product ${productId} not found`);
    if (!warehouse) throw new Error(`Warehouse ${warehouseId} not found`);
    if (!product.isActive) throw new Error(`Product ${product.sku} is inactive`);
    if (!warehouse.isActive) throw new Error(`Warehouse ${warehouse.code} is inactive`);

    return {
      valid: true,
      product: { name: product.name, sku: product.sku },
      warehouse: { name: warehouse.name, code: warehouse.code },
    };
  },
  {
    name: 'validate_product_warehouse',
    description: 'Validates that product and warehouse exist and are active',
    schema: z.object({
      productId: z.string(),
      warehouseId: z.string(),
    }),
  }
);

export const forecastingTools = [
  fetchHistoricalDataTool,
  validateInputTool,
];
