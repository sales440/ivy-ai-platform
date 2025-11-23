import { getDb } from "./db";
import { sendEmail } from "./services/sendgrid";

/**
 * Email Workflow Executor
 * Executes automated email nurturing sequences using SendGrid
 */

interface EmailWorkflowParams {
  leadId: number;
  sequenceName: string;
  startFromDay?: number;
}

interface EmailSequence {
  id: number;
  name: string;
  stage: string;
  dayNumber: number;
  subject: string;
  body: string;
}

/**
 * Execute an email nurturing workflow for a lead
 */
export async function executeEmailWorkflow(params: EmailWorkflowParams): Promise<{
  success: boolean;
  emailsSent: number;
  errors: string[];
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const { leadId, sequenceName, startFromDay = 0 } = params;

  // Get lead information
  const leadQuery = `SELECT * FROM leads WHERE id = ? LIMIT 1`;
  const leadResult = await db.execute(leadQuery, [leadId]);
  const leads = leadResult[0] as any[];
  
  if (leads.length === 0) {
    throw new Error(`Lead ${leadId} not found`);
  }

  const lead = leads[0];

  if (!lead.email) {
    throw new Error(`Lead ${leadId} has no email address`);
  }

  // Get email sequences for this workflow
  const sequenceQuery = `
    SELECT * FROM emailSequences 
    WHERE sequenceName = ? AND dayNumber >= ?
    ORDER BY dayNumber ASC
  `;
  const sequenceResult = await db.execute(sequenceQuery, [sequenceName, startFromDay]);
  const sequences = sequenceResult[0] as EmailSequence[];

  if (sequences.length === 0) {
    throw new Error(`No email sequences found for "${sequenceName}"`);
  }

  const results = {
    success: true,
    emailsSent: 0,
    errors: [] as string[],
  };

  // Send emails for each sequence step
  for (const sequence of sequences) {
    try {
      // Replace variables in subject and body
      const subject = replaceVariables(sequence.subject, lead);
      const body = replaceVariables(sequence.body, lead);

      // Send email via SendGrid
      const result = await sendEmail({
        to: lead.email,
        toName: lead.name,
        subject,
        htmlContent: body,
        textContent: body.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
        trackOpens: true,
        trackClicks: true,
        customArgs: {
          leadId: String(lead.id),
          sequenceName: sequence.name,
          dayNumber: String(sequence.dayNumber),
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      // Log email sent
      await logEmailSent({
        leadId: lead.id,
        sequenceId: sequence.id,
        sequenceName: sequence.name,
        subject,
        body,
        status: "sent",
      });

      results.emailsSent++;

      console.log(`[EmailWorkflow] Sent email to ${lead.email}: ${subject}`);
    } catch (error: any) {
      const errorMsg = `Failed to send email (day ${sequence.dayNumber}): ${error.message}`;
      results.errors.push(errorMsg);
      results.success = false;

      console.error(`[EmailWorkflow] ${errorMsg}`);

      // Log email failure
      await logEmailSent({
        leadId: lead.id,
        sequenceId: sequence.id,
        sequenceName: sequence.name,
        subject: sequence.subject,
        body: sequence.body,
        status: "failed",
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Replace variables in email content
 */
function replaceVariables(content: string, lead: any): string {
  return content
    .replace(/\{\{leadName\}\}/g, lead.name || "there")
    .replace(/\{\{company\}\}/g, lead.company || "your company")
    .replace(/\{\{title\}\}/g, lead.title || "")
    .replace(/\{\{email\}\}/g, lead.email || "")
    .replace(/\{\{phone\}\}/g, lead.phone || "")
    .replace(/\{\{agentName\}\}/g, "Ivy.AI Team")
    .replace(/\{\{agentEmail\}\}/g, "sales@ivybai.com");
}

/**
 * Log email sent to database
 */
async function logEmailSent(params: {
  leadId: number;
  sequenceId: number;
  sequenceName: string;
  subject: string;
  body: string;
  status: "sent" | "failed";
  error?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const query = `
    INSERT INTO emailLogs (
      leadId, 
      sequenceId, 
      sequenceName, 
      subject, 
      body, 
      status, 
      error, 
      sentAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  await db.execute(query, [
    params.leadId,
    params.sequenceId,
    params.sequenceName,
    params.subject,
    params.body,
    params.status,
    params.error || null,
  ]);
}

/**
 * Get available email sequences
 */
export async function getEmailSequences(): Promise<
  Array<{
    name: string;
    stage: string;
    totalEmails: number;
  }>
> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const query = `
    SELECT 
      sequenceName as name,
      stage,
      COUNT(*) as totalEmails
    FROM emailSequences
    GROUP BY sequenceName, stage
    ORDER BY stage, sequenceName
  `;

  const result = await db.execute(query);
  const rows = result[0] as any[];

  return rows.map((row) => ({
    name: row.name,
    stage: row.stage,
    totalEmails: Number(row.totalEmails),
  }));
}

/**
 * Test email workflow with a single lead
 */
export async function testEmailWorkflow(leadEmail: string): Promise<{
  success: boolean;
  message: string;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Find lead by email
  const leadQuery = `SELECT id FROM leads WHERE email = ? LIMIT 1`;
  const leadResult = await db.execute(leadQuery, [leadEmail]);
  const leads = leadResult[0] as any[];

  if (leads.length === 0) {
    return {
      success: false,
      message: `No lead found with email: ${leadEmail}`,
    };
  }

  const leadId = leads[0].id;

  // Execute awareness sequence (first email only)
  try {
    const result = await executeEmailWorkflow({
      leadId,
      sequenceName: "awareness_sequence",
      startFromDay: 0,
    });

    return {
      success: result.success,
      message: result.success
        ? `Successfully sent ${result.emailsSent} email(s) to ${leadEmail}`
        : `Failed with errors: ${result.errors.join(", ")}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error executing workflow: ${error.message}`,
    };
  }
}
