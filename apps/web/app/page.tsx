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

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Fiori Adoption Assistant</h1>

      <label style={{ display: "block", marginTop: 16 }}>
        Question
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={6}
          style={{ width: "100%", marginTop: 8 }}
        />
      </label>

      <label style={{ display: "block", marginTop: 16 }}>
        Language
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as "es" | "en")}
          style={{ width: "100%", marginTop: 8 }}
        >
          <option value="es">es</option>
          <option value="en">en</option>
        </select>
      </label>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || question.trim().length === 0}
        style={{ marginTop: 16 }}
      >
        {loading ? "Consultando..." : "Preguntar"}
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
              <h2>Answer</h2>
              <p>{response.answer ?? "Sin respuesta"}</p>

              <h3>Steps</h3>
              <ul>
                {(response.steps ?? []).map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>

              <h3>Follow up questions</h3>
              <ul>
                {(response.follow_up_questions ?? []).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  );
}
