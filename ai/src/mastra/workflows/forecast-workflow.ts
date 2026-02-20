import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

// Step 1: Validate inputs
const validateInputsStep = createStep({
  id: 'validate-inputs',
  description: 'Validates that product and warehouse exist and are active',
  inputSchema: z.object({
    productId: z.string(),
    warehouseId: z.string(),
  }),
  outputSchema: z.object({
    valid: z.boolean(),
    product: z.object({
      name: z.string(),
      sku: z.string(),
    }),
    warehouse: z.object({
      name: z.string(),
      code: z.string(),
    }),
    productId: z.string(),
    warehouseId: z.string(),
  }),
  execute: async ({ inputData, mastra, requestContext }) => {
    const agent = mastra?.getAgent('forecastAgent');
    if (!agent) {
      throw new Error('Forecast agent not found');
    }

    console.log('Step 1: Validating inputs...');

    // Call the agent with the validation tool
    const result = await agent.generate(
      [
        {
          role: 'user',
          content: `Validate the following product and warehouse:
Product ID: ${inputData.productId}
Warehouse ID: ${inputData.warehouseId}

Use the validateInput tool to check if they exist and are active.`,
        },
      ],
      { requestContext }
    );

    // Parse the tool result from the agent's response
    // The agent should have called the validateInput tool
    const toolResults = (result as any).toolResults || [];
    const validationResult = toolResults.find((tr: any) => tr.toolName === 'validateInput');

    if (!validationResult) {
      throw new Error('Validation tool was not called');
    }

    console.log(`✓ Validated: ${validationResult.result.product.sku} @ ${validationResult.result.warehouse.code}`);

    return {
      ...validationResult.result,
      productId: inputData.productId,
      warehouseId: inputData.warehouseId,
    };
  },
});

// Step 2: Fetch historical data
const fetchHistoricalDataStep = createStep({
  id: 'fetch-historical-data',
  description: 'Fetches 90 days of historical demand data',
  inputSchema: z.object({
    productId: z.string(),
    warehouseId: z.string(),
    product: z.object({
      name: z.string(),
      sku: z.string(),
    }),
    warehouse: z.object({
      name: z.string(),
      code: z.string(),
    }),
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
    product: z.object({
      name: z.string(),
      sku: z.string(),
    }),
    warehouse: z.object({
      name: z.string(),
      code: z.string(),
    }),
  }),
  execute: async ({ inputData, mastra, requestContext }) => {
    const agent = mastra?.getAgent('forecastAgent');
    if (!agent) {
      throw new Error('Forecast agent not found');
    }

    console.log('Step 2: Fetching historical data...');

    const result = await agent.generate(
      [
        {
          role: 'user',
          content: `Fetch historical demand data for:
Product ID: ${inputData.productId}
Warehouse ID: ${inputData.warehouseId}
Days: 90

Use the fetchHistoricalData tool.`,
        },
      ],
      { requestContext }
    );

    const toolResults = (result as any).toolResults || [];
    const histDataResult = toolResults.find((tr: any) => tr.toolName === 'fetchHistoricalData');

    if (!histDataResult) {
      throw new Error('fetchHistoricalData tool was not called');
    }

    if (histDataResult.result.dataPoints < 30) {
      throw new Error(
        `Insufficient data: only ${histDataResult.result.dataPoints} days available (minimum 30)`
      );
    }

    console.log(`✓ Fetched ${histDataResult.result.dataPoints} days of demand data`);

    return {
      historicalData: histDataResult.result,
      productId: inputData.productId,
      warehouseId: inputData.warehouseId,
      product: inputData.product,
      warehouse: inputData.warehouse,
    };
  },
});

// Step 3: Generate forecast using the agent
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
    product: z.object({
      name: z.string(),
      sku: z.string(),
    }),
    warehouse: z.object({
      name: z.string(),
      code: z.string(),
    }),
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
    if (!agent) {
      throw new Error('Forecast agent not found');
    }

    console.log('Step 3: Generating forecast with AI agent...');

    const histData = inputData.historicalData.data;
    const dataPointsStr = histData
      .map(
        (d) =>
          `${d.date} (${d.dayOfWeek === 0 ? 'Sun' : d.dayOfWeek === 6 ? 'Sat' : 'Weekday'}): ${d.demand} units`
      )
      .join('\n');

    const prompt = `Analyze the following historical demand data and generate a 7-day forecast:

**Historical Daily Demand Data (last ${inputData.historicalData.dataPoints} days):**
${dataPointsStr}

**Task:**
1. First, analyze the patterns in the data (trend, seasonality, average, std deviation)
2. Then, generate a 7-day forecast starting from tomorrow
3. Include confidence intervals (95%)
4. Provide reorder recommendations

Return your analysis and forecast as a JSON object following the structure defined in your instructions.`;

    const result = await agent.generate([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    // Parse JSON from the agent's response
    let forecastData;
    try {
      const textResult = result.text || '';
      // Try to extract JSON from the response
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        forecastData = JSON.parse(jsonMatch[0]);
      } else {
        forecastData = JSON.parse(textResult);
      }
    } catch (error) {
      console.error('Failed to parse forecast JSON:', error);
      throw new Error('Agent did not return valid JSON forecast');
    }

    console.log(
      `✓ Forecast generated: avg ${Math.round(forecastData.predictions.reduce((sum: number, p: any) => sum + p.predictedDemand, 0) / 7)} units/day`
    );

    return {
      forecast: forecastData,
      productId: inputData.productId,
      warehouseId: inputData.warehouseId,
    };
  },
});

// Step 4: Save forecast to database
const saveForecastStep = createStep({
  id: 'save-forecast',
  description: 'Saves the forecast to the database',
  inputSchema: z.object({
    forecast: z.any(),
    productId: z.string(),
    warehouseId: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    forecastId: z.string().optional(),
  }),
  execute: async ({ inputData, requestContext }) => {
    console.log('Step 4: Saving forecast to database...');

    const { DemandForecast } = requestContext as any;

    const demandForecast = new DemandForecast({
      product: inputData.productId,
      warehouse: inputData.warehouseId,
      forecastedAt: new Date(),
      forecastHorizonDays: 7,
      dailyForecasts: inputData.forecast.predictions.map((p: any) => ({
        date: new Date(p.date),
        predictedDemand: p.predictedDemand,
        confidenceLow: p.confidenceLow,
        confidenceHigh: p.confidenceHigh,
        actualDemand: undefined,
        mape: undefined,
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

    await demandForecast.save();
    console.log(`✓ Forecast saved to database: ${demandForecast._id}`);

    return {
      success: true,
      forecastId: demandForecast._id.toString(),
    };
  },
});

// Create the workflow
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
