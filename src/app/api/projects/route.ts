/**
 * Projects API
 * POST: Create a project and trigger the M2 pipeline (Script + Storyboard generation)
 * GET: List all projects
 */

import { NextRequest } from "next/server";
import { getLLMProvider, getTTSProvider, getAssetProvider, getRenderer } from "@/lib/providers";
import { PipelineOrchestrator } from "@/lib/pipeline/orchestrator";
import { jobManager } from "@/lib/pipeline/job-store";
import { projectStore } from "@/lib/store/projects";

export async function GET() {
  try {
    const projects = projectStore.list();
    return Response.json({ projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch projects";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, topic, duration } = body;

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Project name is required" }, { status: 400 });
    }
    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return Response.json({ error: "Video topic is required" }, { status: 400 });
    }
    const targetDuration = Number(duration);
    if (![30, 60, 90].includes(targetDuration)) {
      return Response.json(
        { error: "Duration must be 30, 60, or 90 seconds" },
        { status: 400 }
      );
    }

    const tenantId = "default-tenant"; // Hardcoded for MVP (no auth yet)

    // Create the project entry
    const project = projectStore.create({
      name: name.trim(),
      topic: topic.trim(),
      tenantId,
    });

    // Mark as processing
    projectStore.update(project.id, { status: "processing" });

    // Initialize provider and orchestrator
    const llm = getLLMProvider();
    const tts = getTTSProvider();
    const assets = getAssetProvider();
    const renderer = getRenderer();
    const orchestrator = new PipelineOrchestrator(llm, tts, assets, renderer, jobManager);

    // Run the pipeline
    const result = await orchestrator.run({
      projectId: project.id,
      tenantId,
      topic: topic.trim(),
      targetDuration,
      aspectRatio: "9:16",
    });

    // Update the project with generated assets
    projectStore.update(project.id, {
      status: "completed",
      script: result.script,
      storyboard: result.storyboard,
      videoUrl: result.videoUrl,
      jobId: result.jobId,
    });

    return Response.json({
      project: projectStore.get(project.id),
      jobId: result.jobId,
      script: result.script,
      storyboard: result.storyboard,
      videoUrl: result.videoUrl,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Pipeline error:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
