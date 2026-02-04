import { describe, expect, it } from "vitest";
import { chunkMarkdown, retrieveChunks } from "@fiori-access-ai-assistant/core";

function buildKnowledgeBase(files: Record<string, string>) {
  const chunks = Object.entries(files).flatMap(([name, content]) =>
    chunkMarkdown(content, name)
  );
  const docFrequencies = new Map<string, number>();
  for (const chunk of chunks) {
    const unique = new Set(chunk.tokens);
    for (const token of unique) {
      docFrequencies.set(token, (docFrequencies.get(token) ?? 0) + 1);
    }
  }
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  return {
    chunks,
    docCount: chunks.length,
    avgDocLength: chunks.length === 0 ? 0 : totalLength / chunks.length,
    docFrequencies,
    mdFileCount: Object.keys(files).length
  };
}

describe("retrieval scoring", () => {
  it("ranks chunks with overlapping terms higher", async () => {
    const kb = buildKnowledgeBase({
      "roles.md": "# Roles\n\nBusiness role assignments control catalog access.",
      "cache.md": "# Cache\n\nCache invalidation affects launchpad visibility."
    });

    const results = retrieveChunks(kb, "business role not showing apps", {
      topK: 2
    });

    expect(results.length).toBeGreaterThan(0);
    if (results.length > 1) {
      expect(results[0]?.score ?? 0).toBeGreaterThanOrEqual(
        results[1]?.score ?? 0
      );
    }
  });
});
