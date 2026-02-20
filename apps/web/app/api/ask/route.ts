import { NextResponse } from "next/server";
import {
  createProvider,
  loadKnowledgeBase,
  resolveKnowledgeBasePath,
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
let cachedKnowledgeBasePath: string | null = null;
let knowledgeBasePromise: Promise<KnowledgeBase> | null = null;

const provider = createProvider();

async function getKnowledgeBase(origin: string): Promise<KnowledgeBase> {
  const knowledgeBasePath = resolveKnowledgeBasePath(origin);

  // Cache por ruta resuelta para evitar recargar la KB
  // mientras la configuración de entorno no cambie.
  if (cachedKnowledgeBase && cachedKnowledgeBasePath === knowledgeBasePath) {
    return cachedKnowledgeBase;
  }

  if (cachedKnowledgeBasePath !== knowledgeBasePath) {
    knowledgeBasePromise = null;
  }

  if (!knowledgeBasePromise) {
    knowledgeBasePromise = loadKnowledgeBase(knowledgeBasePath).then((kb) => {
      cachedKnowledgeBase = kb;
      cachedKnowledgeBasePath = knowledgeBasePath;

      // Logueamos solo metadatos seguros (sin pregunta ni contenido sensible)
      const chunks = Array.isArray(kb?.chunks) ? kb.chunks.length : 0;
      const mdFileCount = kb?.mdFileCount ?? 0;
      console.log(
        `[KB] path=${knowledgeBasePath} mdFileCount=${mdFileCount} chunks=${chunks}`
      );

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
    AICORE_RESOURCE_GROUP: Boolean(process.env.AICORE_RESOURCE_GROUP),
    KNOWLEDGE_BASE_PATH: Boolean(process.env.KNOWLEDGE_BASE_PATH)
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
    const origin = new URL(request.url).origin;
    const knowledgeBase = await getKnowledgeBase(origin);

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
    const res: Record<string, unknown> = {
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
      res.details = error instanceof Error ? error.stack : String(error);
    }

    return NextResponse.json(res, { status: 500 });
  }
}
