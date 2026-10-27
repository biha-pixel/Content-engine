/**
 * Job Management Service
 * Handles pipeline job state and orchestration
 */

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export type JobStage =
  | "research"
  | "script"
  | "storyboard"
  | "tts"
  | "avatar"
  | "broll"
  | "captions"
  | "rendering"
  | "qc"
  | "export";

export interface Job {
  id: string;
  projectId: string;
  tenantId: string;
  stage: JobStage;
  status: JobStatus;
  progress: number; // 0-100
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Job Manager
 * Manages job lifecycle and state transitions
 */
export class JobManager {
  private jobs: Map<string, Job> = new Map();

  async create(projectId: string, tenantId: string): Promise<Job> {
    const job: Job = {
      id: crypto.randomUUID(),
      projectId,
      tenantId,
      stage: "research",
      status: "pending",
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async get(id: string): Promise<Job | null> {
    return this.jobs.get(id) || null;
  }

  async update(id: string, updates: Partial<Job>): Promise<Job | null> {
    const job = this.jobs.get(id);
    if (!job) return null;
    Object.assign(job, updates, { updatedAt: new Date() });
    return job;
  }

  async listByProject(projectId: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter((j) => j.projectId === projectId);
  }
}
