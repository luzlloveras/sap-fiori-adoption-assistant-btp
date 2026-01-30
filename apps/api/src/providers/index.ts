import { MockProvider } from "./mock.js";
import { OpenAIProvider } from "./openai.js";
import type { LLMProvider } from "./types.js";

export function createProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    return new OpenAIProvider(apiKey, process.env.OPENAI_MODEL);
  }
  return new MockProvider();
}
