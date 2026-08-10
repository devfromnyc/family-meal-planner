import { GoogleGenerativeAI } from "@google/generative-ai";

export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

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

export async function withGeminiModel<T>(
  options: ModelOptions,
  run: (
    model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  ) => Promise<T>,
): Promise<T> {
  const client = getGeminiClient();
  const candidates = modelCandidates();
  let lastError: unknown;

  for (const modelName of candidates) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        ...options,
      });
      return await run(model);
    } catch (error) {
      lastError = error;
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
