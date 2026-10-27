# Creator Engine

Creator Engine is an open-source, multi-tenant SaaS platform that automates the end-to-end production of short-form 9:16 social media videos (30–90 seconds) from text topics.

The system orchestrates AI-generated decisions across specialized provider adapters (LLM, TTS, Asset Retrieval, and FFmpeg Rendering) to produce complete, captioned MP4 videos.

---

## Architecture & Core Principles

Creator Engine separates **AI decision-making** from **deterministic code execution**:
1. **Orchestrator**: Manages state lifecycle and job pipelines.
2. **Provider Adapters**: Loose coupling via provider interfaces (`LLMProvider`, `TTSProvider`, `AssetProvider`, `Renderer`, `Publisher`). No vendor lock-in.
3. **Graceful Degradation**: Core pipelines function even when optional external services (such as TTS or stock video APIs) are unavailable, utilizing robust fallbacks (e.g., silent audio generation and colored gradient backgrounds).

### Pipeline Stages
1. **Script Generation**: LLM generates structured narration and timing based on topic input.
2. **Storyboard Generation**: LLM produces validated JSON scene breakdowns with visual asset directives.
3. **Text-to-Speech (TTS)**: Synthesizes scene audio (with silent audio fallback).
4. **B-roll Retrieval**: Searches and downloads portrait stock footage (Pexels API integration with fallback).
5. **FFmpeg Rendering**: Composes scenes, burns in styled captions, synchronizes audio, and concatenates segments into an optimized 1080x1920 portrait MP4.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4, Shadcn/UI components (`@base-ui/react`, `lucide-react`)
- **Video Processing**: FFmpeg (system binary with explicit font configuration and robust filter sanitization)
- **AI / LLM**: OpenRouter API & local Omniroute integration
- **Assets**: Pexels Stock Video API

---

## Project Structure

```text
├── docs/                  # Architecture specs and milestone summaries
│   ├── architecture.md
│   ├── M2-COMPLETE.md
│   └── M3-COMPLETE.md
├── public/
│   └── exports/           # Rendered MP4 output files
├── src/
│   ├── app/               # Next.js App Router (API routes & dashboard UI)
│   ├── components/        # React dashboard components & UI primitives
│   └── lib/
│       ├── pipeline/      # Orchestrator and job queue state management
│       ├── prompts/       # LLM prompt templates for script & storyboard
│       ├── providers/     # Modular provider adapters (LLM, TTS, Assets, Renderer)
│       ├── store/         # In-memory project and tenant state stores
│       └── validation/    # Storyboard JSON validation and parsing
├── test-full-pipeline.js  # End-to-end integration test script
└── PIPELINE_TEST_REPORT.md# Detailed test results and verification logs
```

---

## Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18+ (Node 20+ recommended)
- **FFmpeg**: Must be installed and available on your system `PATH` (required for video composition and audio generation).

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/biha-pixel/Content-engine.git
cd Content-engine
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and configure your API keys:

```bash
cp .env.example .env.local
```

Example `.env.local`:
```env
# LLM Provider Configuration ("omniroute" or "openrouter")
LLM_PROVIDER=omniroute
OMNIROUTE_API_KEY=your-omniroute-api-key
OMNIROUTE_BASE_URL=http://localhost:20128
OMNIROUTE_MODEL=default

# Alternative OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=mistralai/mistral-nemo

# Pexels API (required for B-roll video search)
PEXELS_API_KEY=your-pexels-api-key-here

# Kokoro TTS (optional; falls back to silent audio if unavailable)
KOKORO_BASE_URL=http://localhost:8880/v1
```

### 3. Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the interactive dashboard.

---

## Development, Build & Testing Commands

- **Start Development Server**: `npm run dev`
- **Build for Production**: `npm run build`
- **Lint Code**: `npm run lint`
- **Run End-to-End Pipeline Test**:
  ```bash
  node test-full-pipeline.js
  ```

---

## Limitations & MVP Scope

- **Storage**: Currently utilizes in-memory state stores (Maps) for projects and jobs suitable for MVP evaluation. PostgreSQL persistence with RLS is planned for post-MVP.
- **Concurrency**: Pipeline executes synchronously within API request context (generation takes ~30–90 seconds depending on video length and scene count).
- **Publishing**: Direct social media API publishing is out of scope for MVP; videos are downloaded locally as MP4 files from `public/exports/`.

---

## Roadmap & Milestones

- ✅ **M1: Scaffolding & Architecture** — Project structure, core interfaces, tenant auth shell.
- ✅ **M2: Infrastructure** — LLM integration (OpenRouter/Omniroute), script/storyboard generation, pipeline orchestration, REST API.
- ✅ **M3: Asset Integration** — Kokoro TTS, Pexels B-roll retrieval, FFmpeg video rendering with captions, dashboard video player modal.
- 🔄 **M4: Polish & Production Readiness** — Quality control flow, persistent database storage, enhanced error recovery, and retry mechanisms.

---

## Contributing

Contributions, issues, and feature requests are welcome. Please ensure that all TypeScript checks (`npm run build`) and linter rules pass before submitting pull requests.

## License

This project is licensed under the MIT License.
