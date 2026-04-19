"use strict";
/**
 * Warehouse Optimization Agent Runner
 *
 * This module provides a function to run the warehouse optimization workflow using Mastra.
 * It replaces the old LangChain-based implementation.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOptimizationAgent = runOptimizationAgent;
const mastra_client_1 = require("./mastra-client");
const model_1 = __importDefault(require("@/modules/warehouse/model"));
const model_2 = __importDefault(require("@/modules/inventory/model"));
const model_3 = __importDefault(require("@/modules/warehouse-optimization/model"));
/**
 * Run the warehouse optimization workflow using Mastra
 *
 * This function executes the warehouse-optimization-workflow which:
 * 1. Fetches all active warehouses with capacity data
 * 2. Fetches inventory levels across all warehouses
 * 3. Analyzes distribution patterns using AI
 * 4. Generates 3-5 transfer recommendations
 * 5. Validates and saves recommendations to database
 *
 * @returns Promise with success status, recommendation ID, and duration
 */
async function runOptimizationAgent() {
    console.log(`\n🤖 Starting Mastra warehouse optimization workflow...`);
    const startTime = Date.now();
    try {
        // Prepare request context with database models
        const requestContext = {
            Warehouse: model_1.default,
            Inventory: model_2.default,
            WarehouseOptimizationRecommendation: model_3.default,
        };
        // Execute the workflow
        const result = await (0, mastra_client_1.executeWorkflow)('warehouse-optimization-workflow', {}, requestContext);
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        if (!result.success) {
            console.error('❌ Optimization failed');
            return {
                success: false,
                errors: ['Workflow execution failed'],
                durationSeconds,
            };
        }
        console.log(`✅ Optimization complete via Mastra in ${durationSeconds.toFixed(1)}s! Generated ${result.validatedCount} recommendations.`);
        return {
            success: true,
            recommendationId: result.recommendationId,
            durationSeconds,
        };
    }
    catch (error) {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        console.error('❌ Error running optimization workflow:', error.message);
        return {
            success: false,
            errors: [error.message],
            durationSeconds,
        };
    }
}
