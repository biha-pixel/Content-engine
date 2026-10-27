/**
 * Job Status API
 * GET: Lightweight endpoint for polling job execution state
 */

import { NextRequest } from "next/server";
import { jobManager } from "@/lib/pipeline/job-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = await jobManager.get(jobId);

    if (!job) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    return Response.json({
      id: job.id,
      projectId: job.projectId,
      stage: job.stage,
      status: job.status,
      progress: job.progress,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch job";
    return Response.json({ error: message }, { status: 500 });
  }
}
