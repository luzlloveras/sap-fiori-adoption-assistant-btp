import { NextResponse } from "next/server";

type AskRequest = {
  question?: string;
  language?: "es" | "en" | string;
};

export async function POST(request: Request) {
  // Uses API_URL if provided; falls back to local dev API on 8080.
  const apiBaseUrl = process.env.API_URL?.trim() || "http://localhost:8080";

  let body: AskRequest | undefined;
  try {
    body = (await request.json()) as AskRequest;
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid JSON body",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }

  const targetUrl = `${apiBaseUrl.replace(/\/$/, "")}/ask`;

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: body?.question,
        language: body?.language,
      }),
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to reach backend",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }
}
