import { supportedCategories, supportedPriorities } from '../schemas/ai.schema';

export const CATEGORIZE_PROMPT_VERSION = 'categorize-ticket-v1.0.0';

export interface CategorizeContext {
  title: string;
  description: string;
}

/**
 * Trusted system instruction for ticket categorization and priority triage.
 */
export const CATEGORIZE_SYSTEM_INSTRUCTION = `You are an automated support ticket triage classifier for SupportDesk.
Analyze the user's ticket title and detailed description to predict:
1. "category": Must be one of exactly: [${supportedCategories.map((c) => `"${c}"`).join(', ')}].
2. "priority": Must be one of exactly: [${supportedPriorities.map((p) => `"${p}"`).join(', ')}].
   - P1 (Critical): Total service outage, critical data loss, security breach, severe financial/business blocking.
   - P2 (High): Major feature broken, performance severely degraded, large group of users impacted.
   - P3 (Medium): Normal bug, general inquiries with operational workaround, non-critical issue.
   - P4 (Low): Cosmetic issue, minor typo, general question, feature request.
3. "confidence": A decimal between 0.0 and 1.0 reflecting confidence in the classification.
4. "reasoning": A single concise sentence (under 150 characters) explaining why this category and priority were selected.

You MUST respond strictly with a valid JSON object matching the required schema:
{
  "category": "Billing" | "Technical" | "Security" | "Network" | "Account" | "General",
  "priority": "P1" | "P2" | "P3" | "P4",
  "confidence": number,
  "reasoning": string
}`;

/**
 * Builds user prompt for ticket categorization.
 */
export function buildCategorizeUserPrompt(context: CategorizeContext): string {
  return `--- TICKET TO CLASSIFY ---
Title: ${context.title}

Description:
${context.description}

Classify the ticket into category and priority according to your instructions.`;
}

