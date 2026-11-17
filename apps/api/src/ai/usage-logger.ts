import { CostBreakdown } from './cost';

export interface AiUsageLogEntry {
  feature: 'suggest_reply' | 'categorize_ticket';
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: CostBreakdown;
  durationMs: number;
  ticketId?: number;
  success: boolean;
  errorMessage?: string;
}

/**
 * Logs AI token usage and cost per call with structured output.
 * Never logs raw API keys or customer confidential payload bodies.
 */
export function logAiUsage(entry: AiUsageLogEntry): void {
  const timestamp = new Date().toISOString();
  const costFormatted = `$${entry.cost.totalCost.toFixed(6)}`;

  const logMessage =
    `[AI_USAGE_LOG] timestamp=${timestamp} feature=${entry.feature} model=${entry.model} ` +
    `ticketId=${entry.ticketId ?? 'N/A'} promptTokens=${entry.promptTokens} ` +
    `completionTokens=${entry.completionTokens} totalTokens=${entry.totalTokens} ` +
    `estimatedCost=${costFormatted} durationMs=${entry.durationMs} success=${entry.success}` +
    (entry.errorMessage ? ` error="${entry.errorMessage}"` : '');

  if (entry.success) {
    console.info(logMessage);
  } else {
    console.error(logMessage);
  }
}
