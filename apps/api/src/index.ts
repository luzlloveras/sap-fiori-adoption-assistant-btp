import express, { type Request, type Response } from "express";
import path from "node:path";
import {
  loadKnowledgeBase,
  retrieveChunks,
  buildPrompt,
  type Language
} from "./rag/index.js";
import { createProvider } from "./providers/index.js";

type LlmPayload = {
  answer: string;
  steps: string[];
  follow_up_questions: string[];
};

function buildFallback(language: Language): LlmPayload {
  return {
    answer:
      language === "es"
        ? "No tengo suficiente información en la base de conocimiento para responder eso."
        : "I don't have enough info from the knowledge base to answer that.",
    steps: [],
    follow_up_questions:
      language === "es"
        ? [
            "¿Qué app de Fiori o business role está afectado?",
            "¿Qué cliente y alias de sistema estás usando?"
          ]
        : [
            "Which Fiori app or business role is affected?",
            "Which client and system alias are you using?"
          ]
  };
}

function parseLlmResponse(raw: string, language: Language): LlmPayload {
  const fallback = buildFallback(language);
  if (!raw) return fallback;

  let jsonText = raw.trim();
  if (!jsonText.startsWith("{")) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      jsonText = match[0];
    }
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<LlmPayload>;
    return {
      answer:
        typeof parsed.answer === "string" ? parsed.answer : fallback.answer,
      steps: Array.isArray(parsed.steps)
        ? parsed.steps.filter((item): item is string => typeof item === "string")
        : [],
      follow_up_questions: Array.isArray(parsed.follow_up_questions)
        ? parsed.follow_up_questions.filter(
            (item): item is string => typeof item === "string"
          )
        : []
    };
  } catch {
    return fallback;
  }
}

async function main() {
  // logs para evitar “crash silencioso”
  process.on("unhandledRejection", (err) =>
    console.error("unhandledRejection:", err)
  );
  process.on("uncaughtException", (err) =>
    console.error("uncaughtException:", err)
  );

  const app = express();
  app.use(express.json({ limit: "1mb" }));

  const kbPath =
    process.env.KNOWLEDGE_BASE_PATH ?? path.join(process.cwd(), "knowledge-base");

  console.log(`[KB] path=${kbPath}`);

  const knowledgeBase = await loadKnowledgeBase(kbPath);

  // No asumimos props extra: usamos chunks siempre
  const chunkCount = Array.isArray(knowledgeBase?.chunks)
    ? knowledgeBase.chunks.length
    : 0;

  console.log(`[KB] chunks=${chunkCount}`);

  const provider = createProvider();

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.post("/ask", async (req: Request, res: Response) => {
    try {
      const questionRaw = req.body?.question;
      const languageRaw = req.body?.language;

      const question = typeof questionRaw === "string" ? questionRaw.trim() : "";
      const language: Language = languageRaw === "en" ? "en" : "es";

      if (!question) {
        return res.status(400).json({
          answer: "Falta 'question' en el body.",
          steps: [],
          follow_up_questions: []
        });
      }

      const chunks = retrieveChunks(knowledgeBase, question, { topK: 4 });
      const prompt = buildPrompt(question, chunks, language);

      const llmRaw = await provider.generate(prompt);
      const llmJson = parseLlmResponse(llmRaw, language);

      return res.json({
        answer: llmJson.answer,
        steps: llmJson.steps,
        follow_up_questions: llmJson.follow_up_questions
      });
    } catch (err) {
      console.error("ask_error:", err);
      return res.status(500).json({
        answer: "Error interno procesando la consulta.",
        steps: [],
        follow_up_questions: []
      });
    }
  });

  const port = Number(process.env.PORT ?? 8080);
  app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
