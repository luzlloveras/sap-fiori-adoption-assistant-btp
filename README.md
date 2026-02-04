# Fiori Access AI Assistant

## Project overview
Internal assistant that helps troubleshoot the scenario **"I can't see apps in SAP Fiori"** using a local knowledge base and a lightweight retrieval‑augmented generation (RAG) flow. The assistant answers only from provided sources and includes citations.

## Business problem
When users cannot see apps in the SAP Fiori Launchpad, teams typically juggle roles, catalogs, spaces/pages, cache, and authorization checks across multiple stakeholders. A consistent troubleshooting workflow reduces time to resolution and avoids guesswork.

## Solution description
The API loads Markdown knowledge at startup, retrieves the most relevant snippets with a simple BM25‑style score, and generates a structured response. The web UI provides a single‑page chat‑like experience and supports English and Spanish output.

## Architecture
UI (`apps/web`) calls the Next.js API route `/api/ask`, which runs the hybrid router directly inside Vercel. Retrieval is BM25‑like over the Markdown knowledge base, with grounding guardrails and citations in the response.

ASCII diagram:
```
[User] -> [apps/web UI] -> [/api/ask]
                         -> [Hybrid Router] -> (RULES_ONLY | RAG_LLM | CLARIFY)
                         -> [KB Retrieval] -> [LLM Provider] -> [JSON Response + Citations]
```

## AI design principles
- **Retrieval‑augmented generation**: answers are grounded in local Markdown content.
- **Source‑only responses**: the assistant is instructed to use only provided sources.
- **Explainability**: responses include steps, follow‑up questions, and citations.
- **Guardrails**: if sources are insufficient, it says so and asks clarifying questions.

## Language support (EN / ES)
The UI and responses support English and Spanish. SAP technical terms remain in English: `business role`, `PFCG role`, `catalog`, `space`, `page`, `Launchpad`, `target mapping`.

## Expected business impact
- Faster first‑line troubleshooting for access issues.
- Reduced back‑and‑forth with basis/security teams.
- Consistent, auditable guidance for common Fiori visibility problems.

## Example questions
- "I assigned a business role but the user still sees no tiles. What should I check first?"
- "Only one app is missing from a space. Which checks help narrow that down?"
- "Could personalization hide tiles, and how do I reset it?"
- "How do I confirm the catalog and target mappings are in the right client?"
- "What information should I request from basis or security to troubleshoot access?"

## Run locally
```bash
pnpm install
pnpm -C apps/web dev
```

The web app (UI + API route) runs on `http://localhost:3000`.

Quick API check:
```bash
curl -s http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"No veo la app en el Launchpad","language":"es"}' | jq .
```

Optional OpenAI configuration (local or Vercel):
```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```
Knowledge base path override (optional):
```bash
KNOWLEDGE_BASE_PATH=/absolute/path/to/knowledge-base
```

The default knowledge base lives in `packages/core/knowledge-base`.
Legacy Cloud Foundry artifacts are kept under `legacy/cf/`.

## Manual validation checklist
- Switch language EN / ES in the UI.
- Spanish answers are fully localized.
- SAP terms remain in English.
- Steps and sources are present.
- No hallucinations beyond the sources.

## Demo (placeholder)
`docs/demo.gif`

## SAP BTP & Generative AI Hub blueprint
In SAP landscapes, the LLM call would be routed through **SAP Generative AI Hub** for governed access and policy enforcement. Retrieval could be backed by **HANA Cloud** vector storage while keeping the same grounding and citation model.

## Disclaimer
All knowledge base content is simulated and generic. It does not include SAP confidential information.
