"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runOptimizationAgent = runOptimizationAgent;
const openai_1 = require("@langchain/openai");
const tools_1 = require("./tools");
const prompts_1 = require("./prompts");
const model_1 = __importDefault(require("@/modules/warehouse-optimization/model"));
// Initialize Minimax via OpenAI-compatible API
const model = new openai_1.ChatOpenAI({
    modelName: 'MiniMax-M2.7',
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    temperature: 0.3,
});
// Sequential workflow execution
async function executeOptimizationWorkflow() {
    const state = {
        warehouses: [],
        inventoryData: [],
        recommendations: [],
        startTime: Date.now(),
        agentVersion: 'v1.0',
        errors: [],
    };
    try {
        // Step 1: Fetch warehouse data
        console.log('Step 1: Fetching warehouse data...');
        const warehousesResult = await tools_1.fetchWarehousesTool.invoke({});
        state.warehouses = warehousesResult.warehouses;
        console.log(`✓ Fetched ${warehousesResult.count} active warehouses`);
        if (state.warehouses.length < 2) {
            state.errors.push('Insufficient warehouses: need at least 2 warehouses for optimization');
            return state;
        }
        // Step 2: Fetch inventory data
        console.log('Step 2: Fetching inventory data...');
        const inventoryResult = await tools_1.fetchInventoryDataTool.invoke({});
        state.inventoryData = inventoryResult.inventoryData;
        console.log(`✓ Fetched inventory data for ${inventoryResult.count} warehouses`);
        if (state.inventoryData.length === 0) {
            state.errors.push('No inventory data available');
            return state;
        }
        // Step 3: Analyze distribution using LLM
        console.log('Step 3: Analyzing warehouse distribution with LLM...');
        const analysisPrompt = (0, prompts_1.ANALYSIS_PROMPT)(state.warehouses, state.inventoryData);
        const analysisResult = await model.invoke([
            { role: 'user', content: analysisPrompt }
        ]);
        state.analysis = JSON.parse(analysisResult.content);
        console.log(`✓ Analysis complete: ${state.analysis?.insights?.length || 0} insights identified`);
        // Step 4: Generate optimization recommendations using LLM
        console.log('Step 4: Generating optimization recommendations...');
        if (!state.analysis || !state.analysis.insights) {
            state.errors.push('Analysis failed');
            return state;
        }
        const optimizationPrompt = (0, prompts_1.OPTIMIZATION_PROMPT)(state.warehouses, state.inventoryData, state.analysis);
        const optimizationResult = await model.invoke([
            { role: 'user', content: optimizationPrompt }
        ]);
        const optimization = JSON.parse(optimizationResult.content);
        state.recommendations = optimization.recommendations || [];
        state.summary = optimization.summary;
        state.predictedCostReduction = optimization.predictedCostReduction;
        state.predictedCapacityImprovement = optimization.predictedCapacityImprovement;
        console.log(`✓ Generated ${state.recommendations.length} transfer recommendations`);
        // Step 5: Validate and enrich recommendations
        console.log('Step 5: Validating recommendations...');
        const validatedRecommendations = [];
        for (const rec of state.recommendations) {
            // Find actual product and warehouse IDs
            const fromWarehouse = state.warehouses.find(wh => wh.code === rec.fromWarehouseCode);
            const toWarehouse = state.warehouses.find(wh => wh.code === rec.toWarehouseCode);
            if (!fromWarehouse || !toWarehouse) {
                console.warn(`⚠ Skipping recommendation: warehouse not found`);
                continue;
            }
            // Find product in source warehouse inventory
            const sourceInventoryData = state.inventoryData.find(inv => inv.warehouseId === fromWarehouse.id);
            const product = sourceInventoryData?.products.find(p => p.sku === rec.productSku);
            if (!product) {
                console.warn(`⚠ Skipping recommendation: product ${rec.productSku} not found in ${rec.fromWarehouseCode}`);
                continue;
            }
            // Validate quantity doesn't exceed available stock
            const maxTransfer = Math.max(0, product.availableStock - product.safetyStock);
            const validQuantity = Math.min(rec.quantity, maxTransfer);
            if (validQuantity <= 0) {
                console.warn(`⚠ Skipping recommendation: insufficient stock for transfer`);
                continue;
            }
            validatedRecommendations.push({
                ...rec,
                productId: product.productId,
                productName: product.productName,
                fromWarehouseId: fromWarehouse.id,
                fromWarehouseName: fromWarehouse.name,
                toWarehouseId: toWarehouse.id,
                toWarehouseName: toWarehouse.name,
                quantity: validQuantity,
            });
        }
        console.log(`✓ Validated ${validatedRecommendations.length} recommendations`);
        // Step 6: Save recommendations to database
        console.log('Step 6: Saving recommendations to database...');
        state.endTime = Date.now();
        state.durationSeconds = (state.endTime - state.startTime) / 1000;
        if (state.durationSeconds > 300) {
            state.errors.push('Generation exceeded 300 seconds limit');
            return state;
        }
        const recommendation = new model_1.default({
            generatedAt: new Date(state.startTime),
            generationDurationSeconds: state.durationSeconds,
            warehousesAnalysed: state.warehouses.map(wh => wh.id),
            transferRecommendations: validatedRecommendations.map(rec => ({
                product: rec.productId,
                fromWarehouse: rec.fromWarehouseId,
                toWarehouse: rec.toWarehouseId,
                quantity: rec.quantity,
                reason: rec.reason,
                estimatedCostSaving: rec.estimatedCostSaving,
            })),
            reallocationSummary: state.summary || 'Optimization recommendations generated',
            predictedLogisticsCostReductionPercent: state.predictedCostReduction,
            predictedCapacityUtilizationImprovement: state.predictedCapacityImprovement,
            status: 'pending',
            agentVersion: state.agentVersion,
        });
        await recommendation.save();
        console.log(`✓ Recommendations saved to database: ${recommendation._id}`);
    }
    catch (error) {
        console.error('❌ Error during optimization workflow:', error.message);
        state.errors.push(error.message);
        state.endTime = Date.now();
        state.durationSeconds = (state.endTime - state.startTime) / 1000;
    }
    return state;
}
// Export runner function
async function runOptimizationAgent() {
    console.log(`\n🤖 Starting warehouse optimization agent...`);
    const result = await executeOptimizationWorkflow();
    if (result.errors && result.errors.length > 0) {
        console.error('❌ Optimization failed:', result.errors);
        return {
            success: false,
            errors: result.errors,
            durationSeconds: result.durationSeconds,
        };
    }
    console.log(`✅ Optimization complete in ${result.durationSeconds?.toFixed(1)}s!`);
    return {
        success: true,
        durationSeconds: result.durationSeconds,
    };
}
