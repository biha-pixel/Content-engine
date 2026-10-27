/**
 * Pipeline Job Store (Singleton)
 * Shared in-memory JobManager instance across API route invocations
 */

import { JobManager } from "@/lib/providers/jobs";

const globalForJobs = globalThis as unknown as { jobManager?: JobManager };
export const jobManager = globalForJobs.jobManager ?? new JobManager();
globalForJobs.jobManager = jobManager;
