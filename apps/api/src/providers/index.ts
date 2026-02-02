import { MockProvider } from "./mock.js";
import type { LLMProvider } from "./types.js";

export function createProvider(): LLMProvider {
  // Force mock-only responses; OpenAI is intentionally disabled.
  return new MockProvider();
}
