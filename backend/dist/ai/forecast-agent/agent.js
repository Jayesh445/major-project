"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runForecastingAgent = runForecastingAgent;
const openai_1 = require("@langchain/openai");
const tools_1 = require("./tools");
const prompts_1 = require("./prompts");
const model_1 = __importDefault(require("../../modules/forecast/model"));
// Initialize Minimax via OpenAI-compatible API
const model = new openai_1.ChatOpenAI({
    modelName: 'MiniMax-M2.7',
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    temperature: 0,
});
// Sequential workflow execution
async function executeForecastingWorkflow(initialState) {
    const state = {
        ...initialState,
        modelVersion: 'MiniMax-M2.7',
        errors: [],
    };
    try {
        // Step 1: Validate inputs
        console.log('Step 1: Validating inputs...');
        const validation = await tools_1.validateInputTool.invoke({
            productId: state.productId,
            warehouseId: state.warehouseId,
        });
        console.log(`✓ Validated: ${validation.product.sku} @ ${validation.warehouse.code}`);
        // Step 2: Fetch historical data
        console.log('Step 2: Fetching historical data...');
        const histData = await tools_1.fetchHistoricalDataTool.invoke({
            productId: state.productId,
            warehouseId: state.warehouseId,
            days: 90,
        });
        if (histData.dataPoints < 30) {
            state.errors.push(`Insufficient data: only ${histData.dataPoints} days available (minimum 30)`);
            return state;
        }
        state.historicalData = histData.data;
        console.log(`✓ Fetched ${histData.dataPoints} days of demand data`);
        // Step 3: Analyze patterns using LLM
        console.log('Step 3: Analyzing patterns with LLM...');
        const analysisPrompt = (0, prompts_1.ANALYSIS_PROMPT)(state.historicalData);
        const analysisResult = await model.invoke([
            { role: 'user', content: analysisPrompt }
        ]);
        state.patterns = JSON.parse(analysisResult.content);
        console.log(`✓ Pattern analysis complete: ${state.patterns?.trend || 'unknown'} trend detected`);
        // Step 4: Generate forecast using LLM
        console.log('Step 4: Generating 7-day forecast...');
        if (!state.patterns) {
            state.errors.push('Pattern analysis failed');
            return state;
        }
        const forecastPrompt = (0, prompts_1.FORECAST_PROMPT)(state.historicalData, state.patterns);
        const forecastResult = await model.invoke([
            { role: 'user', content: forecastPrompt }
        ]);
        const forecast = JSON.parse(forecastResult.content);
        state.predictions = forecast.predictions;
        state.recommendedReorderQty = forecast.recommendedReorderQty;
        state.recommendedOrderDate = forecast.recommendedOrderDate;
        state.generatedAt = new Date().toISOString();
        const avgDemand = Math.round(forecast.predictions.reduce((sum, p) => sum + p.predictedDemand, 0) / 7);
        console.log(`✓ Generated 7-day forecast: avg ${avgDemand} units/day`);
        // Step 5: Calculate MAPE (placeholder for now)
        state.mape = 0; // Will be calculated retrospectively
        // Step 6: Save forecast to database
        console.log('Step 6: Saving forecast to database...');
        if (!state.predictions) {
            state.errors.push('Forecast generation failed');
            return state;
        }
        const demandForecast = new model_1.default({
            product: state.productId,
            warehouse: state.warehouseId,
            forecastedAt: new Date(),
            forecastHorizonDays: 7,
            dailyForecasts: state.predictions.map(p => ({
                date: new Date(p.date),
                predictedDemand: p.predictedDemand,
                confidenceLow: p.confidenceLow,
                confidenceHigh: p.confidenceHigh,
                actualDemand: undefined,
                mape: undefined,
            })),
            totalPredicted7Day: state.predictions.reduce((sum, p) => sum + p.predictedDemand, 0),
            overallMape: state.mape,
            modelVersion: state.modelVersion,
            recommendedReorderQty: state.recommendedReorderQty,
            recommendedOrderDate: state.recommendedOrderDate ? new Date(state.recommendedOrderDate) : undefined,
        });
        await demandForecast.save();
        console.log(`✓ Forecast saved to database: ${demandForecast._id}`);
    }
    catch (error) {
        console.error('❌ Error during forecasting workflow:', error.message);
        state.errors.push(error.message);
    }
    return state;
}
// Export runner function
async function runForecastingAgent(productId, warehouseId) {
    console.log(`\n🤖 Starting demand forecasting agent for product ${productId} in warehouse ${warehouseId}...`);
    const result = await executeForecastingWorkflow({ productId, warehouseId });
    if (result.errors && result.errors.length > 0) {
        console.error('❌ Forecasting failed:', result.errors);
        return { success: false, errors: result.errors };
    }
    console.log('✅ Forecasting complete!');
    return { success: true };
}
