## ¿Qué hace esta app?

Asistente interno para un único caso: **“no veo las apps en SAP Fiori Launchpad”**.  
Lee una base de conocimiento local en Markdown.  
Busca los párrafos más relevantes para tu pregunta.  
Decide si puede responder solo con reglas, si necesita un modelo de lenguaje o si tiene que pedir más contexto.  
Devuelve un JSON con: `intent`, `missing_info_questions`, `recommended_actions`, `citations`, `escalation_summary`.  
No guarda estado entre preguntas.

## Problema que resuelve (Fiori troubleshooting)

Cuando un usuario no ve tiles en el Launchpad hay muchas piezas: roles, catálogos, espacios/páginas, caché, autorizaciones y transportes.  
Normalmente se pierde tiempo probando cosas al azar o preguntando a varios equipos.  
Esta app estandariza el primer análisis: siempre hace las mismas preguntas y propone los mismos pasos básicos.  
El objetivo es tener un “primer nivel” consistente y explicable.

## Qué NO hace la app

- No crea ni modifica roles, catálogos, espacios ni transportes.  
- No se conecta a sistemas SAP ni ejecuta transacciones.  
- No ve tus logs reales: solo usa la knowledge base Markdown del proyecto.  
- No resuelve cualquier problema de Fiori, solo los relacionados con visibilidad / acceso.  
- No aprende sola: si la KB está mal, la respuesta también.

## Flujo simple: pregunta → señales → decisión → respuesta

1. **Pregunta**: el usuario envía `POST /api/ask` (Next.js) o `POST /ask` (Express) con `question` y `language`.  
2. **Señales**: el router analiza el texto y detecta intención (`intent`) y confianza (`confidence`).  
3. **Decisión de ruta**:
   - `RULES_ONLY`: usa solo reglas y checklists predefinidos.  
   - `RAG_LLM`: busca en la KB y llama al modelo de lenguaje con esos textos.  
   - `CLARIFY`: pide más contexto antes de seguir.  
4. **Respuesta**: siempre un JSON con:
   - `intent`: tipo de problema detectado.  
   - `missing_info_questions`: preguntas para completar el contexto.  
   - `recommended_actions`: pasos ordenados para revisar el caso.  
   - `citations`: de dónde salió la información (archivos Markdown).  
   - `escalation_summary`: texto listo para pegar en un ticket.

## Dónde hay IA y dónde NO

- **IA (LLM)**:
  - Solo en la ruta `RAG_LLM`.  
  - Se llama a un `provider` intercambiable (mock, OpenAI, GenAI Hub).  
  - El modelo recibe un prompt con la pregunta y los `chunks` de KB como contexto.  
  - El modelo debe devolver únicamente JSON con pasos, preguntas y resumen.

- **Lógica determinística (sin IA)**:
  - Clasificación de intención (`classifyIntent`) a partir de reglas de texto.  
  - Decisión de ruta (`decideRoute`) según intención y confianza.  
  - Búsqueda en la KB (`retrieveChunks`) con un score tipo BM25.  
  - Construcción de `recommended_actions`, `missing_info_questions` y `escalation_summary` cuando se usa `RULES_ONLY` o `CLARIFY`.  
  - Estructura exacta del JSON de salida.

## Glosario simple

- **LLM**: modelo de lenguaje grande que genera texto a partir de texto.  
- **prompt**: texto de instrucciones que le manda la app al modelo para guiar la respuesta.  
- **RAG**: primero busca pedazos de texto relevantes y después se los pasa al modelo para que responda solo con eso.  
- **chunk**: pedazo corto de texto de la KB, pensado para buscar más fácil.  
- **retrieval**: parte que elige qué `chunks` son los más parecidos a la pregunta.  
- **grounding**: obligar al modelo a usar solo lo que está en los `chunks`, sin inventar.  
- **provider**: implementación concreta que llama al modelo (mock, OpenAI, GenAI Hub).  
- **GenAI Hub**: servicio de SAP BTP para llamar modelos de lenguaje de forma gobernada.  
- **AI Core**: servicio de SAP BTP para ejecutar cargas de IA (modelos, pipelines) de forma gestionada.  
- **route (RULES_ONLY / RAG_LLM / CLARIFY)**: camino que sigue el router según la pregunta y la confianza.

## Por qué este proyecto demuestra aprendizaje en IA empresarial

- **Prompting**: los prompts están en código, son cortos y legibles, y muestran cómo guiar a un modelo para obtener solo JSON útil.  
- **Grounding y RAG**: la respuesta se apoya en Markdown local, con búsqueda BM25 y citas explícitas.  
- **Seguridad y PII**: la app nunca loguea el texto completo de la pregunta, solo metadatos (intención, ruta, número de chunks).  
- **Decisión guiada**: el router híbrido combina reglas de negocio con IA, y siempre puede volver a `CLARIFY` cuando la señal es débil.  
- **Intercambio de providers**: el contrato del `provider` es estable; se puede cambiar de mock a GenAI Hub sin tocar el flujo de negocio.  
- **Enfoque en un caso de uso real**: no es un “chat genérico”, está centrado en troubleshooting de acceso Fiori, con lenguaje de consultoría.

## Cómo correrla rápido

Instalar dependencias:

```bash
pnpm install
```

Levantar la app web (UI + `/api/ask` en Next.js):

```bash
pnpm -C apps/web dev
```

Probar la API desde consola:

```bash
curl -s http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"No veo la app en el Launchpad","language":"es"}'
```

Variables opcionales:

```bash
# Provider OpenAI (si no se setea, se usa mock)
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini

# Ruta de la knowledge base
KNOWLEDGE_BASE_PATH=/ruta/absoluta/a/knowledge-base
```

La KB por defecto está en `packages/core/knowledge-base`.  
Artefactos CF heredados viven en `legacy/cf/` y no afectan al flujo principal.
