import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import Warehouse from '@/modules/warehouse/model';
import Inventory from '@/modules/inventory/model';

// Tool: Fetch all active warehouses with capacity information
export const fetchWarehousesTool = tool(
  async () => {
    const warehouses = await Warehouse.find({ isActive: true })
      .select('name code location totalCapacity usedCapacity')
      .lean();

    const result = warehouses.map(wh => ({
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
  {
    name: 'fetch_warehouses',
    description: 'Fetches all active warehouses with capacity and location information',
    schema: z.object({}),
  }
);

// Tool: Fetch inventory data for all warehouses
export const fetchInventoryDataTool = tool(
  async () => {
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
  {
    name: 'fetch_inventory_data',
    description: 'Fetches inventory levels for all products across all active warehouses',
    schema: z.object({}),
  }
);

// Tool: Calculate distance between warehouses (simplified)
export const calculateDistanceTool = tool(
  async ({ fromCity, fromState, toCity, toState }) => {
    // Simplified distance calculation
    // In production, use actual distance API or lookup table
    if (fromCity === toCity && fromState === toState) {
      return { distance: 0, unit: 'km' };
    }

    if (fromState === toState) {
      return { distance: 150, unit: 'km' }; // Same state, different cities
    }

    // Different states - rough estimate
    return { distance: 500, unit: 'km' };
  },
  {
    name: 'calculate_distance',
    description: 'Calculates approximate distance between two locations',
    schema: z.object({
      fromCity: z.string(),
      fromState: z.string(),
      toCity: z.string(),
      toState: z.string(),
    }),
  }
);

export const optimizationTools = [
  fetchWarehousesTool,
  fetchInventoryDataTool,
  calculateDistanceTool,
];
