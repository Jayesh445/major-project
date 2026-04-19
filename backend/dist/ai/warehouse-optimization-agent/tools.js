"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizationTools = exports.calculateDistanceTool = exports.fetchInventoryDataTool = exports.fetchWarehousesTool = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const model_1 = __importDefault(require("@/modules/warehouse/model"));
const model_2 = __importDefault(require("@/modules/inventory/model"));
// Tool: Fetch all active warehouses with capacity information
exports.fetchWarehousesTool = (0, tools_1.tool)(async () => {
    const warehouses = await model_1.default.find({ isActive: true })
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
}, {
    name: 'fetch_warehouses',
    description: 'Fetches all active warehouses with capacity and location information',
    schema: zod_1.z.object({}),
});
// Tool: Fetch inventory data for all warehouses
exports.fetchInventoryDataTool = (0, tools_1.tool)(async () => {
    const inventories = await model_2.default.find({})
        .populate('product', 'name sku isActive')
        .populate('warehouse', 'name code isActive')
        .lean();
    // Filter for active products and warehouses
    const activeInventories = inventories.filter((inv) => inv.product?.isActive && inv.warehouse?.isActive);
    // Group by warehouse
    const warehouseMap = new Map();
    activeInventories.forEach((inv) => {
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
}, {
    name: 'fetch_inventory_data',
    description: 'Fetches inventory levels for all products across all active warehouses',
    schema: zod_1.z.object({}),
});
// Tool: Calculate distance between warehouses (simplified)
exports.calculateDistanceTool = (0, tools_1.tool)(async ({ fromCity, fromState, toCity, toState }) => {
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
}, {
    name: 'calculate_distance',
    description: 'Calculates approximate distance between two locations',
    schema: zod_1.z.object({
        fromCity: zod_1.z.string(),
        fromState: zod_1.z.string(),
        toCity: zod_1.z.string(),
        toState: zod_1.z.string(),
    }),
});
exports.optimizationTools = [
    exports.fetchWarehousesTool,
    exports.fetchInventoryDataTool,
    exports.calculateDistanceTool,
];
