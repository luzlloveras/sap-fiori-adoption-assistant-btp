const API_URL = process.env.API_URL ?? "http://localhost:4000";

type AskResponse = {
  intent: string;
  confidence: number;
  missing_info_questions: string[];
  recommended_actions: string[];
  citations: { file: string; heading: string; anchor: string; excerpt: string }[];
  escalation_summary: string;
};

async function ask(question: string, language: "en" | "es") {
  const res = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, language })
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return (await res.json()) as AskResponse;
}

async function main() {
  const en = await ask("I can't see apps after assigning a role", "en");
  const es = await ask("Asigné un rol pero no veo apps", "es");

  if (!/escalation summary|summary/i.test(en.escalation_summary.toLowerCase())) {
    throw new Error("Expected English escalation summary.");
  }
  if (!/resumen|escalamiento|escalacion/i.test(es.escalation_summary.toLowerCase())) {
    throw new Error("Expected Spanish escalation summary.");
  }
  if (/escalation summary/i.test(es.escalation_summary.toLowerCase())) {
    throw new Error("Unexpected English phrase in es escalation summary.");
  }

  console.log("Language checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
