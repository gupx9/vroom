type GeminiContentPart = { text: string };

export function getGeminiApiKey() {
  return (
    process.env.MARKETASSISTANT_GEMINI_KEY?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GEMINI_API_KEY?.trim() ||
    process.env.GEMINI_KEY?.trim() ||
    ''
  );
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash';
}

function extractTextFromResponse(data: unknown): string {
  if (!data || typeof data !== 'object') return '';

  const candidates = (data as { candidates?: Array<{ content?: { parts?: GeminiContentPart[] } }> }).candidates;
  const parts = candidates?.[0]?.content?.parts;
  if (!parts?.length) return '';

  return parts.map((part) => part.text || '').join('').trim();
}

export function parseJsonFromModelText(text: string) {
  const trimmed = text.trim();

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1]?.trim() || trimmed;

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1)) as unknown;
    }

    throw new Error('Gemini response was not valid JSON');
  }
}

export async function generateGeminiJson(prompt: string) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const model = getGeminiModel();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as unknown;
  const text = extractTextFromResponse(data);
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return parseJsonFromModelText(text);
}

export async function generateGroqJson(prompt: string) {
  const apiKey = process.env.GROQ_KEY?.trim();
  if (!apiKey) {
    throw new Error('GROQ API key is not configured');
  }

  const model = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GROQ request failed (${response.status}): ${body.slice(0, 300)}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('GROQ returned an empty response');
  }

  return parseJsonFromModelText(text);
}
