/**
 * Email Helper
 * 
 * Sends automated follow-up emails using built-in notification API
 * Note: This is a simplified implementation. For production, integrate with
 * SendGrid, AWS SES, or similar email service.
 */

import { notifyOwner } from "./notification";

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  leadName?: string;
  companyName?: string;
}

/**
 * Send email (currently using notification system as placeholder)
 * TODO: Replace with actual email service (SendGrid/SES) in production
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const { to, subject, body, leadName, companyName } = params;

  try {
    // For now, we'll log the email and notify the owner
    console.log('[Email] Sending email:', {
      to,
      subject,
      preview: body.substring(0, 100),
    });

    // Notify owner about the email being sent
    await notifyOwner({
      title: `📧 Email Sent: ${subject}`,
      content: `To: ${to}${leadName ? ` (${leadName})` : ''}${companyName ? ` - ${companyName}` : ''}\n\nSubject: ${subject}\n\n${body.substring(0, 200)}...`,
    });

    // TODO: In production, replace with actual email service:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to,
    //   from: process.env.FROM_EMAIL,
    //   subject,
    //   html: body,
    // });

    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

/**
 * Email templates for different call outcomes
 */
export const EMAIL_TEMPLATES = {
  callback: {
    subject: (leadName: string) => `Following up on our call - ${leadName}`,
    body: (leadName: string, companyName: string) => `
Hi ${leadName},

Thank you for taking the time to speak with me earlier. As discussed, I wanted to follow up and schedule a callback at your convenience.

I have a few time slots available this week:
- [Day 1] at [Time 1]
- [Day 2] at [Time 2]
- [Day 3] at [Time 3]

Please let me know which works best for you, or suggest an alternative time.

Looking forward to continuing our conversation about how we can help ${companyName}.

Best regards,
[Your Name]
[Your Company]
    `.trim(),
  },
  interested: {
    subject: (leadName: string) => `Next steps for ${leadName} - Proposal attached`,
    body: (leadName: string, companyName: string) => `
Hi ${leadName},

It was great speaking with you! I'm excited about the opportunity to work with ${companyName}.

As promised, I've attached our proposal outlining how we can help you achieve [specific goals discussed].

Key highlights:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

I'd love to schedule a follow-up call to walk through the proposal and answer any questions you might have.

When would be a good time for you this week?

Best regards,
[Your Name]
[Your Company]
    `.trim(),
  },
  notInterested: {
    subject: (leadName: string) => `Thank you for your time, ${leadName}`,
    body: (leadName: string, companyName: string) => `
Hi ${leadName},

Thank you for taking the time to speak with me today. I understand that our solution isn't the right fit for ${companyName} at this time.

I'll keep you on our mailing list for future updates and case studies that might be relevant to your industry. If your needs change in the future, please don't hesitate to reach out.

Wishing you and ${companyName} continued success!

Best regards,
[Your Name]
[Your Company]
    `.trim(),
  },
  voicemail: {
    subject: (leadName: string) => `Following up - ${leadName}`,
    body: (leadName: string, companyName: string) => `
Hi ${leadName},

I tried reaching you earlier today but wasn't able to connect. I wanted to touch base about how we can help ${companyName} with [specific value proposition].

I'd love to schedule a brief 15-minute call to discuss:
- [Topic 1]
- [Topic 2]
- [Topic 3]

Please let me know a time that works for you, or feel free to book directly on my calendar: [Calendar Link]

Looking forward to connecting!

Best regards,
[Your Name]
[Your Company]
    `.trim(),
  },
};

/**
 * Get email template based on call outcome
 */
export function getEmailTemplate(outcome: string, leadName: string, companyName: string) {
  const template = EMAIL_TEMPLATES[outcome as keyof typeof EMAIL_TEMPLATES];
  if (!template) {
    return null;
  }

  return {
    subject: template.subject(leadName),
    body: template.body(leadName, companyName),
  };
}
