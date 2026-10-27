# Architecture: Creator Engine

Creator Engine is a multi-tenant SaaS platform that automates short-form video production.

## 1. High-Level Architecture

The system follows a **Modular Pipeline Pattern**. A core orchestrator manages the state lifecycle of a project, while specialized "Provider Adapters" perform the work at each stage.

*   **Orchestrator (The Engine):** Manages job queues, state persistence, and error handling.
*   **Provider Adapters:** Abstraction layer for interchangeable services (LLM, TTS, Avatar, Asset, Renderer, Publisher).
*   **Tenant Manager:** Handles multi-tenant isolation, billing tracking, and project scoping.

## 2. Database Schema (PostgreSQL)

*   **Tenants:** `id`, `name`, `plan_tier`, `created_at`
*   **Projects:** `id`, `tenant_id`, `name`, `status`, `created_at`
*   **Jobs (Pipeline State):** `id`, `project_id`, `stage`, `status` (PENDING, RUNNING, COMPLETED, FAILED), `result_metadata` (jsonb)
*   **Assets:** `id`, `project_id`, `type` (RESEARCH, SCRIPT, VIDEO, BROLL), `url` (or local path), `license_metadata` (JSON), `created_at`

## 3. API Structure (REST/gRPC)

*   `POST /projects`: Create a new project.
*   `GET /projects/{id}`: Check project status and pipeline state.
*   `POST /projects/{id}/orchestrate`: Trigger pipeline or next stage.
*   `GET /tenants/{id}/usage`: Retrieve cost/quota reports.

## 4. Job State Machine

Each stage (Research → Script → ...) is treated as a discrete job task managed by a persistent task queue (e.g., Temporal or Redis + BullMQ).

1.  **Enqueued** (Initial)
2.  **Processing** (Adapter running)
3.  **Paused** (Awaiting human approval if configured)
4.  **Completed**
5.  **Failed** (Triggers retry policy or alerts)

## 5. Provider Interfaces (Adapter Pattern)

Every external dependency must implement a defined interface:

```typescript
interface LLMProvider {
  generate(prompt: string): Promise<string>;
}
// Example swap: OpenAIAdapter vs LocalLlamaAdapter
```

## 6. Security Model

*   **Multi-tenancy:** Row Level Security (RLS) in PostgreSQL enforced by `tenant_id` on all tables.
*   **Secrets:** API keys managed in a vaulted secret store; never persisted in the application database.
*   **Media Integrity:** Media assets stored in private S3 buckets or secured local volumes; access controlled via temporary signed URLs.

## 7. Video Storyboard Schema (JSON)

```json
{
  "project_id": "uuid",
  "scenes": [
    {
      "duration": 5.0,
      "narration": "...",
      "visuals": { "type": "avatar|broll", "asset_id": "uuid" },
      "captions": "..."
    }
  ]
}
```

## 8. MVP Milestones

1.  **M1: Scaffolding** (Project structure, DB/Queue setup, Tenant/Auth shell)
2.  **M2: Infrastructure** (Implement LLM + Storyboard Orchestration)
3.  **M3: Asset Integration** (Basic B-Roll + TTS + Simple Composition)
4.  **M4: Polish** (QC Flow, Export, Tenant Management)

## 9. Out of Scope for MVP

*   Real-time collaborative editing.
*   High-end AI avatar lip-sync fidelity (simple overlays/animators for MVP).
*   Automatic publishing to multiple platforms (manual export to file for MVP).
*   Massive parallel processing for high-volume users.

## 10. Budget/Component Strategy

| Component | Default Approach | Open-Source Alternative |
|-----------|------------------|--------------------------|
| LLM | Mistral/Llama 3 | Local Ollama |
| TTS | Piper (Local)    | Coqui TTS (Local) |
| Renderer  | FFmpeg           | Manim (Animated visual) |
| Assets    | Pexels/Pixabay   | CC0 Libraries only |
