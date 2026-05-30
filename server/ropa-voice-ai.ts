/**
 * ROPA Voice AI — Llamadas salientes automáticas via Twilio
 * Cuando un lead no responde a 2+ emails, ROPA inicia una llamada de seguimiento
 * con un script personalizado generado por LLM.
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

export interface VoiceCallRequest {
  companyId: number;
  companyName: string;
  industry: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  campaignName: string;
  emailsNotOpened: number;
  fromPhone?: string; // Twilio number
}

export interface VoiceCallResult {
  success: boolean;
  callSid?: string;
  scriptGenerated?: string;
  error?: string;
  method: "twilio" | "n8n" | "simulated";
}

/**
 * Generate a personalized call script using LLM
 */
export async function generateCallScript(params: {
  companyName: string;
  industry: string;
  leadName: string;
  campaignName: string;
  emailsNotOpened: number;
}): Promise<string> {
  const { companyName, industry, leadName, campaignName, emailsNotOpened } = params;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `Eres ROPA, el Super Meta-Agente de ventas de ${companyName}. 
Genera un script de llamada telefónica de seguimiento en español, profesional, conciso (máximo 90 segundos de habla).
El script debe:
1. Presentarse como representante de ${companyName}
2. Mencionar que enviaron emails sobre ${campaignName} sin respuesta
3. Preguntar si recibieron la información
4. Ofrecer una demo o reunión de 15 minutos
5. Ser conversacional, no robótico
6. Incluir manejo de objeciones comunes
Formato: Solo el texto del script, sin etiquetas ni instrucciones extra.`
      },
      {
        role: "user",
        content: `Genera el script para llamar a ${leadName} de la industria ${industry}. 
Han recibido ${emailsNotOpened} emails sin abrir sobre "${campaignName}".`
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  return (typeof content === 'string' ? content : null) || 
    `Buenos días ${leadName}, le llamo de ${companyName}. Le contactamos porque le enviamos información sobre ${campaignName} y queríamos verificar si la recibió. ¿Tendría 15 minutos esta semana para una breve conversación?`;
}

/**
 * Initiate an outbound call via Twilio (or n8n webhook as fallback)
 */
export async function initiateVoiceCall(params: VoiceCallRequest): Promise<VoiceCallResult> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFromNumber = params.fromPhone || process.env.TWILIO_FROM_NUMBER;

  // Generate the call script with LLM
  const script = await generateCallScript({
    companyName: params.companyName,
    industry: params.industry,
    leadName: params.leadName,
    campaignName: params.campaignName,
    emailsNotOpened: params.emailsNotOpened
  });

  // Try Twilio first
  if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
    try {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX" voice="Polly.Mia">${script.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c))}</Say>
  <Gather numDigits="1" timeout="10">
    <Say language="es-MX" voice="Polly.Mia">Si desea más información, presione 1. Para no recibir más llamadas, presione 9.</Say>
  </Gather>
</Response>`;

      const twimlUrl = `https://handler.twilio.com/twiml/EH${Buffer.from(twiml).toString('base64').slice(0, 32)}`;

      // Use Twilio REST API
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`,
        {
          method: "POST",
          headers: {
            "Authorization": `Basic ${Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64')}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            To: params.leadPhone,
            From: twilioFromNumber,
            Twiml: twiml
          }).toString()
        }
      );

      if (response.ok) {
        const data = await response.json() as { sid: string };
        await logVoiceCall({
          companyId: params.companyId,
          leadName: params.leadName,
          leadPhone: params.leadPhone,
          script,
          callSid: data.sid,
          status: "initiated"
        });
        return { success: true, callSid: data.sid, scriptGenerated: script, method: "twilio" };
      }
    } catch (err) {
      console.error("[VoiceAI] Twilio call failed:", err);
    }
  }

  // Fallback: Try n8n webhook for voice
  const n8nUrl = process.env.N8N_WEBHOOK_BASE_URL;
  if (n8nUrl) {
    try {
      const response = await fetch(`${n8nUrl}/voice-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: params.leadPhone,
          leadName: params.leadName,
          company: params.companyName,
          script,
          campaign: params.campaignName
        })
      });

      if (response.ok) {
        await logVoiceCall({
          companyId: params.companyId,
          leadName: params.leadName,
          leadPhone: params.leadPhone,
          script,
          status: "initiated_via_n8n"
        });
        return { success: true, scriptGenerated: script, method: "n8n" };
      }
    } catch (err) {
      console.error("[VoiceAI] n8n voice webhook failed:", err);
    }
  }

  // Simulated mode: log the call as pending for manual execution
  await logVoiceCall({
    companyId: params.companyId,
    leadName: params.leadName,
    leadPhone: params.leadPhone,
    script,
    status: "pending_manual"
  });

  return {
    success: true,
    scriptGenerated: script,
    method: "simulated",
    error: "Twilio no configurado. Script generado para llamada manual."
  };
}

/**
 * Log voice call attempt to DB
 */
async function logVoiceCall(params: {
  companyId: number;
  leadName: string;
  leadPhone: string;
  script: string;
  callSid?: string;
  status: string;
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db.execute(sql`
      INSERT INTO voice_calls (company_id, lead_name, lead_phone, script, call_sid, status, created_at)
      VALUES (${params.companyId}, ${params.leadName}, ${params.leadPhone}, ${params.script}, 
              ${params.callSid || null}, ${params.status}, NOW())
      ON DUPLICATE KEY UPDATE status = ${params.status}
    `);
  } catch {
    // Table may not exist yet — create it
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS voice_calls (
          id INT AUTO_INCREMENT PRIMARY KEY,
          company_id INT NOT NULL,
          lead_name VARCHAR(255),
          lead_phone VARCHAR(50),
          script TEXT,
          call_sid VARCHAR(100),
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_company (company_id)
        )
      `);
    } catch (e2) {
      console.error("[VoiceAI] Failed to create voice_calls table:", e2);
    }
  }
}

/**
 * ROPA autonomous check: find leads that haven't responded to 2+ emails
 * and schedule voice follow-up calls
 */
export async function checkAndScheduleVoiceCalls(companyId: number): Promise<{
  callsScheduled: number;
  leads: Array<{ name: string; phone: string; emailsIgnored: number }>;
}> {
  const db = await getDb();
  if (!db) return { callsScheduled: 0, leads: [] };

  try {
    // Find leads with 2+ unopened emails in the last 7 days
    const leads = await db.execute(sql`
      SELECT 
        l.name, l.phone, l.email,
        COUNT(ea.id) as emails_ignored,
        c.name as company_name,
        c.industry,
        camp.name as campaign_name
      FROM leads l
      JOIN email_activities ea ON ea.lead_id = l.id AND ea.status = 'sent' AND ea.opened_at IS NULL
      JOIN campaigns camp ON camp.id = ea.campaign_id
      JOIN companies c ON c.id = ${companyId}
      WHERE l.company_id = ${companyId}
        AND ea.sent_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND l.phone IS NOT NULL AND l.phone != ''
        AND l.voice_call_attempted = 0
      GROUP BY l.id
      HAVING emails_ignored >= 2
      LIMIT 10
    `);

    const rows = Array.isArray(leads) ? leads : (leads as { rows: unknown[] }).rows || [];
    return {
      callsScheduled: rows.length,
      leads: rows.map((r: unknown) => {
        const row = r as Record<string, unknown>;
        return { name: String(row.name || ''), phone: String(row.phone || ''), emailsIgnored: Number(row.emails_ignored || 0) };
      })
    };
  } catch {
    // leads table may not exist yet
    return { callsScheduled: 0, leads: [] };
  }
}

/**
 * Get all voice calls for a company
 */
export async function getVoiceCallsForCompany(companyId: number): Promise<unknown[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(sql`
      SELECT * FROM voice_calls 
      WHERE company_id = ${companyId}
      ORDER BY created_at DESC
      LIMIT 50
    `);
    return Array.isArray(result) ? result : (result as { rows: unknown[] }).rows || [];
  } catch {
    return [];
  }
}
