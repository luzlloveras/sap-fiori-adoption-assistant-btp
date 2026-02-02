import fs from "node:fs/promises";
import path from "node:path";

export type Chunk = {
  id: string;
  file: string;
  heading: string;
  anchor: string;
  text: string;
  tokens: string[];
  length: number;
};

export type ScoredChunk = {
  chunk: Chunk;
  score: number;
};

export type KnowledgeBase = {
  chunks: Chunk[];
  docCount: number;
  avgDocLength: number;
  docFrequencies: Map<string, number>;
  mdFileCount: number; // <-- agregado para log seguro
};

type RetrieveOptions = {
  topK?: number;
};

const DEFAULT_TOP_K = 4;

export async function loadKnowledgeBase(kbPath: string): Promise<KnowledgeBase> {
  let files: string[] = [];
  try {
    files = await fs.readdir(kbPath);
  } catch {
    // KB no existe en CF o no está montada
    return {
      chunks: [],
      docCount: 0,
      avgDocLength: 0,
      docFrequencies: new Map<string, number>(),
      mdFileCount: 0
    };
  }

  const markdownFiles = files.filter((file) => file.toLowerCase().endsWith(".md"));
  const chunks: Chunk[] = [];

  for (const file of markdownFiles) {
    const fullPath = path.join(kbPath, file);
    let content = "";
    try {
      content = await fs.readFile(fullPath, "utf-8");
    } catch {
      continue;
    }
    const fileChunks = chunkMarkdown(content, file);
    chunks.push(...fileChunks);
  }

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
    mdFileCount: markdownFiles.length
  };
}

export function retrieveChunks(
  knowledgeBase: KnowledgeBase,
  question: string,
  options: RetrieveOptions = {}
): ScoredChunk[] {
  const topK = options.topK ?? DEFAULT_TOP_K;

  if (!knowledgeBase?.chunks?.length) {
    return [];
  }

  const queryTokens = tokenize(question);
  if (!queryTokens.length) {
    return [];
  }

  const scored = knowledgeBase.chunks
    .map((chunk) => ({
      chunk,
      score: bm25Score(chunk, queryTokens, knowledgeBase)
    }))
    .filter((item) => item.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

export type Language = "en" | "es";

export function buildPrompt(
  question: string,
  chunks: ScoredChunk[],
  language: Language
): string {
  const sources = (chunks ?? [])
    .map((item, index) => {
      return [
        `[${index + 1}] ${item.chunk.file} :: ${item.chunk.heading}`,
        item.chunk.text
      ].join("\n");
    })
    .join("\n\n");

  const languageInstruction =
    language === "es" ? "Respond in Spanish." : "Respond in English.";
  const guardrail =
    language === "es"
      ? "No tengo suficiente información en la base de conocimiento para responder eso."
      : "I don't have enough info from the knowledge base to answer that.";
  const likelyCause =
    language === "es" ? "Causa probable:" : "Likely cause:";
  const closingLine =
    language === "es"
      ? "Puede ser necesario un análisis de autorización adicional."
      : "Further authorization analysis may be required.";

  return [
    "You are an internal assistant that answers using ONLY the provided sources.",
    "Do not leave any part of the response in English when responding in Spanish.",
    "Keep SAP technical terms in English even when responding in Spanish.",
    languageInstruction,
    "Use only the provided sources.",
    `Start the answer with a short "${likelyCause}" sentence.`,
    `End the answer with "${closingLine}".`,
    "If the sources do not contain the answer, respond with:",
    `"${guardrail}"`,
    "If you respond with the guardrail, ask 1-3 clarifying questions.",
    "Return JSON with keys: answer, steps, follow_up_questions.",
    "Keep the answer concise.",
    "",
    `Question: ${question}`,
    "",
    "SOURCES_START",
    sources,
    "SOURCES_END"
  ].join("\n");
}

export function chunkMarkdown(content: string, file: string): Chunk[] {
  const lines = (content ?? "").split(/\r?\n/);
  const sections: { heading: string; text: string }[] = [];
  let currentHeading = "Introduction";
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    sections.push({
      heading: currentHeading,
      text: buffer.join("\n").trim()
    });
    buffer = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flush();
      currentHeading = (headingMatch[2] ?? "").trim() || "Section";
      continue;
    }
    buffer.push(line);
  }
  flush();

  const chunks: Chunk[] = [];
  for (const section of sections) {
    const paragraphs = (section.text ?? "")
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);

    for (const paragraph of paragraphs) {
      const text = paragraph.replace(/\s+/g, " ");
      const tokens = tokenize(text);
      if (!tokens.length) continue;

      chunks.push({
        id: `${file}-${section.heading}-${chunks.length}`,
        file,
        heading: section.heading,
        anchor: slugify(section.heading),
        text,
        tokens,
        length: tokens.length
      });
    }
  }

  return chunks;
}

function bm25Score(
  chunk: Chunk,
  queryTokens: string[],
  knowledgeBase: KnowledgeBase
): number {
  const k1 = 1.2;
  const b = 0.75;

  const avgDocLength = knowledgeBase.avgDocLength || 1;
  const docLength = chunk.length || 1;

  const termCounts = countTerms(chunk.tokens);
  let score = 0;

  for (const term of queryTokens) {
    const tf = termCounts.get(term) ?? 0;
    if (tf === 0) continue;

    const df = knowledgeBase.docFrequencies.get(term) ?? 0;
    const idf = Math.log(1 + (knowledgeBase.docCount - df + 0.5) / (df + 0.5));

    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + (b * docLength) / avgDocLength);

    score += idf * (numerator / denominator);
  }

  return score;
}

function countTerms(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens ?? []) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

function tokenize(text: string): string[] {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function slugify(text: string): string {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
