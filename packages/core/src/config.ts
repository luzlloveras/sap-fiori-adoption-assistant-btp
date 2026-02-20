import { getDefaultKnowledgeBasePath } from "./rag/index";

const DEFAULT_PLAYBOOK_MAX_STEPS = 12;

export function getPlaybookMaxSteps(): number {
  const rawValue = process.env.PLAYBOOK_MAX_STEPS;
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;

  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return DEFAULT_PLAYBOOK_MAX_STEPS;
}

export function resolveKnowledgeBasePath(origin: string): string {
  const knowledgeBasePath = process.env.KNOWLEDGE_BASE_PATH ?? "/knowledge-base";

  if (knowledgeBasePath.startsWith("/")) {
    return new URL(knowledgeBasePath, origin).toString();
  }

  return knowledgeBasePath;
}

export function getNodeKnowledgeBasePath(): string {
  return process.env.KNOWLEDGE_BASE_PATH ?? getDefaultKnowledgeBasePath();
}

