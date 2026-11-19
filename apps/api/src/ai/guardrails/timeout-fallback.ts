/**
 * Timeout and Safe Fallback Guardrail.
 * Ensures AI provider calls abort after a strict deadline and return a standardized fallback:
 * "AI unavailable — reply manually."
 */

export const AI_REQUEST_TIMEOUT_MS = 25000; // 25 seconds strict timeout for external provider calls
export const SAFE_AI_FALLBACK_MESSAGE = 'AI unavailable — reply manually.';

export class AiTimeoutError extends Error {
  constructor(message = 'AI provider request timed out') {
    super(message);
    this.name = 'AiTimeoutError';
  }
}

/**
 * Wraps an async AI operation with a strict timeout.
 */
export async function withTimeout<T>(
  promiseFn: (signal: AbortSignal) => Promise<T>,
  timeoutMs = AI_REQUEST_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const result = await promiseFn(controller.signal);
    clearTimeout(timeoutId);
    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError' || controller.signal.aborted) {
      throw new AiTimeoutError(`AI operation timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}
