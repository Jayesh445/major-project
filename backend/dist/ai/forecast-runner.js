"use strict";
/**
 * Forecast Agent Runner
 *
 * This module provides a function to run the demand forecasting workflow using Mastra.
 * It replaces the old LangChain-based implementation.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runForecastingAgent = runForecastingAgent;
exports.runBatchForecasting = runBatchForecasting;
const mastra_client_1 = require("./mastra-client");
const model_1 = __importDefault(require("@/modules/product/model"));
const model_2 = __importDefault(require("@/modules/warehouse/model"));
const model_3 = __importDefault(require("@/modules/inventory/model"));
const model_4 = __importDefault(require("@/modules/forecast/model"));
/**
 * Run the demand forecasting workflow using Mastra
 *
 * This function executes the forecast-workflow which:
 * 1. Validates product and warehouse
 * 2. Fetches historical demand data (90 days)
 * 3. Analyzes patterns using AI
 * 4. Generates 7-day demand forecast
 * 5. Saves forecast to database
 *
 * @param productId - MongoDB ObjectId of the product
 * @param warehouseId - MongoDB ObjectId of the warehouse
 * @returns Promise with success status and forecast ID
 */
async function runForecastingAgent(productId, warehouseId) {
    console.log(`\n🤖 Starting Mastra demand forecasting workflow for product ${productId} in warehouse ${warehouseId}...`);
    try {
        // Prepare request context with database models
        const requestContext = {
            Product: model_1.default,
            Warehouse: model_2.default,
            Inventory: model_3.default,
            DemandForecast: model_4.default,
        };
        // Execute the workflow
        const result = await (0, mastra_client_1.executeWorkflow)('forecast-workflow', {
            productId,
            warehouseId,
        }, requestContext);
        if (!result.success) {
            console.error('❌ Forecasting failed');
            return { success: false, errors: ['Workflow execution failed'] };
        }
        console.log('✅ Forecasting complete via Mastra!');
        return {
            success: true,
            forecastId: result.forecastId,
        };
    }
    catch (error) {
        console.error('❌ Error running forecasting workflow:', error.message);
        return {
            success: false,
            errors: [error.message],
        };
    }
}
/**
 * Run forecasting for all active inventory records
 *
 * This is useful for batch processing (e.g., daily scheduled forecasts)
 */
async function runBatchForecasting() {
    console.log('\n🤖 Starting batch forecasting via Mastra...');
    const inventories = await model_3.default.find({})
        .populate('product', 'isActive')
        .populate('warehouse', 'isActive')
        .lean();
    const activeInventories = inventories.filter((inv) => inv.product?.isActive && inv.warehouse?.isActive);
    console.log(`Found ${activeInventories.length} active inventory records to forecast`);
    let succeeded = 0;
    let failed = 0;
    const errors = [];
    for (const inv of activeInventories) {
        try {
            const result = await runForecastingAgent(inv.product._id.toString(), inv.warehouse._id.toString());
            if (result.success) {
                succeeded++;
            }
            else {
                failed++;
                errors.push(`Failed for product ${inv.product._id} @ warehouse ${inv.warehouse._id}: ${result.errors?.join(', ')}`);
            }
        }
        catch (error) {
            failed++;
            errors.push(`Error for product ${inv.product._id} @ warehouse ${inv.warehouse._id}: ${error.message}`);
        }
    }
    console.log(`✅ Batch forecasting complete: ${succeeded} succeeded, ${failed} failed out of ${activeInventories.length} total`);
    return {
        total: activeInventories.length,
        succeeded,
        failed,
        errors,
    };
}
