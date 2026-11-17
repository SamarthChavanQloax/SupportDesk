import OpenAI from 'openai';
import { env } from '../config/env';

let customClient: OpenAI | null = null;

/**
 * Injects a mock or custom OpenAI client for testing.
 */
export function setOpenAiClient(client: OpenAI | null): void {
  customClient = client;
}

/**
 * Checks whether a valid OpenAI client or API key is configured.
 */
export function isOpenAiConfigured(): boolean {
  if (customClient) {
    return true;
  }
  const openAiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  const hasOpenAi = Boolean(
    openAiKey &&
      openAiKey.trim().length > 0 &&
      openAiKey !== 'mock' &&
      openAiKey !== 'demo' &&
      openAiKey !== 'your-openai-api-key-here'
  );

  const hasGemini = Boolean(
    geminiKey &&
      geminiKey.trim().length > 0 &&
      geminiKey !== 'mock' &&
      geminiKey !== 'demo'
  );

  return hasOpenAi || hasGemini;
}

/**
 * Returns the appropriate model name based on configured keys.
 */
export function getActiveAiModel(): string {
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const openAiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (geminiKey || (openAiKey && openAiKey.startsWith('AIza'))) {
    return env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  }
  return env.OPENAI_MODEL || 'gpt-4o-mini';
}

/**
 * Returns the singleton AI client (OpenAI or Gemini via official OpenAI-compatible gateway).
 * Strictly backend-only; fails fast with clear guidance if API key is unconfigured.
 */
export function getOpenAiClient(): OpenAI {
  if (customClient) {
    return customClient;
  }

  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const openAiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  // 1. Google Gemini Key (starts with AIza... or set via GEMINI_API_KEY)
  if (geminiKey || (openAiKey && openAiKey.startsWith('AIza'))) {
    const key = geminiKey || openAiKey!;
    customClient = new OpenAI({
      apiKey: key,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });
    return customClient;
  }

  // 2. OpenAI Key (starts with sk-...)
  if (openAiKey && openAiKey.startsWith('sk-')) {
    customClient = new OpenAI({
      apiKey: openAiKey,
    });
    return customClient;
  }

  // 3. Fallback to generic openAiKey if provided
  if (openAiKey) {
    customClient = new OpenAI({
      apiKey: openAiKey,
    });
    return customClient;
  }

  throw new Error(
    'Neither OPENAI_API_KEY nor GEMINI_API_KEY is configured in backend environment. Set GEMINI_API_KEY or OPENAI_API_KEY in .env.'
  );
}

