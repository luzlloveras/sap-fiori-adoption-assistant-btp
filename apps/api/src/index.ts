import express, { type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadKnowledgeBase,
  type Language
} from "./rag/index.js";
import { createProvider } from "./providers/index.js";
import { routeHybrid } from "./hybrid/router.js";

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

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const defaultKbPath = path.join(__dirname, "../knowledge-base");
  const kbPath = process.env.KNOWLEDGE_BASE_PATH ?? defaultKbPath;

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
          intent: "clarify",
          confidence: 0.1,
          missing_info_questions: [
            "Falta 'question' en el body.",
            "Incluí el problema y el contexto."
          ],
          recommended_actions: [],
          citations: [],
          escalation_summary: "Solicitud inválida: falta question."
        });
      }

      const response = await routeHybrid({
        question,
        language,
        knowledgeBase,
        provider
      });

      return res.json(response);
    } catch (err) {
      console.error("ask_error:", err);
      const body = {
        intent: "clarify",
        confidence: 0.1,
        missing_info_questions: [
          "Error interno procesando la consulta.",
          "Intentá nuevamente con más detalles."
        ],
        recommended_actions: [],
        citations: [],
        escalation_summary: "Error interno en /ask."
      } as Record<string, unknown>;
      if (process.env.NODE_ENV !== "production") {
        body.details = String((err as Error)?.stack ?? err);
      }
      return res.status(500).json(body);
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
