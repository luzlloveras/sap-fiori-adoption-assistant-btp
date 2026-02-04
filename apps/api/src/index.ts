import express, { type Request, type Response } from "express";
import {
  createProvider,
  getDefaultKnowledgeBasePath,
  loadKnowledgeBase,
  routeHybrid,
  type Language
} from "@fiori-access-ai-assistant/core";

async function main() {
  // logs para evitar “crash silencioso”
  process.on("unhandledRejection", (err) =>
    console.error("unhandledRejection:", err)
  );
  process.on("uncaughtException", (err) =>
    console.error("uncaughtException:", err)
  );

  const app = express();

  // ======================================================
  // JSON
  // ======================================================
  app.use(express.json({ limit: "1mb" }));

  // ======================================================
  // Knowledge Base
  // ======================================================
  const kbPath = process.env.KNOWLEDGE_BASE_PATH ?? getDefaultKnowledgeBasePath();

  console.log(`[KB] path=${kbPath}`);

  const knowledgeBase = await loadKnowledgeBase(kbPath);

  const chunkCount = Array.isArray(knowledgeBase?.chunks)
    ? knowledgeBase.chunks.length
    : 0;

  console.log(`[KB] chunks=${chunkCount}`);

  const provider = createProvider();

  // ======================================================
  // Health
  // ======================================================
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // ======================================================
  // Ask
  // ======================================================
  app.post("/ask", async (req: Request, res: Response) => {
    try {
      const questionRaw = req.body?.question;
      const languageRaw = req.body?.language;

      const question =
        typeof questionRaw === "string" ? questionRaw.trim() : "";

      const language: Language = languageRaw === "en" ? "en" : "es";

      if (!question) {
        return res.status(400).json({
          intent: "clarify",
          confidence: 0.1,
          missing_info_questions: [
            "Falta 'question' en el body.",
            "Incluí el problema y el contexto.",
          ],
          recommended_actions: [],
          citations: [],
          escalation_summary: "Solicitud inválida: falta question.",
        });
      }

      const response = await routeHybrid({
        question,
        language,
        knowledgeBase,
        provider,
        trace: {
          provider: process.env.OPENAI_API_KEY?.trim()
            ? "sap-genai-hub"
            : "mock",
          model: process.env.OPENAI_MODEL ?? "default",
          startMs: Date.now()
        }
      });

      return res.json(response);
    } catch (err) {
      console.error("ask_error:", err);

      const body: Record<string, unknown> = {
        intent: "clarify",
        confidence: 0.1,
        missing_info_questions: [
          "Error interno procesando la consulta.",
          "Intentá nuevamente con más detalles.",
        ],
        recommended_actions: [],
        citations: [],
        escalation_summary: "Error interno en /ask.",
      };

      if (process.env.NODE_ENV !== "production") {
        body.details = String((err as Error)?.stack ?? err);
      }

      return res.status(500).json(body);
    }
  });

  // ======================================================
  // Server
  // ======================================================
  const port = Number(process.env.PORT ?? 8080);
  app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on port ${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
