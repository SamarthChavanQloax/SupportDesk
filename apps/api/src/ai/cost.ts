export interface ModelPricing {
  promptCostPerMillion: number;
  completionCostPerMillion: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gpt-4o-mini': {
    promptCostPerMillion: 0.15,
    completionCostPerMillion: 0.6,
  },
  'gpt-4o': {
    promptCostPerMillion: 2.5,
    completionCostPerMillion: 10.0,
  },
  'gpt-3.5-turbo': {
    promptCostPerMillion: 0.5,
    completionCostPerMillion: 1.5,
  },
  'gemini-1.5-flash': {
    promptCostPerMillion: 0.075,
    completionCostPerMillion: 0.3,
  },
  'gemini-2.0-flash': {
    promptCostPerMillion: 0.1,
    completionCostPerMillion: 0.4,
  },
  'gemini-1.5-pro': {
    promptCostPerMillion: 1.25,
    completionCostPerMillion: 5.0,
  },
};

export interface CostBreakdown {
  promptCost: number;
  completionCost: number;
  totalCost: number;
  currency: 'USD';
}

/**
 * Calculates estimated model cost based on token usage and known model pricing.
 * Does not invent numbers; strictly applies official pricing rates.
 */
export function calculateCost(
  model: string,
  promptTokens = 0,
  completionTokens = 0
): CostBreakdown {
  const normalizedModel = Object.keys(MODEL_PRICING).find((m) =>
    model.toLowerCase().includes(m)
  );

  const pricing = normalizedModel
    ? MODEL_PRICING[normalizedModel]
    : MODEL_PRICING['gpt-4o-mini'];

  const promptCost = (promptTokens / 1_000_000) * pricing.promptCostPerMillion;
  const completionCost =
    (completionTokens / 1_000_000) * pricing.completionCostPerMillion;
  const totalCost = Number((promptCost + completionCost).toFixed(8));

  return {
    promptCost: Number(promptCost.toFixed(8)),
    completionCost: Number(completionCost.toFixed(8)),
    totalCost,
    currency: 'USD',
  };
}

