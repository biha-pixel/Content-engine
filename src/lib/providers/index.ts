/**
 * Provider Factory
 * Creates provider instances from environment variables
 */

import { LLMProvider, OpenRouterLLMProvider } from "./llm";
import { TTSProvider, KokoroTTSProvider } from "./tts";
import { AssetProvider, PexelsAssetProvider } from "./assets";
import { Renderer, FFmpegRenderer } from "./renderer";

let llmProviderInstance: LLMProvider | null = null;
let ttsProviderInstance: TTSProvider | null = null;
let assetProviderInstance: AssetProvider | null = null;
let rendererInstance: Renderer | null = null;

export function getLLMProvider(): LLMProvider {
  if (llmProviderInstance) return llmProviderInstance;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY environment variable is required. " +
      "Add it to .env.local (see .env.example for template)."
    );
  }

  const model = process.env.OPENROUTER_MODEL || "mistralai/mistral-nemo";
  llmProviderInstance = new OpenRouterLLMProvider(apiKey, model);
  return llmProviderInstance;
}

export function getTTSProvider(): TTSProvider {
  if (ttsProviderInstance) return ttsProviderInstance;

  const baseURL = process.env.KOKORO_BASE_URL || "http://localhost:8880/v1";
  ttsProviderInstance = new KokoroTTSProvider(baseURL);
  return ttsProviderInstance;
}

export function getAssetProvider(): AssetProvider {
  if (assetProviderInstance) return assetProviderInstance;

  const apiKey = process.env.PEXELS_API_KEY || "";
  assetProviderInstance = new PexelsAssetProvider(apiKey);
  return assetProviderInstance;
}

export function getRenderer(): Renderer {
  if (rendererInstance) return rendererInstance;

  rendererInstance = new FFmpegRenderer("ffmpeg");
  return rendererInstance;
}
