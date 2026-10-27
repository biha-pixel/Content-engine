/**
 * Single Project API
 * GET: Retrieve project details including generated script and storyboard
 */

import { NextRequest } from "next/server";
import { projectStore } from "@/lib/store/projects";
import { jobManager } from "@/lib/pipeline/job-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = projectStore.get(id);

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    let job = null;
    if (project.jobId) {
      job = await jobManager.get(project.jobId);
    }

    return Response.json({ project, job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch project";
    return Response.json({ error: message }, { status: 500 });
  }
}
