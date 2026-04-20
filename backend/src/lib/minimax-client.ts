/**
 * Custom Minimax API client
 * Minimax uses a custom API format (not Anthropic-compatible)
 * Endpoint: https://api.minimax.io/v1/text/chatcompletion_v2
 */

export interface MinimaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface MinimaxResponse {
  id: string;
  choices: Array<{
    finish_reason: string;
    index: number;
    message: {
      content: string;
      role: string;
      name?: string;
    };
  }>;
  created: number;
  model: string;
  usage: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export class MinimaxClient {
  private apiKey: string;
  private baseURL = 'https://api.minimax.io/v1';
  private model = 'M2-her';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MINIMAX_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('MINIMAX_API_KEY environment variable is required');
    }
  }

  async createMessage(
    messages: MinimaxMessage[],
    options?: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
    }
  ): Promise<MinimaxResponse> {
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

    return response.json() as Promise<MinimaxResponse>;
  }
}

export const minimaxClient = new MinimaxClient();
