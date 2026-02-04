import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  buildActionsFromPlaybook,
  extractRequestedSteps,
  loadKnowledgeBase,
  routeHybrid
} from "@fiori-access-ai-assistant/core";
import { MockProvider } from "@fiori-access-ai-assistant/core";

async function createTempKnowledgeBase(
  files: Record<string, string>
): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "kb-"));
  await Promise.all(
    Object.entries(files).map(([name, content]) =>
      fs.writeFile(path.join(dir, name), content, "utf-8")
    )
  );
  return dir;
}

describe("hybrid router", () => {
  const basePlaybook = {
    summary: { es: "Resumen", en: "Summary" },
    starterActions: {
      es: [
        "Accion 1",
        "Accion 2",
        "Accion 3",
        "Accion 4",
        "Accion 5",
        "Accion 6",
        "Accion 7",
        "Accion 8",
        "Accion 9",
        "Accion 10"
      ],
      en: [
        "Action 1",
        "Action 2",
        "Action 3",
        "Action 4",
        "Action 5",
        "Action 6",
        "Action 7",
        "Action 8",
        "Action 9",
        "Action 10"
      ]
    },
    clarifyQuestions: { es: [], en: [] },
    escalate: { es: "Escalar", en: "Escalate" }
  } as const;
  it("returns rules-only response for common missing apps intent", async () => {
    const kbDir = await createTempKnowledgeBase({
      "roles-catalogs-spaces.md":
        "# Roles\nBusiness roles bundle catalogs, spaces, and pages.",
      "apps-not-visible-checklist.md": "# Checklist\nCheck catalog and tiles."
    });
    const knowledgeBase = await loadKnowledgeBase(kbDir);
    const response = await routeHybrid({
      question: "No veo la app en el Launchpad",
      language: "es",
      knowledgeBase,
      provider: new MockProvider()
    });

    expect(response.intent).toBe("apps_not_visible");
    expect(response.recommended_actions.length).toBeGreaterThan(0);
    expect(response.recommended_actions[0]).not.toMatch(/^Resumen:/i);
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.escalation_summary).toMatch(
      /Escalar con: capturas, logs y resultado de los checks$/
    );
  });

  it("returns rules-only response for blank FLP after activation", async () => {
    const kbDir = await createTempKnowledgeBase({
      "flp-blank-page-after-activation.md":
        "# FLP Blank\nUI2 services and ICF checks."
    });
    const knowledgeBase = await loadKnowledgeBase(kbDir);
    const response = await routeHybrid({
      question:
        "Después de activar servicios el Launchpad queda en blanco para todos los usuarios",
      language: "es",
      knowledgeBase,
      provider: new MockProvider()
    });

    expect(response.intent).toBe("flp_blank_page_after_activation");
    expect(response.recommended_actions.length).toBeGreaterThan(0);
    expect(response.recommended_actions[0]).not.toMatch(/^Resumen:/i);
    expect(response.missing_info_questions.join(" ")).not.toMatch(/aplicaci[oó]n|rol/i);
  });

  it("classifies global blank FLP after activation as flp_blank_page_after_activation", async () => {
    const kbDir = await createTempKnowledgeBase({
      "flp-blank-page-after-activation.md":
        "# FLP Blank\nUI2 services and ICF checks."
    });
    const knowledgeBase = await loadKnowledgeBase(kbDir);
    const response = await routeHybrid({
      question:
        "Después de activar servicios el Launchpad queda en blanco para todos los usuarios",
      language: "es",
      knowledgeBase,
      provider: new MockProvider()
    });

    expect(response.intent).toBe("flp_blank_page_after_activation");
    expect(response.recommended_actions.length).toBeGreaterThanOrEqual(3);
    expect(response.missing_info_questions.join(" ")).not.toMatch(/aplicaci[oó]n|rol/i);
  });

  it("uses rag+llm path when intent is unclear but sources exist", async () => {
    const kbDir = await createTempKnowledgeBase({
      "troubleshooting-overview.md":
        "# Troubleshooting\nActivation troubleshooting steps for Fiori.",
      "cache-indexing.md": "# Cache\nLaunchpad cache and indexing notes."
    });
    const knowledgeBase = await loadKnowledgeBase(kbDir);
    const response = await routeHybrid({
      question: "activation troubleshooting guidance",
      language: "en",
      knowledgeBase,
      provider: new MockProvider()
    });

    expect(response.intent).toBe("other");
    expect(response.recommended_actions.length).toBeGreaterThan(0);
    expect(response.recommended_actions[0]).not.toMatch(/^Resumen:/i);
    expect(response.escalation_summary.length).toBeGreaterThan(0);
    expect(response.escalation_summary).toMatch(/^Resumen:/i);
  });

  it("formats odata summary with consultant wording", async () => {
    const kbDir = await createTempKnowledgeBase({
      "odata-401-403-troubleshooting.md":
        "# OData\n401/403 authorization troubleshooting."
    });
    const knowledgeBase = await loadKnowledgeBase(kbDir);
    const response = await routeHybrid({
      question: "OData devuelve 403 en una app",
      language: "es",
      knowledgeBase,
      provider: new MockProvider()
    });

    expect(response.intent).toBe("odata_401_403");
    expect(response.escalation_summary).toMatch(/^Resumen:/i);
    expect(response.escalation_summary).toMatch(/autorizaciones|Gateway\/alias/i);
  });

  it("returns clarify when question is too vague", async () => {
    const kbDir = await createTempKnowledgeBase({
      "troubleshooting-overview.md":
        "# Overview\nConfirm user, client, and role assignment."
    });
    const knowledgeBase = await loadKnowledgeBase(kbDir);
    const response = await routeHybrid({
      question: "No funciona Fiori",
      language: "es",
      knowledgeBase,
      provider: new MockProvider()
    });

    expect(response.intent).toBe("clarify");
    expect(response.recommended_actions.length).toBeGreaterThanOrEqual(3);
    expect(response.missing_info_questions.length).toBeGreaterThan(0);
    expect(response.escalation_summary).not.toMatch(/Error interno en \/ask/i);
  });

  it("returns clarify when top chunk is weakly related", async () => {
    const kbDir = await createTempKnowledgeBase({
      "roles-catalogs-spaces.md":
        "# Roles\nBusiness roles bundle catalogs, spaces, and pages."
    });
    const knowledgeBase = await loadKnowledgeBase(kbDir);
    const response = await routeHybrid({
      question: "printer not working",
      language: "en",
      knowledgeBase,
      provider: new MockProvider()
    });

    expect(response.intent).toBe("clarify");
    expect(response.recommended_actions.length).toBe(0);
  });

  it("handles individual user case with role/catalog context", async () => {
    const kbDir = await createTempKnowledgeBase({
      "roles-catalogs-spaces.md":
        "# Roles\nBusiness roles bundle catalogs, spaces, and pages.",
      "apps-not-visible-checklist.md": "# Checklist\nCheck catalog and tiles."
    });
    const knowledgeBase = await loadKnowledgeBase(kbDir);
    const response = await routeHybrid({
      question: "Un usuario no ve tiles pero otros sí",
      language: "es",
      knowledgeBase,
      provider: new MockProvider()
    });

    expect(["apps_not_visible", "role_catalog_space"]).toContain(response.intent);
    if (response.recommended_actions.length === 0) {
      expect(response.missing_info_questions.join(" ")).toMatch(/rol|cat[aá]logo/i);
    }
  });

  it("classifies per-user tiles issue as apps_not_visible or role_catalog_space", async () => {
    const kbDir = await createTempKnowledgeBase({
      "roles-catalogs-spaces.md":
        "# Roles\nBusiness roles bundle catalogs, spaces, and pages.",
      "apps-not-visible-checklist.md": "# Checklist\nCheck catalog and tiles."
    });
    const knowledgeBase = await loadKnowledgeBase(kbDir);
    const response = await routeHybrid({
      question: "Un usuario no ve tiles en QAS cliente 300, pero otros sí",
      language: "es",
      knowledgeBase,
      provider: new MockProvider()
    });

    expect(["apps_not_visible", "role_catalog_space"]).toContain(response.intent);
    expect(response.confidence).toBeGreaterThanOrEqual(0.7);
    expect(response.intent).not.toBe("other");
  });

  it("returns clarify with intent-aware questions when KB is missing", async () => {
    const kbDir = await createTempKnowledgeBase({});
    const knowledgeBase = await loadKnowledgeBase(kbDir);
    const response = await routeHybrid({
      question:
        "Después de activar servicios el Launchpad queda en blanco para todos los usuarios",
      language: "es",
      knowledgeBase,
      provider: new MockProvider()
    });

    expect(response.intent).toBe("clarify");
    expect(response.recommended_actions.length).toBeGreaterThanOrEqual(3);
    const joined = response.missing_info_questions.join(" ").toLowerCase();
    expect(joined).toMatch(/base de conocimiento/i);
    expect(joined).toMatch(/tema|theme/);
    expect(joined).not.toMatch(/error interno/);
  });

  it("extracts requested steps in ES/EN", () => {
    expect(extractRequestedSteps("dame 7 pasos")).toBe(7);
    expect(extractRequestedSteps("give me 6 steps")).toBe(6);
    expect(extractRequestedSteps("listar checks")).toBeNull();
  });

  it("honors requested steps and clamps to max", () => {
    const originalMax = process.env.PLAYBOOK_MAX_STEPS;
    process.env.PLAYBOOK_MAX_STEPS = "12";

    const esActions = buildActionsFromPlaybook(
      basePlaybook,
      "es",
      "dame 7 pasos"
    );
    expect(esActions).toHaveLength(7);

    const enActions = buildActionsFromPlaybook(
      basePlaybook,
      "en",
      "give me 6 steps"
    );
    expect(enActions).toHaveLength(6);

    const noNumber = buildActionsFromPlaybook(basePlaybook, "es", "hola");
    expect(noNumber).toHaveLength(10);

    const clamped = buildActionsFromPlaybook(
      basePlaybook,
      "es",
      "dame 50 pasos"
    );
    expect(clamped).toHaveLength(12);

    if (originalMax === undefined) {
      delete process.env.PLAYBOOK_MAX_STEPS;
    } else {
      process.env.PLAYBOOK_MAX_STEPS = originalMax;
    }
  });
});
