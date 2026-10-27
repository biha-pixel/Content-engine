/**
 * Renderer Interface & FFmpeg Implementation
 * Abstracts video rendering functionality using native FFmpeg
 */

import type { Storyboard, Scene } from "@/types";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const execAsync = promisify(exec);

export interface RenderAssets {
  audioFiles: Record<string, string>; // sceneId -> local audio file path
  videoFiles: Record<string, string>; // sceneId -> local video file path
}

export interface Renderer {
  /**
   * Render a video from storyboard and assets
   */
  render(storyboard: Storyboard, assets: RenderAssets): Promise<string>;

  /**
   * Check if the renderer is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get renderer name for logging/debugging
   */
  getName(): string;
}

/**
 * FFmpeg Renderer Implementation
 * Renders vertical 9:16 videos (1080x1920) with synchronized audio & captions
 */
export class FFmpegRenderer implements Renderer {
  private ffmpegPath: string;

  constructor(ffmpegPath: string = "ffmpeg") {
    this.ffmpegPath = ffmpegPath;
  }

  async render(storyboard: Storyboard, assets: RenderAssets): Promise<string> {
    const isAvail = await this.isAvailable();
    if (!isAvail) {
      throw new Error("FFmpeg is not installed or not accessible in PATH");
    }

    const tmpDir = path.join(process.cwd(), "tmp", "assets", `render-${storyboard.projectId}`);
    if (!fsSync.existsSync(tmpDir)) {
      await fs.mkdir(tmpDir, { recursive: true });
    }

    const exportDir = path.join(process.cwd(), "public", "exports");
    if (!fsSync.existsSync(exportDir)) {
      await fs.mkdir(exportDir, { recursive: true });
    }

    const outputFileName = `${storyboard.projectId}.mp4`;
    const finalOutputPath = path.join(exportDir, outputFileName);
    const sceneSegmentPaths: string[] = [];

    try {
      // 1. Render each individual scene segment
      for (let i = 0; i < storyboard.scenes.length; i++) {
        const scene = storyboard.scenes[i];
        const sceneOutputPath = path.join(tmpDir, `scene-${i}.mp4`);

        await this.renderScene(scene, assets, sceneOutputPath);
        sceneSegmentPaths.push(sceneOutputPath);
      }

      // 2. Concatenate all scene segments into final video
      const concatListPath = path.join(tmpDir, "concat_list.txt");
      const concatContent = sceneSegmentPaths
        .map((p) => `file '${p.replace(/\\/g, "/")}'`)
        .join("\n");
      await fs.writeFile(concatListPath, concatContent, "utf8");

      // FFmpeg concat demuxer
      const concatCmd = `"${this.ffmpegPath}" -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k "${finalOutputPath}"`;
      await execAsync(concatCmd);

      // Clean up temporary scene files
      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch (err) {
        console.warn("Failed to clean up temp render dir:", err);
      }

      return `/exports/${outputFileName}`;

    } catch (error) {
      console.error("FFmpeg render failed:", error);
      throw new Error(`Video rendering failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render an individual scene to a 1080x1920 MP4 segment
   */
  private async renderScene(
    scene: Scene,
    assets: RenderAssets,
    outputPath: string
  ): Promise<void> {
    const videoFile = assets.videoFiles[scene.id];
    const audioFile = assets.audioFiles[scene.id];
    const duration = Math.max(1, scene.duration);

    // Escape text for drawtext filter
    const caption = (scene.captionText || scene.narrationText || "")
      .replace(/'/g, "")
      .replace(/:/g, "\\:")
      .replace(/"/g, "")
      .slice(0, 100);

    // Common 9:16 dimensions
    const width = 1080;
    const height = 1920;

    // Pick background color palette based on order for dynamic visual interest
    const colors = ["#0f172a", "#1e1b4b", "#1e293b", "#172554", "#042f2e"];
    const bgColor = colors[scene.order % colors.length];

    if (videoFile && fsSync.existsSync(videoFile)) {
      // With background video clip
      let cmd: string;
      if (audioFile && fsSync.existsSync(audioFile)) {
        cmd = `"${this.ffmpegPath}" -y -stream_loop -1 -i "${videoFile}" -i "${audioFile}" -t ${duration} ` +
          `-vf "scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},` +
          `drawtext=text='${caption}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.6:boxborderw=16:x=(w-text_w)/2:y=h-th-250" ` +
          `-c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${outputPath}"`;
      } else {
        cmd = `"${this.ffmpegPath}" -y -stream_loop -1 -i "${videoFile}" -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} ` +
          `-vf "scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},` +
          `drawtext=text='${caption}':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.6:boxborderw=16:x=(w-text_w)/2:y=h-th-250" ` +
          `-c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "${outputPath}"`;
      }
      await execAsync(cmd);
    } else {
      // Generate colored motion background fallback
      let cmd: string;
      if (audioFile && fsSync.existsSync(audioFile)) {
        cmd = `"${this.ffmpegPath}" -y -f lavfi -i "color=c=${bgColor}:s=${width}x${height}:d=${duration}" -i "${audioFile}" ` +
          `-vf "drawtext=text='${caption}':fontcolor=white:fontsize=56:box=1:boxcolor=black@0.5:boxborderw=24:x=(w-text_w)/2:y=(h-text_h)/2" ` +
          `-c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -t ${duration} "${outputPath}"`;
      } else {
        cmd = `"${this.ffmpegPath}" -y -f lavfi -i "color=c=${bgColor}:s=${width}x${height}:d=${duration}" -f lavfi -i anullsrc=r=44100:cl=stereo ` +
          `-vf "drawtext=text='${caption}':fontcolor=white:fontsize=56:box=1:boxcolor=black@0.5:boxborderw=24:x=(w-text_w)/2:y=(h-text_h)/2" ` +
          `-c:v libx264 -pix_fmt yuv420p -c:a aac -t ${duration} "${outputPath}"`;
      }
      await execAsync(cmd);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`"${this.ffmpegPath}" -version`);
      return stdout.includes("ffmpeg version");
    } catch {
      return false;
    }
  }

  getName(): string {
    return "FFmpeg";
  }
}
