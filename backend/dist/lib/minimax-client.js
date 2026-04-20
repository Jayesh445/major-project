"use strict";
/**
 * Custom Minimax API client
 * Minimax uses a custom API format (not Anthropic-compatible)
 * Endpoint: https://api.minimax.io/v1/text/chatcompletion_v2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.minimaxClient = exports.MinimaxClient = void 0;
class MinimaxClient {
    constructor(apiKey) {
        this.baseURL = 'https://api.minimax.io/v1';
        this.model = 'M2-her';
        this.apiKey = apiKey || process.env.MINIMAX_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('MINIMAX_API_KEY environment variable is required');
        }
    }
    async createMessage(messages, options) {
        const payload = {
            model: this.model,
            messages,
            temperature: options?.temperature ?? 0,
            top_p: options?.top_p ?? 1,
            ...(options?.max_tokens && { max_tokens: options.max_tokens }),
        };
        const response = await fetch(`${this.baseURL}/text/chatcompletion_v2`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Minimax API error: ${response.status} ${error}`);
        }
        return response.json();
    }
}
exports.MinimaxClient = MinimaxClient;
exports.minimaxClient = new MinimaxClient();
