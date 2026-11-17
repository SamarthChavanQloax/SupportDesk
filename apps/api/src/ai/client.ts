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
 * Returns the singleton OpenAI client.
 * Strictly backend-only; fails fast with clear guidance if API key is unconfigured.
 */
export function getOpenAiClient(): OpenAI {
  if (customClient) {
    return customClient;
  }

  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is not configured in backend environment. Set OPENAI_API_KEY in .env.'
    );
  }

  customClient = new OpenAI({
    apiKey,
  });

  return customClient;
}
