import { GoogleGenerativeAI } from "@google/generative-ai";

/** Preferred default — 2.5 models are blocked for many newer API keys. */
export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

/** Tried in order when a model is blocked/unavailable for the API key. */
const FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
] as const;

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
}

function modelCandidates() {
  const preferred = getGeminiModel();
  const rest = FALLBACK_MODELS.filter((m) => m !== preferred);
  return [preferred, ...rest];
}

function isModelUnavailableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("no longer available") ||
    message.includes("not found") ||
    message.includes("404") ||
    message.includes("NOT_FOUND")
  );
}

function isQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("Too Many Requests") ||
    message.includes("exceeded your current quota")
  );
}

function hasGoogleSearch(options: ModelOptions) {
  return Boolean(
    options.tools?.some(
      (tool) =>
        tool &&
        typeof tool === "object" &&
        ("googleSearch" in tool || "google_search" in tool),
    ),
  );
}

export function getGeminiClient() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(key);
}

type ModelOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools?: any[];
  systemInstruction?: string;
};

/**
 * Run a Gemini call, falling back across models when Google blocks one for new keys.
 * If Google Search grounding hits quota (common on free tier), retries without Search.
 */
export async function withGeminiModel<T>(
  options: ModelOptions,
  run: (
    model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  ) => Promise<T>,
): Promise<T> {
  const client = getGeminiClient();
  const candidates = modelCandidates();
  let lastError: unknown;
  let skipSearch = false;

  for (let i = 0; i < candidates.length; i++) {
    const modelName = candidates[i];
    const useOptions =
      skipSearch || !hasGoogleSearch(options)
        ? { ...options, tools: undefined }
        : options;

    try {
      const model = client.getGenerativeModel({
        model: modelName,
        ...useOptions,
      });
      return await run(model);
    } catch (error) {
      lastError = error;

      if (!skipSearch && hasGoogleSearch(options) && isQuotaError(error)) {
        console.warn(
          `[gemini] Google Search grounding hit quota on ${modelName}; retrying without Search.`,
        );
        skipSearch = true;
        i -= 1; // retry same model without Search
        continue;
      }

      if (!isModelUnavailableError(error)) {
        throw error;
      }
      console.warn(
        `[gemini] Model ${modelName} unavailable for this key; trying next fallback.`,
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No available Gemini model for this API key");
}
