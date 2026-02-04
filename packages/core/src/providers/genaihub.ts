import type { LLMProvider } from "./types";

type GenAiHubChatResponse = {
  choices?: { message?: { content?: string } }[];
};

export type GenAiHubConfig = {
  baseUrl: string;
  authUrl: string;
  clientId: string;
  clientSecret: string;
  resourceGroup: string;
  model?: string;
};

type TokenResponse = {
  access_token?: string;
};

export class GenAiHubProvider implements LLMProvider {
  private baseUrl: string;
  private authUrl: string;
  private clientId: string;
  private clientSecret: string;
  private resourceGroup: string;
  private model: string;
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(config: GenAiHubConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.authUrl = config.authUrl.replace(/\/$/, "");
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.resourceGroup = config.resourceGroup;
    this.model = config.model ?? "gpt-4o-mini";
  }

  async generate(prompt: string): Promise<string> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "AI-Resource-Group": this.resourceGroup
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

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const body = new URLSearchParams();
    body.set("grant_type", "client_credentials");
    body.set("client_id", this.clientId);
    body.set("client_secret", this.clientSecret);

    const response = await fetch(`${this.authUrl}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GenAI Hub auth error: ${response.status} ${text}`);
    }

    const data = (await response.json()) as TokenResponse;
    const token = data.access_token;
    if (!token) {
      throw new Error("GenAI Hub auth error: missing access_token");
    }
    this.cachedToken = token;
    this.tokenExpiresAt = now + 50 * 60 * 1000;
    return token;
  }
}
