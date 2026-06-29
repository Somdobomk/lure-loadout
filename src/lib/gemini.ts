/**
 * Gemini API helper with primary/fallback model support.
 *
 * Primary:  gemini-3.5-flash  — used for Daily Picks and Quick Card (deeper reasoning)
 * Fallback: gemini-2.5-flash-lite-preview-06-17 — used when primary is unavailable, or for
 *           lightweight tasks (inventory summaries, pairing suggestions, etc.)
 */

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export const MODELS = {
  primary:  "gemini-3.5-flash",
  fallback: "gemini-2.5-flash-lite-preview-06-17",
} as const;

export type GeminiModel = (typeof MODELS)[keyof typeof MODELS];

interface GeminiOptions {
  maxOutputTokens?: number;
  temperature?: number;
}

interface GeminiResult {
  text: string;
  model: GeminiModel;
  usedFallback: boolean;
}

/**
 * Call Gemini with automatic fallback.
 * Tries the primary model first. On 503 (overloaded) or 404 (unavailable),
 * retries once with the fallback model before giving up.
 */
export async function callGemini(
  prompt: string,
  model: GeminiModel = MODELS.primary,
  options: GeminiOptions = {},
  _isFallbackAttempt = false
): Promise<GeminiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new GeminiError("GEMINI_API_KEY is not set.", 500);

  const { maxOutputTokens = 1024, temperature = 0.4 } = options;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens, temperature },
      }),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new GeminiError(`Network error reaching Gemini: ${msg}`, 503);
  }

  // On 503 (overloaded) or 404 (model unavailable), try fallback
  if ((res.status === 503 || res.status === 404) && !_isFallbackAttempt) {
    console.warn(`Gemini ${model} returned ${res.status} — retrying with fallback ${MODELS.fallback}`);
    return callGemini(prompt, MODELS.fallback, options, true);
  }

  if (!res.ok) {
    const body = await res.text();
    console.error(`Gemini ${model} error ${res.status}:`, body.slice(0, 400));
    // On any other error from the fallback, throw a clean error
    throw new GeminiError(`Gemini error ${res.status}`, res.status);
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new GeminiError("Gemini returned a non-JSON response.", 500);
  }

  const text =
    (data?.candidates as { content?: { parts?: { text?: string }[] } }[])?.[0]
      ?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    console.error(`Gemini ${model} returned no text. Response:`, JSON.stringify(data).slice(0, 400));
    throw new GeminiError("Gemini returned an empty response.", 500);
  }

  return { text, model, usedFallback: model === MODELS.fallback };
}

/**
 * Structured error with HTTP status so API routes can respond correctly.
 */
export class GeminiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "GeminiError";
  }
}

/**
 * User-friendly error messages by HTTP status.
 */
export function geminiUserMessage(status: number): string {
  switch (status) {
    case 503:
      return "The AI fishing assistant is temporarily busy. Please try again in a moment.";
    case 429:
      return "Too many requests — please wait a few seconds and try again.";
    case 401:
    case 403:
      return "AI service configuration error. Please contact support.";
    case 404:
      return "AI model unavailable. Please try again shortly.";
    default:
      return "The AI fishing assistant encountered an error. Please try again.";
  }
}
