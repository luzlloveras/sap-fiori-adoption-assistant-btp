"use client";

import { API_BASE_URL } from "../lib/api";
import { useState } from "react";


type Citation = {
  file: string;
  heading: string;
  anchor: string;
  excerpt: string;
};

type AskResponse = {
  intent?: string;
  confidence?: number;
  missing_info_questions?: string[];
  recommended_actions?: string[];
  citations?: Citation[];
  escalation_summary?: string;
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
      const res = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, language }),
      });
      const data = (await res.json()) as AskResponse;
      setResponse(data);
    } catch (error) {
      setResponse({
        error: language === "es" ? "Fallo la solicitud" : "Request failed",
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
        missing: "Para continuar necesito:",
        summaryTitle: "Resumen",
        noSummary: "Sin resumen",
        errorTitle: "Error",
        serverErrorTitle: "Error del servidor",
        serverErrorText: "No se pudo procesar la consulta en este momento.",
        serverErrorSummary: "No se pudo generar resumen: error del servidor.",
        actionsHeading: "Qué revisar (en este orden)",
        ticketTitle: "Texto para ticket",
        noActions: "Sin acciones",
        docsTitle: "Ver documentación",
        docsSummary: "Resumen de referencia",
        excerptLabel: "Ver extracto",
      }
      : {
        title: "Fiori Adoption Assistant",
        question: "Question",
        languageLabel: "Language",
        ask: "Ask",
        asking: "Asking...",
        missing: "To continue I need:",
        summaryTitle: "Summary",
        noSummary: "No summary",
        errorTitle: "Error",
        serverErrorTitle: "Server error",
        serverErrorText: "The request could not be processed right now.",
        serverErrorSummary: "Could not generate summary: server error.",
        actionsHeading: "What to review (in this order)",
        ticketTitle: "Ticket text",
        noActions: "No actions",
        docsTitle: "View documentation",
        docsSummary: "Reference summary",
        excerptLabel: "View excerpt",
      };


  const summaryText = extractSummary(response?.escalation_summary);
  const backendError = isBackendError(response);
  const isClarify = !response?.recommended_actions?.length;

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
              <h2>{copy.errorTitle}</h2>
              <p>{response.error}</p>
              {response.details && <p>{response.details}</p>}
            </>
          ) : backendError ? (
            <div className="server-error">
              <h3>{copy.serverErrorTitle}</h3>
              <p>{copy.serverErrorText}</p>
              <div className="ticket">
                <h3>{copy.ticketTitle}</h3>
                <p>{copy.serverErrorSummary}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="summary">
                {summaryText
                  ? `${copy.summaryTitle}: ${summaryText}`
                  : `${copy.summaryTitle}: ${copy.noSummary}`}
              </p>

              {!isClarify && (
                <>
                  <h3>{copy.actionsHeading}</h3>
                  {(response.recommended_actions ?? []).length ? (
                    <ol className="checklist">
                      {(response.recommended_actions ?? []).map(
                        (action, index) => (
                          <li key={index}>{action}</li>
                        )
                      )}
                    </ol>
                  ) : (
                    <p>{copy.noActions}</p>
                  )}
                </>
              )}

              {isClarify && (
                <>
                  <h3>{copy.missing}</h3>
                  <ul>
                    {(response.missing_info_questions ?? []).map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </>
              )}

              <div className="ticket">
                <h3>{copy.ticketTitle}</h3>
                <pre className="ticket-block">
                  {buildTicketSummary({ question, response, language })}
                </pre>
              </div>

              {response.citations?.length ? (
                <details className="citations">
                  <summary>{copy.docsTitle}</summary>
                  <ul>
                    {response.citations.map((item, index) => (
                      <li key={index}>
                        <strong>{mapCitationLabel(item.file, language)}</strong>
                        <p style={{ margin: "6px 0 0" }}>
                          {mapCitationDescription(item.file, language)}
                        </p>
                        <details style={{ marginTop: 4 }}>
                          <summary>{copy.excerptLabel}</summary>
                          <p style={{ marginTop: 6 }}>
                            {formatExcerpt(item.excerpt, language)}
                          </p>
                        </details>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
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
        .cards {
          display: grid;
          gap: 10px;
        }
        .summary {
          margin: 0 0 12px;
        }
        .checklist {
          margin: 8px 0 0;
          padding-left: 20px;
        }
        .citations {
          margin-top: 8px;
        }
        .ticket {
          margin-top: 16px;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }
        .server-error {
          padding: 12px;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          background: #fef2f2;
        }
        .ticket-block {
          white-space: pre-wrap;
          margin: 8px 0 0;
          font-family: inherit;
        }
        .debug {
          margin-top: 12px;
        }
      `}</style>
    </main>
  );
}

function buildTicketSummary({
  question,
  response,
  language,
}: {
  question: string;
  response: AskResponse;
  language: "es" | "en";
}): string {
  if (isBackendError(response)) {
    return language === "es"
      ? "No se pudo generar resumen: error del servidor."
      : "Could not generate summary: server error.";
  }
  const actions = response.recommended_actions ?? [];
  const missing = response.missing_info_questions ?? [];
  if (language === "es") {
    if (actions.length > 0) {
      return [
        "Texto para ticket:",
        `- Síntoma: ${question}`,
        `- Acciones sugeridas: ${actions.join("; ")}`,
        "- Escalar si: el problema persiste tras validar los pasos"
      ].join("\n");
    }
    return [
      "Texto para ticket:",
      `- Síntoma: ${question}`,
      `- Datos faltantes: ${missing.slice(0, 2).join("; ") || "Ninguno"}`,
      "- Escalar con: detalle de los datos solicitados"
    ].join("\n");
  }
  if (actions.length > 0) {
    return [
      "Ticket text:",
      `- Symptom: ${question}`,
      `- Suggested actions: ${actions.join("; ")}`,
      "- Escalate if: issue persists after validations"
    ].join("\n");
  }
  return [
    "Ticket text:",
    `- Symptom: ${question}`,
    `- Missing info: ${missing.slice(0, 3).join("; ") || "Not applicable"}`,
    "- Escalate if: more information is needed"
  ].join("\n");
}

function mapCitationLabel(file: string, language: "es" | "en"): string {
  const lower = file.toLowerCase();
  if (language === "es") {
    if (lower.includes("flp-blank-page")) {
      return "Launchpad en blanco tras activación";
    }
    if (lower.includes("ui2-services")) return "Servicios UI2 faltantes";
    if (lower.includes("launchpad-theme")) return "Problemas de tema en Launchpad";
    if (lower.includes("odata-401-403")) return "OData 401/403 – causas comunes";
    if (lower.includes("transport-incomplete")) return "Transporte incompleto";
    if (lower.includes("roles-catalogs")) return "Roles y catálogos";
    if (lower.includes("cache-indexing")) return "Caché e indexación";
    if (lower.includes("authorization-checks")) return "Autorizaciones – verificación";
    if (lower.includes("apps-not-visible")) return "Tiles o apps no visibles";
    return "Referencia técnica";
  }
  if (lower.includes("flp-blank-page")) return "Launchpad blank page after activation";
  if (lower.includes("ui2-services")) return "Missing UI2 services";
  if (lower.includes("launchpad-theme")) return "Launchpad theme issues";
  if (lower.includes("odata-401-403")) return "OData 401/403 – common causes";
  if (lower.includes("transport-incomplete")) return "Incomplete transport";
  if (lower.includes("roles-catalogs")) return "Roles and catalogs";
  if (lower.includes("cache-indexing")) return "Cache and indexing";
  if (lower.includes("authorization-checks")) return "Authorization checks";
  if (lower.includes("apps-not-visible")) return "Apps/tiles not visible";
  return "Reference";
}

function mapCitationDescription(
  file: string,
  language: "es" | "en"
): string {
  const lower = file.toLowerCase();
  if (language === "es") {
    if (lower.includes("flp-blank-page")) {
      return "Guía rápida para aislar fallas de servicios, recursos UI y cache.";
    }
    if (lower.includes("ui2-services")) {
      return "Checklist de servicios /UI2 y pasos de activación en SICF.";
    }
    if (lower.includes("launchpad-theme")) {
      return "Indicadores de problemas de tema y validaciones seguras.";
    }
    if (lower.includes("odata-401-403")) {
      return "Causas típicas de 401/403 y verificaciones de Gateway.";
    }
    if (lower.includes("transport-incomplete")) {
      return "Señales de transporte incompleto y validaciones en destino.";
    }
    if (lower.includes("roles-catalogs")) {
      return "Relación rol–catálogo–espacio/página en visibilidad de apps.";
    }
    if (lower.includes("cache-indexing")) {
      return "Casos donde cache o indexación impactan en el Launchpad.";
    }
    if (lower.includes("authorization-checks")) {
      return "Pasos para validar autorizaciones y trazas SU53.";
    }
    if (lower.includes("apps-not-visible")) {
      return "Diagnóstico para tiles o apps que no aparecen a un usuario.";
    }
    return "Resumen de referencia para el diagnóstico.";
  }
  if (lower.includes("flp-blank-page")) {
    return "Quick guide to isolate services, UI resources, and cache issues.";
  }
  if (lower.includes("ui2-services")) {
    return "Checklist for /UI2 services and SICF activation steps.";
  }
  if (lower.includes("launchpad-theme")) {
    return "Signals of theme issues and safe validation steps.";
  }
  if (lower.includes("odata-401-403")) {
    return "Typical 401/403 causes and Gateway validation steps.";
  }
  if (lower.includes("transport-incomplete")) {
    return "Symptoms of incomplete transport and target checks.";
  }
  if (lower.includes("roles-catalogs")) {
    return "Role–catalog–space/page link to app visibility.";
  }
  if (lower.includes("cache-indexing")) {
    return "Cases where cache or indexing affects Launchpad.";
  }
  if (lower.includes("authorization-checks")) {
    return "Steps to validate authorizations and SU53 traces.";
  }
  if (lower.includes("apps-not-visible")) {
    return "Diagnosis for tiles/apps missing for a user.";
  }
  return "Reference summary for diagnosis.";
}

function formatExcerpt(excerpt: string, language: "es" | "en"): string {
  if (language !== "es") return excerpt;
  if (isLikelyEnglish(excerpt)) {
    return "Resumen en español: La referencia describe síntomas, causas probables y verificaciones recomendadas relacionadas con este problema.";
  }
  return excerpt;
}

function isLikelyEnglish(text: string): boolean {
  const lower = text.toLowerCase();
  const englishHits = [
    " the ",
    " and ",
    " or ",
    " with ",
    " without ",
    "check",
    "symptom",
    "cause",
    "steps",
    "verify",
    "missing",
    "launchpad",
    "service",
  ].filter((token) => lower.includes(token)).length;
  const spanishHits = [
    " el ",
    " la ",
    " los ",
    " las ",
    " de ",
    " para ",
    " que ",
    " con ",
    " sin ",
    " usuario",
    " servicio",
    " revisar",
  ].filter((token) => lower.includes(token)).length;
  return englishHits >= 2 && spanishHits < 2;
}
function isBackendError(response: AskResponse | null): boolean {
  if (!response) return false;
  const escalation = response.escalation_summary ?? "";
  const missing = response.missing_info_questions ?? [];
  return (
    /error interno/i.test(escalation) ||
    missing.some((item) => /error interno/i.test(item))
  );
}

function extractSummary(escalation?: string): string | null {
  if (!escalation) return null;
  const firstLine = escalation.split("\n")[0] ?? "";
  if (/^Resumen:/i.test(firstLine)) {
    return firstLine.replace(/^Resumen:\s*/i, "").trim();
  }
  if (/^Summary:/i.test(firstLine)) {
    return firstLine.replace(/^Summary:\s*/i, "").trim();
  }
  return null;
}
