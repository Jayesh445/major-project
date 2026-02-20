/**
 * Forecast Agent Runner
 *
 * This module provides a function to run the demand forecasting workflow using Mastra.
 * It replaces the old LangChain-based implementation.
 */

import { executeWorkflow } from './mastra-client';
import Product from '@/modules/product/model';
import Warehouse from '@/modules/warehouse/model';
import Inventory from '@/modules/inventory/model';
import DemandForecast from '@/modules/forecast/model';

interface ForecastInput {
  productId: string;
  warehouseId: string;
}

interface ForecastOutput {
  success: boolean;
  forecastId?: string;
}

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
export async function runForecastingAgent(
  productId: string,
  warehouseId: string
): Promise<{ success: boolean; forecastId?: string; errors?: string[] }> {
  console.log(
    `\n🤖 Starting Mastra demand forecasting workflow for product ${productId} in warehouse ${warehouseId}...`
  );

  try {
    // Prepare request context with database models
    const requestContext = {
      Product,
      Warehouse,
      Inventory,
      DemandForecast,
    };

    // Execute the workflow
    const result = await executeWorkflow<ForecastInput, ForecastOutput>(
      'forecast-workflow',
      {
        productId,
        warehouseId,
      },
      requestContext
    );

    if (!result.success) {
      console.error('❌ Forecasting failed');
      return { success: false, errors: ['Workflow execution failed'] };
    }

    console.log('✅ Forecasting complete via Mastra!');
    return {
      success: true,
      forecastId: result.forecastId,
    };
  } catch (error: any) {
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
export async function runBatchForecasting(): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  errors: string[];
}> {
  console.log('\n🤖 Starting batch forecasting via Mastra...');

  const inventories = await Inventory.find({})
    .populate('product', 'isActive')
    .populate('warehouse', 'isActive')
    .lean();

  const activeInventories = inventories.filter(
    (inv: any) => inv.product?.isActive && inv.warehouse?.isActive
  );

  console.log(`Found ${activeInventories.length} active inventory records to forecast`);

  let succeeded = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const inv of activeInventories) {
    try {
      const result = await runForecastingAgent(
        (inv.product as any)._id.toString(),
        (inv.warehouse as any)._id.toString()
      );

      if (result.success) {
        succeeded++;
      } else {
        failed++;
        errors.push(
          `Failed for product ${(inv.product as any)._id} @ warehouse ${(inv.warehouse as any)._id}: ${result.errors?.join(', ')}`
        );
      }
    } catch (error: any) {
      failed++;
      errors.push(
        `Error for product ${(inv.product as any)._id} @ warehouse ${(inv.warehouse as any)._id}: ${error.message}`
      );
    }
  }

  console.log(
    `✅ Batch forecasting complete: ${succeeded} succeeded, ${failed} failed out of ${activeInventories.length} total`
  );

  return {
    total: activeInventories.length,
    succeeded,
    failed,
    errors,
  };
}
