/**
 * Custom Minimax language model for Mastra
 * Maps Mastra's interface to Minimax's API
 */

import { LanguageModel } from '@mastra/core/language-model';

export interface MinimaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export class MinimaxLanguageModel implements LanguageModel {
  private apiKey: string;
  private baseURL = 'https://api.minimax.io/v1';
  private modelId = 'M2-her';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MINIMAX_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('MINIMAX_API_KEY environment variable is required');
    }
  }

  async doGenerate(params: {
    prompt: string | Array<{ role: string; content: string }>;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    system?: string;
  }): Promise<string> {
    const messages: MinimaxMessage[] = [];

    // Handle system message
    if (params.system) {
      messages.push({
        role: 'system',
        content: params.system,
        name: 'System',
      });
    }

    // Handle prompt
    if (typeof params.prompt === 'string') {
      messages.push({
        role: 'user',
        content: params.prompt,
        name: 'User',
      });
    } else {
      for (const msg of params.prompt) {
        messages.push({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
          name: msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : 'System',
        });
      }
    }

    try {
      const response = await fetch(`${this.baseURL}/text/chatcompletion_v2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelId,
          messages,
          temperature: params.temperature ?? 0,
          top_p: params.topP ?? 1,
          ...(params.maxTokens && { max_tokens: params.maxTokens }),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Minimax API error: ${response.status} ${error}`);
      }

      const data = await response.json() as any;
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Minimax API call failed:', error);
      throw error;
    }
  }
}

export function createMinimaxModel(apiKey?: string): MinimaxLanguageModel {
  return new MinimaxLanguageModel(apiKey);
}
