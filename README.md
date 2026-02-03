# Fiori Access AI Assistant

## Project overview
Internal assistant that helps troubleshoot the scenario **"I can't see apps in SAP Fiori"** using a local knowledge base and a lightweight retrieval‑augmented generation (RAG) flow. The assistant answers only from provided sources and includes citations.

## Business problem
When users cannot see apps in the SAP Fiori Launchpad, teams typically juggle roles, catalogs, spaces/pages, cache, and authorization checks across multiple stakeholders. A consistent troubleshooting workflow reduces time to resolution and avoids guesswork.

## Solution description
The API loads Markdown knowledge at startup, retrieves the most relevant snippets with a simple BM25‑style score, and generates a structured response. The web UI provides a single‑page chat‑like experience and supports English and Spanish output.

## Architecture
UI (`apps/web`) calls the Next.js proxy `/api/ask`, which forwards to the API (`apps/api` `/ask`). The API uses a hybrid router that chooses between RULES_ONLY, RAG_LLM, or CLARIFY. Retrieval is BM25‑like over Markdown knowledge base content, with grounding guardrails and citations in the response.

ASCII diagram:
```
[User] -> [apps/web UI] -> [/api/ask proxy] -> [/ask API]
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
pnpm -C apps/api dev
pnpm -C apps/web dev
```

The web app runs on `http://localhost:3000` and the API runs on `http://localhost:8080`.

Optional OpenAI configuration in `apps/api/.env`:
```bash
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o-mini
```

## Deploy to SAP BTP Cloud Foundry
```bash
cf login -a https://api.cf.<region>.hana.ondemand.com
cf target -o <org> -s <space>
```

Deploy API:
```bash
cd apps/api
cf push
cf app fiori-assistant-api
```

Copy the route from `cf app` into `apps/web/manifest.yml` as `API_URL`.

Deploy web:
```bash
cd ../web
cf push
```

Note: Your org/space must have quota assigned. If quota is 0 MB, deployment will fail.

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
