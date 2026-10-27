/**
 * Storyboard Validation Layer
 * Deterministically validates that LLM storyboard output matches the canonical Storyboard type
 * Enforces CLAUDE.md rule: "All generated videos must originate from validated storyboard data."
 */

import type { Storyboard, Scene, StoryboardMetadata } from "@/types";

export function parseAndValidateStoryboard(raw: string): Storyboard {
  // Strip markdown code fences if present (LLMs frequently wrap JSON in ```json ... ```)
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Storyboard JSON parse failed: ${(e as Error).message}\nRaw output: ${raw.slice(0, 200)}...`);
  }

  // Validate top-level shape
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Storyboard must be an object");
  }
  const obj = parsed as Record<string, unknown>;

  if (typeof obj.id !== "string" || obj.id.trim().length === 0) {
    throw new Error("Storyboard missing valid 'id'");
  }
  if (typeof obj.projectId !== "string" || obj.projectId.trim().length === 0) {
    throw new Error("Storyboard missing valid 'projectId'");
  }
  if (!Array.isArray(obj.scenes) || obj.scenes.length === 0) {
    throw new Error("Storyboard must have at least one scene");
  }

  // Validate each scene
  const scenes: Scene[] = obj.scenes.map((s: unknown, i: number) => {
    if (!s || typeof s !== "object") {
      throw new Error(`Scene ${i} is not an object`);
    }
    const scene = s as Record<string, unknown>;

    if (typeof scene.id !== "string" || scene.id.trim().length === 0) {
      throw new Error(`Scene ${i} missing valid 'id'`);
    }
    if (typeof scene.order !== "number" || scene.order < 0) {
      throw new Error(`Scene ${i} missing valid 'order'`);
    }
    if (typeof scene.duration !== "number" || scene.duration <= 0) {
      throw new Error(`Scene ${i} has invalid duration (must be positive number)`);
    }
    if (typeof scene.narrationText !== "string" || scene.narrationText.trim().length === 0) {
      throw new Error(`Scene ${i} missing valid 'narrationText'`);
    }
    if (!["avatar", "broll", "text"].includes(scene.visualType as string)) {
      throw new Error(`Scene ${i} has invalid visualType '${scene.visualType}' (must be avatar, broll, or text)`);
    }

    const validTransition = ["fade", "cut", "dissolve"].includes(scene.transition as string)
      ? (scene.transition as Scene["transition"])
      : undefined;

    return {
      id: scene.id as string,
      order: scene.order as number,
      duration: scene.duration as number,
      narrationText: (scene.narrationText as string).trim(),
      visualType: scene.visualType as Scene["visualType"],
      captionText: typeof scene.captionText === "string" ? scene.captionText.trim() : undefined,
      transition: validTransition,
    };
  });

  // Validate metadata
  if (!obj.metadata || typeof obj.metadata !== "object") {
    throw new Error("Storyboard missing 'metadata'");
  }
  const meta = obj.metadata as Record<string, unknown>;

  if (!["9:16", "16:9", "1:1"].includes(meta.aspectRatio as string)) {
    throw new Error(`Invalid aspectRatio '${meta.aspectRatio}' (must be 9:16, 16:9, or 1:1)`);
  }
  if (typeof meta.targetDuration !== "number" || meta.targetDuration <= 0) {
    throw new Error("Missing or invalid targetDuration");
  }

  // Recompute total duration from individual scene durations (deterministic override)
  const computedTotal = scenes.reduce((sum, s) => sum + s.duration, 0);

  const metadata: StoryboardMetadata = {
    aspectRatio: meta.aspectRatio as StoryboardMetadata["aspectRatio"],
    targetDuration: meta.targetDuration as number,
    totalDuration: Math.round(computedTotal * 10) / 10,
  };

  return {
    id: obj.id as string,
    projectId: obj.projectId as string,
    scenes,
    metadata,
  };
}
