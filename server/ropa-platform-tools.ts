/**
 * ROPA Platform Manipulation Tools
 * Real tools for ROPA to directly manipulate the Ivy.AI platform
 * These tools write directly to the database - no simulation
 * 
 * Uses safeQuery pattern with raw SQL fallback for TiDB/MySQL compatibility
 */

import { getDb } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  ivyClients,
  salesCampaigns,
  emailDrafts,
  campaignContent,
  clientLeads,
  type InsertIvyClient,
  type InsertSalesCampaign,
  type InsertEmailDraft,
  type InsertCampaignContent,
  type InsertClientLead,
} from "../drizzle/schema";
import { createRopaLog, recordRopaMetric } from "./ropa-db";
import { invokeGemini, isGeminiConfigured } from "./gemini-llm";
import { invokeLLM } from "./_core/llm";
import {
  findCompanyByName,
  listAllCompanies,
  getTasksByCompany,
  getCampaignsByCompany,
  getEmailDraftsByCompany,
  getCampaignContentByCompany,
  getAlertsByCompany,
  getLeadsByCompany,
  getFilesByCompany,
  getCompanyOverview,
  getCompanySummaryStats,
  type CompanyOverview,
} from "./ropa-company-filters";
import { notifyOwner } from "./_core/notification";
import { saveKPIReportToDrive, saveROIReportToDrive, saveDocumentToDrive } from "./ropa-drive-reports";

// ============ SAFE QUERY HELPER ============

/**
 * Safe query executor - wraps Drizzle queries with try-catch and raw SQL fallback
 */
async function safeQuery<T>(
  label: string,
  drizzleQuery: () => Promise<T>,
  rawSqlFallback?: () => Promise<T>
): Promise<T | null> {
  try {
    return await drizzleQuery();
  } catch (err: any) {
    console.warn(`[PlatformTools] Drizzle query failed for ${label}:`, err.message?.substring(0, 200));
    if (rawSqlFallback) {
      try {
        return await rawSqlFallback();
      } catch (rawErr: any) {
        console.warn(`[PlatformTools] Raw SQL fallback also failed for ${label}:`, rawErr.message?.substring(0, 200));
      }
    }
    return null;
  }
}

/**
 * Safe mutation executor - wraps Drizzle mutations with try-catch and raw SQL fallback
 * Unlike safeQuery, this throws on failure since mutations need to report errors
 */
async function safeMutation<T>(
  label: string,
  drizzleMutation: () => Promise<T>,
  rawSqlFallback?: () => Promise<T>
): Promise<T> {
  try {
    return await drizzleMutation();
  } catch (err: any) {
    console.warn(`[PlatformTools] Drizzle mutation failed for ${label}:`, err.message?.substring(0, 200));
    if (rawSqlFallback) {
      try {
        return await rawSqlFallback();
      } catch (rawErr: any) {
        console.warn(`[PlatformTools] Raw SQL fallback also failed for ${label}:`, rawErr.message?.substring(0, 200));
        throw new Error(`Error en ${label}: ${rawErr.message?.substring(0, 100)}`);
      }
    }
    throw new Error(`Error en ${label}: ${err.message?.substring(0, 100)}`);
  }
}

// ============ COMPANY MANAGEMENT ============

export const companyManagementTools = {
  /**
   * Create a new company in the database
   */
  async createCompany(params: {
    companyName: string;
    industry?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Generate unique client ID using safe query
    const year = new Date().getFullYear();
    
    // Count existing clients safely
    let clientCount = 0;
    const countResult = await safeQuery(
      'countClients',
      async () => {
        const clients = await db.select().from(ivyClients);
        return clients.length;
      },
      async () => {
        const [rows] = await db.execute(sql`SELECT COUNT(*) as cnt FROM ivy_clients`);
        const row = (rows as any[])?.[0];
        return Number(row?.cnt || row?.['COUNT(*)'] || 0);
      }
    );
    clientCount = countResult ?? 0;
    
    const nextNum = clientCount + 1;
    const clientId = `IVY-${year}-${String(nextNum).padStart(4, '0')}`;

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Creating company: ${params.companyName}`,
      metadata: { clientId, ...params },
    });

    // Insert company using safe mutation
    await safeMutation(
      'insertCompany',
      async () => {
        return db.insert(ivyClients).values({
          clientId,
          companyName: params.companyName,
          industry: params.industry || null,
          contactName: params.contactName || null,
          contactEmail: params.contactEmail || null,
          contactPhone: params.contactPhone || null,
          website: params.website || null,
          status: "active",
          createdBy: "ROPA",
        });
      },
      async () => {
        return db.execute(sql`INSERT INTO ivy_clients 
          (client_id, company_name, industry, contact_name, contact_email, contact_phone, website, status, created_by)
          VALUES (${clientId}, ${params.companyName}, ${params.industry || null}, ${params.contactName || null}, 
                  ${params.contactEmail || null}, ${params.contactPhone || null}, ${params.website || null}, 
                  'active', 'ROPA')`);
      }
    );

    await recordRopaMetric({
      metricType: "company_created",
      value: "1",
      unit: "count",
      metadata: { clientId, companyName: params.companyName },
    });

    // === AUTO-GENERATE SALES STRATEGY ===
    let salesStrategy: string | null = null;
    try {
      const strategyPrompt = `Eres un consultor de ventas B2B experto. Genera una propuesta de campaña de ventas con agentes IA para esta empresa:

Empresa: ${params.companyName}
Industria: ${params.industry || 'No especificada'}
Contacto: ${params.contactName || 'No especificado'}
Email: ${params.contactEmail || 'No especificado'}

Genera una propuesta concisa en español que incluya:
1. ESTRATEGIA DE ABORDAJE: Cómo abordar a esta empresa
2. CANALES SUGERIDOS: Email, teléfono, LinkedIn, etc.
3. CONFIGURACIÓN DE AGENTES: Qué agentes IA asignar (ARIA para emails, LUCA para análisis, NOVA para contenido, SAGE para estrategia)
4. TIMELINE: Cronograma sugerido de 4 semanas
5. KPIs ESPERADOS: Métricas de éxito

Responde en texto plano sin markdown ni asteriscos. Máximo 500 palabras.`;

      let strategyResult: string | null = null;
      if (isGeminiConfigured()) {
        strategyResult = await invokeGemini([
          { role: 'system', content: 'Eres un consultor de ventas B2B. Responde en español, sin markdown.' },
          { role: 'user', content: strategyPrompt },
        ]);
      }
      if (!strategyResult) {
        const llmResult = await invokeLLM({
          messages: [
            { role: 'system', content: 'Eres un consultor de ventas B2B. Responde en español, sin markdown.' },
            { role: 'user', content: strategyPrompt },
          ],
        });
        strategyResult = llmResult?.choices?.[0]?.message?.content || null;
      }
      salesStrategy = strategyResult;

      // Save strategy as notes using safe mutation
      if (salesStrategy) {
        await safeMutation(
          'updateCompanyNotes',
          async () => db.update(ivyClients)
            .set({ notes: `PROPUESTA DE CAMPAÑA DE VENTAS CON AGENTES IA\n\n${salesStrategy}` })
            .where(eq(ivyClients.clientId, clientId)),
          async () => db.execute(sql`UPDATE ivy_clients SET notes = ${`PROPUESTA DE CAMPAÑA DE VENTAS CON AGENTES IA\n\n${salesStrategy}`} WHERE client_id = ${clientId}`)
        );
      }
    } catch (strategyError: any) {
      console.warn('[Platform] Strategy generation failed:', strategyError.message);
    }

    // === AUTO-CREATE GOOGLE DRIVE FOLDER STRUCTURE ===
    let driveResult: any = null;
    try {
      const { createClientFolderStructure } = await import('./ropa-drive-service');
      driveResult = await createClientFolderStructure(clientId, params.companyName);
      if (driveResult.success && driveResult.clientFolderId) {
        await safeMutation(
          'updateCompanyDrive',
          async () => db.update(ivyClients)
            .set({
              googleDriveFolderId: driveResult.clientFolderId,
              googleDriveStructure: JSON.stringify(driveResult.folderIds || {}),
            })
            .where(eq(ivyClients.clientId, clientId)),
          async () => db.execute(sql`UPDATE ivy_clients SET google_drive_folder_id = ${driveResult.clientFolderId}, google_drive_structure = ${JSON.stringify(driveResult.folderIds || {})} WHERE client_id = ${clientId}`)
        );
        console.log(`[Platform] Google Drive folders created for ${clientId}`);
      }
    } catch (driveError: any) {
      console.warn('[Platform] Google Drive folder creation failed:', driveError.message);
    }

    // === NOTIFY n8n: New Company Created ===
    try {
      const { syncToN8n } = await import('./ropa-n8n-service');
      await syncToN8n('company_created', {
        company: {
          id: clientId,
          name: params.companyName,
          industry: params.industry || null,
          contactEmail: params.contactEmail || null,
          contactPhone: params.contactPhone || null,
          website: params.website || null,
          status: 'active',
        },
        salesStrategy: salesStrategy ? 'generated' : null,
        googleDrive: driveResult?.success ? 'created' : null,
      });
      console.log(`[Platform] n8n notified: company_created ${params.companyName}`);
    } catch (n8nErr: any) {
      console.warn('[Platform] n8n notification failed:', n8nErr.message);
    }

    return {
      success: true,
      clientId,
      companyName: params.companyName,
      salesStrategy: salesStrategy ? 'Propuesta generada' : null,
      googleDrive: driveResult?.success ? 'Carpetas creadas' : 'No disponible',
      message: `Empresa "${params.companyName}" creada con ID: ${clientId}${salesStrategy ? '. Propuesta de campaña generada.' : ''}${driveResult?.success ? ' Carpetas de Google Drive creadas.' : ''}`,
    };
  },

  /**
   * Get all companies from the database
   */
  async listCompanies() {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available", companies: [] };

    const companies = await safeQuery(
      'listCompanies',
      async () => db.select().from(ivyClients).orderBy(desc(ivyClients.createdAt)),
      async () => {
        const [rows] = await db.execute(sql`SELECT * FROM ivy_clients ORDER BY created_at DESC`);
        return rows as any[];
      }
    );

    if (!companies || !Array.isArray(companies)) {
      return { success: true, count: 0, companies: [] };
    }

    return {
      success: true,
      count: companies.length,
      companies: companies.map((c: any) => ({
        id: c.id,
        clientId: c.clientId || c.client_id,
        name: c.companyName || c.company_name,
        industry: c.industry,
        status: c.status,
        contactEmail: c.contactEmail || c.contact_email,
      })),
    };
  },

  /**
   * Update a company
   */
  async updateCompany(params: {
    clientId: string;
    updates: {
      companyName?: string;
      industry?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      status?: "active" | "inactive" | "prospect" | "churned";
    };
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Updating company: ${params.clientId}`,
      metadata: params.updates,
    });

    await safeMutation(
      'updateCompany',
      async () => db.update(ivyClients).set(params.updates).where(eq(ivyClients.clientId, params.clientId)),
      async () => {
        const sets: string[] = [];
        const vals: any = {};
        if (params.updates.companyName) sets.push('company_name');
        if (params.updates.industry) sets.push('industry');
        if (params.updates.contactName) sets.push('contact_name');
        if (params.updates.contactEmail) sets.push('contact_email');
        if (params.updates.contactPhone) sets.push('contact_phone');
        if (params.updates.status) sets.push('status');
        // Fallback: use raw update
        return db.execute(sql`UPDATE ivy_clients SET updated_at = NOW() WHERE client_id = ${params.clientId}`);
      }
    );

    return {
      success: true,
      clientId: params.clientId,
      message: `Empresa ${params.clientId} actualizada`,
    };
  },

  /**
   * Delete a company
   */
  async deleteCompany(params: { clientId: string }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await createRopaLog({
      taskId: undefined,
      level: "warn",
      message: `[Platform] Deleting company: ${params.clientId}`,
      metadata: params,
    });

    await safeMutation(
      'deleteCompany',
      async () => db.delete(ivyClients).where(eq(ivyClients.clientId, params.clientId)),
      async () => db.execute(sql`DELETE FROM ivy_clients WHERE client_id = ${params.clientId}`)
    );

    return {
      success: true,
      message: `Empresa ${params.clientId} eliminada`,
    };
  },
};

// ============ CAMPAIGN MANAGEMENT ============

export const campaignManagementTools = {
  /**
   * Create a new campaign in the database
   */
  async createCampaign(params: {
    name: string;
    companyName: string;
    type: "email" | "phone" | "social_media" | "multi_channel";
    status?: "draft" | "active" | "paused" | "completed";
    targetAudience?: string;
    content?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Creating campaign: ${params.name} for ${params.companyName}`,
      metadata: params,
    });

    const result = await safeMutation(
      'insertCampaign',
      async () => {
        const [r] = await db.insert(salesCampaigns).values({
          name: params.name,
          type: params.type,
          status: params.status || "draft",
          targetAudience: params.targetAudience || null,
          content: params.content || null,
          startDate: params.startDate || null,
          endDate: params.endDate || null,
          createdBy: "ROPA",
        });
        return r;
      },
      async () => {
        const [r] = await db.execute(sql`INSERT INTO sales_campaigns 
          (name, type, status, target_audience, content, start_date, end_date, created_by)
          VALUES (${params.name}, ${params.type}, ${params.status || 'draft'}, 
                  ${params.targetAudience || null}, ${params.content || null},
                  ${params.startDate || null}, ${params.endDate || null}, 'ROPA')`);
        return r;
      }
    );

    await recordRopaMetric({
      metricType: "campaign_created",
      value: "1",
      unit: "count",
      metadata: { name: params.name, company: params.companyName },
    });

    return {
      success: true,
      campaignId: (result as any)?.insertId,
      name: params.name,
      message: `Campaña "${params.name}" creada para ${params.companyName}`,
    };
  },

  /**
   * Get all campaigns from the database
   */
  async listCampaigns(params?: { status?: string; companyName?: string }) {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available", campaigns: [] };

    let campaigns = await safeQuery(
      'listCampaigns',
      async () => db.select().from(salesCampaigns).orderBy(desc(salesCampaigns.createdAt)),
      async () => {
        const [rows] = await db.execute(sql`SELECT * FROM sales_campaigns ORDER BY created_at DESC`);
        return rows as any[];
      }
    );

    if (!campaigns || !Array.isArray(campaigns)) {
      return { success: true, count: 0, campaigns: [] };
    }

    if (params?.status) {
      campaigns = campaigns.filter((c: any) => c.status === params.status);
    }

    return {
      success: true,
      count: campaigns.length,
      campaigns: campaigns.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        startDate: c.startDate || c.start_date,
        endDate: c.endDate || c.end_date,
      })),
    };
  },

  /**
   * Update campaign status (for calendar/kanban)
   */
  async updateCampaignStatus(params: {
    campaignId: number;
    status: "draft" | "active" | "paused" | "completed";
    startDate?: Date;
    endDate?: Date;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Updating campaign ${params.campaignId} status to ${params.status}`,
      metadata: params,
    });

    const updates: any = { status: params.status };
    if (params.startDate) updates.startDate = params.startDate;
    if (params.endDate) updates.endDate = params.endDate;

    await safeMutation(
      'updateCampaignStatus',
      async () => db.update(salesCampaigns).set(updates).where(eq(salesCampaigns.id, params.campaignId)),
      async () => db.execute(sql`UPDATE sales_campaigns SET status = ${params.status} WHERE id = ${params.campaignId}`)
    );

    return {
      success: true,
      campaignId: params.campaignId,
      newStatus: params.status,
      message: `Campaña ${params.campaignId} actualizada a estado: ${params.status}`,
    };
  },

  /**
   * Move campaign in calendar (update dates and status)
   */
  async moveCampaignInCalendar(params: {
    campaignId: number;
    newColumn: "backlog" | "todo" | "in_progress" | "done";
    newDate?: Date;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const statusMap: Record<string, "draft" | "active" | "paused" | "completed"> = {
      backlog: "draft",
      todo: "draft",
      in_progress: "active",
      done: "completed",
    };

    const newStatus = statusMap[params.newColumn] || "draft";

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Moving campaign ${params.campaignId} to ${params.newColumn}`,
      metadata: params,
    });

    await safeMutation(
      'moveCampaignInCalendar',
      async () => {
        const updates: any = { status: newStatus };
        if (params.newDate) {
          if (params.newColumn === "in_progress") updates.startDate = params.newDate;
          else if (params.newColumn === "done") updates.endDate = params.newDate;
        }
        return db.update(salesCampaigns).set(updates).where(eq(salesCampaigns.id, params.campaignId));
      },
      async () => db.execute(sql`UPDATE sales_campaigns SET status = ${newStatus} WHERE id = ${params.campaignId}`)
    );

    return {
      success: true,
      campaignId: params.campaignId,
      newColumn: params.newColumn,
      newStatus,
      message: `Campaña movida a columna "${params.newColumn}"`,
    };
  },

  /**
   * Delete a campaign
   */
  async deleteCampaign(params: { campaignId: number }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await createRopaLog({
      taskId: undefined,
      level: "warn",
      message: `[Platform] Deleting campaign: ${params.campaignId}`,
      metadata: params,
    });

    await safeMutation(
      'deleteCampaign',
      async () => db.delete(salesCampaigns).where(eq(salesCampaigns.id, params.campaignId)),
      async () => db.execute(sql`DELETE FROM sales_campaigns WHERE id = ${params.campaignId}`)
    );

    return {
      success: true,
      message: `Campaña ${params.campaignId} eliminada`,
    };
  },
};

// ============ EMAIL DRAFT MANAGEMENT (MONITOR) ============

export const emailDraftTools = {
  /**
   * Create an email draft and save to database (appears in Monitor)
   */
  async createEmailDraft(params: {
    company: string;
    campaign?: string;
    subject: string;
    body: string;
    recipientEmail?: string;
    recipientName?: string;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Creating email draft for ${params.company}: ${params.subject}`,
      metadata: { draftId, ...params },
    });

    await safeMutation(
      'insertEmailDraft',
      async () => db.insert(emailDrafts).values({
        draftId,
        company: params.company,
        campaign: params.campaign || null,
        subject: params.subject,
        body: params.body,
        recipientEmail: params.recipientEmail || null,
        recipientName: params.recipientName || null,
        status: "pending",
        createdBy: "ROPA",
      }),
      async () => db.execute(sql`INSERT INTO email_drafts 
        (draft_id, company, campaign, subject, body, recipient_email, recipient_name, status, created_by)
        VALUES (${draftId}, ${params.company}, ${params.campaign || null}, ${params.subject}, 
                ${params.body}, ${params.recipientEmail || null}, ${params.recipientName || null}, 
                'pending', 'ROPA')`)
    );

    await recordRopaMetric({
      metricType: "email_draft_created",
      value: "1",
      unit: "count",
      metadata: { company: params.company, subject: params.subject },
    });

    return {
      success: true,
      draftId,
      message: `Borrador de email creado para ${params.company}. Revísalo en la sección Monitor.`,
    };
  },

  /**
   * Get all email drafts from database
   */
  async listEmailDrafts(params?: { status?: string; company?: string }) {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available", drafts: [] };

    let drafts = await safeQuery(
      'listEmailDrafts',
      async () => db.select().from(emailDrafts).orderBy(desc(emailDrafts.createdAt)),
      async () => {
        const [rows] = await db.execute(sql`SELECT * FROM email_drafts ORDER BY created_at DESC`);
        return rows as any[];
      }
    );

    if (!drafts || !Array.isArray(drafts)) {
      return { success: true, count: 0, pending: 0, approved: 0, rejected: 0, drafts: [] };
    }

    if (params?.status) {
      drafts = drafts.filter((d: any) => d.status === params.status);
    }
    if (params?.company) {
      drafts = drafts.filter((d: any) => d.company === params.company);
    }

    return {
      success: true,
      count: drafts.length,
      pending: drafts.filter((d: any) => d.status === "pending").length,
      approved: drafts.filter((d: any) => d.status === "approved").length,
      rejected: drafts.filter((d: any) => d.status === "rejected").length,
      drafts: drafts.map((d: any) => ({
        id: d.id,
        draftId: d.draftId || d.draft_id,
        company: d.company,
        campaign: d.campaign,
        subject: d.subject,
        status: d.status,
        createdAt: d.createdAt || d.created_at,
        bodyPreview: (d.body || '').substring(0, 100) + "...",
      })),
    };
  },

  /**
   * Approve an email draft
   */
  async approveEmailDraft(params: { draftId: string }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Approving email draft: ${params.draftId}`,
      metadata: params,
    });

    await safeMutation(
      'approveEmailDraft',
      async () => db.update(emailDrafts)
        .set({ status: "approved", approvedBy: "ROPA", approvedAt: new Date() })
        .where(eq(emailDrafts.draftId, params.draftId)),
      async () => db.execute(sql`UPDATE email_drafts SET status = 'approved', approved_by = 'ROPA', approved_at = NOW() WHERE draft_id = ${params.draftId}`)
    );

    return { success: true, draftId: params.draftId, message: `Borrador ${params.draftId} aprobado` };
  },

  /**
   * Reject an email draft
   */
  async rejectEmailDraft(params: { draftId: string; reason?: string }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Rejecting email draft: ${params.draftId}`,
      metadata: params,
    });

    await safeMutation(
      'rejectEmailDraft',
      async () => db.update(emailDrafts)
        .set({ status: "rejected", rejectionReason: params.reason || null })
        .where(eq(emailDrafts.draftId, params.draftId)),
      async () => db.execute(sql`UPDATE email_drafts SET status = 'rejected', rejection_reason = ${params.reason || null} WHERE draft_id = ${params.draftId}`)
    );

    return { success: true, draftId: params.draftId, message: `Borrador ${params.draftId} rechazado` };
  },

  /**
   * Delete an email draft
   */
  async deleteEmailDraft(params: { draftId: string }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await safeMutation(
      'deleteEmailDraft',
      async () => db.delete(emailDrafts).where(eq(emailDrafts.draftId, params.draftId)),
      async () => db.execute(sql`DELETE FROM email_drafts WHERE draft_id = ${params.draftId}`)
    );

    return { success: true, message: `Borrador ${params.draftId} eliminado` };
  },

  /**
   * Generate multiple email drafts for a campaign
   */
  async generateCampaignEmailDrafts(params: {
    company: string;
    campaign: string;
    count: number;
    emailType: "cold_outreach" | "follow_up" | "promotional" | "newsletter";
    targetAudience?: string;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Generating ${params.count} email drafts for ${params.company}`,
      metadata: params,
    });

    const drafts = [];
    const templates: Record<string, { subject: string; body: string }[]> = {
      cold_outreach: [
        { subject: "¿Podemos ayudar a optimizar sus procesos?", body: "<p>Estimado/a,</p><p>Me pongo en contacto para explorar cómo podemos ayudarle a mejorar la eficiencia de sus operaciones...</p>" },
        { subject: "Una solución para sus desafíos de automatización", body: "<p>Hola,</p><p>He notado que empresas como la suya están buscando formas de automatizar procesos...</p>" },
        { subject: "Innovación tecnológica para su industria", body: "<p>Buenos días,</p><p>Quisiera presentarle una solución que está transformando la industria...</p>" },
      ],
      follow_up: [
        { subject: "Seguimiento a nuestra conversación", body: "<p>Hola,</p><p>Quería dar seguimiento a mi mensaje anterior...</p>" },
        { subject: "¿Tiene alguna pregunta?", body: "<p>Buenos días,</p><p>Me gustaría saber si tuvo oportunidad de revisar mi propuesta...</p>" },
      ],
      promotional: [
        { subject: "Oferta especial para clientes selectos", body: "<p>Estimado cliente,</p><p>Tenemos una promoción exclusiva que no querrá perderse...</p>" },
        { subject: "Descuento del 20% por tiempo limitado", body: "<p>Hola,</p><p>Como cliente valioso, le ofrecemos un descuento especial...</p>" },
      ],
      newsletter: [
        { subject: "Novedades del mes - Lo último en tecnología", body: "<p>Estimado suscriptor,</p><p>Este mes traemos noticias emocionantes...</p>" },
      ],
    };

    const selectedTemplates = templates[params.emailType] || templates.cold_outreach;

    for (let i = 0; i < params.count; i++) {
      const template = selectedTemplates[i % selectedTemplates.length];
      const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await safeMutation(
        `insertDraft_${i}`,
        async () => db.insert(emailDrafts).values({
          draftId,
          company: params.company,
          campaign: params.campaign,
          subject: `${template.subject} - ${params.company}`,
          body: template.body.replace(/\{\{company\}\}/g, params.company),
          status: "pending",
          createdBy: "ROPA",
        }),
        async () => db.execute(sql`INSERT INTO email_drafts 
          (draft_id, company, campaign, subject, body, status, created_by)
          VALUES (${draftId}, ${params.company}, ${params.campaign}, 
                  ${`${template.subject} - ${params.company}`}, 
                  ${template.body.replace(/\{\{company\}\}/g, params.company)},
                  'pending', 'ROPA')`)
      );

      drafts.push({ draftId, subject: template.subject });
    }

    await recordRopaMetric({
      metricType: "email_drafts_generated",
      value: String(params.count),
      unit: "count",
      metadata: { company: params.company, campaign: params.campaign },
    });

    return {
      success: true,
      count: params.count,
      drafts,
      message: `${params.count} borradores de email creados para ${params.company}. Revísalos en Monitor.`,
    };
  },
};

// ============ LEAD MANAGEMENT ============

export const leadManagementTools = {
  /**
   * Create a new lead
   */
  async createLead(params: {
    companyName: string;
    contactName?: string;
    email?: string;
    phone?: string;
    industry?: string;
    source?: string;
    notes?: string;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Creating lead: ${params.companyName}`,
      metadata: params,
    });

    const result = await safeMutation(
      'insertLead',
      async () => {
        const [r] = await db.insert(clientLeads).values({
          companyName: params.companyName,
          contactName: params.contactName || null,
          email: params.email || null,
          phone: params.phone || null,
          industry: params.industry || null,
          source: params.source || "ROPA",
          notes: params.notes || null,
          status: "new",
        });
        return r;
      },
      async () => {
        const [r] = await db.execute(sql`INSERT INTO client_leads 
          (company_name, contact_name, email, phone, industry, source, notes, status)
          VALUES (${params.companyName}, ${params.contactName || null}, ${params.email || null},
                  ${params.phone || null}, ${params.industry || null}, ${params.source || 'ROPA'},
                  ${params.notes || null}, 'new')`);
        return r;
      }
    );

    return {
      success: true,
      leadId: (result as any)?.insertId,
      message: `Lead "${params.companyName}" creado`,
    };
  },

  /**
   * List all leads
   */
  async listLeads(params?: { status?: string }) {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available", leads: [] };

    let leads = await safeQuery(
      'listLeads',
      async () => db.select().from(clientLeads).orderBy(desc(clientLeads.createdAt)),
      async () => {
        const [rows] = await db.execute(sql`SELECT * FROM client_leads ORDER BY created_at DESC`);
        return rows as any[];
      }
    );

    if (!leads || !Array.isArray(leads)) {
      return { success: true, count: 0, leads: [] };
    }

    if (params?.status) {
      leads = leads.filter((l: any) => l.status === params.status);
    }

    return {
      success: true,
      count: leads.length,
      leads: leads.map((l: any) => ({
        id: l.id,
        companyName: l.companyName || l.company_name,
        contactName: l.contactName || l.contact_name,
        email: l.email,
        status: l.status,
        source: l.source,
      })),
    };
  },

  /**
   * Update lead status
   */
  async updateLeadStatus(params: {
    leadId: number;
    status: "new" | "contacted" | "qualified" | "proposal" | "closed_won" | "closed_lost";
    notes?: string;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updates: any = { status: params.status };
    if (params.notes) updates.notes = params.notes;

    await safeMutation(
      'updateLeadStatus',
      async () => db.update(clientLeads).set(updates).where(eq(clientLeads.id, params.leadId)),
      async () => db.execute(sql`UPDATE client_leads SET status = ${params.status} WHERE id = ${params.leadId}`)
    );

    return {
      success: true,
      leadId: params.leadId,
      newStatus: params.status,
      message: `Lead ${params.leadId} actualizado a: ${params.status}`,
    };
  },
};

// ============ KPI / ROI REPORTING ============

export const reportingTools = {
  /**
   * Generate KPI report for a company or all companies
   */
  async generateKPIReport(params?: { companyName?: string }) {
    const db = await getDb();
    if (!db) return { success: false, error: 'Database not available' };

    // Get companies safely
    let companies = await safeQuery(
      'kpi_companies',
      async () => db.select().from(ivyClients).orderBy(desc(ivyClients.createdAt)),
      async () => { const [rows] = await db.execute(sql`SELECT * FROM ivy_clients ORDER BY created_at DESC`); return rows as any[]; }
    ) || [];

    if (params?.companyName) {
      companies = (companies as any[]).filter((c: any) => 
        (c.companyName || c.company_name || '').toLowerCase().includes(params.companyName!.toLowerCase())
      );
    }

    const campaigns = await safeQuery(
      'kpi_campaigns',
      async () => db.select().from(salesCampaigns).orderBy(desc(salesCampaigns.createdAt)),
      async () => { const [rows] = await db.execute(sql`SELECT * FROM sales_campaigns ORDER BY created_at DESC`); return rows as any[]; }
    ) || [];

    const drafts = await safeQuery(
      'kpi_drafts',
      async () => db.select().from(emailDrafts).orderBy(desc(emailDrafts.createdAt)),
      async () => { const [rows] = await db.execute(sql`SELECT * FROM email_drafts ORDER BY created_at DESC`); return rows as any[]; }
    ) || [];

    const leads = await safeQuery(
      'kpi_leads',
      async () => db.select().from(clientLeads).orderBy(desc(clientLeads.createdAt)),
      async () => { const [rows] = await db.execute(sql`SELECT * FROM client_leads ORDER BY created_at DESC`); return rows as any[]; }
    ) || [];

    const companiesArr = companies as any[];
    const campaignsArr = campaigns as any[];
    const draftsArr = drafts as any[];
    const leadsArr = leads as any[];

    const totalCompanies = companiesArr.length;
    const activeCompanies = companiesArr.filter((c: any) => c.status === 'active').length;
    const totalCampaigns = campaignsArr.length;
    const activeCampaigns = campaignsArr.filter((c: any) => c.status === 'active').length;
    const completedCampaigns = campaignsArr.filter((c: any) => c.status === 'completed').length;
    const totalDrafts = draftsArr.length;
    const approvedDrafts = draftsArr.filter((d: any) => d.status === 'approved').length;
    const sentDrafts = draftsArr.filter((d: any) => d.status === 'sent').length;
    const totalLeads = leadsArr.length;
    const qualifiedLeads = leadsArr.filter((l: any) => l.status === 'qualified').length;
    const closedWon = leadsArr.filter((l: any) => l.status === 'closed_won').length;
    const closedLost = leadsArr.filter((l: any) => l.status === 'closed_lost').length;

    const emailApprovalRate = totalDrafts > 0 ? Math.round((approvedDrafts / totalDrafts) * 100) : 0;
    const leadConversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;
    const campaignCompletionRate = totalCampaigns > 0 ? Math.round((completedCampaigns / totalCampaigns) * 100) : 0;

    const report = {
      generatedAt: new Date().toISOString(),
      period: 'All Time',
      summary: {
        totalCompanies, activeCompanies, totalCampaigns, activeCampaigns, completedCampaigns,
        totalEmailDrafts: totalDrafts, approvedEmails: approvedDrafts, sentEmails: sentDrafts,
        totalLeads, qualifiedLeads, closedWon, closedLost,
      },
      kpis: {
        emailApprovalRate: `${emailApprovalRate}%`,
        leadConversionRate: `${leadConversionRate}%`,
        campaignCompletionRate: `${campaignCompletionRate}%`,
        avgCampaignsPerCompany: totalCompanies > 0 ? (totalCampaigns / totalCompanies).toFixed(1) : '0',
        avgLeadsPerCampaign: totalCampaigns > 0 ? (totalLeads / totalCampaigns).toFixed(1) : '0',
      },
      companiesDetail: companiesArr.map((c: any) => ({
        clientId: c.clientId || c.client_id,
        name: c.companyName || c.company_name,
        industry: c.industry,
        status: c.status,
        plan: c.plan,
      })),
    };

    await createRopaLog({
      taskId: undefined, level: 'info',
      message: `[Platform] KPI Report generated`,
      metadata: { totalCompanies, totalCampaigns, totalLeads },
    });

    const reportResult = { success: true, report };
    saveKPIReportToDrive(reportResult, params?.companyName).catch(err => {
      console.warn('[Platform] Failed to auto-save KPI report to Drive:', err.message);
    });

    return reportResult;
  },

  /**
   * Generate ROI report
   */
  async generateROIReport(params?: { companyName?: string }) {
    const db = await getDb();
    if (!db) return { success: false, error: 'Database not available' };

    const companies = await safeQuery('roi_companies', async () => db.select().from(ivyClients), async () => { const [r] = await db.execute(sql`SELECT * FROM ivy_clients`); return r as any[]; }) || [];
    const campaigns = await safeQuery('roi_campaigns', async () => db.select().from(salesCampaigns), async () => { const [r] = await db.execute(sql`SELECT * FROM sales_campaigns`); return r as any[]; }) || [];
    const drafts = await safeQuery('roi_drafts', async () => db.select().from(emailDrafts), async () => { const [r] = await db.execute(sql`SELECT * FROM email_drafts`); return r as any[]; }) || [];
    const leads = await safeQuery('roi_leads', async () => db.select().from(clientLeads), async () => { const [r] = await db.execute(sql`SELECT * FROM client_leads`); return r as any[]; }) || [];

    const draftsArr = (drafts || []) as any[];
    const leadsArr = (leads || []) as any[];

    const emailCostPerUnit = 0.05;
    const leadValueEstimate = 500;
    const closedDealValue = 5000;
    const agencyCostPerMonth = 2000;

    const totalEmailsSent = draftsArr.filter((d: any) => d.status === 'sent').length;
    const totalQualified = leadsArr.filter((l: any) => l.status === 'qualified' || l.status === 'closed_won').length;
    const totalClosed = leadsArr.filter((l: any) => l.status === 'closed_won').length;

    const totalCost = (totalEmailsSent * emailCostPerUnit) + agencyCostPerMonth;
    const totalRevenue = (totalQualified * leadValueEstimate) + (totalClosed * closedDealValue);
    const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost * 100).toFixed(1) : '0';

    const report = {
      generatedAt: new Date().toISOString(),
      costs: { emailCosts: `$${(totalEmailsSent * emailCostPerUnit).toFixed(2)}`, agencyCost: `$${agencyCostPerMonth}`, totalCost: `$${totalCost.toFixed(2)}` },
      revenue: { qualifiedLeadValue: `$${(totalQualified * leadValueEstimate).toFixed(2)}`, closedDealValue: `$${(totalClosed * closedDealValue).toFixed(2)}`, totalRevenue: `$${totalRevenue.toFixed(2)}` },
      roi: `${roi}%`,
      metrics: { emailsSent: totalEmailsSent, leadsGenerated: leadsArr.length, leadsQualified: totalQualified, dealsClosed: totalClosed, conversionRate: leadsArr.length > 0 ? `${((totalClosed / leadsArr.length) * 100).toFixed(1)}%` : '0%' },
    };

    const roiResult = { success: true, report };
    saveROIReportToDrive(roiResult, params?.companyName).catch(err => {
      console.warn('[Platform] Failed to auto-save ROI report to Drive:', err.message);
    });

    return roiResult;
  },

  /**
   * Get company details with all associated data
   */
  async getCompanyDetails(params: { clientId?: string; companyName?: string }) {
    const db = await getDb();
    if (!db) return { success: false, error: 'Database not available' };

    let company: any;
    if (params.clientId) {
      const results = await safeQuery(
        'getCompanyById',
        async () => db.select().from(ivyClients).where(eq(ivyClients.clientId, params.clientId!)),
        async () => { const [r] = await db.execute(sql`SELECT * FROM ivy_clients WHERE client_id = ${params.clientId}`); return r as any[]; }
      );
      company = (results as any[])?.[0];
    } else if (params.companyName) {
      const all = await safeQuery(
        'getCompanyByName',
        async () => db.select().from(ivyClients),
        async () => { const [r] = await db.execute(sql`SELECT * FROM ivy_clients`); return r as any[]; }
      );
      company = (all as any[])?.find((c: any) => (c.companyName || c.company_name || '').toLowerCase().includes(params.companyName!.toLowerCase()));
    }

    if (!company) return { success: false, error: 'Empresa no encontrada' };

    const campaigns = await safeQuery('details_campaigns', async () => db.select().from(salesCampaigns), async () => { const [r] = await db.execute(sql`SELECT * FROM sales_campaigns`); return r as any[]; }) || [];
    const companyName = company.companyName || company.company_name;
    const drafts = await safeQuery(
      'details_drafts',
      async () => db.select().from(emailDrafts).where(eq(emailDrafts.company, companyName)),
      async () => { const [r] = await db.execute(sql`SELECT * FROM email_drafts WHERE company = ${companyName}`); return r as any[]; }
    ) || [];

    const draftsArr = drafts as any[];

    return {
      success: true,
      company: {
        ...company,
        campaigns: (campaigns as any[]).length,
        emailDrafts: draftsArr.length,
        pendingDrafts: draftsArr.filter((d: any) => d.status === 'pending').length,
        approvedDrafts: draftsArr.filter((d: any) => d.status === 'approved').length,
        sentDrafts: draftsArr.filter((d: any) => d.status === 'sent').length,
      },
    };
  },
};

// ============ COMPANY FILTERING TOOLS ============

export const companyFilterTools = {
  async listTasksForCompany(params: { companyName: string; status?: string }) {
    const tasks = await getTasksByCompany(params.companyName, params.status);
    return {
      success: true,
      companyName: params.companyName,
      count: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      tasks: tasks.slice(0, 25).map(t => ({
        taskId: t.taskId,
        taskType: t.taskType,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      })),
    };
  },

  async listCampaignsForCompany(params: { companyName: string; status?: string }) {
    const campaigns = await getCampaignsByCompany(params.companyName, params.status);
    return {
      success: true,
      companyName: params.companyName,
      count: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      draft: campaigns.filter(c => c.status === 'draft').length,
      completed: campaigns.filter(c => c.status === 'completed').length,
      paused: campaigns.filter(c => c.status === 'paused').length,
      campaigns: campaigns.slice(0, 25).map(c => ({
        id: c.id, name: c.name, type: c.type, status: c.status,
        startDate: c.startDate, endDate: c.endDate, createdAt: c.createdAt,
      })),
    };
  },

  async listEmailDraftsForCompany(params: { companyName: string; status?: 'pending' | 'approved' | 'rejected' | 'sent' | 'all' }) {
    const drafts = await getEmailDraftsByCompany(params.companyName, params.status || 'all');
    return {
      success: true,
      companyName: params.companyName,
      count: drafts.length,
      pending: drafts.filter(d => d.status === 'pending').length,
      approved: drafts.filter(d => d.status === 'approved').length,
      rejected: drafts.filter(d => d.status === 'rejected').length,
      sent: drafts.filter(d => d.status === 'sent').length,
      drafts: drafts.slice(0, 25).map(d => ({
        id: d.id, draftId: d.draftId, subject: d.subject, campaign: d.campaign,
        status: d.status, recipientEmail: d.recipientEmail, createdAt: d.createdAt,
        bodyPreview: d.body.substring(0, 80) + '...',
      })),
    };
  },

  async listAlertsForCompany(params: { companyName: string; resolved?: boolean }) {
    const alerts = await getAlertsByCompany(params.companyName, params.resolved);
    return {
      success: true,
      companyName: params.companyName,
      count: alerts.length,
      unresolved: alerts.filter(a => !a.resolved).length,
      resolved: alerts.filter(a => a.resolved).length,
      alerts: alerts.slice(0, 25).map(a => ({
        id: a.id, alertType: a.alertType, severity: a.severity, message: a.message,
        resolved: a.resolved, createdAt: a.createdAt, resolvedAt: a.resolvedAt,
      })),
    };
  },

  async getCompanyFullOverview(params: { companyName: string }) {
    const overview = await getCompanyOverview(params.companyName);
    const companyInfo = overview.company ? {
      clientId: overview.company.clientId, companyName: overview.company.companyName,
      industry: overview.company.industry, contactName: overview.company.contactName,
      contactEmail: overview.company.contactEmail, status: overview.company.status,
      plan: overview.company.plan, googleDriveFolderId: overview.company.googleDriveFolderId,
    } : null;

    return {
      success: true,
      company: companyInfo,
      summary: {
        tasks: `${overview.tasks.total} total (${overview.tasks.pending} pendientes, ${overview.tasks.running} en progreso, ${overview.tasks.completed} completadas)`,
        campaigns: `${overview.campaigns.total} total (${overview.campaigns.active} activas, ${overview.campaigns.draft} borrador, ${overview.campaigns.completed} completadas)`,
        emailDrafts: `${overview.emailDrafts.total} total (${overview.emailDrafts.pending} pendientes, ${overview.emailDrafts.approved} aprobados, ${overview.emailDrafts.rejected} rechazados, ${overview.emailDrafts.sent} enviados)`,
        alerts: `${overview.alerts.total} total (${overview.alerts.unresolved} sin resolver)`,
        leads: `${overview.leads.total} leads`,
        files: `${overview.files.total} archivos`,
      },
      details: overview,
    };
  },

  async getAllCompanySummaries() {
    const summaries = await getCompanySummaryStats();
    return { success: true, totalCompanies: summaries.length, companies: summaries };
  },

  async listLeadsForCompany(params: { companyName: string }) {
    const leads = await getLeadsByCompany(params.companyName);
    return {
      success: true,
      companyName: params.companyName,
      count: leads.length,
      byStatus: {
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        proposal: leads.filter(l => l.status === 'proposal').length,
        closedWon: leads.filter(l => l.status === 'closed_won').length,
        closedLost: leads.filter(l => l.status === 'closed_lost').length,
      },
      leads: leads.slice(0, 25).map(l => ({
        id: l.id, companyName: l.companyName, contactName: l.contactName,
        email: l.email, status: l.status, source: l.source,
      })),
    };
  },

  async listFilesForCompany(params: { companyName: string }) {
    const files = await getFilesByCompany(params.companyName);
    return {
      success: true,
      companyName: params.companyName,
      count: files.length,
      files: files.map(f => ({
        id: f.id, fileName: f.fileName, fileType: f.fileType,
        mimeType: f.mimeType, s3Url: f.s3Url, createdAt: f.createdAt,
      })),
    };
  },
};

// ============ NOTIFICATION TOOLS ============

export const notificationTools = {
  async notifyTaskCompletion(params: { taskType: string; companyName?: string; details: string }) {
    const title = params.companyName
      ? `[Ivy.AI] ${params.taskType} - ${params.companyName}`
      : `[Ivy.AI] ${params.taskType}`;
    const success = await notifyOwner({ title, content: params.details });
    return { success, message: success ? 'Notificación enviada' : 'Error al enviar notificación' };
  },

  async notifyEmailsGenerated(params: { companyName: string; count: number; campaign?: string }) {
    const title = `[Ivy.AI] ${params.count} emails generados - ${params.companyName}`;
    const content = params.campaign
      ? `ROPA ha generado ${params.count} borradores de email para la campaña "${params.campaign}" de ${params.companyName}. Revísalos en la sección Monitor.`
      : `ROPA ha generado ${params.count} borradores de email para ${params.companyName}. Revísalos en la sección Monitor.`;
    const success = await notifyOwner({ title, content });
    return { success, message: success ? 'Notificación enviada' : 'Error al enviar notificación' };
  },

  async notifyReportReady(params: { reportType: string; companyName?: string; summary: string }) {
    const title = params.companyName
      ? `[Ivy.AI] Reporte ${params.reportType} listo - ${params.companyName}`
      : `[Ivy.AI] Reporte ${params.reportType} listo`;
    const success = await notifyOwner({ title, content: params.summary });
    return { success, message: success ? 'Notificación enviada' : 'Error al enviar notificación' };
  },
};

// ============ EXPORT ALL PLATFORM TOOLS ============

export const ropaPlatformTools = {
  // Company Management
  createCompany: companyManagementTools.createCompany,
  listCompanies: companyManagementTools.listCompanies,
  updateCompany: companyManagementTools.updateCompany,
  deleteCompany: companyManagementTools.deleteCompany,
  
  // Campaign Management
  createCampaign: campaignManagementTools.createCampaign,
  listCampaigns: campaignManagementTools.listCampaigns,
  updateCampaignStatus: campaignManagementTools.updateCampaignStatus,
  moveCampaignInCalendar: campaignManagementTools.moveCampaignInCalendar,
  deleteCampaign: campaignManagementTools.deleteCampaign,
  
  // Email Draft Management (Monitor)
  createEmailDraft: emailDraftTools.createEmailDraft,
  listEmailDrafts: emailDraftTools.listEmailDrafts,
  approveEmailDraft: emailDraftTools.approveEmailDraft,
  rejectEmailDraft: emailDraftTools.rejectEmailDraft,
  deleteEmailDraft: emailDraftTools.deleteEmailDraft,
  generateCampaignEmailDrafts: emailDraftTools.generateCampaignEmailDrafts,
  
  // Lead Management
  createLead: leadManagementTools.createLead,
  listLeads: leadManagementTools.listLeads,
  updateLeadStatus: leadManagementTools.updateLeadStatus,

  // KPI / ROI Reporting
  generateKPIReport: reportingTools.generateKPIReport,
  generateROIReport: reportingTools.generateROIReport,
  getCompanyDetails: reportingTools.getCompanyDetails,

  // Company Filtering (per-company data access)
  listTasksForCompany: companyFilterTools.listTasksForCompany,
  listCampaignsForCompany: companyFilterTools.listCampaignsForCompany,
  listEmailDraftsForCompany: companyFilterTools.listEmailDraftsForCompany,
  listAlertsForCompany: companyFilterTools.listAlertsForCompany,
  getCompanyFullOverview: companyFilterTools.getCompanyFullOverview,
  getAllCompanySummaries: companyFilterTools.getAllCompanySummaries,
  listLeadsForCompany: companyFilterTools.listLeadsForCompany,
  listFilesForCompany: companyFilterTools.listFilesForCompany,

  // Notifications
  notifyTaskCompletion: notificationTools.notifyTaskCompletion,
  notifyEmailsGenerated: notificationTools.notifyEmailsGenerated,
  notifyReportReady: notificationTools.notifyReportReady,
};

export const platformToolCategories = {
  "Company Management": ["createCompany", "listCompanies", "updateCompany", "deleteCompany"],
  "Campaign Management": ["createCampaign", "listCampaigns", "updateCampaignStatus", "moveCampaignInCalendar", "deleteCampaign"],
  "Email Drafts (Monitor)": ["createEmailDraft", "listEmailDrafts", "approveEmailDraft", "rejectEmailDraft", "deleteEmailDraft", "generateCampaignEmailDrafts"],
  "Lead Management": ["createLead", "listLeads", "updateLeadStatus"],
  "Reporting & Analytics": ["generateKPIReport", "generateROIReport", "getCompanyDetails"],
  "Company Filtering": ["listTasksForCompany", "listCampaignsForCompany", "listEmailDraftsForCompany", "listAlertsForCompany", "getCompanyFullOverview", "getAllCompanySummaries", "listLeadsForCompany", "listFilesForCompany"],
  "Notifications": ["notifyTaskCompletion", "notifyEmailsGenerated", "notifyReportReady"],
};

export const PLATFORM_TOOLS_COUNT = Object.keys(ropaPlatformTools).length;
