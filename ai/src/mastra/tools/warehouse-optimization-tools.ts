import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// These imports will need to be accessible from the Mastra app
// You'll need to set up database connection in the Mastra app
interface WarehouseModel {
  find: (query: any) => any;
}

interface InventoryModel {
  find: (query: any) => any;
}

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
        location: z.object({
          city: z.string(),
          state: z.string(),
        }),
      })
    ),
  }),
  execute: async (_inputData, { requestContext }) => {
    const { Warehouse } = requestContext as { Warehouse: WarehouseModel };

    const warehouses = await Warehouse.find({ isActive: true })
      .select('name code location totalCapacity usedCapacity')
      .lean();

    const result = warehouses.map((wh: any) => ({
      id: wh._id.toString(),
      name: wh.name,
      code: wh.code,
      totalCapacity: wh.totalCapacity,
      usedCapacity: wh.usedCapacity,
      utilizationPercent: (wh.usedCapacity / wh.totalCapacity) * 100,
      location: {
        city: wh.location.city,
        state: wh.location.state,
      },
    }));

    return {
      count: result.length,
      warehouses: result,
    };
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
  execute: async (_inputData, { requestContext }) => {
    const { Inventory } = requestContext as { Inventory: InventoryModel };

    const inventories = await Inventory.find({})
      .populate('product', 'name sku isActive')
      .populate('warehouse', 'name code isActive')
      .lean();

    // Filter for active products and warehouses
    const activeInventories = inventories.filter(
      (inv: any) => inv.product?.isActive && inv.warehouse?.isActive
    );

    // Group by warehouse
    const warehouseMap = new Map();

    activeInventories.forEach((inv: any) => {
      const whId = inv.warehouse._id.toString();
      const whName = inv.warehouse.name;

      if (!warehouseMap.has(whId)) {
        warehouseMap.set(whId, {
          warehouseId: whId,
          warehouseName: whName,
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
  outputSchema: z.object({
    distance: z.number(),
    unit: z.string(),
  }),
  execute: async (inputData) => {
    // Simplified distance calculation
    // In production, use actual distance API or lookup table
    if (inputData.fromCity === inputData.toCity && inputData.fromState === inputData.toState) {
      return { distance: 0, unit: 'km' };
    }

    if (inputData.fromState === inputData.toState) {
      return { distance: 150, unit: 'km' }; // Same state, different cities
    }

    // Different states - rough estimate
    return { distance: 500, unit: 'km' };
  },
});
