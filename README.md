## ¿Qué es esta app?

Es una pequeña aplicación web que te ayuda a **entender por qué no ves apps o recibís errores al usar SAP Fiori Launchpad**.  
No es un chat genérico: está pensada solo para problemas de acceso/visibilidad en el Launchpad.

## ¿Cómo la usa alguien no técnico?

- **Escribís tu problema** en una caja de texto, por ejemplo:
  - “Error 403 al abrir Fiori Launchpad”
  - “No veo apps en el Launchpad después de asignar rol”
  - “OData 401 error”
- La app **lee tu texto y busca en una “guía interna”** (documentos Markdown del proyecto).
- Con esa guía, te devuelve **una lista corta de pasos a seguir** y **preguntas que deberías hacer** a Basis/Security.

No necesitás saber qué es IA, RAG ni LLM para usarla.

## ¿Qué recibo como respuesta?

La respuesta no es un párrafo largo, sino una estructura clara:

- **intención detectada** (por ejemplo: apps no visibles, problema de OData, tema de UI2/SICF).  
- **preguntas que faltan**: qué datos deberías aclarar (usuario, cliente, rol, etc.).  
- **acciones recomendadas**: una mini check‑list de cosas para revisar.  
- **citas**: de qué documento interno salió esa recomendación.  
- **resumen para ticket**: un texto listo para pegar en un ticket a Basis/Security.

Si la app no tiene suficiente información para tu caso, en lugar de inventar, te pide más contexto.

## ¿Qué NO hace?

- **No** se conecta a sistemas SAP ni ejecuta transacciones.  
- **No** crea ni modifica roles, catálogos, espacios ni transportes.  
- **No** ve tus logs reales: solo usa los documentos Markdown incluidos en el proyecto.  
- **No** soluciona cualquier problema de Fiori: se centra en visibilidad/acceso y errores típicos (401/403/blank page).  
- **No** guarda tus preguntas ni datos personales: solo puede registrar algunos contadores/tipos de caso para debug.

## ¿Quién puede usarla?

- Alguien funcional que recibe tickets de “no veo la app en el Launchpad”.  
- Un consultor que quiere una lista de checks rápida y siempre igual.  
- Un recruiter o tech lead que quiere ver **cómo se arma un flujo guiado de troubleshooting** usando IA de forma controlada.

## ¿Cómo se ejecuta (modo simple)?

- **Instalar dependencias**:

```bash
pnpm install
```

- **Levantar la app web (UI + `/api/ask`)**:

```bash
pnpm -C apps/web dev
```

- **Probar la API a mano (opcional)**:

```bash
curl -s http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"No veo la app en el Launchpad","language":"es"}'
```

Con eso tenés suficiente para entender **qué hace** y **cómo interactuar con ella**, aunque no conozcas los detalles de IA por dentro.
