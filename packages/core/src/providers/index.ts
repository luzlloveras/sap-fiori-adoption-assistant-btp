import { GenAiHubProvider } from "./genaihub";
import { MockProvider } from "./mock";
import { OpenAIProvider } from "./openai";
import type { LLMProvider } from "./types";

export { GenAiHubProvider, MockProvider, OpenAIProvider };

export function createProvider(): LLMProvider {
  const providerName = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (providerName === "genaihub") {
    const apiKey = process.env.GENAIHUB_API_KEY?.trim();
    const baseUrl = process.env.GENAIHUB_API_URL?.trim();
    const model = process.env.GENAIHUB_MODEL?.trim() || "gpt-4o-mini";
    if (apiKey && baseUrl) {
      return new GenAiHubProvider(apiKey, baseUrl, model);
    }
    return new MockProvider();
  }
  if (providerName === "openai") {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (apiKey) {
      return new OpenAIProvider(apiKey, process.env.OPENAI_MODEL);
    }
    return new MockProvider();
  }
  if (providerName === "mock") {
    return new MockProvider();
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    return new OpenAIProvider(apiKey, process.env.OPENAI_MODEL);
  }
  return new MockProvider();
}
