import fs from "node:fs/promises";
import path from "node:path";

type QaItem = {
  question: string;
  answer: string;
  steps: string[];
  follow_up_questions: string[];
};

const OUTPUT_PATH =
  process.env.QA_OUTPUT_PATH?.trim() ??
  path.join(process.cwd(), "outputs", "troubleshooting-qa.json");
const QA_LANGUAGE =
  process.env.QA_LANGUAGE === "en"
    ? "en"
    : process.env.QA_LANGUAGE === "both"
      ? "both"
      : "es";

function buildEsItems(): QaItem[] {
  return [
    {
      question: "No veo la app en el Launchpad pero tengo roles asignados.",
      answer:
        "Causa probable: el business role puede no incluir el catálogo correcto o la asignación de space/page no está activa. Puede ser necesario un análisis de autorización adicional.",
      steps: [
        "Verifica que el business role contenga el catálogo requerido.",
        "Confirma que la space y la page estén asignadas y activas en el mismo role.",
        "Revisa que el catálogo tenga target mappings para la app."
      ],
      follow_up_questions: [
        "¿Qué business role o PFCG role está asignado al usuario?",
        "¿Qué app tile o target mapping específico falta?"
      ]
    },
    {
      question: "El usuario entra al Launchpad pero no aparecen tiles.",
      answer:
        "Causa probable: el catálogo o la asignación de space/page no están completos. Puede ser necesario un análisis de autorización adicional.",
      steps: [
        "Confirma que el business role tenga al menos un catálogo con tiles visibles.",
        "Asegura que space y page estén asignadas al mismo role.",
        "Valida que el catálogo tenga target mappings."
      ],
      follow_up_questions: [
        "¿Qué catálogo y space/page están asignados al role?"
      ]
    },
    {
      question: "Después de un transporte no aparecen las apps en el Launchpad.",
      answer:
        "Causa probable: el contenido de Launchpad no se transportó completo o necesita reconstrucción. Puede ser necesario un análisis de autorización adicional.",
      steps: [
        "Confirma que catálogo y role llegaron al sistema destino.",
        "Verifica que las versiones de catálogo/role sean consistentes.",
        "Reconstruye el contenido de Launchpad si aplica."
      ],
      follow_up_questions: [
        "¿En qué sistema/cliente ocurrió el transporte?"
      ]
    },
    {
      question: "Los cambios de roles no se reflejan en el Launchpad.",
      answer:
        "Causa probable: caché o indexación de contenido en Launchpad. Puede ser necesario un análisis de autorización adicional.",
      steps: [
        "Pide al usuario cerrar sesión y volver a entrar.",
        "Limpia la caché de Launchpad para el usuario o el sistema.",
        "Revalida la visibilidad de tiles."
      ],
      follow_up_questions: ["¿Probaste con una sesión nueva?"]
    },
    {
      question: "La app aparece para otros usuarios pero no para uno en particular.",
      answer:
        "Causa probable: personalización de UI o roles específicos del usuario. Puede ser necesario un análisis de autorización adicional.",
      steps: [
        "Restablece la personalización de la interfaz del usuario.",
        "Revisa el role assignment específico del usuario.",
        "Verifica autorización con trace si persiste."
      ],
      follow_up_questions: ["¿El usuario tiene personalizaciones activas?"]
    },
    {
      question: "Falta un target mapping en el catálogo.",
      answer:
        "Causa probable: el catálogo no contiene el target mapping requerido o no se activó. Puede ser necesario un análisis de autorización adicional.",
      steps: [
        "Verifica que el catálogo contenga el target mapping.",
        "Comprueba que el target mapping esté activo.",
        "Valida autorización para el objeto requerido."
      ],
      follow_up_questions: [
        "¿Qué app/servicio exacto falta en el catálogo?"
      ]
    },
    {
      question: "El usuario tiene business role pero no ve espacios/páginas.",
      answer:
        "Causa probable: la asignación de space/page no está activa o no coincide con el role. Puede ser necesario un análisis de autorización adicional.",
      steps: [
        "Confirma que space y page estén asignadas al mismo business role.",
        "Revisa que la asignación esté activa.",
        "Revalida en Launchpad con nueva sesión."
      ],
      follow_up_questions: ["¿Qué space/page debería ver?"]
    },
    {
      question: "El Launchpad carga pero algunas apps específicas no aparecen.",
      answer:
        "Causa probable: falta de autorización o target mapping incompleto. Puede ser necesario un análisis de autorización adicional.",
      steps: [
        "Ejecuta un authorization trace para el usuario.",
        "Compara objetos requeridos vs roles asignados.",
        "Valida que el catálogo tenga target mappings."
      ],
      follow_up_questions: ["¿Qué app exacta no aparece?"]
    },
    {
      question: "No veo la app luego de cambiar el alias de sistema.",
      answer:
        "Causa probable: el alias de sistema no coincide con el target mapping o cliente. Puede ser necesario un análisis de autorización adicional.",
      steps: [
        "Verifica el alias de sistema configurado en el target mapping.",
        "Confirma el cliente usado por el usuario.",
        "Revalida la app en el catálogo correcto."
      ],
      follow_up_questions: ["¿Cuál es el alias de sistema actual?"]
    },
    {
      question: "El usuario ve el Launchpad vacío en un cliente específico.",
      answer:
        "Causa probable: el role assignment en ese cliente no está completo. Puede ser necesario un análisis de autorización adicional.",
      steps: [
        "Confirma el role assignment en el cliente correcto.",
        "Revisa que los roles estén transportados al cliente.",
        "Valida espacios/páginas asignados."
      ],
      follow_up_questions: ["¿Qué cliente y usuario estás probando?"]
    }
  ];
}

function buildEnItems(): QaItem[] {
  return [
    {
      question: "I cannot see the app in the Launchpad but roles are assigned.",
      answer:
        "Likely cause: the business role may not include the required catalog or the space/page assignment is inactive. Further authorization analysis may be required.",
      steps: [
        "Verify the business role includes the required catalog.",
        "Confirm the space and page are assigned and active in the same role.",
        "Ensure the catalog has target mappings for the app."
      ],
      follow_up_questions: [
        "Which business role or PFCG role is assigned to the user?",
        "Which exact app tile or target mapping is missing?"
      ]
    },
    {
      question: "The user can access Launchpad but no tiles appear.",
      answer:
        "Likely cause: the catalog or space/page assignment is incomplete. Further authorization analysis may be required.",
      steps: [
        "Confirm the business role has at least one catalog with visible tiles.",
        "Ensure the space and page are assigned to the same role.",
        "Validate the catalog has target mappings."
      ],
      follow_up_questions: ["Which catalog and space/page are assigned to the role?"]
    },
    {
      question: "After a transport, apps do not appear in the Launchpad.",
      answer:
        "Likely cause: Launchpad content did not transport fully or needs a rebuild. Further authorization analysis may be required.",
      steps: [
        "Confirm catalog and role arrived in the target system.",
        "Verify catalog/role versions match.",
        "Rebuild Launchpad content if required."
      ],
      follow_up_questions: ["Which system/client was the transport applied to?"]
    },
    {
      question: "Role changes are not reflected in the Launchpad.",
      answer:
        "Likely cause: Launchpad cache or content indexing. Further authorization analysis may be required.",
      steps: [
        "Ask the user to log out and log in again.",
        "Clear Launchpad cache for the user or system.",
        "Revalidate tile visibility."
      ],
      follow_up_questions: ["Did you test with a fresh session?"]
    },
    {
      question: "The app appears for other users but not for one user.",
      answer:
        "Likely cause: UI personalization or user-specific role assignment. Further authorization analysis may be required.",
      steps: [
        "Reset the user's UI personalization.",
        "Review the user's role assignment.",
        "Run an authorization trace if it persists."
      ],
      follow_up_questions: ["Does the user have personalization active?"]
    },
    {
      question: "A target mapping is missing in the catalog.",
      answer:
        "Likely cause: the catalog lacks the required target mapping or it is inactive. Further authorization analysis may be required.",
      steps: [
        "Verify the catalog contains the target mapping.",
        "Check the target mapping is active.",
        "Validate required authorization objects."
      ],
      follow_up_questions: ["Which exact app/service is missing from the catalog?"]
    },
    {
      question: "The user has a business role but cannot see spaces/pages.",
      answer:
        "Likely cause: the space/page assignment is inactive or not linked to the same role. Further authorization analysis may be required.",
      steps: [
        "Confirm space and page are assigned to the same business role.",
        "Verify the assignment is active.",
        "Revalidate in Launchpad with a new session."
      ],
      follow_up_questions: ["Which space/page should the user see?"]
    },
    {
      question: "Launchpad loads but some specific apps do not appear.",
      answer:
        "Likely cause: missing authorization or incomplete target mapping. Further authorization analysis may be required.",
      steps: [
        "Run an authorization trace for the user.",
        "Compare required objects vs assigned roles.",
        "Validate the catalog has target mappings."
      ],
      follow_up_questions: ["Which exact app is missing?"]
    },
    {
      question: "I can't see the app after changing the system alias.",
      answer:
        "Likely cause: the system alias does not match the target mapping or client. Further authorization analysis may be required.",
      steps: [
        "Verify the system alias configured in the target mapping.",
        "Confirm the client used by the user.",
        "Revalidate the app in the correct catalog."
      ],
      follow_up_questions: ["What is the current system alias?"]
    },
    {
      question: "The user sees an empty Launchpad in a specific client.",
      answer:
        "Likely cause: role assignment in that client is incomplete. Further authorization analysis may be required.",
      steps: [
        "Confirm role assignment in the correct client.",
        "Verify roles were transported to that client.",
        "Validate assigned spaces/pages."
      ],
      follow_up_questions: ["Which client and user are you testing?"]
    }
  ];
}

async function main() {
  const items =
    QA_LANGUAGE === "en"
      ? buildEnItems()
      : QA_LANGUAGE === "both"
        ? [...buildEsItems(), ...buildEnItems()]
        : buildEsItems();
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(items, null, 2), "utf-8");
  console.log(`Generated ${items.length} Q&A items -> ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
