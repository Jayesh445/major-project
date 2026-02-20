import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getActiveWarehouses, getAllInventory } from '../api-client.js';

// Tool: Fetch all active warehouses with capacity information
export const fetchWarehousesTool = createTool({
  id: 'fetch-warehouses',
  description: 'Fetches all active warehouses with capacity and location information',
  inputSchema: z.object({}),
  outputSchema: z.object({
    count: z.number(),
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
  execute: async (_inputData) => {
    const warehouses = await getActiveWarehouses();

    const result = warehouses.map((wh) => ({
      id: wh._id.toString(),
      name: wh.name,
      code: wh.code,
      totalCapacity: wh.totalCapacity,
      usedCapacity: wh.usedCapacity,
      utilizationPercent:
        wh.totalCapacity > 0 ? (wh.usedCapacity / wh.totalCapacity) * 100 : 0,
      location: { city: wh.location.city, state: wh.location.state },
    }));

    return { count: result.length, warehouses: result };
  },
});

// Tool: Fetch inventory data for all warehouses
export const fetchInventoryDataTool = createTool({
  id: 'fetch-inventory-data',
  description: 'Fetches inventory levels for all products across all active warehouses',
  inputSchema: z.object({}),
  outputSchema: z.object({
    count: z.number(),
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
  execute: async (_inputData) => {
    const inventories = await getAllInventory();

    // Filter for active products and warehouses
    const active = inventories.filter(
      (inv: any) => inv.product?.isActive && inv.warehouse?.isActive
    );

    // Group by warehouse
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

    return {
      count: warehouseMap.size,
      inventoryData: Array.from(warehouseMap.values()),
    };
  },
});

// Tool: Calculate distance between warehouses (simplified)
export const calculateDistanceTool = createTool({
  id: 'calculate-distance',
  description: 'Calculates approximate distance between two locations',
  inputSchema: z.object({
    fromCity: z.string(),
    fromState: z.string(),
    toCity: z.string(),
    toState: z.string(),
  }),
  outputSchema: z.object({ distance: z.number(), unit: z.string() }),
  execute: async (inputData) => {
    if (inputData.fromCity === inputData.toCity && inputData.fromState === inputData.toState) {
      return { distance: 0, unit: 'km' };
    }
    if (inputData.fromState === inputData.toState) {
      return { distance: 150, unit: 'km' };
    }
    return { distance: 500, unit: 'km' };
  },
});
