/**
 * Pipeline Orchestrator
 * Chained execution of video production stages:
 * Research + Script → Storyboard → TTS → B-roll → Rendering (M2 + M3 scope)
 */

import type { LLMProvider } from "@/lib/providers/llm";
import type { TTSProvider } from "@/lib/providers/tts";
import type { AssetProvider } from "@/lib/providers/assets";
import type { Renderer, RenderAssets } from "@/lib/providers/renderer";
import type { Storyboard } from "@/types";
import { JobManager } from "@/lib/providers/jobs";
import { buildScriptPrompt } from "@/lib/prompts/script";
import { buildStoryboardPrompt } from "@/lib/prompts/storyboard";
import { parseAndValidateStoryboard } from "@/lib/validation/storyboard";
import fs from "fs/promises";
import path from "path";

export interface PipelineInput {
  projectId: string;
  tenantId: string;
  topic: string;
  targetDuration: number;
  aspectRatio?: "9:16" | "16:9" | "1:1";
}

export interface PipelineResult {
  jobId: string;
  script: string;
  storyboard: Storyboard;
  videoUrl?: string;
}

export class PipelineOrchestrator {
  constructor(
    private llm: LLMProvider,
    private tts: TTSProvider,
    private assets: AssetProvider,
    private renderer: Renderer,
    private jobManager: JobManager
  ) {}

  async run(input: PipelineInput): Promise<PipelineResult> {
    const job = await this.jobManager.create(input.projectId, input.tenantId);

    try {
      // Stage 1: Research + Script Generation (inline for MVP)
      await this.jobManager.update(job.id, {
        stage: "research",
        status: "running",
        progress: 5,
      });

      await this.jobManager.update(job.id, {
        stage: "script",
        status: "running",
        progress: 15,
      });

      const scriptPrompt = buildScriptPrompt(input.topic, input.targetDuration);
      const script = await this.llm.generate(scriptPrompt, {
        maxTokens: 2048,
        temperature: 0.7,
      });

      if (!script || script.trim().length === 0) {
        throw new Error("LLM returned empty script");
      }

      await this.jobManager.update(job.id, {
        stage: "script",
        status: "completed",
        progress: 30,
      });

      // Stage 2: Storyboard Generation
      await this.jobManager.update(job.id, {
        stage: "storyboard",
        status: "running",
        progress: 40,
      });

      const storyboardPrompt = buildStoryboardPrompt(
        script,
        input.projectId,
        input.targetDuration,
        input.aspectRatio || "9:16"
      );

      const storyboardRaw = await this.llm.generate(storyboardPrompt, {
        maxTokens: 4096,
        temperature: 0.3,
      });

      const storyboard = parseAndValidateStoryboard(storyboardRaw);

      await this.jobManager.update(job.id, {
        stage: "storyboard",
        status: "completed",
        progress: 50,
      });

      // Stage 3: TTS (Text-to-Speech)
      await this.jobManager.update(job.id, {
        stage: "tts",
        status: "running",
        progress: 60,
      });

      const audioFiles: Record<string, string> = {};
      const tmpAudioDir = path.join(process.cwd(), "tmp", "assets", input.projectId);
      await fs.mkdir(tmpAudioDir, { recursive: true });

      for (const scene of storyboard.scenes) {
        const audioBuffer = await this.tts.synthesize(scene.narrationText, {
          voice: "af_heart",
          speed: 1.0,
        });

        const audioPath = path.join(tmpAudioDir, `scene-${scene.order}.mp3`);
        await fs.writeFile(audioPath, audioBuffer);
        audioFiles[scene.id] = audioPath;
      }

      await this.jobManager.update(job.id, {
        stage: "tts",
        status: "completed",
        progress: 70,
      });

      // Stage 4: B-roll Asset Search & Download
      await this.jobManager.update(job.id, {
        stage: "broll",
        status: "running",
        progress: 75,
      });

      const videoFiles: Record<string, string> = {};

      for (const scene of storyboard.scenes) {
        if (scene.visualType === "broll") {
          // Extract keywords from narration for search
          const keywords = this.extractKeywords(scene.narrationText);
          const searchQuery = keywords.slice(0, 3).join(" ") || input.topic;

          const searchResults = await this.assets.search(searchQuery, {
            type: "video",
            orientation: "portrait",
            maxResults: 3,
          });

          if (searchResults.length > 0) {
            try {
              const localPath = await this.assets.download(searchResults[0]);
              videoFiles[scene.id] = localPath;
            } catch (error) {
              console.warn(`Failed to download B-roll for scene ${scene.order}:`, error);
              // Renderer will use fallback background
            }
          }
        }
        // For "text" and "avatar" visual types, renderer uses generated backgrounds
      }

      await this.jobManager.update(job.id, {
        stage: "broll",
        status: "completed",
        progress: 85,
      });

      // Stage 5: Video Rendering
      await this.jobManager.update(job.id, {
        stage: "rendering",
        status: "running",
        progress: 90,
      });

      const renderAssets: RenderAssets = {
        audioFiles,
        videoFiles,
      };

      const videoUrl = await this.renderer.render(storyboard, renderAssets);

      await this.jobManager.update(job.id, {
        stage: "rendering",
        status: "completed",
        progress: 100,
      });

      return { jobId: job.id, script, storyboard, videoUrl };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown pipeline error";
      await this.jobManager.update(job.id, {
        status: "failed",
        error: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Extract important keywords from narration text for B-roll search
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction: remove common stop words and take nouns/verbs
    const stopWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "is", "are", "was", "were", "been", "be", "have", "has",
      "had", "do", "does", "did", "will", "would", "should", "could", "can",
      "may", "might", "must", "this", "that", "these", "those", "it", "its",
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))
      .slice(0, 5);
  }
}
