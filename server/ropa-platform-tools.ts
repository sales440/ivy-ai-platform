/**
 * ROPA Platform Manipulation Tools
 * Real tools for ROPA to directly manipulate the Ivy.AI platform
 * These tools write directly to the database - no simulation
 */

import { getDb } from "./db";
import { eq, desc, and } from "drizzle-orm";
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

    // Generate unique client ID
    const year = new Date().getFullYear();
    const existingClients = await db.select().from(ivyClients);
    const nextNum = existingClients.length + 1;
    const clientId = `IVY-${year}-${String(nextNum).padStart(4, '0')}`;

    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[Platform] Creating company: ${params.companyName}`,
      metadata: { clientId, ...params },
    });

    const [result] = await db.insert(ivyClients).values({
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

    await recordRopaMetric({
      metricType: "company_created",
      value: "1",
      unit: "count",
      metadata: { clientId, companyName: params.companyName },
    });

    return {
      success: true,
      clientId,
      companyName: params.companyName,
      message: `Empresa "${params.companyName}" creada con ID: ${clientId}`,
    };
  },

  /**
   * Get all companies from the database
   */
  async listCompanies() {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available", companies: [] };

    const companies = await db.select().from(ivyClients).orderBy(desc(ivyClients.createdAt));

    return {
      success: true,
      count: companies.length,
      companies: companies.map(c => ({
        id: c.id,
        clientId: c.clientId,
        name: c.companyName,
        industry: c.industry,
        status: c.status,
        contactEmail: c.contactEmail,
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

    await db.update(ivyClients)
      .set(params.updates)
      .where(eq(ivyClients.clientId, params.clientId));

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

    await db.delete(ivyClients).where(eq(ivyClients.clientId, params.clientId));

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

    const [result] = await db.insert(salesCampaigns).values({
      name: params.name,
      type: params.type,
      status: params.status || "draft",
      targetAudience: params.targetAudience || null,
      content: params.content || null,
      startDate: params.startDate || null,
      endDate: params.endDate || null,
      createdBy: "ROPA",
    });

    await recordRopaMetric({
      metricType: "campaign_created",
      value: "1",
      unit: "count",
      metadata: { name: params.name, company: params.companyName },
    });

    return {
      success: true,
      campaignId: result.insertId,
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

    let campaigns = await db.select().from(salesCampaigns).orderBy(desc(salesCampaigns.createdAt));

    if (params?.status) {
      campaigns = campaigns.filter(c => c.status === params.status);
    }

    return {
      success: true,
      count: campaigns.length,
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
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

    await db.update(salesCampaigns)
      .set(updates)
      .where(eq(salesCampaigns.id, params.campaignId));

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

    // Map column to status
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

    const updates: any = { status: newStatus };
    if (params.newDate) {
      if (params.newColumn === "in_progress") {
        updates.startDate = params.newDate;
      } else if (params.newColumn === "done") {
        updates.endDate = params.newDate;
      }
    }

    await db.update(salesCampaigns)
      .set(updates)
      .where(eq(salesCampaigns.id, params.campaignId));

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

    await db.delete(salesCampaigns).where(eq(salesCampaigns.id, params.campaignId));

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

    await db.insert(emailDrafts).values({
      draftId,
      company: params.company,
      campaign: params.campaign || null,
      subject: params.subject,
      body: params.body,
      recipientEmail: params.recipientEmail || null,
      recipientName: params.recipientName || null,
      status: "pending",
      createdBy: "ROPA",
    });

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

    let drafts = await db.select().from(emailDrafts).orderBy(desc(emailDrafts.createdAt));

    if (params?.status) {
      drafts = drafts.filter(d => d.status === params.status);
    }
    if (params?.company) {
      drafts = drafts.filter(d => d.company === params.company);
    }

    return {
      success: true,
      count: drafts.length,
      pending: drafts.filter(d => d.status === "pending").length,
      approved: drafts.filter(d => d.status === "approved").length,
      rejected: drafts.filter(d => d.status === "rejected").length,
      drafts: drafts.map(d => ({
        id: d.id,
        draftId: d.draftId,
        company: d.company,
        campaign: d.campaign,
        subject: d.subject,
        status: d.status,
        createdAt: d.createdAt,
        bodyPreview: d.body.substring(0, 100) + "...",
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

    await db.update(emailDrafts)
      .set({
        status: "approved",
        approvedBy: "ROPA",
        approvedAt: new Date(),
      })
      .where(eq(emailDrafts.draftId, params.draftId));

    return {
      success: true,
      draftId: params.draftId,
      message: `Borrador ${params.draftId} aprobado`,
    };
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

    await db.update(emailDrafts)
      .set({
        status: "rejected",
        rejectionReason: params.reason || null,
      })
      .where(eq(emailDrafts.draftId, params.draftId));

    return {
      success: true,
      draftId: params.draftId,
      message: `Borrador ${params.draftId} rechazado`,
    };
  },

  /**
   * Delete an email draft
   */
  async deleteEmailDraft(params: { draftId: string }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(emailDrafts).where(eq(emailDrafts.draftId, params.draftId));

    return {
      success: true,
      message: `Borrador ${params.draftId} eliminado`,
    };
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

      await db.insert(emailDrafts).values({
        draftId,
        company: params.company,
        campaign: params.campaign,
        subject: `${template.subject} - ${params.company}`,
        body: template.body.replace(/\{\{company\}\}/g, params.company),
        status: "pending",
        createdBy: "ROPA",
      });

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

    const [result] = await db.insert(clientLeads).values({
      companyName: params.companyName,
      contactName: params.contactName || null,
      email: params.email || null,
      phone: params.phone || null,
      industry: params.industry || null,
      source: params.source || "ROPA",
      notes: params.notes || null,
      status: "new",
    });

    return {
      success: true,
      leadId: result.insertId,
      message: `Lead "${params.companyName}" creado`,
    };
  },

  /**
   * List all leads
   */
  async listLeads(params?: { status?: string }) {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available", leads: [] };

    let leads = await db.select().from(clientLeads).orderBy(desc(clientLeads.createdAt));

    if (params?.status) {
      leads = leads.filter(l => l.status === params.status);
    }

    return {
      success: true,
      count: leads.length,
      leads: leads.map(l => ({
        id: l.id,
        companyName: l.companyName,
        contactName: l.contactName,
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

    await db.update(clientLeads)
      .set(updates)
      .where(eq(clientLeads.id, params.leadId));

    return {
      success: true,
      leadId: params.leadId,
      newStatus: params.status,
      message: `Lead ${params.leadId} actualizado a: ${params.status}`,
    };
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
};

export const platformToolCategories = {
  "Company Management": ["createCompany", "listCompanies", "updateCompany", "deleteCompany"],
  "Campaign Management": ["createCampaign", "listCampaigns", "updateCampaignStatus", "moveCampaignInCalendar", "deleteCampaign"],
  "Email Drafts (Monitor)": ["createEmailDraft", "listEmailDrafts", "approveEmailDraft", "rejectEmailDraft", "deleteEmailDraft", "generateCampaignEmailDrafts"],
  "Lead Management": ["createLead", "listLeads", "updateLeadStatus"],
};

export const PLATFORM_TOOLS_COUNT = Object.keys(ropaPlatformTools).length;
