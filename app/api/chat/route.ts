import { NextResponse } from "next/server";

type ClientMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: Request) {
  const groqKey = process.env.GROQ_KEY;

  if (!groqKey) {
    return NextResponse.json(
      { error: "Server is missing GROQ_KEY." },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as {
      message?: string;
      messages?: ClientMessage[];
      systemPrompt?: string;
    };

    const message = body.message?.trim() ?? "";
    const systemPrompt = body.systemPrompt?.trim() || "You are a helpful assistant.";

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    const history = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (m): m is ClientMessage =>
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim().length > 0,
          )
          .slice(-10)
      : [];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: "Groq API request failed.", details: errorBody },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const assistantReply = data.choices?.[0]?.message?.content?.trim();

    if (!assistantReply) {
      return NextResponse.json(
        { error: "Groq API returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply: assistantReply });
  } catch {
    return NextResponse.json(
      { error: "Unexpected error while processing chat request." },
      { status: 500 },
    );
  }
}
