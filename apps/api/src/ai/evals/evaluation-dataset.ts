import { SupportedCategory, SupportedPriority } from '../schemas/ai.schema';

export interface EvalTicket {
  id: number;
  reference: string;
  title: string;
  description: string;
  expectedCategory: SupportedCategory;
  expectedPriority: SupportedPriority;
  domain: string;
}

/**
 * 20 Ground-Truth Labelled Evaluation Tickets for Ticket Categorisation & Triage Benchmark.
 * Curated to span all 6 supported categories and priorities P1-P4.
 */
export const EVALUATION_TICKETS: EvalTicket[] = [
  // --- Billing (3) ---
  {
    id: 1,
    reference: 'EVAL-TCK-001',
    title: 'Duplicate charge on November subscription renewal',
    description: 'I was charged twice on my corporate Visa card for invoice #INV-2026-9021. Please issue an immediate refund for the $499 duplicate transaction.',
    expectedCategory: 'Billing',
    expectedPriority: 'P2',
    domain: 'Billing / Invoicing',
  },
  {
    id: 2,
    reference: 'EVAL-TCK-002',
    title: 'Credit card declined with payment gateway code 4002',
    description: 'During checkout for annual enterprise license renewal, Stripe returned payment declined with error code 4002. Card has sufficient funds.',
    expectedCategory: 'Billing',
    expectedPriority: 'P2',
    domain: 'Payment Gateway',
  },
  {
    id: 3,
    reference: 'EVAL-TCK-003',
    title: 'Request for official VAT receipt and tax invoice for FY2026',
    description: 'Our accounting department requires itemized tax invoices with VAT registration numbers for the Q3 billing cycle for audit compliance.',
    expectedCategory: 'Billing',
    expectedPriority: 'P3',
    domain: 'Tax & Receipts',
  },

  // --- Technical (4) ---
  {
    id: 4,
    reference: 'EVAL-TCK-004',
    title: 'NullPointerException in checkout webhook processor',
    description: 'Production webhook processor crashed with java.lang.NullPointerException at com.supportdesk.order.WebhookHandler.line42. 120 orders queued.',
    expectedCategory: 'Technical',
    expectedPriority: 'P1',
    domain: 'Backend Code Exception',
  },
  {
    id: 5,
    reference: 'EVAL-TCK-005',
    title: 'Database migration script failed with unique constraint violation',
    description: 'Prisma migrate deploy threw error: Unique constraint failed on the fields: (`reference`). Schema upgrade is currently blocked on staging.',
    expectedCategory: 'Technical',
    expectedPriority: 'P2',
    domain: 'Database / Schema',
  },
  {
    id: 6,
    reference: 'EVAL-TCK-006',
    title: 'Mobile application crashes immediately on Android 15 launch',
    description: 'Users running Android 15 report immediate app crash on cold start. Stack trace shows ClassNotFoundException in analytics initialization.',
    expectedCategory: 'Technical',
    expectedPriority: 'P2',
    domain: 'Mobile Runtime',
  },
  {
    id: 7,
    reference: 'EVAL-TCK-007',
    title: 'Worker node memory leak causing OOM kill every 6 hours',
    description: 'Node.js background queue workers steadily consume heap memory until Linux OOM killer terminates PID. Node heap snapshot attached.',
    expectedCategory: 'Technical',
    expectedPriority: 'P2',
    domain: 'Memory & Performance',
  },

  // --- Security (3) ---
  {
    id: 8,
    reference: 'EVAL-TCK-008',
    title: 'Potential credential stuffing attack on customer login portal',
    description: 'SIEM telemetry detected 45,000 failed authentication requests per minute originating from Tor exit nodes targeting customer /auth/login.',
    expectedCategory: 'Security',
    expectedPriority: 'P1',
    domain: 'Authentication Abuse',
  },
  {
    id: 9,
    reference: 'EVAL-TCK-009',
    title: 'Unencrypted production database credentials leaked in public commit',
    description: 'Secret scanner flagged DATABASE_URL containing production postgres passwords committed to public GitHub repository in commit sha a7f3b9c.',
    expectedCategory: 'Security',
    expectedPriority: 'P1',
    domain: 'Secret Exposure',
  },
  {
    id: 10,
    reference: 'EVAL-TCK-010',
    title: 'Suspicious spear phishing email impersonating CEO wire instructions',
    description: 'Multiple finance employees received emails from ceo-supportdesk-internal@mail-relay.net instructing urgent wire transfers to an offshore bank.',
    expectedCategory: 'Security',
    expectedPriority: 'P1',
    domain: 'Phishing Threat',
  },

  // --- Network (3) ---
  {
    id: 11,
    reference: 'EVAL-TCK-011',
    title: '504 Gateway Timeout across entire US-East edge cluster',
    description: 'Edge proxies are returning HTTP 504 Gateway Timeout on 95% of incoming HTTPS traffic. Upstream origin servers appear healthy but unreachable.',
    expectedCategory: 'Network',
    expectedPriority: 'P1',
    domain: 'Edge Outage',
  },
  {
    id: 12,
    reference: 'EVAL-TCK-012',
    title: 'High packet loss and intermittent IPSec VPN tunnel disconnection',
    description: 'Corporate headquarters reports 28% packet loss across the primary IPSec VPN gateway. Remote office VoIP calls are dropping constantly.',
    expectedCategory: 'Network',
    expectedPriority: 'P2',
    domain: 'VPN & Routing',
  },
  {
    id: 13,
    reference: 'EVAL-TCK-013',
    title: 'DNS resolution failure for custom customer portal subdomains',
    description: 'Authoritative DNS nameservers are failing to resolve *.portal.supportdesk.com from European ISPs, returning SERVFAIL responses.',
    expectedCategory: 'Network',
    expectedPriority: 'P2',
    domain: 'DNS Infrastructure',
  },

  // --- Account (3) ---
  {
    id: 14,
    reference: 'EVAL-TCK-014',
    title: 'Admin user locked out after exceeding failed password attempts',
    description: 'Lead engineer account is locked out with status 429 after mistyping password on new laptop. Need emergency password reset link.',
    expectedCategory: 'Account',
    expectedPriority: 'P2',
    domain: 'Account Lockout',
  },
  {
    id: 15,
    reference: 'EVAL-TCK-015',
    title: 'Lost two-factor authentication device, need 2FA reset',
    description: 'Employee dropped phone in water and lost Google Authenticator seeds. Cannot access company dashboard; backup codes exhausted.',
    expectedCategory: 'Account',
    expectedPriority: 'P2',
    domain: '2FA Recovery',
  },
  {
    id: 16,
    reference: 'EVAL-TCK-016',
    title: 'SAML SSO assertion failed for Google Workspace directory integration',
    description: 'Users attempting SSO login are redirected to error page: SAML Response invalid signature. Certificate was renewed this morning.',
    expectedCategory: 'Account',
    expectedPriority: 'P2',
    domain: 'SSO / Identity',
  },

  // --- General (4) ---
  {
    id: 17,
    reference: 'EVAL-TCK-017',
    title: 'Where can I find API documentation for Webhooks v2?',
    description: 'We are planning an integration with our CRM. Could you please share the documentation URL and sample payloads for Webhooks v2?',
    expectedCategory: 'General',
    expectedPriority: 'P4',
    domain: 'Documentation',
  },
  {
    id: 18,
    reference: 'EVAL-TCK-018',
    title: 'Inquiry regarding Enterprise SLA coverage terms and support hours',
    description: 'We are reviewing contracts for renewal. Does our Enterprise agreement include 24/7 phone support and guaranteed 1-hour P1 response times?',
    expectedCategory: 'General',
    expectedPriority: 'P4',
    domain: 'Service Agreements',
  },
  {
    id: 19,
    reference: 'EVAL-TCK-019',
    title: 'Feedback and feature request for dark mode contrast improvements',
    description: 'Great job on the new interface! Just wanted to share some feedback: the muted gray text in dark mode is a bit hard to read in low light.',
    expectedCategory: 'General',
    expectedPriority: 'P4',
    domain: 'Customer Feedback',
  },
  {
    id: 20,
    reference: 'EVAL-TCK-020',
    title: 'Upcoming holiday support schedule and emergency on-call contact',
    description: 'Could you please confirm the support coverage hours and primary escalation contact for the upcoming Thanksgiving weekend?',
    expectedCategory: 'General',
    expectedPriority: 'P4',
    domain: 'Support Information',
  },
];
