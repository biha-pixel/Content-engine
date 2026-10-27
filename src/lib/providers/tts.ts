/**
 * TTS Provider Interface
 * Abstracts Text-to-Speech functionality
 */

export interface TTSProvider {
  /**
   * Convert text to speech and return audio buffer
   */
  synthesize(text: string, options?: SynthesizeOptions): Promise<Buffer>;

  /**
   * Check if the provider is available/configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get provider name for logging/debugging
   */
  getName(): string;
}

export interface SynthesizeOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
}

/**
 * Kokoro TTS Provider Implementation
 * Uses Kokoro for local/remote TTS with graceful fallback to silent audio
 */
export class KokoroTTSProvider implements TTSProvider {
  private apiKey?: string;
  private baseURL: string;

  constructor(baseURL: string = "http://localhost:8880/v1", apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  async synthesize(text: string, options?: SynthesizeOptions): Promise<Buffer> {
    try {
      // Try Kokoro TTS endpoint (OpenAI-compatible format)
      const response = await fetch(`${this.baseURL}/audio/speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: "kokoro",
          input: text,
          voice: options?.voice || "af_heart",
          speed: options?.speed || 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Kokoro TTS API error: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);

    } catch (error) {
      console.warn("Kokoro TTS unavailable, using silent audio fallback:", error);
      return this.generateSilentAudio(text);
    }
  }

  /**
   * Generate silent audio as fallback when Kokoro is unavailable
   * Estimates duration based on text length (2.5 words per second)
   */
  private async generateSilentAudio(text: string): Promise<Buffer> {
    const { exec } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(exec);
    const fs = await import("fs/promises");
    const path = await import("path");

    // Estimate duration: ~2.5 words per second
    const wordCount = text.trim().split(/\s+/).length;
    const duration = Math.max(1, Math.ceil(wordCount / 2.5));

    const tmpFile = path.join(process.cwd(), "tmp", "assets", `silent-${Date.now()}.mp3`);

    try {
      // Generate silent audio with FFmpeg
      await execAsync(
        `ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} -q:a 9 -acodec libmp3lame "${tmpFile}" -y`
      );

      const buffer = await fs.readFile(tmpFile);
      await fs.unlink(tmpFile); // Clean up temp file
      return buffer;

    } catch (error) {
      console.error("Failed to generate silent audio:", error);
      // Return minimal empty buffer as last resort
      return Buffer.alloc(0);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: "GET",
        headers: this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {},
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  getName(): string {
    return "Kokoro";
  }
}
