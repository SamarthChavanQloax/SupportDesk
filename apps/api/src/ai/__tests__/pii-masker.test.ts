import { maskPii, isValidLuhn } from '../guardrails/pii-masker';

describe('PII Masker Guardrail', () => {
  it('masks valid email addresses', () => {
    const input = 'Please contact customer at alice.smith@example.com or bob.corporate@company.org regarding this issue.';
    const result = maskPii(input);
    expect(result.maskedText).toContain('[REDACTED_EMAIL]');
    expect(result.maskedText).not.toContain('alice.smith@example.com');
    expect(result.maskedText).not.toContain('bob.corporate@company.org');
    expect(result.hasPii).toBe(true);
    expect(result.detectedPii).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'EMAIL', count: 2 })])
    );
  });

  it('masks valid Social Security Numbers (SSN)', () => {
    const input = 'My identity verification SSN is 000-12-3456 and my spouse is 123-45-6789.';
    const result = maskPii(input);
    expect(result.maskedText).toBe('My identity verification SSN is [REDACTED_SSN] and my spouse is [REDACTED_SSN].');
    expect(result.hasPii).toBe(true);
  });

  it('masks valid Luhn credit cards and keeps random non-card numbers intact', () => {
    // Valid sample Luhn Visa card: 4111 1111 1111 1111
    const validCard = 'Customer card is 4111-1111-1111-1111 for billing checkout.';
    const resultValid = maskPii(validCard);
    expect(resultValid.maskedText).toContain('[REDACTED_CREDIT_CARD]');
    expect(resultValid.maskedText).not.toContain('4111-1111-1111-1111');

    // Invalid Luhn number (e.g. tracking number or order ID)
    const invalidCard = 'Tracking order reference is 1234-5678-9012-3456 in system.';
    const resultInvalid = maskPii(invalidCard);
    expect(resultInvalid.maskedText).toContain('1234-5678-9012-3456');
  });

  it('masks phone numbers in diverse international and standard formats', () => {
    const input = 'Call me at +1 (555) 234-5678 or direct line 555-987-6543 immediately.';
    const result = maskPii(input);
    expect(result.maskedText).toContain('[REDACTED_PHONE]');
    expect(result.maskedText).not.toContain('555-987-6543');
  });

  it('masks API keys and Bearer tokens', () => {
    const input = 'Credentials leaked: sk-proj-1234567890abcdef12345678 and Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
    const result = maskPii(input);
    expect(result.maskedText).toContain('[REDACTED_API_KEY]');
    expect(result.maskedText).not.toContain('sk-proj-');
    expect(result.hasPii).toBe(true);
  });

  it('masks cleartext passwords and secrets in payload', () => {
    const input = 'Login failing with password: SuperSecretP@ssw0rd! and secret=xyz987654321';
    const result = maskPii(input);
    expect(result.maskedText).toContain('[REDACTED_SECRET]');
    expect(result.maskedText).not.toContain('SuperSecretP@ssw0rd!');
  });

  it('returns clean text unchanged when no PII is present', () => {
    const input = 'Cannot connect to database because port 5433 has connection refused.';
    const result = maskPii(input);
    expect(result.maskedText).toBe(input);
    expect(result.hasPii).toBe(false);
    expect(result.detectedPii).toHaveLength(0);
  });
});

