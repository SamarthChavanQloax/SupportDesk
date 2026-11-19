/**
 * PII Masking Guardrail: Detects and redacts sensitive personal & financial data
 * before sending content to external AI providers.
 */

export interface MaskResult {
  maskedText: string;
  detectedPii: Array<{
    type: string;
    count: number;
  }>;
  hasPii: boolean;
}

// Regex Patterns
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
const CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b/g;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
const API_KEY_REGEX = /\b(?:sk-[A-Za-z0-9-_]{20,}|AIza[A-Za-z0-9-_]{35}|Bearer\s+[A-Za-z0-9-_=.]{20,})\b/gi;
const PASSWORD_SECRET_REGEX = /\b(?:password|passwd|secret|api_key)\s*[:=]\s*[^\s,;]+/gi;

/**
 * Validates a credit card number using Luhn algorithm to avoid false positive number strings.
 */
export function isValidLuhn(numStr: string): boolean {
  const sanitized = numStr.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(sanitized)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

/**
 * Masks PII from input text.
 */
export function maskPii(text: string): MaskResult {
  if (!text) {
    return { maskedText: '', detectedPii: [], hasPii: false };
  }

  let result = text;
  const counts: Record<string, number> = {};

  const record = (type: string) => {
    counts[type] = (counts[type] || 0) + 1;
  };

  // 1. API Keys & Bearer Tokens
  result = result.replace(API_KEY_REGEX, (match) => {
    record('API_KEY');
    return '[REDACTED_API_KEY]';
  });

  // 2. Passwords / Secrets
  result = result.replace(PASSWORD_SECRET_REGEX, (match) => {
    record('SECRET');
    return '[REDACTED_SECRET]';
  });

  // 3. Credit Cards (with Luhn check to prevent replacing random digit strings)
  result = result.replace(CREDIT_CARD_REGEX, (match) => {
    if (isValidLuhn(match)) {
      record('CREDIT_CARD');
      return '[REDACTED_CREDIT_CARD]';
    }
    return match;
  });

  // 4. Social Security Numbers
  result = result.replace(SSN_REGEX, (match) => {
    record('SSN');
    return '[REDACTED_SSN]';
  });

  // 5. Emails
  result = result.replace(EMAIL_REGEX, (match) => {
    record('EMAIL');
    return '[REDACTED_EMAIL]';
  });

  // 6. Phone Numbers
  result = result.replace(PHONE_REGEX, (match) => {
    // Basic sanity check: must contain at least 10 digits
    const digits = match.replace(/\D/g, '');
    if (digits.length >= 10 && digits.length <= 15) {
      record('PHONE');
      return '[REDACTED_PHONE]';
    }
    return match;
  });

  const detectedPii = Object.entries(counts).map(([type, count]) => ({
    type,
    count,
  }));

  return {
    maskedText: result,
    detectedPii,
    hasPii: detectedPii.length > 0,
  };
}

