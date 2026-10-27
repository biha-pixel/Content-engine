/**
 * Health Check API
 * Verifies system status and configured providers
 */

import { getLLMProvider, getTTSProvider, getAssetProvider, getRenderer } from "@/lib/providers";

export async function GET() {
  try {
    const llm = getLLMProvider();
    const tts = getTTSProvider();
    const assets = getAssetProvider();
    const renderer = getRenderer();

    const [isLLMAvailable, isTTSAvailable, isAssetsAvailable, isRendererAvailable] = await Promise.all([
      llm.isAvailable(),
      tts.isAvailable(),
      assets.isAvailable(),
      renderer.isAvailable(),
    ]);

    return Response.json({
      status: "ok",
      providers: {
        llm: { name: llm.getName(), available: isLLMAvailable },
        tts: { name: tts.getName(), available: isTTSAvailable },
        assets: { name: assets.getName(), available: isAssetsAvailable },
        renderer: { name: renderer.getName(), available: isRendererAvailable },
        publisher: { name: "Local Export", available: true },
      },
    });
  } catch (error) {
    return Response.json({
      status: "degraded",
      error: error instanceof Error ? error.message : "Provider initialization failed",
      providers: {
        llm: { name: "OpenRouter", available: false },
        tts: { name: "Kokoro", available: false },
        assets: { name: "Pexels", available: false },
        renderer: { name: "FFmpeg", available: false },
        publisher: { name: "Local Export", available: true },
      },
    });
  }
}
