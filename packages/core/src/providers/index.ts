import { MockProvider } from "./mock";
import { OpenAIProvider } from "./openai";
import type { LLMProvider } from "./types";

export { MockProvider, OpenAIProvider };

export function createProvider(): LLMProvider {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    return new OpenAIProvider(apiKey, process.env.OPENAI_MODEL);
  }
  return new MockProvider();
}
