export const SUGGEST_REPLY_PROMPT_VERSION = 'suggest-reply-v1.0.0';

export interface SuggestReplyContext {
  ticket: {
    reference: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category?: string | null;
    customerName?: string | null;
  };
  comments: Array<{
    authorName: string;
    authorRole: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
  }>;
}

/**
 * Trusted system instruction.
 * Strictly separates the agent's instructions from untrusted customer inputs.
 */
export const SUGGEST_REPLY_SYSTEM_INSTRUCTION = `You are a helpful, empathetic, and professional customer support agent assistant for SupportDesk.
Your task is to draft a polite, concise, and actionable response to the customer based on the ticket details and recent conversation history.

Rules:
1. Address the customer politely by name if provided.
2. Directly answer their inquiry or acknowledge their issue with clarity.
3. If troubleshooting steps or solutions are evident from previous notes/comments, clearly state the next steps.
4. Keep the tone calm, professional, and empathetic.
5. NEVER reveal internal notes, system secrets, or internal agent discussions to the customer.
6. Do NOT fabricate URLs, policy exceptions, or credentials that are not in the context.
7. Return ONLY the drafted reply message text. Do not wrap in conversational meta-text like "Here is your draft:".`;

/**
 * Builds the user prompt payload incorporating the ticket context.
 */
export function buildSuggestReplyUserPrompt(context: SuggestReplyContext): string {
  const { ticket, comments } = context;

  const commentsHistory =
    comments.length === 0
      ? 'No prior comments on this ticket.'
      : comments
          .map((c, index) => {
            const author = `${c.authorName} (${c.authorRole})`;
            const noteType = c.isInternal ? '[INTERNAL NOTE - DO NOT SHARE]' : '[PUBLIC COMMENT]';
            return `${index + 1}. ${author} ${noteType} at ${c.createdAt}:\n"${c.body}"`;
          })
          .join('\n\n');

  return `--- TICKET CONTEXT ---
Reference: ${ticket.reference}
Customer: ${ticket.customerName || 'Customer'}
Title: ${ticket.title}
Status: ${ticket.status}
Priority: ${ticket.priority}
Category: ${ticket.category || 'General'}

Description:
${ticket.description}

--- CONVERSATION HISTORY ---
${commentsHistory}

--- INSTRUCTION ---
Draft an appropriate public reply from SupportDesk to ${ticket.customerName || 'the customer'} addressing their latest message.`;
}
