"use strict";
/**
 * Mastra Client for Backend Integration
 *
 * This module provides functions to call Mastra agents and workflows from the backend.
 * It handles HTTP communication with the Mastra Studio server running on port 4111.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWorkflow = executeWorkflow;
exports.generateFromAgent = generateFromAgent;
exports.streamFromAgent = streamFromAgent;
const axios_1 = __importDefault(require("axios"));
const MASTRA_BASE_URL = process.env.MASTRA_BASE_URL || 'http://localhost:4111';
/**
 * Execute a Mastra workflow
 */
async function executeWorkflow(workflowId, input, requestContext) {
    try {
        const response = await axios_1.default.post(`${MASTRA_BASE_URL}/api/workflows/${workflowId}/execute`, {
            inputData: input,
            requestContext,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 300000, // 5 minutes
        });
        return response.data;
    }
    catch (error) {
        console.error(`Error executing workflow ${workflowId}:`, error.message);
        throw new Error(`Workflow execution failed: ${error.message}`);
    }
}
/**
 * Generate a response from a Mastra agent
 */
async function generateFromAgent(agentId, messages, requestContext) {
    try {
        const response = await axios_1.default.post(`${MASTRA_BASE_URL}/api/agents/${agentId}/generate`, {
            messages,
            requestContext,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 120000, // 2 minutes
        });
        return response.data;
    }
    catch (error) {
        console.error(`Error generating from agent ${agentId}:`, error.message);
        throw new Error(`Agent generation failed: ${error.message}`);
    }
}
/**
 * Stream a response from a Mastra agent
 */
async function streamFromAgent(agentId, messages, requestContext) {
    try {
        const response = await axios_1.default.post(`${MASTRA_BASE_URL}/api/agents/${agentId}/stream`, {
            messages,
            requestContext,
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            responseType: 'stream',
            timeout: 120000,
        });
        return response.data;
    }
    catch (error) {
        console.error(`Error streaming from agent ${agentId}:`, error.message);
        throw new Error(`Agent streaming failed: ${error.message}`);
    }
}
