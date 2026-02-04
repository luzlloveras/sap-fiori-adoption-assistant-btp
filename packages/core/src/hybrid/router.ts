import type { KnowledgeBase, Language, ScoredChunk } from "../rag/index";
import { retrieveChunks } from "../rag/index";
import type { LLMProvider } from "../providers/types";
import type { Citation, HybridResponse, Intent, RoutePath } from "./types";

type LlmHybridPayload = {
  recommended_actions: string[];
  missing_info_questions: string[];
  escalation_summary: string;
};

type TraceOptions = {
  provider?: string;
  model?: string;
  startMs?: number;
};

type ChecklistTemplate = {
  steps: string[];
};

type IntentConfig = {
  globalEligible?: boolean;
  clarifyQuestions: { es: string[]; en: string[] };
};

type IntentPlaybook = {
  summary: { es: string; en: string };
  starterActions: { es: string[]; en: string[] };
  clarifyQuestions: { es: string[]; en: string[] };
  escalate: { es: string; en: string };
};

const RULE_INTENTS: Intent[] = [
  "apps_not_visible",
  "role_catalog_space",
  "cache_indexing",
  "transport",
  "authorization",
  "ui2_services_missing",
  "theme_issue_launchpad",
  "odata_401_403",
  "transport_incomplete_fiori",
  "flp_blank_page_after_activation"
];

const CITATION_FILES: Record<Intent, string[]> = {
  apps_not_visible: [
    "apps-not-visible-checklist.md",
    "roles-catalogs-spaces.md",
    "cache-indexing.md"
  ],
  role_catalog_space: ["roles-catalogs-spaces.md", "role-assignment.md"],
  cache_indexing: ["cache-indexing.md"],
  transport: ["launchpad-content-transport.md"],
  authorization: ["authorization-checks.md", "request-info-basis-security.md"],
  flp_blank_page_after_activation: ["flp-blank-page-after-activation.md"],
  ui2_services_missing: ["ui2-services-missing.md"],
  theme_issue_launchpad: ["launchpad-theme-issues.md"],
  odata_401_403: ["odata-401-403-troubleshooting.md", "authorization-checks.md"],
  transport_incomplete_fiori: ["transport-incomplete-fiori.md"],
  clarify: ["troubleshooting-overview.md"],
  other: ["troubleshooting-overview.md"]
};

const INTENT_CONFIG: Record<Intent, IntentConfig> = {
  apps_not_visible: {
    clarifyQuestions: {
      es: [
        "¿Es solo una aplicación o toda la pantalla?",
        "¿Ocurre para un solo usuario o varios?",
        "¿En qué sistema/cliente ocurre?"
      ],
      en: [
        "Is it one app or the whole screen?",
        "Does it affect one user or multiple?",
        "Which system/client is affected?"
      ]
    }
  },
  role_catalog_space: {
    clarifyQuestions: {
      es: [
        "¿Qué rol de negocio tiene el usuario?",
        "¿Qué catálogo debería ver?",
        "¿En qué cliente estás probando?"
      ],
      en: [
        "Which business role is assigned?",
        "Which catalog should be visible?",
        "Which client are you testing?"
      ]
    }
  },
  cache_indexing: {
    clarifyQuestions: {
      es: [
        "¿El problema desaparece al iniciar sesión de nuevo?",
        "¿Ocurre para todos o solo algunos usuarios?"
      ],
      en: [
        "Does it disappear after a fresh login?",
        "Does it affect all users or just some?"
      ]
    }
  },
  transport: {
    clarifyQuestions: {
      es: [
        "¿Qué transporte se movió?",
        "¿En qué sistema/cliente destino ocurre?"
      ],
      en: ["Which transport moved?", "Which target system/client is affected?"]
    }
  },
  authorization: {
    clarifyQuestions: {
      es: [
        "¿En qué aplicación ocurre el error?",
        "¿El sistema muestra un mensaje de autorización?"
      ],
      en: [
        "Which app shows the error?",
        "Does the system show an authorization error?"
      ]
    }
  },
  flp_blank_page_after_activation: {
    globalEligible: true,
    clarifyQuestions: {
      es: [
        "¿Hay errores en la consola del navegador (F12) al abrir el FLP?",
        "¿En Network ves 401/403 o recursos UI5 que no cargan?",
        "¿Qué tema está activo (Quartz/Belize) y probaste uno estándar?"
      ],
      en: [
        "Any browser console errors (F12) when opening FLP?",
        "Any 401/403 or UI5 resources failing in Network?",
        "Which theme is active (Quartz/Belize) and did you try a standard one?"
      ]
    }
  },
  ui2_services_missing: {
    globalEligible: true,
    clarifyQuestions: {
      es: [
        "¿Existen y están activos en SICF los servicios /UI2/* (shell/start_up, etc.)?",
        "¿Se ejecutó /UI2/FLP_ACTIVATE_SERVICES o /UI2/ACTIVATE_FLP? ¿Con qué resultado?"
      ],
      en: [
        "Are /UI2/* services active in SICF (shell/start_up, etc.)?",
        "Was /UI2/FLP_ACTIVATE_SERVICES or /UI2/ACTIVATE_FLP run? Result?"
      ]
    }
  },
  theme_issue_launchpad: {
    globalEligible: true,
    clarifyQuestions: {
      es: [
        "¿Qué tema está asignado al usuario?",
        "¿El problema desaparece al cambiar a un tema estándar?"
      ],
      en: [
        "Which theme is assigned to the user?",
        "Does the issue disappear with a standard theme?"
      ]
    }
  },
  odata_401_403: {
    globalEligible: true,
    clarifyQuestions: {
      es: [
        "¿Qué servicio OData devuelve 401/403 y en qué endpoint?",
        "¿Qué aparece en /IWFND/ERROR_LOG y en SU53?"
      ],
      en: [
        "Which OData service returns 401/403 and at which endpoint?",
        "What appears in /IWFND/ERROR_LOG and SU53?"
      ]
    }
  },
  transport_incomplete_fiori: {
    globalEligible: true,
    clarifyQuestions: {
      es: [
        "¿Qué transporte (STMS) y qué objetos faltan (catálogo/rol/mapeo de destino)?",
        "¿En qué sistema/cliente destino ocurre?"
      ],
      en: [
        "Which transport (STMS) and which objects are missing (catalog/role/target mapping)?",
        "Which target system/client is affected?"
      ]
    }
  },
  clarify: {
    clarifyQuestions: {
      es: [
        "¿Falta toda la pantalla o solo una aplicación?",
        "¿Ocurre para todos los usuarios?",
        "¿En qué sistema/cliente ocurre?"
      ],
      en: [
        "Is the whole screen missing or only one app?",
        "Does it affect all users?",
        "Which system/client is affected?"
      ]
    }
  },
  other: {
    clarifyQuestions: {
      es: [
        "¿Qué aplicación está afectada?",
        "¿Ocurre para todos los usuarios o solo uno?",
        "¿En qué sistema/cliente ocurre?"
      ],
      en: [
        "Which app is affected?",
        "Does it affect all users or just one?",
        "Which system/client is affected?"
      ]
    }
  }
};

const INTENT_PLAYBOOK: Record<Intent, IntentPlaybook> = {
  flp_blank_page_after_activation: {
    summary: {
      es: "El Launchpad queda en blanco por fallas en servicios o recursos de interfaz.",
      en: "Launchpad is blank due to service or UI resource failures."
    },
    starterActions: {
      es: [
        "Revisar consola del navegador (errores JavaScript).",
        "Revisar Network (401/403/500, recursos UI5/CSS).",
        "Verificar servicios /UI2/* activos en SICF y servicios FLP.",
        "Probar con tema estándar (Quartz/Belize) y limpiar caché/personalización.",
        "Revisar logs relevantes (ST22/SM21 y /IWFND/ERROR_LOG si aplica)."
      ],
      en: [
        "Check browser console and network for load errors.",
        "Verify /UI2 services are active in SICF.",
        "Test with a standard theme and clear cache."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.flp_blank_page_after_activation.clarifyQuestions,
    escalate: {
      es: "Consola del navegador, errores de red, estado SICF y tema activo.",
      en: "Browser console, network errors, SICF status, and active theme."
    }
  },
  ui2_services_missing: {
    summary: {
      es: "Los servicios técnicos del Launchpad pueden estar inactivos o incompletos.",
      en: "Launchpad technical services may be inactive or incomplete."
    },
    starterActions: {
      es: [
        "Verificar en SICF que /UI2/* estén activos.",
        "Revisar ejecución de /UI2/FLP_ACTIVATE_SERVICES o /UI2/ACTIVATE_FLP.",
        "Validar alias de sistema y cliente."
      ],
      en: [
        "Verify /UI2/* services are active in SICF.",
        "Check /UI2/FLP_ACTIVATE_SERVICES or /UI2/ACTIVATE_FLP execution.",
        "Validate system alias and client."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.ui2_services_missing.clarifyQuestions,
    escalate: {
      es: "Listado de servicios UI2 inactivos y log de activación.",
      en: "List of inactive UI2 services and activation log."
    }
  },
  theme_issue_launchpad: {
    summary: {
      es: "El problema parece estar relacionado con el tema visual.",
      en: "The issue appears related to the visual theme."
    },
    starterActions: {
      es: [
        "Confirmar tema asignado y versión.",
        "Cambiar a tema estándar y limpiar caché.",
        "Revisar personalización del usuario."
      ],
      en: [
        "Confirm assigned theme and version.",
        "Switch to a standard theme and clear cache.",
        "Review user personalization."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.theme_issue_launchpad.clarifyQuestions,
    escalate: {
      es: "Tema activo, navegador afectado y captura del problema.",
      en: "Active theme, affected browser, and a screenshot."
    }
  },
  odata_401_403: {
    summary: {
      es: "El 403 en OData suele deberse a autorizaciones faltantes o configuración Gateway/alias.",
      en: "The app is blocked by OData service authorizations."
    },
    starterActions: {
      es: [
        "Revisar /IWFND/ERROR_LOG del servicio.",
        "Ejecutar SU53 o traza para el usuario.",
        "Validar roles backend y activación del servicio."
      ],
      en: [
        "Review /IWFND/ERROR_LOG for the service.",
        "Run SU53 or trace for the user.",
        "Validate backend roles and service activation."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.odata_401_403.clarifyQuestions,
    escalate: {
      es: "Entrada de /IWFND/ERROR_LOG y objeto fallido en SU53.",
      en: "IWFND error log entry and failed object in SU53."
    }
  },
  transport_incomplete_fiori: {
    summary: {
      es: "El transporte podría estar incompleto o en cliente incorrecto.",
      en: "The transport may be incomplete or in the wrong client."
    },
    starterActions: {
      es: [
        "Comparar objetos transportados vs requeridos en STMS.",
        "Confirmar cliente de importación.",
        "Reimportar y regenerar contenido de Launchpad."
      ],
      en: [
        "Compare transported objects vs required in STMS.",
        "Confirm import client.",
        "Reimport and regenerate Launchpad content."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.transport_incomplete_fiori.clarifyQuestions,
    escalate: {
      es: "ID de transporte, lista de objetos faltantes y cliente destino.",
      en: "Transport ID, missing object list, and target client."
    }
  },
  transport: {
    summary: {
      es: "El contenido transportado requiere verificación en el destino.",
      en: "Transported content needs verification in target."
    },
    starterActions: {
      es: [
        "Confirmar en STMS el import en el cliente correcto.",
        "Verificar que catálogo y rol existan en destino.",
        "Recalcular contenido de Launchpad si aplica."
      ],
      en: [
        "Confirm STMS import in the correct client.",
        "Verify catalog and role exist in target.",
        "Rebuild Launchpad content if required."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.transport.clarifyQuestions,
    escalate: {
      es: "ID de transporte y log de importación.",
      en: "Transport ID and import log."
    }
  },
  apps_not_visible: {
    summary: {
      es: "La visibilidad de apps depende del rol, catálogo y espacio/página.",
      en: "App visibility depends on role, catalog, and space/page."
    },
    starterActions: {
      es: [
        "Confirmar que el rol de negocio incluye espacio y página activos.",
        "Validar que el catálogo tenga mapeos de destino visibles.",
        "Revisar si el caso es individual o global.",
        "Limpiar caché/personalización y revalidar."
      ],
      en: [
        "Confirm business role includes active space and page.",
        "Validate the catalog has visible target mappings.",
        "Check if the issue is individual or global.",
        "Clear cache/personalization and retest."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.apps_not_visible.clarifyQuestions,
    escalate: {
      es: "Rol asignado, catálogo esperado y usuario afectado.",
      en: "Assigned role, expected catalog, and affected user."
    }
  },
  role_catalog_space: {
    summary: {
      es: "El rol está asignado pero su contenido no coincide con lo esperado.",
      en: "The role is assigned but its content does not match expectations."
    },
    starterActions: {
      es: [
        "Verificar contenido del rol de negocio en el cliente.",
        "Confirmar catálogos esperados.",
        "Revisar espacio/página asignados.",
        "Validar alias de sistema y cliente."
      ],
      en: [
        "Verify business role content in the client.",
        "Confirm expected catalogs.",
        "Review assigned space/page.",
        "Validate system alias and client."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.role_catalog_space.clarifyQuestions,
    escalate: {
      es: "Rol asignado y lista de catálogos esperados.",
      en: "Assigned role and expected catalog list."
    }
  },
  cache_indexing: {
    summary: {
      es: "La sesión o caché puede estar ocultando cambios recientes.",
      en: "Session or cache may be hiding recent changes."
    },
    starterActions: {
      es: [
        "Probar con sesión nueva o usuario sin personalización.",
        "Limpiar caché de Launchpad del usuario/sistema.",
        "Revalidar visibilidad."
      ],
      en: [
        "Retest with a fresh session or user without personalization.",
        "Clear Launchpad cache for user/system.",
        "Revalidate visibility."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.cache_indexing.clarifyQuestions,
    escalate: {
      es: "Usuario afectado y evidencia de caché/personalización.",
      en: "Affected user and cache/personalization evidence."
    }
  },
  authorization: {
    summary: {
      es: "Faltan autorizaciones para acceder a la aplicación o servicio.",
      en: "Authorizations are missing for the app or service."
    },
    starterActions: {
      es: [
        "Ejecutar SU53 o traza de autorización.",
        "Ajustar objetos/autorizaciones faltantes.",
        "Revalidar acceso."
      ],
      en: [
        "Run SU53 or authorization trace.",
        "Adjust missing authorization objects.",
        "Revalidate access."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.authorization.clarifyQuestions,
    escalate: {
      es: "Objeto fallido en SU53 y rol asignado.",
      en: "Failed object in SU53 and assigned role."
    }
  },
  clarify: {
    summary: {
      es: "Faltan datos para continuar el diagnóstico.",
      en: "More details are needed to continue."
    },
    starterActions: {
      es: [
        "Confirmar si el problema es global o individual.",
        "Identificar sistema y cliente afectados.",
        "Revisar si hay cambios recientes."
      ],
      en: [
        "Confirm whether the issue is global or individual.",
        "Identify affected system and client.",
        "Review recent changes."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.clarify.clarifyQuestions,
    escalate: {
      es: "Datos de usuario, sistema y cliente.",
      en: "User, system, and client details."
    }
  },
  other: {
    summary: {
      es: "Necesitamos identificar la causa con verificaciones básicas.",
      en: "We need basic checks to identify the cause."
    },
    starterActions: {
      es: [
        "Confirmar rol de negocio efectivo del usuario.",
        "Validar catálogo y mapeos de destino.",
        "Revisar caché/personalización."
      ],
      en: [
        "Confirm effective business role.",
        "Validate catalog and target mappings.",
        "Review cache/personalization."
      ]
    },
    clarifyQuestions: INTENT_CONFIG.other.clarifyQuestions,
    escalate: {
      es: "Rol asignado y síntoma exacto.",
      en: "Assigned role and exact symptom."
    }
  }
};

const GENERAL_PLAYBOOK: IntentPlaybook = {
  summary: {
    es: "Necesitamos hacer verificaciones básicas para orientar el diagnóstico.",
    en: "We need basic checks to guide the diagnosis."
  },
  starterActions: {
    es: [
      "Confirmar rol de negocio efectivo del usuario.",
      "Validar catálogo y mapeos de destino.",
      "Revisar caché/personalización.",
      "Revalidar con sesión nueva."
    ],
    en: [
      "Confirm the user's effective business role.",
      "Validate catalog and target mappings.",
      "Review cache/personalization.",
      "Retest with a fresh session."
    ]
  },
  clarifyQuestions: {
    es: [
      "¿Es un problema general o de un usuario?",
      "¿En qué sistema/cliente ocurre?"
    ],
    en: [
      "Is it a global issue or a single user?",
      "Which system/client is affected?"
    ]
  },
  escalate: {
    es: "Síntoma y pasos realizados.",
    en: "Symptom and steps taken."
  }
};

export function classifyIntent(question: string): {
  intent: Intent;
  confidence: number;
} {
  const normalized = normalize(question);
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length < 3) {
    return { intent: "clarify", confidence: 0.2 };
  }

  const has = (patterns: RegExp[]) => patterns.some((pattern) => pattern.test(normalized));
  const isGlobal = detectGlobalScope(question);

  if (
    isGlobal &&
    has([/launchpad/, /flp/, /fiori launchpad/, /sap flp/]) &&
    has([/blanco/, /p[aá]gina en blanco/, /blank page/, /white screen/, /pantalla blanca/]) &&
    has([/activar/, /activate/, /activacion/, /activation/, /servicios/, /services/, /\/ui2/, /sicf/, /flp_activate_services/])
  ) {
    return { intent: "flp_blank_page_after_activation", confidence: 0.84 };
  }

  if (
    has([
      /\/ui2/,
      /flp_activate_services/,
      /icf/,
      /activate flp/,
      /activar flp/
    ])
  ) {
    return {
      intent: "ui2_services_missing",
      confidence: isGlobal ? 0.86 : 0.78
    };
  }
  if (
    has([/activate services/, /activar servicios/]) &&
    has([/ui2/, /flp/])
  ) {
    return { intent: "ui2_services_missing", confidence: 0.72 };
  }
  if (
    has([
      /pagina en blanco/,
      /p[aá]gina en blanco/,
      /blank page/,
      /white screen/,
      /flp en blanco/,
      /launchpad blank/
    ])
  ) {
    return {
      intent: "flp_blank_page_after_activation",
      confidence: isGlobal ? 0.86 : 0.8
    };
  }
  if (
    has([/theme/, /tema/]) &&
    has([
      /quartz/,
      /belize/,
      /sap fiori 3/,
      /sap_fiori_3/,
      /fiori 3/,
      /shell bar/,
      /css cache/,
      /css/,
      /sapui5/,
      /ui5 theme/,
      /theming/,
      /visual/,
      /glitch/
    ])
  ) {
    return {
      intent: "theme_issue_launchpad",
      confidence: isGlobal ? 0.8 : 0.74
    };
  }
  if (
    has([/odata/, /servicio odata/, /odata service/]) &&
    has([
      /\b401\b/,
      /\b403\b/,
      /forbidden/,
      /unauthorized/,
      /iwfnd/,
      /\/iwfnd\/error_log/,
      /su53/
    ])
  ) {
    return {
      intent: "odata_401_403",
      confidence: isGlobal ? 0.84 : 0.8
    };
  }
  if (
    has([/transport/, /transporte/, /stms/, /content transport/]) &&
    has([
      /incomplete/,
      /no llego/,
      /faltan/,
      /missing/,
      /no aparece en destino/,
      /catalog not in target/,
      /objects not arrived/,
      /role not in target/
    ])
  ) {
    return { intent: "transport_incomplete_fiori", confidence: 0.76 };
  }
  if (
    has([
      /no veo (la|las) app/,
      /no aparecen? tiles?/,
      /no ve (los )?tiles/,
      /no ve apps/,
      /no ve aplicaciones/,
      /no le aparecen tiles/,
      /no ve nada en launchpad/,
      /no le aparecen apps/,
      /solo a un usuario/,
      /a un usuario/,
      /otros si/,
      /pero otros si/,
      /missing tile/,
      /launchpad.*vacio/,
      /launchpad.*empty/
    ])
  ) {
    return { intent: "apps_not_visible", confidence: 0.82 };
  }
  if (has([/catalog(o)?/, /space/, /page/, /business role/, /pfcg/])) {
    return { intent: "role_catalog_space", confidence: 0.75 };
  }
  if (has([/cache/, /cach[eé]/, /index(ing)?/])) {
    return { intent: "cache_indexing", confidence: 0.7 };
  }
  if (has([/transport/, /transporte/])) {
    return { intent: "transport", confidence: 0.72 };
  }
  if (has([/authoriz/, /autoriz/, /trace/])) {
    return { intent: "authorization", confidence: 0.68 };
  }

  return { intent: "other", confidence: 0.45 };
}

export function decideRoute(intent: Intent, confidence: number): RoutePath {
  if (intent === "clarify" || confidence <= 0.35) {
    return "CLARIFY";
  }
  if (RULE_INTENTS.includes(intent) && confidence >= 0.7) {
    return "RULES_ONLY";
  }
  return "RAG_LLM";
}

export async function routeHybrid({
  question,
  language,
  knowledgeBase,
  provider,
  trace
}: {
  question: string;
  language: Language;
  knowledgeBase: KnowledgeBase;
  provider: LLMProvider;
  trace?: TraceOptions;
}): Promise<HybridResponse> {
  const traceStart = trace?.startMs ?? Date.now();
  const traceProvider = trace?.provider ?? "unknown";
  const traceModel = trace?.model ?? "unknown";

  const emitTrace = (
    route: RoutePath,
    intent: Intent,
    chunkCount: number
  ): void => {
    console.log(
      "[trace]",
      JSON.stringify({
        intent,
        route,
        kbChunks: chunkCount,
        provider: traceProvider,
        model: traceModel,
        latencyMs: Date.now() - traceStart
      })
    );
  };

  try {
    const classification = classifyIntent(question);
    const isGlobal = detectGlobalScope(question);
    const chunkCount = Array.isArray(knowledgeBase?.chunks)
      ? knowledgeBase.chunks.length
      : 0;
    if (chunkCount === 0) {
      console.log(
        "[ask]",
        JSON.stringify({
          intent: classification.intent,
          confidence: classification.confidence,
          route: "CLARIFY",
          kbChunks: chunkCount
        })
      );
      const response = buildKbMissingClarify(
        question,
        language,
        classification.intent
      );
      emitTrace("CLARIFY", response.intent, chunkCount);
      return response;
    }
    const route = decideRoute(classification.intent, classification.confidence);
    console.log(
      "[ask]",
      JSON.stringify({
        intent: classification.intent,
        confidence: classification.confidence,
        route,
        kbChunks: chunkCount
      })
    );

    if (isGlobal && isGlobalIntent(classification.intent)) {
      const citations = buildRulesCitations(
        knowledgeBase,
        question,
        classification.intent
      );
      if (citations.length > 0) {
        const response = buildRulesOnlyResponse(
          question,
          language,
          knowledgeBase,
          classification
        );
        emitTrace("RULES_ONLY", response.intent, chunkCount);
        return response;
      }
      const response = buildClarifyResponse(
        question,
        language,
        knowledgeBase,
        classification
      );
      emitTrace("CLARIFY", response.intent, chunkCount);
      return response;
    }

    if (route === "CLARIFY") {
      const response = buildClarifyResponse(
        question,
        language,
        knowledgeBase,
        classification
      );
      emitTrace("CLARIFY", response.intent, chunkCount);
      return response;
    }

    if (route === "RULES_ONLY") {
      const response = buildRulesOnlyResponse(
        question,
        language,
        knowledgeBase,
        classification
      );
      emitTrace("RULES_ONLY", response.intent, chunkCount);
      return response;
    }

    const response = await buildRagLlmResponse(
      question,
      language,
      knowledgeBase,
      provider,
      classification
    );
    emitTrace("RAG_LLM", response.intent, chunkCount);
    return response;
  } catch (error) {
    const response: HybridResponse = {
      intent: "clarify",
      confidence: 0.1,
      missing_info_questions: [
        "No pude acceder a la base de conocimiento (KB) o falló el retrieval.",
        "Verificá KNOWLEDGE_BASE_PATH y que existan archivos .md."
      ],
      recommended_actions: [
        "Revisar la ruta configurada de la base de conocimiento.",
        "Verificar en logs que haya chunks cargados.",
        "Reiniciar la API con la KB disponible."
      ],
      citations: [],
      escalation_summary:
        "Falla técnica en KB/retrieval: revisar logs del backend y path de knowledge base."
    };
    emitTrace("CLARIFY", response.intent, 0);
    return response;
  }
}

function buildRulesOnlyResponse(
  question: string,
  language: Language,
  knowledgeBase: KnowledgeBase,
  classification: { intent: Intent; confidence: number }
): HybridResponse {
  const intent = classification.intent;
  const playbook = getPlaybookForIntent(intent);
  const actions = buildActionList(playbook, language);
  const questions = shouldAskForContext(question, classification.intent)
    ? toStringArray(pickByLanguage(playbook?.clarifyQuestions, language)).slice(0, 2)
    : [];
  const citations = buildRulesCitations(knowledgeBase, question, intent);
  const summary = pickSummary(playbook, language);
  const escalation = buildTicketSummary({
    summary,
    question,
    actions,
    missing: questions,
    language
  });
  return {
    intent,
    confidence: classification.confidence,
    missing_info_questions: questions,
    recommended_actions: actions,
    citations,
    escalation_summary: escalation
  };
}

async function buildRagLlmResponse(
  question: string,
  language: Language,
  knowledgeBase: KnowledgeBase,
  provider: LLMProvider,
  classification: { intent: Intent; confidence: number }
): Promise<HybridResponse> {
  if (!knowledgeBase?.chunks?.length) {
    return buildClarifyResponse(question, language, knowledgeBase, classification);
  }
  const chunks = retrieveChunks(knowledgeBase, question, { topK: 4 });
  if (!chunks.length) {
    return buildClarifyResponse(question, language, knowledgeBase, classification);
  }
  const topText = chunks[0]?.chunk?.text ?? "";
  if (topText.length < 120) {
    return buildClarifyResponse(question, language, knowledgeBase, classification);
  }
  const questionTokens = tokenizeNormalized(question);
  const chunkTokens = tokenizeNormalized(topText);
  if (tokenOverlapCount(questionTokens, chunkTokens) < 2) {
    return buildClarifyResponse(question, language, knowledgeBase, classification);
  }

  const prompt = buildHybridPrompt(question, chunks, language);
  const llmRaw = await provider.generate(prompt);
  const llmJson = parseHybridLlm(llmRaw, language);
  const citations = chunksToCitations(chunks, 4);
  const playbook = getPlaybookForIntent(classification.intent);
  const actions = uniqueStrings(
    (llmJson.recommended_actions ?? []).filter(Boolean)
  );
  const missing = uniqueStrings(
    (llmJson.missing_info_questions ?? []).filter(Boolean)
  );
  const summary = pickSummary(playbook, language);

  return {
    intent: classification.intent,
    confidence: classification.confidence,
    missing_info_questions: missing,
    recommended_actions: actions,
    citations,
    escalation_summary: buildTicketSummary({
      summary,
      question,
      actions,
      missing,
      language
    })
  };
}

function buildClarifyResponse(
  question: string,
  language: Language,
  knowledgeBase: KnowledgeBase,
  classification: { intent: Intent; confidence: number }
): HybridResponse {
  try {
    const playbook = getPlaybookForIntent(classification.intent);
    const actions = buildActionList(playbook, language);
    const questionsRaw = pickByLanguage(playbook?.clarifyQuestions, language);
    const questions = toStringArray(questionsRaw).slice(0, 2);
    const citations = buildRulesCitations(
      knowledgeBase,
      question,
      classification.intent
    );
    const summary = pickSummary(playbook, language);
    return {
      intent: "clarify",
      confidence: classification.confidence,
      missing_info_questions: questions,
      recommended_actions: actions,
      citations,
      escalation_summary: buildTicketSummary({
        summary,
        question,
        actions,
        missing: questions,
        language
      })
    };
  } catch {
    const actions = buildActionsFromPlaybook(GENERAL_PLAYBOOK, language);
    const questions = toStringArray(
      pickByLanguage(GENERAL_PLAYBOOK.clarifyQuestions, language)
    ).slice(0, 2);
    return {
      intent: "clarify",
      confidence: 0.1,
      missing_info_questions: questions,
      recommended_actions: actions,
      citations: [],
      escalation_summary:
        language === "es"
          ? "Resumen: Falla técnica al generar respuesta.\nSíntoma: falla técnica al generar respuesta.\nAcciones sugeridas:\n1) Revisar logs y configuración.\nDatos faltantes: Ninguno.\nEscalar con: logs del backend."
          : "Summary: Technical failure generating response.\nSymptom: technical failure generating response.\nSuggested actions:\n1) Review logs and configuration.\nMissing info: None.\nEscalate with: backend logs."
    };
  }
}

function buildClarifyEscalation(question: string, language: Language): string {
  if (language === "es") {
    return [
      "Para ticket:",
      `- Síntoma: ${question}`,
      "- Hipótesis: falta información para diagnosticar",
      "- Primer check: solicitar datos de rol/cliente/app",
      "- Evidencia: n/a",
      "- Próximos pasos: pedir más contexto"
    ].join("\n");
  }
  return [
    "For ticket:",
    `- Symptom: ${question}`,
    "- Hypothesis: insufficient information to diagnose",
    "- First check: request role/client/app details",
    "- Evidence: n/a",
    "- Next steps: ask for more context"
  ].join("\n");
}

function buildKbMissingClarify(
  question: string,
  language: Language,
  intent: Intent
): HybridResponse {
  const message =
    language === "es"
      ? "La base de conocimiento no está cargada. Verificá la ruta configurada."
      : "Knowledge base is not loaded. Verify KNOWLEDGE_BASE_PATH.";
  const playbook = getPlaybookForIntent(intent);
  const intentQuestions = toStringArray(
    pickByLanguage(playbook?.clarifyQuestions, language)
  ).slice(0, 2);
  const actions = buildActionList(playbook, language);
  const summary = pickSummary(playbook, language);
  return {
    intent: "clarify",
    confidence: 0.1,
    missing_info_questions: [
      message,
      language === "es"
        ? "¿Podés confirmar la ruta configurada de la base de conocimiento?"
        : "Can you confirm the knowledge base path?",
      ...intentQuestions
    ],
    recommended_actions: actions,
    citations: [],
    escalation_summary: buildTicketSummary({
      summary,
      question,
      actions,
      missing: intentQuestions,
      language
    })
  };
}

function buildHybridPrompt(
  question: string,
  chunks: ScoredChunk[],
  language: Language
): string {
  const sources = chunks
    .map((item, index) => {
      return [
        `[${index + 1}] ${item.chunk.file} :: ${item.chunk.heading}`,
        item.chunk.text
      ].join("\n");
    })
    .join("\n\n");

  return [
    "You are a troubleshooting assistant that answers using ONLY the provided sources.",
    language === "es" ? "Respond in Spanish." : "Respond in English.",
    "Return ONLY valid JSON with keys:",
    "recommended_actions (array of short steps, ordered by priority),",
    "missing_info_questions (array of short questions),",
    "escalation_summary (ticket-ready short block).",
    "Do not include markdown or extra text.",
    "Do NOT provide explanations or hypotheses.",
    "Order steps as: verification/measurement, corrective action, re-test.",
    "Prefix steps with Verificar/Acción/Validar (or Verify/Action/Validate) when clear.",
    "Avoid repeating the same information in steps and missing_info_questions.",
    "Steps must be actionable and grounded in the sources only.",
    "Escalation summary must include: symptom, suggested actions, missing info, and when to escalate.",
    "",
    `Question: ${question}`,
    "",
    "SOURCES_START",
    sources,
    "SOURCES_END"
  ].join("\n");
}

function parseHybridLlm(raw: string, language: Language): LlmHybridPayload {
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
    const parsed = JSON.parse(jsonText) as Partial<LlmHybridPayload>;
    return {
      recommended_actions: Array.isArray(parsed.recommended_actions)
        ? parsed.recommended_actions.filter(
            (item): item is string => typeof item === "string"
          )
        : fallback.recommended_actions,
      missing_info_questions: Array.isArray(parsed.missing_info_questions)
        ? parsed.missing_info_questions.filter(
            (item): item is string => typeof item === "string"
          )
        : fallback.missing_info_questions,
      escalation_summary:
        typeof parsed.escalation_summary === "string"
          ? parsed.escalation_summary
          : fallback.escalation_summary
    };
  } catch {
    return fallback;
  }
}

function getPlaybookForIntent(intent: Intent): IntentPlaybook {
  return INTENT_PLAYBOOK[intent] ?? GENERAL_PLAYBOOK;
}

function buildActionList(playbook: IntentPlaybook, language: Language): string[] {
  const actions = buildActionsFromPlaybook(playbook, language);
  return uniqueStrings(actions).slice(0, 6);
}

function pickSummary(playbook: IntentPlaybook, language: Language): string {
  const summaryRaw = pickByLanguage(playbook?.summary, language);
  const summaryText = toStringArray(summaryRaw).join(" ").trim();
  if (summaryText) return summaryText;
  return language === "es"
    ? "Necesitamos verificaciones básicas."
    : "Basic checks are needed.";
}

function buildFallback(language: Language): LlmHybridPayload {
  if (language === "es") {
    return {
      recommended_actions: [
        "Confirmar rol de negocio efectivo del usuario.",
        "Validar catálogo y mapeos de destino.",
        "Revisar caché/personalización y revalidar."
      ],
      missing_info_questions: [
        "¿Qué rol de negocio está asignado?",
        "¿Qué app específica falta?"
      ],
      escalation_summary: buildTicketSummary({
        summary: "Faltan datos para continuar el diagnóstico.",
        question: "Consulta sin contexto suficiente",
        actions: ["Confirmar rol de negocio efectivo", "Validar catálogo y mapeos de destino"],
        missing: ["rol de negocio asignado", "app afectada"],
        language
      })
    };
  }
  return {
    recommended_actions: [
      "Confirm the user's effective business role.",
      "Validate the catalog has target mappings for the app.",
      "Verify space/page assignments for the role.",
      "Review cache/personalization and retest."
    ],
    missing_info_questions: [
      "Which business role is assigned?",
      "Which specific app is missing?"
    ],
    escalation_summary: buildTicketSummary({
      summary: "More details are needed to continue.",
      question: "Insufficient context in request",
      actions: [
        "Confirm effective business role",
        "Validate catalog target mappings"
      ],
      missing: ["assigned business role", "affected app"],
      language
    })
  };
}

function chunksToCitations(chunks: ScoredChunk[], max: number): Citation[] {
  return chunks.slice(0, max).map((item) => ({
    file: item.chunk.file,
    heading: item.chunk.heading,
    anchor: item.chunk.anchor,
    excerpt: item.chunk.text.slice(0, 220)
  }));
}

function collectCitations(
  knowledgeBase: KnowledgeBase,
  files: string[],
  max: number
): Citation[] {
  if (!knowledgeBase?.chunks?.length) return [];
  const citations: Citation[] = [];
  for (const file of files) {
    const match = knowledgeBase.chunks.find((chunk) => chunk.file === file);
    if (match) {
      citations.push({
        file: match.file,
        heading: match.heading,
        anchor: match.anchor,
        excerpt: match.text.slice(0, 220)
      });
    }
    if (citations.length >= max) break;
  }
  return citations;
}

function buildRulesCitations(
  knowledgeBase: KnowledgeBase,
  question: string,
  intent: Intent
): Citation[] {
  if (!knowledgeBase?.chunks?.length) return [];
  const candidates = retrieveChunks(knowledgeBase, question, { topK: 8 });
  const allowedFiles = CITATION_FILES[intent] ?? CITATION_FILES.other;
  const filtered = candidates.filter((item) =>
    allowedFiles.includes(item.chunk.file)
  );
  if (!filtered.length) {
    return collectCitations(knowledgeBase, allowedFiles, 3);
  }
  return filtered.slice(0, 3).map((item) => ({
    file: item.chunk.file,
    heading: item.chunk.heading,
    anchor: item.chunk.anchor,
    excerpt: item.chunk.text.slice(0, 220)
  }));
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  return (values ?? []).filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function pickByLanguage(value: unknown, language: "es" | "en"): unknown {
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record[language] !== undefined) {
      return record[language];
    }
  }
  return value;
}

function getClarifyQuestions(intent: Intent, language: Language): string[] {
  const config = INTENT_CONFIG[intent] ?? INTENT_CONFIG.other;
  return language === "es"
    ? config.clarifyQuestions.es
    : config.clarifyQuestions.en;
}

function buildTicketSummary({
  summary,
  question,
  actions,
  missing,
  language
}: {
  summary: string;
  question: string;
  actions: string[];
  missing: string[];
  language: Language;
}): string {
  const actionLines = actions.slice(0, 5).map((item, index) => `${index + 1}) ${item}`);
  const missingText = missing.length ? missing.slice(0, 2).join("; ") : language === "es" ? "Ninguno" : "None";
  if (language === "es") {
    return [
      `Resumen: ${summary}`,
      `Síntoma: ${question}`,
      "Acciones sugeridas:",
      ...(actionLines.length ? actionLines : ["1) Sin acciones sugeridas."]),
      `Datos faltantes: ${missingText}`,
      "Escalar con: capturas, logs y resultado de los checks"
    ].join("\n");
  }
  return [
    `Summary: ${summary}`,
    `Symptom: ${question}`,
    "Suggested actions:",
    ...(actionLines.length ? actionLines : ["1) No suggested actions."]),
    `Missing info: ${missingText}`,
    "Escalate with: screenshots, logs, and check results"
  ].join("\n");
}

function getPlaybook(intent: Intent): IntentPlaybook {
  return INTENT_PLAYBOOK[intent] ?? GENERAL_PLAYBOOK;
}

function buildActionsFromPlaybook(
  playbook: IntentPlaybook,
  language: Language
): string[] {
  const actionsRaw = pickByLanguage(playbook?.starterActions, language);
  const actions = toStringArray(actionsRaw);
  if (actions.length >= 3) {
    return actions.slice(0, 5);
  }
  const fallbackRaw = pickByLanguage(GENERAL_PLAYBOOK.starterActions, language);
  const fallback = toStringArray(fallbackRaw);
  return fallback.slice(0, 5);
}

function shouldAskForContext(question: string, intent: Intent): boolean {
  if (isGlobalIntent(intent)) {
    return false;
  }
  const normalized = normalize(question);
  const keywords = [
    "role",
    "catalog",
    "space",
    "page",
    "tile",
    "app",
    "pfcg",
    "client",
    "cliente",
    "launchpad",
    "odata",
    "sicf",
    "401",
    "403",
    "theme",
    "tema",
    "ui2",
    "flp"
  ];
  return !keywords.some((keyword) => normalized.includes(keyword));
}

function normalize(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectGlobalScope(question: string): boolean {
  const normalized = normalize(question);
  const signals = [
    "para todos",
    "todos los usuarios",
    "para todos los usuarios",
    "everyone",
    "all users",
    "global",
    "en todos los usuarios",
    "a todos",
    "every user"
  ];
  return signals.some((signal) => normalized.includes(signal));
}

function isGlobalIntent(intent: Intent): boolean {
  return Boolean(INTENT_CONFIG[intent]?.globalEligible);
}

function tokenizeNormalized(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function tokenOverlapCount(aTokens: string[], bTokens: string[]): number {
  if (!aTokens.length || !bTokens.length) return 0;
  const setA = new Set(aTokens);
  const setB = new Set(bTokens);
  let count = 0;
  for (const token of setB) {
    if (setA.has(token)) {
      count += 1;
    }
  }
  return count;
}

const ES_COPY = {
  checklists: {
    apps_not_visible: {
      steps: [
        "Confirmar que el rol de negocio incluye espacio y página activas.",
        "Validar que el catálogo del rol tenga mapeos de destino visibles.",
        "Revisar si la visibilidad es global o solo para un usuario.",
        "Limpiar caché/personalización y revalidar."
      ]
    },
    role_catalog_space: {
      steps: [
        "Verificar contenido del rol de negocio en el cliente de prueba.",
        "Confirmar que los catálogos esperados están asignados.",
        "Revisar espacio/página asignados al mismo rol.",
        "Validar alias de sistema y cliente usados."
      ]
    },
    cache_indexing: {
      steps: [
        "Probar con sesión nueva o usuario sin personalización.",
        "Limpiar caché de Launchpad del usuario/sistema.",
        "Revalidar visibilidad de mosaicos."
      ]
    },
    transport: {
      steps: [
        "Confirmar en STMS el import en el cliente correcto.",
        "Verificar que catálogo y role existan en el destino.",
        "Recalcular contenido de Launchpad si aplica."
      ]
    },
    authorization: {
      steps: [
        "Ejecutar SU53 o traza de autorización en el usuario afectado.",
        "Ajustar objetos/autorizaciones faltantes.",
        "Revalidar acceso a la aplicación/servicio."
      ]
    },
    flp_blank_page_after_activation: {
      steps: [
        "Revisar consola del navegador y red por errores de carga.",
        "Verificar servicios /UI2 activos en SICF.",
        "Probar con tema estándar y limpiar caché."
      ]
    },
    ui2_services_missing: {
      steps: [
        "Verificar en SICF que /UI2/* estén activos.",
        "Revisar si se ejecutó /UI2/FLP_ACTIVATE_SERVICES.",
        "Validar alias de sistema y cliente."
      ]
    },
    theme_issue_launchpad: {
      steps: [
        "Confirmar tema asignado y versión.",
        "Cambiar a tema estándar y limpiar caché.",
        "Revisar personalización del usuario."
      ]
    },
    odata_401_403: {
      steps: [
        "Revisar /IWFND/ERROR_LOG del servicio.",
        "Ejecutar SU53 o traza para el usuario.",
        "Validar roles backend y activación del servicio."
      ]
    },
    transport_incomplete_fiori: {
      steps: [
        "Comparar objetos transportados vs requeridos en STMS.",
        "Confirmar cliente de importación.",
        "Reimportar y regenerar contenido de Launchpad."
      ]
    },
    other: {
      steps: [
        "Confirmar rol de negocio efectivo del usuario.",
        "Validar catálogo y mapeos de destino.",
        "Revisar caché/personalización."
      ]
    }
  } as Record<Intent, ChecklistTemplate>,
  missing: {
    apps_not_visible: [
      "¿Qué app específica no aparece?",
      "¿Qué rol de negocio está asignado?"
    ],
    role_catalog_space: [
      "¿Qué catálogos y espacios/páginas están asignados?",
      "¿Qué rol o PFCG tiene el usuario?"
    ],
    cache_indexing: ["¿Probaste con una sesión nueva?"],
    transport: ["¿En qué sistema/cliente ocurrió el transporte?"],
    authorization: ["¿Qué objeto de autorización falla en la traza?"],
    flp_blank_page_after_activation: [
      "¿Ves pantalla en blanco en todos los usuarios?",
      "¿Ocurre en todos los navegadores?",
      "¿Cambiaste el tema visual recientemente?"
    ],
    ui2_services_missing: [
      "¿El Launchpad dejó de cargar después de activar servicios?",
      "¿Ocurre para todos los usuarios?",
      "¿En qué sistema/cliente ocurre?"
    ],
    theme_issue_launchpad: [
      "¿El problema empezó después de cambiar el tema visual?",
      "¿Cambiar a un tema estándar lo corrige?",
      "¿Se limpió caché del navegador?"
    ],
    odata_401_403: [
      "¿El problema aparece al abrir una app o cargar datos?",
      "¿El sistema muestra un mensaje de autorización?",
      "¿Ocurre para todos los usuarios?"
    ],
    transport_incomplete_fiori: [
      "¿Qué objetos no llegaron con el transporte?",
      "¿En qué sistema/cliente se detectó?"
    ],
    clarify: [
      "¿Falta toda la pantalla o solo una app específica?",
      "¿Ocurre para todos los usuarios?",
      "¿En qué sistema/cliente ocurre?"
    ],
    other: [
      "¿Qué app está afectada?",
      "¿Qué rol y cliente estás usando?"
    ]
  } as Record<Intent, string[]>
};

const EN_COPY = {
  checklists: {
    apps_not_visible: {
      steps: [
        "Confirm the business role includes active space and page.",
        "Validate the catalog has visible target mappings.",
        "Check if it affects all users or just one.",
        "Clear cache/personalization and retest."
      ]
    },
    role_catalog_space: {
      steps: [
        "Verify business role content in the test client.",
        "Confirm expected catalogs are assigned.",
        "Review space/page assigned to the same role.",
        "Validate system alias and client."
      ]
    },
    cache_indexing: {
      steps: [
        "Retest with a fresh session or a user without personalization.",
        "Clear Launchpad cache for user/system.",
        "Revalidate tile visibility."
      ]
    },
    transport: {
      steps: [
        "Confirm in STMS the import in the correct client.",
        "Verify catalog and role exist in target.",
        "Rebuild Launchpad content if required."
      ]
    },
    authorization: {
      steps: [
        "Run SU53 or authorization trace for the affected user.",
        "Adjust missing authorization objects.",
        "Revalidate access to the tile/service."
      ]
    },
    flp_blank_page_after_activation: {
      steps: [
        "Check browser console and network for load errors.",
        "Verify /UI2 services are active in SICF.",
        "Test with a standard theme and clear cache."
      ]
    },
    ui2_services_missing: {
      steps: [
        "Verify /UI2/* services are active in SICF.",
        "Check whether /UI2/FLP_ACTIVATE_SERVICES ran.",
        "Validate system alias and client."
      ]
    },
    theme_issue_launchpad: {
      steps: [
        "Confirm assigned theme and version.",
        "Switch to a standard theme and clear cache.",
        "Review user personalization."
      ]
    },
    odata_401_403: {
      steps: [
        "Review /IWFND/ERROR_LOG for the service.",
        "Run SU53 or trace for the user.",
        "Validate backend roles and service activation."
      ]
    },
    transport_incomplete_fiori: {
      steps: [
        "Compare transported objects vs required ones in STMS.",
        "Confirm the import client.",
        "Reimport and regenerate Launchpad content."
      ]
    },
    other: {
      steps: [
        "Confirm effective business role for the user.",
        "Validate catalog and target mappings.",
        "Review cache/personalization."
      ]
    }
  } as Record<Intent, ChecklistTemplate>,
  missing: {
    apps_not_visible: [
      "Which specific app is missing?",
      "Which business role is assigned?"
    ],
    role_catalog_space: [
      "Which catalogs and spaces/pages are assigned?",
      "Which role or PFCG role is assigned to the user?"
    ],
    cache_indexing: ["Did you test with a fresh session?"],
    transport: ["Which system/client was the transport applied to?"],
    authorization: ["Which authorization object fails in the trace?"],
    flp_blank_page_after_activation: [
      "Do you see a blank screen for all users?",
      "Does it happen in all browsers?",
      "Did the visual theme change recently?"
    ],
    ui2_services_missing: [
      "Did Launchpad stop loading after service activation?",
      "Does it happen for all users?",
      "Which system/client is affected?"
    ],
    theme_issue_launchpad: [
      "Did the issue start after a theme change?",
      "Does switching to a standard theme fix it?",
      "Was browser cache cleared?"
    ],
    odata_401_403: [
      "Does the issue appear when opening an app or loading data?",
      "Does the system show an authorization error?",
      "Does it affect all users?"
    ],
    transport_incomplete_fiori: [
      "Which objects did not arrive with the transport?",
      "Which system/client shows the issue?"
    ],
    clarify: [
      "Is the whole screen missing or only one app?",
      "Does it affect all users?",
      "Which system/client is affected?"
    ],
    other: [
      "Which app is affected?",
      "Which role and client are you using?"
    ]
  } as Record<Intent, string[]>
};
