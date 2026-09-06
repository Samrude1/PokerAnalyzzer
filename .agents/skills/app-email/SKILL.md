---
name: app-email
description: >-
  Integrates transactional email services, React Email templates, provider SDKs (Resend, SendGrid), and delivery security.
  Use this skill whenever the user requests email integration, newsletter forms, transactional emails,
  password reset notifications, or runs /email.
---

# App Email & Notification Integration Skill

This skill guides the agent in architecting, integrating, and testing production-ready transactional email systems in fullstack applications. It enforces typed component templates (React Email), secure API delivery (Resend / SendGrid / Postmark), and proper deliverability configurations (SPF, DKIM, DMARC).

---

## Architecture & Recommended Stack

1. **Email Engine & Component Templates**: **React Email** (`@react-email/components`, `react-email`)
   - Type-safe, component-driven email design with preview mode.
2. **Delivery Providers**:
   - **Resend** (Recommended for modern Next.js / TypeScript stacks)
   - **SendGrid** / **Postmark** / **AWS SES** (Enterprise / high-volume)
3. **Template Directory Structure**:
   ```text
   src/
   ├── emails/
   │   ├── components/       # Header, Footer, Button, Container
   │   ├── WelcomeEmail.tsx  # User onboarding template
   │   ├── ResetPassword.tsx # Auth credential reset template
   │   └── ReceiptEmail.tsx  # Transactional invoice template
   └── lib/
       └── email.ts          # Central delivery client & helper
   ```

---

## Workflow Steps

### Step 1: Package Installation & Setup
Install React Email and chosen provider SDK (e.g. Resend):

```bash
npm install resend @react-email/components
npm install -D react-email
```

Configure environment variable in `.env.example` and local `.env`:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="App Name <noreply@yourdomain.com>"
```

---

### Step 2: Central Email Client
Create `src/lib/email.ts`:

```typescript
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  from = process.env.EMAIL_FROM || 'noreply@example.com',
  replyTo,
}: SendEmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
      reply_to: replyTo,
    });

    if (error) {
      console.error('[Email Delivery Error]:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[Email Client Exception]:', err);
    return { success: false, error: err };
  }
}
```

---

### Step 3: Type-Safe React Email Template
Create sample template (e.g. `src/emails/WelcomeEmail.tsx`):

```tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
  actionUrl: string;
}

export function WelcomeEmail({ name, actionUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#0b0f19', color: '#f8fafc', fontFamily: 'sans-serif' }}>
        <Container style={{ maxWidth: '580px', margin: '0 auto', padding: '32px 16px' }}>
          <Heading style={{ color: '#38bdf8', fontSize: '24px' }}>Welcome, {name}!</Heading>
          <Text style={{ fontSize: '16px', lineHeight: '1.6', color: '#94a3b8' }}>
            Thanks for joining. We are thrilled to have you onboard. Click below to verify your account and get started:
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button
              href={actionUrl}
              style={{
                backgroundColor: '#38bdf8',
                color: '#0f172a',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 'bold',
                textDecoration: 'none',
              }}
            >
              Get Started
            </Button>
          </Section>
          <Hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '24px 0' }} />
          <Text style={{ fontSize: '12px', color: '#64748b' }}>
            If you did not create this account, please ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

---

### Step 4: Deliverability & Security Checklist
Before launching emails in production:
1. **Domain Verification**:
   - Add SPF record (`v=spf1 include:amazonses.com ~all` or provider specific).
   - Add DKIM public keys (CNAME records).
   - Configure DMARC policy (`v=DMARC1; p=quarantine;`).
2. **Rate Limiting & Queueing**:
   - Protect public endpoints that trigger emails (e.g. contact forms, password reset) with IP rate limiting to prevent spam abuse.
3. **No Secrets in Client**:
   - Verify `RESEND_API_KEY` is never accessed in client-rendered components.

---

### Step 5: Completion Report
```markdown
## ✉️ Email Integration Complete

- **Provider**: [Resend / SendGrid / Postmark]
- **Engine**: React Email
- **Templates Created**: `src/emails/...`
- **Delivery Service**: `src/lib/email.ts`
- **Security Check**: API keys in `.env`, rate limiting applied, SPF/DKIM noted
```

---

## Error Handling & Fallbacks

If email sending fails or delivery times out:
1. **Missing Domain Verification**: On unverified domains, providers restrict recipients (e.g. Resend sandbox sends only to account owner's email).
2. **Template Rendering Failures**: Test email markup locally with `npx email dev` to preview component rendering before sending.
3. **Network Drops**: Wrap email dispatches in background tasks or message queues (BullMQ, Upstash QStash) for resilient retries.
4. **Escalate**: If API returns 401/403 Invalid Key or account suspension, alert developer immediately with provider error code.
