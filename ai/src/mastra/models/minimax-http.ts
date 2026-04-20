/**
 * Direct HTTP client for Minimax API (OpenAI-compatible)
 * Used by Mastra agents to call Minimax directly
 */

export interface MinimaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MinimaxChatCompletion {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class MinimaxHTTPClient {
  private apiKey: string;
  private baseURL = 'https://api.minimax.io/v1';
  private modelId = 'MiniMax-M2.7';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  async chat(
    messages: MinimaxMessage[],
    options?: {
      temperature?: number;
      max_tokens?: number;
      top_p?: number;
    }
  ): Promise<string> {
    const payload = {
      model: this.modelId,
      messages,
      temperature: options?.temperature ?? 0,
      top_p: options?.top_p ?? 1,
      stream: false,
      ...(options?.max_tokens && { max_tokens: options.max_tokens }),
    };

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
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

      const data = (await response.json()) as MinimaxChatCompletion;
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('[Minimax] API call failed:', error);
      throw error;
    }
  }
}

export const minimaxHTTP = new MinimaxHTTPClient();
