import { useEffect, useMemo, useState } from "react";

type Language = "en" | "es";

type AskResponse = {
  answer: string;
  steps: string[];
  follow_up_questions: string[];
  sources: { title: string; file: string; anchors?: string }[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const LANGUAGE_STORAGE_KEY = "fiori-assistant-language";

const translations = {
  en: {
    title: "Fiori Access AI Assistant",
    subtitle: "Ask about the issue: I can't see apps in SAP Fiori.",
    questionLabel: "Question",
    placeholder:
      "Example: I can't see apps after assigning a role. What should I check?",
    ask: "Ask",
    loading: "Thinking...",
    error: "Something went wrong. Please try again.",
    emptyQuestion: "Please enter a question.",
    noAnswerYet: "No answer yet.",
    emptySteps: "No steps available from the knowledge base.",
    emptyFollowUps: "No follow-up questions suggested.",
    answer: "Answer",
    steps: "Steps",
    followUp: "What to check next",
    sources: "Sources"
  },
  es: {
    title: "Asistente de Acceso a Fiori",
    subtitle: "Consulta el problema: No puedo ver apps en SAP Fiori.",
    questionLabel: "Pregunta",
    placeholder:
      "Ejemplo: Asigné un rol y no veo apps. ¿Qué debo revisar?",
    ask: "Preguntar",
    loading: "Pensando...",
    error: "Algo salió mal. Inténtalo de nuevo.",
    emptyQuestion: "Escribe una pregunta.",
    noAnswerYet: "Aún no hay respuesta.",
    emptySteps: "No hay pasos disponibles en la base de conocimiento.",
    emptyFollowUps: "No hay preguntas de seguimiento sugeridas.",
    answer: "Respuesta",
    steps: "Pasos",
    followUp: "Qué revisar después",
    sources: "Fuentes"
  }
} satisfies Record<Language, Record<string, string>>;

type TranslationKey = keyof typeof translations.en;

export default function Home() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
        : null;
    if (saved === "en" || saved === "es") {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    }
  }, [language]);

  const t = useMemo(() => {
    return (key: TranslationKey) => translations[language][key];
  }, [language]);

  const handleAsk = async () => {
    if (!question.trim()) {
      setError(t("emptyQuestion"));
      return;
    }
    setError(null);
    setLoading(true);
    setResponse(null);
    try {
      const payload = { question, language };
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }
      const data = (await res.json()) as AskResponse;
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <header className="header">
        <div className="header-row">
          <div>
            <h1>{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              type="button"
              className={language === "en" ? "active" : ""}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={language === "es" ? "active" : ""}
              onClick={() => setLanguage("es")}
            >
              ES
            </button>
          </div>
        </div>
      </header>

      <section className="card">
        <label htmlFor="question">{t("questionLabel")}</label>
        <textarea
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t("placeholder")}
          rows={4}
        />
        <button onClick={handleAsk} disabled={loading}>
          {loading ? t("loading") : t("ask")}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      <section className="card">
        {response ? (
          <>
            <h2>{t("answer")}</h2>
            <p>{response.answer}</p>

            <h3>{t("steps")}</h3>
            {response.steps.length > 0 ? (
              <ol>
                {response.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : (
              <p>{t("emptySteps")}</p>
            )}

            <h3>{t("followUp")}</h3>
            {response.follow_up_questions.length > 0 ? (
              <ul>
                {response.follow_up_questions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{t("emptyFollowUps")}</p>
            )}

            <h3>{t("sources")}</h3>
            <ul>
              {response.sources.map((source) => (
                <li key={`${source.file}-${source.anchors ?? ""}`}>
                  {source.title} ({source.file})
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>{t("noAnswerYet")}</p>
        )}
      </section>
    </main>
  );
}
