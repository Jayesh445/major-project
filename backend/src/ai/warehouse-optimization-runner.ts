/**
 * Warehouse Optimization Agent Runner
 *
 * This module provides a function to run the warehouse optimization workflow using Mastra.
 * It replaces the old LangChain-based implementation.
 */

import { executeWorkflow } from './mastra-client';
import Warehouse from '@/modules/warehouse/model';
import Inventory from '@/modules/inventory/model';
import WarehouseOptimizationRecommendation from '@/modules/warehouse-optimization/model';

interface OptimizationOutput {
  success: boolean;
  recommendationId?: string;
  validatedCount: number;
}

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
export async function runOptimizationAgent(): Promise<{
  success: boolean;
  recommendationId?: string;
  durationSeconds?: number;
  errors?: string[];
}> {
  console.log(`\n🤖 Starting Mastra warehouse optimization workflow...`);

  const startTime = Date.now();

  try {
    // Prepare request context with database models
    const requestContext = {
      Warehouse,
      Inventory,
      WarehouseOptimizationRecommendation,
    };

    // Execute the workflow
    const result = await executeWorkflow<{}, OptimizationOutput>(
      'warehouse-optimization-workflow',
      {},
      requestContext
    );

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

    console.log(
      `✅ Optimization complete via Mastra in ${durationSeconds.toFixed(1)}s! Generated ${result.validatedCount} recommendations.`
    );

    return {
      success: true,
      recommendationId: result.recommendationId,
      durationSeconds,
    };
  } catch (error: any) {
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
