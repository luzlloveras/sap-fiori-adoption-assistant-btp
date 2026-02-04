import type { Language } from "../rag/index";

export type Intent =
  | "apps_not_visible"
  | "role_catalog_space"
  | "cache_indexing"
  | "transport"
  | "authorization"
  | "flp_blank_page_after_activation"
  | "ui2_services_missing"
  | "theme_issue_launchpad"
  | "odata_401_403"
  | "transport_incomplete_fiori"
  | "clarify"
  | "other";

export type RoutePath = "RULES_ONLY" | "RAG_LLM" | "CLARIFY";

export type Citation = {
  file: string;
  heading: string;
  anchor: string;
  excerpt: string;
};

export type HybridResponse = {
  intent: Intent;
  confidence: number;
  missing_info_questions: string[];
  recommended_actions: string[];
  citations: Citation[];
  escalation_summary: string;
};

export type HybridContext = {
  question: string;
  language: Language;
};
