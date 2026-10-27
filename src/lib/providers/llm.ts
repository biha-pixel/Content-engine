/**
 * LLM Provider Interface
 * Abstracts LLM functionality to support multiple providers (OpenRouter, local Ollama, etc.)
 */

export interface LLMProvider {
  /**
   * Generate text from a prompt
   */
  generate(prompt: string, options?: GenerateOptions): Promise<string>;

  /**
   * Check if the provider is available/configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider name for logging/debugging
   */
  getName(): string;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  systemPrompt?: string;
}

/**
 * OpenRouter LLM Provider Implementation
 * Uses the OpenRouter API for LLM access
 */
export class OpenRouterLLMProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "mistral/mistral-nemo") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];

    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://creator-engine.local",
        "X-Title": "Creator Engine",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenRouter returned empty response");
    }

    return content;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  getName(): string {
    return "OpenRouter";
  }
}

/**
 * Omniroute LLM Provider Implementation
 * Uses local Omniroute routing endpoint (OpenAI-compatible)
 */
export class OmnirouteLLMProvider implements LLMProvider {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(
    apiKey: string = "",
    baseURL: string = "http://localhost:20128",
    model: string = "default"
  ) {
    this.apiKey = apiKey;
    this.baseURL = baseURL.replace(/\/+$/, "");
    this.model = model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const messages: Array<{ role: string; content: string }> = [];

    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const endpoint = this.baseURL.endsWith("/v1")
      ? `${this.baseURL}/chat/completions`
      : `${this.baseURL}/v1/chat/completions`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Omniroute API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Omniroute returned empty response");
    }

    return content;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const endpoint = this.baseURL.endsWith("/v1")
        ? `${this.baseURL}/models`
        : `${this.baseURL}/v1/models`;

      const headers: Record<string, string> = {};
      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getName(): string {
    return "Omniroute";
  }
}

/**
 * Local Ollama LLM Provider Implementation
 * Uses a local Ollama instance for LLM access
 */
export class OllamaLLMProvider implements LLMProvider {
  private baseURL: string;
  private model: string;

  constructor(baseURL: string = "http://localhost:11434", model: string = "llama2") {
    this.baseURL = baseURL;
    this.model = model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    // TODO: Implement Ollama API call
    throw new Error("OllamaLLMProvider.generate() not yet implemented");
  }

  async isAvailable(): Promise<boolean> {
    // TODO: Implement health check
    return false;
  }

  getName(): string {
    return "Ollama (Local)";
  }
}
