import type { LLMProvider } from "./types";

type ParsedSource = {
  title: string;
  content: string;
};

export class MockProvider implements LLMProvider {
  async generate(prompt: string): Promise<string> {
    if (prompt.includes("recommended_actions") && prompt.includes("SOURCES_START")) {
      return JSON.stringify(buildHybridResponse(prompt));
    }
    const sources = parseSources(prompt);
    const language = detectLanguage(prompt);
    if (sources.length === 0) {
      return JSON.stringify({
        answer:
          language === "es"
            ? "No tengo suficiente información en la base de conocimiento para responder eso."
            : "I don't have enough info from the knowledge base to answer that.",
        steps: [],
        follow_up_questions: [
          language === "es"
            ? "¿Qué app de Fiori o rol de negocio está afectado?"
            : "Which Fiori app or business role is affected?",
          language === "es"
            ? "¿Qué cliente y alias de sistema estás usando?"
            : "Which client and system alias are you using?"
        ]
      });
    }

    const summary = buildSummary(sources, language);
    const steps = buildSteps(sources, language);
    const followUp = buildFollowUps(sources, language);

    return JSON.stringify({
      answer: buildAnswer(summary, language),
      steps,
      follow_up_questions: followUp
    });
  }
}

function parseSources(prompt: string): ParsedSource[] {
  const start = prompt.indexOf("SOURCES_START");
  const end = prompt.indexOf("SOURCES_END");
  if (start === -1 || end === -1 || end <= start) {
    return [];
  }
  const raw = prompt.slice(start + "SOURCES_START".length, end).trim();
  if (!raw) {
    return [];
  }
  const blocks = raw.split(/\n(?=\[\d+\]\s)/g);
  return blocks.map((block) => {
    const lines = block.trim().split("\n");
    const title = lines.shift()?.replace(/^\[\d+\]\s*/, "").trim() ?? "Source";
    return {
      title,
      content: lines.join(" ").trim()
    };
  });
}

function buildSummary(sources: ParsedSource[], language: "en" | "es"): string {
  const hints = extractHints(sources);
  if (language === "es") {
    if (hints.roles) {
      return "el rol de negocio, el catálogo y la asignación de espacio/página en Launchpad parecen ser el primer punto de revisión";
    }
    if (hints.cache) {
      return "el problema puede estar relacionado con caché o indexación de contenido en Launchpad";
    }
    if (hints.auth) {
      return "conviene revisar autorizaciones para el mapeo de destino faltante";
    }
    return "la visibilidad de aplicaciones en Launchpad requiere validar la lista de verificación básica";
  }
  if (hints.roles) {
    return "the business role, catalog, and Launchpad space/page assignment are the most likely starting point";
  }
  if (hints.cache) {
    return "the issue may relate to Launchpad cache or content indexing";
  }
  if (hints.auth) {
    return "authorization checks may be needed for the missing target mapping";
  }
  return "the apps visibility checklist in Launchpad is the best starting point";
}

function buildSteps(
  sources: ParsedSource[],
  language: "en" | "es"
): string[] {
  const hints = extractHints(sources);
  if (language === "es") {
    const steps: string[] = [];
    if (hints.roles) {
      steps.push(
        "Verifica que el usuario tenga el rol de negocio correcto y el catálogo requerido."
      );
      steps.push(
        "Confirma que la asignación de espacio/página en Launchpad esté activa y en el mismo rol de negocio."
      );
    }
    if (hints.cache) {
      steps.push(
        "Revisa caché e indexación de contenido en Launchpad; prueba con una sesión nueva."
      );
    }
    steps.push(
      "Si aplica, restablece la personalización de la interfaz de usuario y vuelve a validar."
    );
    if (hints.client) {
      steps.push("Confirma cliente, alias de sistema e ID de usuario usados en la prueba.");
    }
    if (steps.length === 0) {
      steps.push("Sigue la lista de verificación de aplicaciones no visibles en Launchpad.");
    }
    return steps.slice(0, 5);
  }

  const steps: string[] = [];
  if (hints.roles) {
    steps.push(
      "Verify the user has the correct business role and required catalog."
    );
    steps.push(
      "Confirm the Launchpad space/page assignment is active and in the same role."
    );
  }
  if (hints.cache) {
    steps.push("Check cache and content indexing; retest with a fresh session.");
  }
  steps.push(
    "If applicable, reset the user's UI personalization and validate again."
  );
  if (hints.client) {
    steps.push("Confirm client, system alias, and user ID used for testing.");
  }
  if (steps.length === 0) {
    steps.push("Follow the apps-not-visible checklist in Launchpad.");
  }
  return steps.slice(0, 5);
}

function buildFollowUps(
  sources: ParsedSource[],
  language: "en" | "es"
): string[] {
  const hints = extractHints(sources);
  const questions: string[] = [];
  if (hints.client) {
    questions.push(
      language === "es"
      ? "¿Qué cliente y alias de sistema estás usando?"
        : "Which client and system alias are you using?"
    );
  }
  if (hints.roles) {
    questions.push(
      language === "es"
        ? "¿Qué rol de negocio o PFCG está asignado al usuario?"
        : "What business role or PFCG role is assigned to the user?"
    );
  }
  questions.push(
    language === "es"
      ? "¿Qué aplicación o mapeo de destino específico falta?"
      : "Which exact app tile or target mapping is missing?"
  );
  return questions.slice(0, 3);
}

function detectLanguage(prompt: string): "en" | "es" {
  return prompt.includes("Respond in Spanish.") || prompt.includes("Answer in Spanish.")
    ? "es"
    : "en";
}

function extractHints(sources: ParsedSource[]): {
  roles: boolean;
  cache: boolean;
  client: boolean;
  auth: boolean;
} {
  const text = sources.map((source) => source.content).join(" ").toLowerCase();
  return {
    roles: text.includes("role") || text.includes("catalog") || text.includes("space"),
    cache: text.includes("cache") || text.includes("index"),
    client: text.includes("client") || text.includes("alias"),
    auth: text.includes("authorization") || text.includes("trace")
  };
}

function buildAnswer(summary: string, language: "en" | "es"): string {
  if (language === "es") {
    return `Causa probable: ${summary}. Puede ser necesario un análisis de autorización adicional.`;
  }
  return `Likely cause: ${summary}. Further authorization analysis may be required.`;
}

function buildHybridResponse(prompt: string): {
  recommended_actions: string[];
  missing_info_questions: string[];
  escalation_summary: string;
} {
  const sources = parseSources(prompt);
  const language = detectLanguage(prompt);
  if (!sources.length) {
    return {
      recommended_actions: [],
      missing_info_questions:
        language === "es"
          ? ["¿Qué aplicación específica falta?", "¿Qué rol está asignado?"]
          : ["Which specific app or tile is missing?", "Which role is assigned?"],
      escalation_summary:
        language === "es"
          ? [
              "Para ticket:",
              "- Síntoma: falta información para diagnosticar",
              "- Acciones sugeridas: No aplica",
              "- Información faltante: role/cliente",
              "- Próximos pasos: pedir más contexto"
            ].join("\n")
          : [
              "For ticket:",
              "- Symptom: insufficient information to diagnose",
              "- Suggested actions: Not applicable",
              "- Missing info: role/client",
              "- Next steps: ask for more context"
            ].join("\n")
    };
  }

  const summary = buildSummary(sources, language);
  const steps = buildSteps(sources, language);
  const followUps = buildFollowUps(sources, language);
  const { actions, escalation } = buildChecklistOutput(steps, language);
  return {
    recommended_actions: actions,
    missing_info_questions: followUps,
    escalation_summary: escalation
  };
}

function buildChecklistOutput(
  steps: string[],
  language: "en" | "es"
): { actions: string[]; escalation: string } {
  const actions = steps.slice(0, 5);
  const actionsText = actions.slice(0, 3).join("; ");
  const escalation =
    language === "es"
      ? [
          "Texto para ticket:",
          "- Síntoma: problema de Launchpad",
          `- Acciones sugeridas: ${actionsText || "No aplica"}`,
          "- Información faltante: No aplica",
          "- Escalar si: el problema persiste tras validar los pasos"
        ].join("\n")
      : [
          "Ticket text:",
          "- Symptom: Launchpad issue",
          `- Suggested actions: ${actionsText || "Not applicable"}`,
          "- Missing info: Not applicable",
          "- Escalate if: issue persists after validations"
        ].join("\n");
  return { actions, escalation };
}
