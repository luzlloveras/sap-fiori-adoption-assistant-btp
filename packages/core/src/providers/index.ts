import { GenAiHubProvider, type GenAiHubConfig } from "./genaihub";
import { MockProvider } from "./mock";
import { OpenAIProvider } from "./openai";
import type { LLMProvider } from "./types";

export { GenAiHubProvider, MockProvider, OpenAIProvider };

export function createProvider(): LLMProvider {
  const providerName = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (providerName === "genaihub") {
    const baseUrl = process.env.AICORE_BASE_URL?.trim();
    const authUrl = process.env.AICORE_AUTH_URL?.trim();
    const clientId = process.env.AICORE_CLIENT_ID?.trim();
    const clientSecret = process.env.AICORE_CLIENT_SECRET?.trim();
    const resourceGroup = process.env.AICORE_RESOURCE_GROUP?.trim();
    const model = process.env.AICORE_MODEL?.trim() || "gpt-4o-mini";

    if (!baseUrl || !authUrl || !clientId || !clientSecret || !resourceGroup) {
      throw new Error(
        "GenAI Hub config missing: AICORE_BASE_URL, AICORE_AUTH_URL, AICORE_CLIENT_ID, AICORE_CLIENT_SECRET, AICORE_RESOURCE_GROUP are required."
      );
    }

    const config: GenAiHubConfig = {
      baseUrl,
      authUrl,
      clientId,
      clientSecret,
      resourceGroup,
      model
    };
    return new GenAiHubProvider(config);
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
