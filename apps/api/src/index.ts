import express, { type Request, type Response } from "express";
import path from "node:path";
import {
  loadKnowledgeBase,
  retrieveChunks,
  buildPrompt,
  type Language
} from "./rag/index.js";

// Si vos ya tenés integración real con LLM, reemplazá esta función.
// Esto NO debe romper nunca el startup.
async function callLLM(_prompt: string): Promise<{
  answer: string;
  steps: string[];
  follow_up_questions: string[];
}> {
  return {
    answer:
      "No tengo suficiente información en la base de conocimiento para responder eso.",
    steps: [],
    follow_up_questions: []
  };
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

      const llmJson = await callLLM(prompt);

      // Normalizar salida para que nunca sea undefined
      const answer = typeof llmJson?.answer === "string" ? llmJson.answer : "";
      const steps = Array.isArray(llmJson?.steps) ? llmJson.steps : [];
      const follow = Array.isArray(llmJson?.follow_up_questions)
        ? llmJson.follow_up_questions
        : [];

      return res.json({
        answer,
        steps,
        follow_up_questions: follow
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
