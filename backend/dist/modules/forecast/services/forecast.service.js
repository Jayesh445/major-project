"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForecastService = void 0;
const agent_1 = require("../../../ai/forecast-agent/agent");
const model_1 = __importDefault(require("../model"));
const model_2 = __importDefault(require("../../inventory/model"));
class ForecastService {
    // Generate forecast for specific product-warehouse pair
    static async generateForecast(productId, warehouseId) {
        return await (0, agent_1.runForecastingAgent)(productId, warehouseId);
    }
    // Generate forecasts for all active inventory records
    static async generateAllForecasts() {
        const inventories = await model_2.default.find({})
            .populate('product', 'isActive')
            .populate('warehouse', 'isActive');
        const activeInventories = inventories.filter((inv) => inv.product?.isActive && inv.warehouse?.isActive);
        console.log(`Generating forecasts for ${activeInventories.length} inventory records...`);
        const results = await Promise.allSettled(activeInventories.map((inv) => (0, agent_1.runForecastingAgent)(inv.product._id.toString(), inv.warehouse._id.toString())));
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        return { total: activeInventories.length, succeeded, failed };
    }
    // Get latest forecast for product-warehouse
    static async getLatestForecast(productId, warehouseId) {
        return await model_1.default.findOne({
            product: productId,
            warehouse: warehouseId,
        })
            .sort({ forecastedAt: -1 })
            .populate('product', 'name sku')
            .populate('warehouse', 'name code');
    }
    // Get all forecasts for a product across all warehouses
    static async getProductForecasts(productId, limit = 10) {
        return await model_1.default.find({ product: productId })
            .sort({ forecastedAt: -1 })
            .limit(limit)
            .populate('warehouse', 'name code')
            .populate('product', 'name sku');
    }
}
exports.ForecastService = ForecastService;
