/**
 * Mastra Client for Backend Integration
 *
 * This module provides functions to call Mastra agents and workflows from the backend.
 * It handles HTTP communication with the Mastra Studio server running on port 4111.
 */

import axios from 'axios';

const MASTRA_BASE_URL = process.env.MASTRA_BASE_URL || 'http://localhost:4111';

/**
 * Execute a Mastra workflow
 */
export async function executeWorkflow<TInput = any, TOutput = any>(
  workflowId: string,
  input: TInput,
  requestContext?: any
): Promise<TOutput> {
  try {
    const response = await axios.post(
      `${MASTRA_BASE_URL}/api/workflows/${workflowId}/execute`,
      {
        inputData: input,
        requestContext,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 300000, // 5 minutes
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(`Error executing workflow ${workflowId}:`, error.message);
    throw new Error(`Workflow execution failed: ${error.message}`);
  }
}

/**
 * Generate a response from a Mastra agent
 */
export async function generateFromAgent<TOutput = any>(
  agentId: string,
  messages: Array<{ role: string; content: string }>,
  requestContext?: any
): Promise<{ text: string; data: TOutput; toolResults?: any[] }> {
  try {
    const response = await axios.post(
      `${MASTRA_BASE_URL}/api/agents/${agentId}/generate`,
      {
        messages,
        requestContext,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutes
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(`Error generating from agent ${agentId}:`, error.message);
    throw new Error(`Agent generation failed: ${error.message}`);
  }
}

/**
 * Stream a response from a Mastra agent
 */
export async function streamFromAgent(
  agentId: string,
  messages: Array<{ role: string; content: string }>,
  requestContext?: any
): Promise<ReadableStream> {
  try {
    const response = await axios.post(
      `${MASTRA_BASE_URL}/api/agents/${agentId}/stream`,
      {
        messages,
        requestContext,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 120000,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error(`Error streaming from agent ${agentId}:`, error.message);
    throw new Error(`Agent streaming failed: ${error.message}`);
  }
}
