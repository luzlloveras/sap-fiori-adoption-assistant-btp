import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import {
  buildPrompt,
  loadKnowledgeBase,
  retrieveChunks,
  type Language
} from "./rag/index.js";
import { createProvider } from "./providers/index.js";

type AskRequest = {
  question?: string;
  language?: Language;
};

type AskResponse = {
  answer: string;
  steps: string[];
  follow_up_questions: string[];
  sources: { title: string; file: string; anchors?: string }[];
};

const PORT = Number(process.env.PORT ?? 4000);
const MIN_SCORE = 0.6;

async function main() {
  const kbPath = resolveKnowledgeBasePath();
  const knowledgeBase = await loadKnowledgeBase(kbPath);
  const provider = createProvider();

  const app = express();
  const allowedOrigins = new Set(
    [
      "http://localhost:3000",
      process.env.WEB_ORIGIN ? process.env.WEB_ORIGIN.trim() : null
    ].filter((value): value is string => Boolean(value))
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      methods: ["POST"],
      allowedHeaders: ["Content-Type"]
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.post("/ask", async (req, res) => {
    const body = req.body as AskRequest;
    const question = body.question?.trim();
    const language = body.language === "es" || body.language === "en" ? body.language : "en";
    if (!question) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    const scored = retrieveChunks(knowledgeBase, question, { topK: 4 });
    const sources = scored.map((item) => ({
      title: localizeSourceTitle(item.chunk.file, language) ?? item.chunk.heading,
      file: item.chunk.file,
      anchors: item.chunk.anchor
    }));

    if (scored.length === 0 || scored[0].score < MIN_SCORE) {
      const guardrailAnswer =
        language === "es"
          ? "No tengo suficiente información en la base de conocimiento para responder eso."
          : "I don't have enough info from the knowledge base to answer that.";
      const guardrailFollowUps =
        language === "es"
          ? [
              "¿Qué app de Fiori o business role está afectado?",
              "¿Qué sistema/cliente e ID de usuario están en alcance?"
            ]
          : [
              "Which Fiori app or business role is affected?",
              "Which system/client and user ID are in scope?"
            ];
      res.json({
        answer: guardrailAnswer,
        steps: [],
        follow_up_questions: guardrailFollowUps,
        sources
      } satisfies AskResponse);
      return;
    }

    const prompt = buildPrompt(question, scored, language);
    let answer = "";
    let steps: string[] = [];
    let followUp: string[] = [];

    try {
      const raw = await provider.generate(prompt);
      const parsed = parseJsonResponse(raw);
      answer = parsed.answer;
      steps = parsed.steps;
      followUp = parsed.follow_up_questions;
    } catch (error) {
      console.error("LLM error:", error);
      answer =
        language === "es"
          ? "Tuve un problema al generar la respuesta. Inténtalo de nuevo o proporciona más detalle."
          : "I hit an issue generating a response. Please try again or provide more detail.";
    }

    res.json({
      answer,
      steps,
      follow_up_questions: followUp,
      sources
    } satisfies AskResponse);
  });

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    console.log(`Knowledge base path: ${kbPath}`);
  });
}

function resolveKnowledgeBasePath(): string {
  const envPath = process.env.KNOWLEDGE_BASE_PATH;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }
  const candidate = path.resolve(process.cwd(), "../../knowledge-base");
  if (fs.existsSync(candidate)) {
    return candidate;
  }
  return path.resolve(process.cwd(), "../knowledge-base");
}

function parseJsonResponse(raw: string): {
  answer: string;
  steps: string[];
  follow_up_questions: string[];
} {
  try {
    const parsed = JSON.parse(raw);
    return {
      answer: typeof parsed.answer === "string" ? parsed.answer : "",
      steps: Array.isArray(parsed.steps)
        ? parsed.steps.filter((step) => typeof step === "string")
        : [],
      follow_up_questions: Array.isArray(parsed.follow_up_questions)
        ? parsed.follow_up_questions.filter((q) => typeof q === "string")
        : []
    };
  } catch {
    return {
      answer: raw.trim(),
      steps: [],
      follow_up_questions: []
    };
  }
}

function localizeSourceTitle(file: string, language: Language): string | null {
  if (language === "en") {
    return null;
  }
  const mapping: Record<string, string> = {
    "roles-catalogs-spaces.md": "Relación entre roles, catalog y space/page",
    "role-assignment.md": "Asignación de business role y PFCG role",
    "cache-indexing.md": "Caché e indexación de contenido",
    "client-system-alias.md": "Cliente, alias de sistema y desajuste de usuario",
    "authorization-checks.md": "Enfoque para validaciones de autorización",
    "apps-not-visible-checklist.md": "Lista de verificación de apps no visibles",
    "request-info-basis-security.md": "Información para basis y seguridad",
    "ui-personalization.md": "Personalización de la interfaz de usuario",
    "launchpad-content-transport.md": "Contenido de Launchpad y transporte",
    "troubleshooting-overview.md": "Resumen de resolución de problemas"
  };
  return mapping[file] ?? null;
}

main().catch((error) => {
  console.error("Failed to start API:", error);
  process.exit(1);
});
