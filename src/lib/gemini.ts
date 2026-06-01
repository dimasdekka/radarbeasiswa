import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type ModelParams,
  type GenerateContentRequest,
} from "@google/generative-ai";

/**
 * Resilient Gemini client.
 *
 * The free tier of the Gemini API is rate-limited (~5–15 RPM depending on model)
 * and regularly returns `429 RESOURCE_EXHAUSTED`. Previously every AI call site
 * created its own client and called `generateContent` once — a single 429 would
 * throw and, in the scraping pipeline, permanently mark a source as FAILED.
 *
 * This module centralises all text generation behind a single helper that:
 *  1. Retries transient errors (429 / 503 / 500) with exponential backoff + jitter.
 *  2. Honours the `Retry-After` / `retryDelay` hint the API returns on 429.
 *  3. Falls back across a chain of models so a quota hit on the primary model
 *     can still succeed on a lighter model with a separate quota bucket.
 */

let _genAI: GoogleGenerativeAI | null = null;
function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error("GOOGLE_AI_API_KEY is not set");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

/**
 * Ordered list of models to try. The primary is the highest quality free model;
 * the fallbacks have independent quota pools, so when the primary is throttled
 * we can still get an answer instead of failing the whole job.
 * Override via GEMINI_MODEL_CHAIN="model-a,model-b".
 */
const DEFAULT_MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
];

export function getModelChain(): string[] {
  const env = process.env.GEMINI_MODEL_CHAIN;
  if (env) {
    const chain = env.split(",").map((m) => m.trim()).filter(Boolean);
    if (chain.length > 0) return chain;
  }
  return DEFAULT_MODEL_CHAIN;
}

export class GeminiRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiRateLimitError";
  }
}

function isRateLimit(err: unknown): boolean {
  const msg = (err as Error)?.message ?? String(err);
  return /\b429\b|RESOURCE_EXHAUSTED|quota|rate limit|too many requests/i.test(msg);
}

function isTransient(err: unknown): boolean {
  if (isRateLimit(err)) return true;
  const msg = (err as Error)?.message ?? String(err);
  return /\b(500|502|503|504)\b|UNAVAILABLE|INTERNAL|overloaded|deadline|ECONNRESET|ETIMEDOUT|fetch failed/i.test(
    msg
  );
}

/**
 * Try to pull a concrete retry delay (seconds) out of a Gemini error.
 * The SDK surfaces the structured error as JSON inside the message string.
 */
function parseRetryDelaySec(err: unknown): number | null {
  const msg = (err as Error)?.message ?? "";
  // e.g. "retryDelay":"34s"
  const m = msg.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
  if (m) return parseFloat(m[1]);
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface GenerateOptions {
  /** Optional system prompt applied to every model in the chain. */
  systemInstruction?: string;
  /** Pass-through generation config (e.g. responseMimeType: "application/json"). */
  generationConfig?: ModelParams["generationConfig"];
  /** Max attempts per model before moving to the next model in the chain. */
  maxRetriesPerModel?: number;
  /** Base backoff in ms (doubles each attempt). */
  baseDelayMs?: number;
  /** Cap on a single backoff wait. */
  maxDelayMs?: number;
  /** Override the model chain for this call. */
  models?: string[];
}

/**
 * Generate text content with retries + model fallback.
 * `request` accepts anything the SDK's generateContent accepts (string prompt,
 * parts array, or a full request object — useful for multimodal/file inputs).
 *
 * Throws GeminiRateLimitError if every model is exhausted by rate limits, or the
 * underlying error if it was a hard (non-transient) failure.
 */
export async function generateText(
  request: string | GenerateContentRequest | Array<string | object>,
  opts: GenerateOptions = {}
): Promise<string> {
  const {
    systemInstruction,
    generationConfig,
    maxRetriesPerModel = 4,
    baseDelayMs = 2000,
    maxDelayMs = 60000,
    models = getModelChain(),
  } = opts;

  let lastErr: unknown;
  let everyFailureWasRateLimit = true;

  for (const modelName of models) {
    const model: GenerativeModel = getGenAI().getGenerativeModel({
      model: modelName,
      ...(systemInstruction ? { systemInstruction } : {}),
      ...(generationConfig ? { generationConfig } : {}),
    });

    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        // The SDK overloads generateContent for string | array | request.
        const result = await model.generateContent(
          request as GenerateContentRequest
        );
        return result.response.text();
      } catch (err) {
        lastErr = err;

        if (!isTransient(err)) {
          // Hard error (bad request, auth, safety block) — don't waste retries.
          everyFailureWasRateLimit = false;
          throw err;
        }

        if (!isRateLimit(err)) everyFailureWasRateLimit = false;

        const isLastAttempt = attempt === maxRetriesPerModel;
        if (isLastAttempt) break; // move to next model in the chain

        const hinted = parseRetryDelaySec(err);
        const backoff = Math.min(
          maxDelayMs,
          hinted != null
            ? hinted * 1000
            : baseDelayMs * 2 ** (attempt - 1)
        );
        const jitter = Math.floor(Math.random() * 500);
        await sleep(backoff + jitter);
      }
    }
    // Exhausted this model; loop tries the next fallback model.
  }

  if (everyFailureWasRateLimit) {
    throw new GeminiRateLimitError(
      `Semua model Gemini kena rate limit / quota. Coba lagi nanti. (${(lastErr as Error)?.message ?? "unknown"})`
    );
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

/**
 * Convenience wrapper: generate text expected to be JSON, strip code fences,
 * and parse. Sets responseMimeType to application/json by default.
 */
export async function generateJson<T = unknown>(
  request: string | GenerateContentRequest | Array<string | object>,
  opts: GenerateOptions = {}
): Promise<T> {
  const text = await generateText(request, {
    ...opts,
    generationConfig: { responseMimeType: "application/json", ...opts.generationConfig },
  });
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch (e) {
    throw new Error(
      `Gagal parse output Gemini sebagai JSON: ${(e as Error).message}\nRaw: ${cleaned.slice(0, 500)}`
    );
  }
}
