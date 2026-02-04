import { NextResponse } from "next/server";
import {
  createProvider,
  getDefaultKnowledgeBasePath,
  loadKnowledgeBase,
  routeHybrid,
  type KnowledgeBase,
  type Language
} from "@fiori-access-ai-assistant/core";

export const runtime = "nodejs";

type AskRequest = {
  question?: string;
  language?: "es" | "en" | string;
};

let cachedKnowledgeBase: KnowledgeBase | null = null;
let knowledgeBasePromise: Promise<KnowledgeBase> | null = null;
const provider = createProvider();

async function getKnowledgeBase(): Promise<KnowledgeBase> {
  if (cachedKnowledgeBase) return cachedKnowledgeBase;
  if (!knowledgeBasePromise) {
    const kbPath =
      process.env.KNOWLEDGE_BASE_PATH ?? getDefaultKnowledgeBasePath();
    knowledgeBasePromise = loadKnowledgeBase(kbPath).then((kb) => {
      cachedKnowledgeBase = kb;
      return kb;
    });
  }
  return knowledgeBasePromise;
}

export async function POST(request: Request) {
  console.log("[env]", {
    LLM_PROVIDER: process.env.LLM_PROVIDER ?? "mock",
    AICORE_BASE_URL: Boolean(process.env.AICORE_BASE_URL),
    AICORE_AUTH_URL: Boolean(process.env.AICORE_AUTH_URL),
    AICORE_CLIENT_ID: Boolean(process.env.AICORE_CLIENT_ID),
    AICORE_CLIENT_SECRET: Boolean(process.env.AICORE_CLIENT_SECRET),
    AICORE_RESOURCE_GROUP: Boolean(process.env.AICORE_RESOURCE_GROUP)
  });

  let body: AskRequest | undefined;
  try {
    body = (await request.json()) as AskRequest;
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid JSON body",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 400 }
    );
  }

  const question =
    typeof body?.question === "string" ? body.question.trim() : "";
  const language: Language = body?.language === "en" ? "en" : "es";

  if (!question) {
    return NextResponse.json(
      {
        intent: "clarify",
        confidence: 0.1,
        missing_info_questions: [
          "Falta 'question' en el body.",
          "Incluí el problema y el contexto."
        ],
        recommended_actions: [],
        citations: [],
        escalation_summary: "Solicitud inválida: falta question."
      },
      { status: 400 }
    );
  }

  try {
    const knowledgeBase = await getKnowledgeBase();
    const response = await routeHybrid({
      question,
      language,
      knowledgeBase,
      provider,
      trace: {
        provider: process.env.LLM_PROVIDER ?? "mock",
        model: process.env.AICORE_MODEL ?? "default",
        startMs: Date.now()
      }
    } as Parameters<typeof routeHybrid>[0]);
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const body: Record<string, unknown> = {
      intent: "clarify",
      confidence: 0.1,
      missing_info_questions: [
        "Error interno procesando la consulta.",
        "Intentá nuevamente con más detalles."
      ],
      recommended_actions: [],
      citations: [],
      escalation_summary: "Error interno en /ask."
    };

    if (process.env.NODE_ENV !== "production") {
      body.details = error instanceof Error ? error.stack : String(error);
    }

    return NextResponse.json(body, { status: 500 });
  }
}
