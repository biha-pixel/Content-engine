/**
 * In-Memory Project Store (Singleton)
 * Tracks projects and their generated artifacts for MVP
 */

import type { Project, Storyboard } from "@/types";

export interface ProjectData extends Project {
  script?: string;
  storyboard?: Storyboard;
  jobId?: string;
  videoUrl?: string;
}

class ProjectStore {
  private projects: Map<string, ProjectData> = new Map();

  create(data: { name: string; topic: string; tenantId: string }): ProjectData {
    const project: ProjectData = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      name: data.name,
      topic: data.topic,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(project.id, project);
    return project;
  }

  get(id: string): ProjectData | null {
    return this.projects.get(id) || null;
  }

  update(id: string, updates: Partial<ProjectData>): ProjectData | null {
    const project = this.projects.get(id);
    if (!project) return null;
    Object.assign(project, updates, { updatedAt: new Date() });
    return project;
  }

  list(tenantId?: string): ProjectData[] {
    const all = Array.from(this.projects.values());
    if (tenantId) {
      return all.filter((p) => p.tenantId === tenantId);
    }
    return all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

const globalForProjects = globalThis as unknown as { projectStore?: ProjectStore };
export const projectStore = globalForProjects.projectStore ?? new ProjectStore();
globalForProjects.projectStore = projectStore;
