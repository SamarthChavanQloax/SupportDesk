import { ticketQuerySchema, ParsedTicketQuery } from '../validations/ticket.validation';

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

/**
 * Validates and sanitizes raw query parameters for ticket queries.
 * Enforces pagination limits, enums, sort allowlists, and whitespace trimming.
 */
export function validateAndSanitizeTicketQuery(
  rawQuery: Record<string, unknown>
): ValidationResult<ParsedTicketQuery> {
  const parseResult = ticketQuerySchema.safeParse(rawQuery);

  if (!parseResult.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parseResult.error.issues) {
      const key = issue.path.join('.') || 'root';
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    }
    return {
      isValid: false,
      errors,
    };
  }

  return {
    isValid: true,
    data: parseResult.data,
  };
}
