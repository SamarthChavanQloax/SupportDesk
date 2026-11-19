/**
 * Moderation Guardrail: Detects severe harassment, hate speech, self-harm,
 * and malicious exploitation attempts in support tickets before AI processing.
 */

export interface ModerationResult {
  isFlagged: boolean;
  categories: string[];
  reason?: string;
}

// Known toxic / malicious intent patterns
const HATE_SPEECH_REGEX = /\b(nigger|faggot|kill\s+all\s+(?:jews|muslims|blacks|whites)|terrorist\s+attack)\b/i;
const SELF_HARM_REGEX = /\b(suicide|kill\s+myself|end\s+my\s+life|hanging\s+myself)\b/i;
const EXPLOIT_REGEX = /\b(drop\s+(?:table|database)|rm\s+-rf\s+\/|exec\s+xp_cmdshell|<script>alert|<script>)/i;

export function checkModeration(text: string): ModerationResult {
  if (!text) {
    return { isFlagged: false, categories: [] };
  }

  const categories: string[] = [];

  if (SELF_HARM_REGEX.test(text)) {
    categories.push('self_harm');
  }

  if (HATE_SPEECH_REGEX.test(text)) {
    categories.push('hate_speech');
  }

  if (EXPLOIT_REGEX.test(text)) {
    categories.push('exploit_attempt');
  }

  if (categories.length > 0) {
    return {
      isFlagged: true,
      categories,
      reason: `Content flagged for safety violations: ${categories.join(', ')}. Please escalate manually.`,
    };
  }

  return {
    isFlagged: false,
    categories: [],
  };
}
