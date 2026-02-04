import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { loadKnowledgeBase, retrieveChunks } from "@fiori-access-ai-assistant/core";
async function createTempKnowledgeBase(files) {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "kb-"));
    await Promise.all(Object.entries(files).map(([name, content]) => fs.writeFile(path.join(dir, name), content, "utf-8")));
    return dir;
}
describe("retrieval scoring", () => {
    it("ranks chunks with overlapping terms higher", async () => {
        const kbPath = await createTempKnowledgeBase({
            "roles.md": "# Roles\n\nBusiness role assignments control catalog access.",
            "cache.md": "# Cache\n\nCache invalidation affects launchpad visibility."
        });
        const kb = await loadKnowledgeBase(kbPath);
        const results = retrieveChunks(kb, "business role not showing apps", {
            topK: 2
        });
        expect(results[0]?.chunk.file).toBe("roles.md");
        await fs.rm(kbPath, { recursive: true, force: true });
    });
});
