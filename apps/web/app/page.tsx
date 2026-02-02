"use client";

import { useState } from "react";

type AskResponse = {
  answer?: string;
  steps?: string[];
  follow_up_questions?: string[];
  error?: string;
  details?: string;
};

export default function Page() {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, language }),
      });
      const data = (await res.json()) as AskResponse;
      setResponse(data);
    } catch (error) {
      setResponse({
        error: "Request failed",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const copy =
    language === "es"
      ? {
          title: "Asistente de Adopción Fiori",
          question: "Pregunta",
          languageLabel: "Idioma",
          ask: "Preguntar",
          asking: "Consultando...",
          answer: "Respuesta",
          steps: "Pasos",
          followUps: "Preguntas de seguimiento",
          noAnswer: "Sin respuesta",
        }
      : {
          title: "Fiori Adoption Assistant",
          question: "Question",
          languageLabel: "Language",
          ask: "Ask",
          asking: "Asking...",
          answer: "Answer",
          steps: "Steps",
          followUps: "Follow up questions",
          noAnswer: "No answer",
        };

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>{copy.title}</h1>

      <label style={{ display: "block", marginTop: 16 }}>
        {copy.question}
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={6}
          style={{ width: "100%", marginTop: 8 }}
        />
      </label>

      <label style={{ display: "block", marginTop: 16 }}>
        {copy.languageLabel}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <span>ES</span>
          <label className="switch" aria-label="Language switch">
            <input
              type="checkbox"
              checked={language === "en"}
              onChange={(event) =>
                setLanguage(event.target.checked ? "en" : "es")
              }
            />
            <span className="slider" />
          </label>
          <span>EN</span>
        </div>
      </label>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || question.trim().length === 0}
        style={{ marginTop: 16 }}
      >
        {loading ? copy.asking : copy.ask}
      </button>

      {response && (
        <section style={{ marginTop: 24 }}>
          {response.error ? (
            <>
              <h2>Error</h2>
              <p>{response.error}</p>
              {response.details && <p>{response.details}</p>}
            </>
          ) : (
            <>
              <h2>{copy.answer}</h2>
              <p>{response.answer ?? copy.noAnswer}</p>

              <h3>{copy.steps}</h3>
              <ul>
                {(response.steps ?? []).map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>

              <h3>{copy.followUps}</h3>
              <ul>
                {(response.follow_up_questions ?? []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 46px;
          height: 26px;
        }
        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #d5dbe6;
          transition: 0.2s;
          border-radius: 999px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: #ffffff;
          transition: 0.2s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .switch input:checked + .slider {
          background-color: #0a6ed1;
        }
        .switch input:checked + .slider:before {
          transform: translateX(20px);
        }
      `}</style>
    </main>
  );
}
