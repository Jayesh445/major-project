"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forecastingTools = exports.validateInputTool = exports.fetchHistoricalDataTool = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const model_1 = __importDefault(require("@/modules/inventory/model"));
const model_2 = __importDefault(require("@/modules/product/model"));
const model_3 = __importDefault(require("@/modules/warehouse/model"));
// Tool: Fetch historical demand data
exports.fetchHistoricalDataTool = (0, tools_1.tool)(async ({ productId, warehouseId, days }) => {
    const inventory = await model_1.default.findOne({
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
    const dailyDemand = new Map();
    // Filter for outbound transactions that represent demand (sale, transfer_out)
    inventory.transactions
        .filter(t => t.timestamp >= startDate &&
        ['sale', 'transfer_out'].includes(t.type))
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
        productName: inventory.product.name,
        sku: inventory.product.sku,
        dataPoints: result.length,
        data: result,
    };
}, {
    name: 'fetch_historical_demand_data',
    description: 'Fetches historical daily demand data from inventory transactions for forecasting',
    schema: zod_1.z.object({
        productId: zod_1.z.string().describe('MongoDB Product ObjectId'),
        warehouseId: zod_1.z.string().describe('MongoDB Warehouse ObjectId'),
        days: zod_1.z.number().default(90).describe('Number of days of historical data to fetch'),
    }),
});
// Tool: Validate product and warehouse exist
exports.validateInputTool = (0, tools_1.tool)(async ({ productId, warehouseId }) => {
    const [product, warehouse] = await Promise.all([
        model_2.default.findById(productId).select('name sku isActive'),
        model_3.default.findById(warehouseId).select('name code isActive'),
    ]);
    if (!product)
        throw new Error(`Product ${productId} not found`);
    if (!warehouse)
        throw new Error(`Warehouse ${warehouseId} not found`);
    if (!product.isActive)
        throw new Error(`Product ${product.sku} is inactive`);
    if (!warehouse.isActive)
        throw new Error(`Warehouse ${warehouse.code} is inactive`);
    return {
        valid: true,
        product: { name: product.name, sku: product.sku },
        warehouse: { name: warehouse.name, code: warehouse.code },
    };
}, {
    name: 'validate_product_warehouse',
    description: 'Validates that product and warehouse exist and are active',
    schema: zod_1.z.object({
        productId: zod_1.z.string(),
        warehouseId: zod_1.z.string(),
    }),
});
exports.forecastingTools = [
    exports.fetchHistoricalDataTool,
    exports.validateInputTool,
];
