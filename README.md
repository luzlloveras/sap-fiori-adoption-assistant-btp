# Fiori Access AI Assistant

An internal demo assistant for troubleshooting the scenario **"I can't see apps in SAP Fiori"** using a local knowledge base and a lightweight retrieval-augmented generation (RAG) pipeline. The assistant only answers from the provided sources and includes citations.

## What it does
- Reads Markdown docs from `knowledge-base/` at API startup.
- Retrieves the most relevant snippets with a simple BM25-style overlap score.
- Calls an LLM provider (mock by default) using only those snippets.
- Returns a structured response with summary, steps, follow-up questions, and sources.

## How it works (RAG + provider)
1. **Ingestion**: Markdown files are split into chunks by headings and paragraphs.
2. **Retrieval**: A BM25-like score ranks chunks based on term overlap with the question.
3. **Generation**:
   - **MockProvider**: deterministic response using the retrieved chunks.
   - **OpenAIProvider**: used only when `OPENAI_API_KEY` is set.
4. **Guardrails**: if top sources are weak, the API returns "I don't have enough info from the knowledge base".

## Architecture
```
Browser (Next.js)
    |
    | POST /ask
    v
API (Express)
    |
    | retrieve top-K
    v
Knowledge Base (Markdown)
    |
    | prompt with sources
    v
LLM Provider (Mock or OpenAI)
```

## How to run
```bash
pnpm install
pnpm dev
```

The web app runs on `http://localhost:3000` and the API runs on `http://localhost:4000`.

### Optional OpenAI config
Create `apps/api/.env.example` (or `.env`) with:
```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
PORT=4000
```

## Demo questions
- "I assigned a business role but the user still sees no tiles. What should I check first?"
- "Only one app is missing from a space. Which checks help narrow that down?"
- "Could personalization hide tiles, and how do I reset it?"
- "How do I confirm the catalog and target mappings are in the right client?"
- "What information should I request from basis or security to troubleshoot access?"

## How this maps to SAP Generative AI Hub
In SAP landscapes, the LLM call would be replaced by **SAP Generative AI Hub** for governed model access, logging, and policy enforcement. The local knowledge base and retrieval logic could be replaced or extended with **HANA Cloud** vector storage, while still applying the same guardrails and citation-driven responses.

## Scripts
- `pnpm dev`: run API + web concurrently
- `pnpm lint`: lint all workspaces
- `pnpm typecheck`: strict type checks
- `pnpm test`: run API unit tests
