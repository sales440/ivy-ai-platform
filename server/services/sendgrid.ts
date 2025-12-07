import sgMail from "@sendgrid/mail";

/**
 * SendGrid Email Service
 * Handles automated email sending for marketing campaigns
 */

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn("[SendGrid] API key not configured. Email sending will be simulated.");
}

const FROM_EMAIL = "sales@ivybai.com";
const FROM_NAME = "Ivy.AI - AI Agent Platform";

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
  customArgs?: Record<string, string>;
}

/**
 * Send a single email via SendGrid
 */
export async function sendEmail(params: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!SENDGRID_API_KEY) {
    console.log("[SendGrid] Simulated email send:", {
      to: params.to,
      subject: params.subject,
    });
    return {
      success: true,
      messageId: `sim-${Date.now()}`,
    };
  }

  try {
    const msg = {
      to: params.toName ? `${params.toName} <${params.to}>` : params.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: params.subject,
      text: params.textContent || stripHtml(params.htmlContent),
      html: params.htmlContent,
      trackingSettings: {
        clickTracking: {
          enable: params.trackClicks ?? true,
        },
        openTracking: {
          enable: params.trackOpens ?? true,
        },
      },
      customArgs: params.customArgs || {},
    };

    const [response] = await sgMail.send(msg);

    console.log("[SendGrid] Email sent successfully:", {
      to: params.to,
      subject: params.subject,
      messageId: response.headers["x-message-id"],
    });

    return {
      success: true,
      messageId: response.headers["x-message-id"] as string,
    };
  } catch (error: any) {
    console.error("[SendGrid] Failed to send email:", error);

    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Send bulk emails (up to 1000 recipients)
 */
export async function sendBulkEmails(
  recipients: Array<{ email: string; name?: string; customData?: Record<string, string> }>,
  template: EmailTemplate,
  customArgs?: Record<string, string>
): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}> {
  if (!SENDGRID_API_KEY) {
    console.log("[SendGrid] Simulated bulk email send:", {
      count: recipients.length,
      subject: template.subject,
    });
    return {
      success: true,
      sent: recipients.length,
      failed: 0,
      errors: [],
    };
  }

  const results = {
    success: true,
    sent: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>,
  };

  // SendGrid allows up to 1000 recipients per request
  const batches = chunkArray(recipients, 1000);

  for (const batch of batches) {
    try {
      const msg = {
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        subject: template.subject,
        text: template.textContent || stripHtml(template.htmlContent),
        html: template.htmlContent,
        personalizations: batch.map((recipient) => ({
          to: [
            {
              email: recipient.email,
              name: recipient.name,
            },
          ],
          customArgs: {
            ...customArgs,
            ...recipient.customData,
          },
        })),
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      };

      await sgMail.send(msg as any);
      results.sent += batch.length;

      console.log("[SendGrid] Bulk batch sent successfully:", {
        count: batch.length,
        subject: template.subject,
      });
    } catch (error: any) {
      console.error("[SendGrid] Bulk batch failed:", error);
      results.failed += batch.length;
      results.success = false;

      batch.forEach((recipient) => {
        results.errors.push({
          email: recipient.email,
          error: error.message || "Unknown error",
        });
      });
    }
  }

  return results;
}

/**
 * Send email using predefined template
 */
export async function sendTemplateEmail(params: {
  to: string;
  toName?: string;
  templateId: string;
  dynamicData: Record<string, any>;
  customArgs?: Record<string, string>;
}): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!SENDGRID_API_KEY) {
    console.log("[SendGrid] Simulated template email send:", {
      to: params.to,
      templateId: params.templateId,
    });
    return {
      success: true,
      messageId: `sim-${Date.now()}`,
    };
  }

  try {
    const msg = {
      to: params.toName ? `${params.toName} <${params.to}>` : params.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      templateId: params.templateId,
      dynamicTemplateData: params.dynamicData,
      customArgs: params.customArgs || {},
    };

    const [response] = await sgMail.send(msg);

    console.log("[SendGrid] Template email sent successfully:", {
      to: params.to,
      templateId: params.templateId,
      messageId: response.headers["x-message-id"],
    });

    return {
      success: true,
      messageId: response.headers["x-message-id"] as string,
    };
  } catch (error: any) {
    console.error("[SendGrid] Failed to send template email:", error);

    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

/**
 * Verify SendGrid API key is valid
 */
export async function verifySendGridConnection(): Promise<{
  valid: boolean;
  error?: string;
}> {
  if (!SENDGRID_API_KEY) {
    return {
      valid: false,
      error: "SENDGRID_API_KEY not configured",
    };
  }

  try {
    // Try to send a test email to verify connection
    const testMsg = {
      to: FROM_EMAIL, // Send to self
      from: FROM_EMAIL,
      subject: "SendGrid Connection Test",
      text: "This is a test email to verify SendGrid connection.",
      html: "<p>This is a test email to verify SendGrid connection.</p>",
      mailSettings: {
        sandboxMode: {
          enable: true, // Sandbox mode - doesn't actually send
        },
      },
    };

    await sgMail.send(testMsg);

    console.log("[SendGrid] Connection verified successfully");

    return { valid: true };
  } catch (error: any) {
    console.error("[SendGrid] Connection verification failed:", error);

    return {
      valid: false,
      error: error.message || "Unknown error",
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
