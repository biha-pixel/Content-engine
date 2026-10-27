/**
 * Core Types for Creator Engine
 */

// Project types
export interface Project {
  id: string;
  tenantId: string;
  name: string;
  topic: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = "draft" | "processing" | "completed" | "failed";

// Storyboard types
export interface Storyboard {
  id: string;
  projectId: string;
  scenes: Scene[];
  metadata: StoryboardMetadata;
}

export interface Scene {
  id: string;
  order: number;
  duration: number; // in seconds
  narrationText: string;
  narrationAudioURL?: string;
  visualType: "avatar" | "broll" | "text";
  visualAssetURL?: string;
  captionText?: string;
  transition?: "fade" | "cut" | "dissolve";
}

export interface StoryboardMetadata {
  aspectRatio: "9:16" | "16:9" | "1:1";
  targetDuration: number; // in seconds (30-90 for MVP)
  totalDuration: number;
}

// Asset types
export interface Asset {
  id: string;
  projectId: string;
  type: AssetType;
  url: string;
  localPath?: string;
  license: AssetLicense;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export type AssetType = "video" | "image" | "audio" | "script" | "storyboard";

export interface AssetLicense {
  type: string; // "CC0", "CC-BY", "Royalty-Free", etc.
  attribution?: string;
  sourceUrl?: string;
  creator?: string;
}

// Export types
export interface Export {
  id: string;
  projectId: string;
  format: "mp4" | "webm";
  resolution: "1080p" | "720p" | "480p";
  url: string;
  size: number; // in bytes
  createdAt: Date;
}
