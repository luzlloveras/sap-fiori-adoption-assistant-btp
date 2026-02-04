import type { LLMProvider } from "./types";

type GenAiHubChatResponse = {
  choices?: { message?: { content?: string } }[];
};

export class GenAiHubProvider implements LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl: string, model: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.model = model;
  }

  async generate(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You answer strictly from provided sources and return JSON only."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GenAI Hub error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as GenAiHubChatResponse;
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  }
}
