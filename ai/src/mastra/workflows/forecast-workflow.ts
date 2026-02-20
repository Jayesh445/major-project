import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  getProductById,
  getWarehouseById,
  getInventoryByProductWarehouse,
  saveForecast,
} from '../api-client.js';

// ── Step 1: Validate inputs directly via backend API ──────────────────────────
const validateInputsStep = createStep({
  id: 'validate-inputs',
  description: 'Validates that product and warehouse exist and are active',
  inputSchema: z.object({
    productId: z.string(),
    warehouseId: z.string(),
  }),
  outputSchema: z.object({
    valid: z.boolean(),
    product: z.object({ name: z.string(), sku: z.string() }),
    warehouse: z.object({ name: z.string(), code: z.string() }),
    productId: z.string(),
    warehouseId: z.string(),
  }),
  execute: async ({ inputData }) => {
    console.log('Step 1: Validating inputs...');

    const [product, warehouse] = await Promise.all([
      getProductById(inputData.productId),
      getWarehouseById(inputData.warehouseId),
    ]);

    if (!product.isActive) throw new Error(`Product ${product.sku} is inactive`);
    if (!warehouse.isActive) throw new Error(`Warehouse ${warehouse.code} is inactive`);

    console.log(`✓ Validated: ${product.sku} @ ${warehouse.code}`);

    return {
      valid: true,
      product: { name: product.name, sku: product.sku },
      warehouse: { name: warehouse.name, code: warehouse.code },
      productId: inputData.productId,
      warehouseId: inputData.warehouseId,
    };
  },
});

// ── Step 2: Fetch historical demand data directly via backend API ─────────────
const fetchHistoricalDataStep = createStep({
  id: 'fetch-historical-data',
  description: 'Fetches 90 days of historical demand data',
  inputSchema: z.object({
    productId: z.string(),
    warehouseId: z.string(),
    product: z.object({ name: z.string(), sku: z.string() }),
    warehouse: z.object({ name: z.string(), code: z.string() }),
  }),
  outputSchema: z.object({
    historicalData: z.object({
      productName: z.string(),
      sku: z.string(),
      dataPoints: z.number(),
      data: z.array(
        z.object({
          date: z.string(),
          demand: z.number(),
          dayOfWeek: z.number(),
          isWeekend: z.boolean(),
        })
      ),
    }),
    productId: z.string(),
    warehouseId: z.string(),
    product: z.object({ name: z.string(), sku: z.string() }),
    warehouse: z.object({ name: z.string(), code: z.string() }),
  }),
  execute: async ({ inputData }) => {
    console.log('Step 2: Fetching historical data...');

    const inventory = await getInventoryByProductWarehouse(
      inputData.productId,
      inputData.warehouseId
    );

    const days = 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Aggregate outbound transactions (demand) by day
    const dailyDemand = new Map<string, number>();

    (inventory.transactions as any[])
      .filter(
        (t) =>
          new Date(t.timestamp) >= startDate &&
          ['sale', 'transfer_out'].includes(t.type)
      )
      .forEach((t) => {
        const dateKey = new Date(t.timestamp).toISOString().split('T')[0];
        dailyDemand.set(dateKey, (dailyDemand.get(dateKey) || 0) + Math.abs(t.quantity));
      });

    const data = Array.from(dailyDemand.entries())
      .map(([date, demand]) => {
        const d = new Date(date);
        return { date, demand, dayOfWeek: d.getDay(), isWeekend: d.getDay() === 0 || d.getDay() === 6 };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    if (data.length < 30) {
      throw new Error(`Insufficient data: only ${data.length} days available (minimum 30)`);
    }

    console.log(`✓ Fetched ${data.length} days of demand data`);

    return {
      historicalData: {
        productName: (inventory.product as any).name,
        sku: (inventory.product as any).sku,
        dataPoints: data.length,
        data,
      },
      productId: inputData.productId,
      warehouseId: inputData.warehouseId,
      product: inputData.product,
      warehouse: inputData.warehouse,
    };
  },
});

// ── Step 3: Generate forecast using the LLM agent ─────────────────────────────
const generateForecastStep = createStep({
  id: 'generate-forecast',
  description: 'Analyzes patterns and generates 7-day demand forecast',
  inputSchema: z.object({
    historicalData: z.object({
      productName: z.string(),
      sku: z.string(),
      dataPoints: z.number(),
      data: z.array(
        z.object({
          date: z.string(),
          demand: z.number(),
          dayOfWeek: z.number(),
          isWeekend: z.boolean(),
        })
      ),
    }),
    productId: z.string(),
    warehouseId: z.string(),
    product: z.object({ name: z.string(), sku: z.string() }),
    warehouse: z.object({ name: z.string(), code: z.string() }),
  }),
  outputSchema: z.object({
    forecast: z.object({
      analysis: z.object({
        trend: z.enum(['increasing', 'decreasing', 'stable']),
        seasonality: z.string(),
        averageDemand: z.number(),
        stdDeviation: z.number(),
        keyInsights: z.array(z.string()),
      }),
      predictions: z.array(
        z.object({
          date: z.string(),
          predictedDemand: z.number(),
          confidenceLow: z.number(),
          confidenceHigh: z.number(),
        })
      ),
      reasoning: z.string(),
      recommendedReorderQty: z.number(),
      recommendedOrderDate: z.string(),
    }),
    productId: z.string(),
    warehouseId: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('forecastAgent');
    if (!agent) throw new Error('Forecast agent not found');

    console.log('Step 3: Generating forecast with AI agent...');

    const dataPointsStr = inputData.historicalData.data
      .map(
        (d) =>
          `${d.date} (${d.dayOfWeek === 0 ? 'Sun' : d.dayOfWeek === 6 ? 'Sat' : 'Weekday'}): ${d.demand} units`
      )
      .join('\n');

    const prompt = `Analyze the following historical demand data and generate a 7-day forecast:

**Product:** ${inputData.historicalData.productName} (${inputData.historicalData.sku})
**Warehouse:** ${inputData.warehouse.name} (${inputData.warehouse.code})
**Historical Daily Demand (last ${inputData.historicalData.dataPoints} days):**
${dataPointsStr}

**Task:**
1. Analyze patterns (trend, seasonality, average, std deviation)
2. Generate a 7-day forecast starting from tomorrow
3. Include 95% confidence intervals
4. Provide reorder recommendations

Return ONLY valid JSON following your instructions. No markdown, no code blocks.`;

    const result = await agent.generate([{ role: 'user', content: prompt }]);

    let forecastData;
    try {
      const text = result.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      forecastData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      throw new Error('Agent did not return valid JSON forecast');
    }

    const avgDemand = Math.round(
      forecastData.predictions.reduce((s: number, p: any) => s + p.predictedDemand, 0) / 7
    );
    console.log(`✓ Forecast generated: avg ${avgDemand} units/day`);

    return {
      forecast: forecastData,
      productId: inputData.productId,
      warehouseId: inputData.warehouseId,
    };
  },
});

// ── Step 4: Save forecast via backend API ─────────────────────────────────────
const saveForecastStep = createStep({
  id: 'save-forecast',
  description: 'Saves the forecast to the database via the backend API',
  inputSchema: z.object({
    forecast: z.any(),
    productId: z.string(),
    warehouseId: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    forecastId: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    console.log('Step 4: Saving forecast via backend...');

    const saved = await saveForecast({
      product: inputData.productId,
      warehouse: inputData.warehouseId,
      forecastedAt: new Date(),
      forecastHorizonDays: 7,
      dailyForecasts: inputData.forecast.predictions.map((p: any) => ({
        date: new Date(p.date),
        predictedDemand: p.predictedDemand,
        confidenceLow: p.confidenceLow,
        confidenceHigh: p.confidenceHigh,
      })),
      totalPredicted7Day: inputData.forecast.predictions.reduce(
        (sum: number, p: any) => sum + p.predictedDemand,
        0
      ),
      overallMape: 0,
      modelVersion: 'mastra-gemini-2.0-flash',
      recommendedReorderQty: inputData.forecast.recommendedReorderQty,
      recommendedOrderDate: inputData.forecast.recommendedOrderDate
        ? new Date(inputData.forecast.recommendedOrderDate)
        : undefined,
    });

    console.log(`✓ Forecast saved: ${saved._id}`);
    return { success: true, forecastId: saved._id };
  },
});

// ── Workflow definition ───────────────────────────────────────────────────────
export const forecastWorkflow = createWorkflow({
  id: 'forecast-workflow',
  inputSchema: z.object({
    productId: z.string(),
    warehouseId: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    forecastId: z.string().optional(),
  }),
})
  .then(validateInputsStep)
  .then(fetchHistoricalDataStep)
  .then(generateForecastStep)
  .then(saveForecastStep);

forecastWorkflow.commit();
