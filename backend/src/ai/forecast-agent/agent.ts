import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { fetchHistoricalDataTool, validateInputTool } from './tools';
import { ANALYSIS_PROMPT, FORECAST_PROMPT } from './prompts';
import DemandForecast from '../../modules/forecast/model';

// Initialize Google Gemini via LangChain
const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash-exp',
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0, // Deterministic for forecasting
});

// Define state interface
interface ForecastState {
  productId: string;
  warehouseId: string;
  historicalData?: {
    date: string;
    demand: number;
    dayOfWeek?: number;
    isWeekend?: boolean;
  }[];
  patterns?: {
    trend?: 'increasing' | 'decreasing' | 'stable';
    seasonality?: string;
    averageDemand?: number;
    stdDeviation?: number;
  };
  predictions?: {
    date: string;
    predictedDemand: number;
    confidenceLow: number;
    confidenceHigh: number;
  }[];
  mape?: number;
  recommendedReorderQty?: number;
  recommendedOrderDate?: string;
  modelVersion: string;
  generatedAt?: string;
  errors: string[];
}

// Sequential workflow execution
async function executeForecastingWorkflow(
  initialState: Pick<ForecastState, 'productId' | 'warehouseId'>
): Promise<ForecastState> {
  const state: ForecastState = {
    ...initialState,
    modelVersion: 'gemini-2.0-flash',
    errors: [],
  };

  try {
    // Step 1: Validate inputs
    console.log('Step 1: Validating inputs...');
    const validation = await validateInputTool.invoke({
      productId: state.productId,
      warehouseId: state.warehouseId,
    });
    console.log(`✓ Validated: ${validation.product.sku} @ ${validation.warehouse.code}`);

    // Step 2: Fetch historical data
    console.log('Step 2: Fetching historical data...');
    const histData = await fetchHistoricalDataTool.invoke({
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
    const analysisPrompt = ANALYSIS_PROMPT(state.historicalData);

    // Use LangChain's withStructuredOutput for JSON mode
    const analysisResult = await model.invoke([
      { role: 'user', content: analysisPrompt }
    ]);

    state.patterns = JSON.parse(analysisResult.content as string);
    console.log(`✓ Pattern analysis complete: ${state.patterns?.trend || 'unknown'} trend detected`);

    // Step 4: Generate forecast using LLM
    console.log('Step 4: Generating 7-day forecast...');
    if (!state.patterns) {
      state.errors.push('Pattern analysis failed');
      return state;
    }
    const forecastPrompt = FORECAST_PROMPT(state.historicalData, state.patterns);

    const forecastResult = await model.invoke([
      { role: 'user', content: forecastPrompt }
    ]);

    const forecast = JSON.parse(forecastResult.content as string);
    state.predictions = forecast.predictions;
    state.recommendedReorderQty = forecast.recommendedReorderQty;
    state.recommendedOrderDate = forecast.recommendedOrderDate;
    state.generatedAt = new Date().toISOString();

    const avgDemand = Math.round(
      forecast.predictions.reduce((sum: number, p: any) => sum + p.predictedDemand, 0) / 7
    );
    console.log(`✓ Generated 7-day forecast: avg ${avgDemand} units/day`);

    // Step 5: Calculate MAPE (placeholder for now)
    state.mape = 0; // Will be calculated retrospectively

    // Step 6: Save forecast to database
    console.log('Step 6: Saving forecast to database...');
    if (!state.predictions) {
      state.errors.push('Forecast generation failed');
      return state;
    }

    const demandForecast = new DemandForecast({
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

  } catch (error: any) {
    console.error('❌ Error during forecasting workflow:', error.message);
    state.errors.push(error.message);
  }

  return state;
}

// Export runner function
export async function runForecastingAgent(
  productId: string,
  warehouseId: string
): Promise<{ success: boolean; forecastId?: string; errors?: string[] }> {
  console.log(`\n🤖 Starting demand forecasting agent for product ${productId} in warehouse ${warehouseId}...`);

  const result = await executeForecastingWorkflow({ productId, warehouseId });

  if (result.errors && result.errors.length > 0) {
    console.error('❌ Forecasting failed:', result.errors);
    return { success: false, errors: result.errors };
  }

  console.log('✅ Forecasting complete!');
  return { success: true };
}
