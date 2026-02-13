/**
 * ROPA Company Filters - Database query functions for filtering all data by company
 * 
 * Provides tools for ROPA to filter:
 * - Tasks by company
 * - Campaigns by company  
 * - Email drafts by company (with status filter: pending/approved/rejected/sent)
 * - Alerts by company
 * - Full company overview (all data combined)
 * - Company list with summary stats
 */

import { eq, desc, and, like, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  ropaTasks,
  ropaAlerts,
  salesCampaigns,
  emailDrafts,
  ivyClients,
  campaignContent,
  clientLeads,
  companyFiles,
  clientLists,
} from "../drizzle/schema";

// ============ HELPER: Fuzzy company name matching ============

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s]/g, '')
    .trim();
}

/**
 * Find a company by fuzzy name match
 */
export async function findCompanyByName(companyName: string) {
  const db = await getDb();
  if (!db) return null;

  const normalized = normalizeCompanyName(companyName);
  
  // Try exact match first
  const clients = await db.select().from(ivyClients).limit(100);
  
  // Fuzzy match: check if the search term is contained in company name or vice versa
  const match = clients.find(c => {
    const cn = normalizeCompanyName(c.companyName);
    return cn === normalized || cn.includes(normalized) || normalized.includes(cn);
  });
  
  return match || null;
}

/**
 * List all companies with summary stats
 */
export async function listAllCompanies() {
  const db = await getDb();
  if (!db) return [];

  const clients = await db.select().from(ivyClients).orderBy(desc(ivyClients.createdAt));
  return clients;
}

// ============ TASKS BY COMPANY ============

export async function getTasksByCompany(companyName: string, statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  // Get all tasks and filter by company name in taskType or output
  const allTasks = await db.select().from(ropaTasks).orderBy(desc(ropaTasks.createdAt)).limit(200);
  
  return allTasks.filter(task => {
    const taskStr = JSON.stringify(task).toLowerCase();
    const matchesCompany = taskStr.includes(normalized) || 
      (task.taskType && normalizeCompanyName(task.taskType).includes(normalized));
    const matchesStatus = !statusFilter || task.status === statusFilter;
    return matchesCompany && matchesStatus;
  });
}

// ============ CAMPAIGNS BY COMPANY ============

export async function getCampaignsByCompany(companyName: string, statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  // Get campaigns - check name and targetAudience fields
  const allCampaigns = await db.select().from(salesCampaigns).orderBy(desc(salesCampaigns.createdAt)).limit(200);
  
  return allCampaigns.filter(campaign => {
    const campaignStr = JSON.stringify(campaign).toLowerCase();
    const matchesCompany = campaignStr.includes(normalized);
    const matchesStatus = !statusFilter || campaign.status === statusFilter;
    return matchesCompany && matchesStatus;
  });
}

// ============ EMAIL DRAFTS BY COMPANY ============

export async function getEmailDraftsByCompany(
  companyName: string, 
  statusFilter?: 'pending' | 'approved' | 'rejected' | 'sent' | 'all'
) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  // Email drafts have a 'company' field directly
  let drafts;
  if (statusFilter && statusFilter !== 'all') {
    drafts = await db.select().from(emailDrafts)
      .where(eq(emailDrafts.status, statusFilter))
      .orderBy(desc(emailDrafts.createdAt))
      .limit(200);
  } else {
    drafts = await db.select().from(emailDrafts)
      .orderBy(desc(emailDrafts.createdAt))
      .limit(200);
  }
  
  return drafts.filter(draft => {
    return normalizeCompanyName(draft.company).includes(normalized) ||
           normalized.includes(normalizeCompanyName(draft.company));
  });
}

// ============ CAMPAIGN CONTENT BY COMPANY ============

export async function getCampaignContentByCompany(
  companyName: string,
  statusFilter?: 'pending' | 'approved' | 'rejected' | 'sent' | 'all'
) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  let content;
  if (statusFilter && statusFilter !== 'all') {
    content = await db.select().from(campaignContent)
      .where(eq(campaignContent.status, statusFilter))
      .orderBy(desc(campaignContent.createdAt))
      .limit(200);
  } else {
    content = await db.select().from(campaignContent)
      .orderBy(desc(campaignContent.createdAt))
      .limit(200);
  }
  
  return content.filter(c => {
    return normalizeCompanyName(c.companyName).includes(normalized) ||
           normalized.includes(normalizeCompanyName(c.companyName));
  });
}

// ============ ALERTS BY COMPANY ============

export async function getAlertsByCompany(companyName: string, resolvedFilter?: boolean) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  let alerts;
  if (resolvedFilter !== undefined) {
    alerts = await db.select().from(ropaAlerts)
      .where(eq(ropaAlerts.resolved, resolvedFilter))
      .orderBy(desc(ropaAlerts.createdAt))
      .limit(200);
  } else {
    alerts = await db.select().from(ropaAlerts)
      .orderBy(desc(ropaAlerts.createdAt))
      .limit(200);
  }
  
  return alerts.filter(alert => {
    const alertStr = JSON.stringify(alert).toLowerCase();
    return alertStr.includes(normalized);
  });
}

// ============ LEADS BY COMPANY ============

export async function getLeadsByCompany(companyName: string) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  const leads = await db.select().from(clientLeads)
    .orderBy(desc(clientLeads.createdAt))
    .limit(200);
  
  return leads.filter(lead => {
    return normalizeCompanyName(lead.companyName).includes(normalized) ||
           normalized.includes(normalizeCompanyName(lead.companyName));
  });
}

// ============ FILES BY COMPANY ============

export async function getFilesByCompany(companyName: string) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  const files = await db.select().from(companyFiles)
    .orderBy(desc(companyFiles.createdAt))
    .limit(200);
  
  return files.filter(file => {
    return normalizeCompanyName(file.companyName).includes(normalized) ||
           normalized.includes(normalizeCompanyName(file.companyName));
  });
}

// ============ FULL COMPANY OVERVIEW ============

export interface CompanyOverview {
  company: any | null;
  tasks: { total: number; pending: number; running: number; completed: number; failed: number; items: any[] };
  campaigns: { total: number; active: number; draft: number; completed: number; paused: number; items: any[] };
  emailDrafts: { total: number; pending: number; approved: number; rejected: number; sent: number; items: any[] };
  campaignContent: { total: number; pending: number; approved: number; rejected: number; sent: number; items: any[] };
  alerts: { total: number; unresolved: number; resolved: number; items: any[] };
  leads: { total: number; items: any[] };
  files: { total: number; items: any[] };
}

export async function getCompanyOverview(companyName: string): Promise<CompanyOverview> {
  const company = await findCompanyByName(companyName);
  
  const [tasks, campaigns, drafts, content, alerts, leads, files] = await Promise.all([
    getTasksByCompany(companyName),
    getCampaignsByCompany(companyName),
    getEmailDraftsByCompany(companyName, 'all'),
    getCampaignContentByCompany(companyName, 'all'),
    getAlertsByCompany(companyName),
    getLeadsByCompany(companyName),
    getFilesByCompany(companyName),
  ]);

  return {
    company,
    tasks: {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      running: tasks.filter(t => t.status === 'running').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      items: tasks.slice(0, 20),
    },
    campaigns: {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'active').length,
      draft: campaigns.filter(c => c.status === 'draft').length,
      completed: campaigns.filter(c => c.status === 'completed').length,
      paused: campaigns.filter(c => c.status === 'paused').length,
      items: campaigns.slice(0, 20),
    },
    emailDrafts: {
      total: drafts.length,
      pending: drafts.filter(d => d.status === 'pending').length,
      approved: drafts.filter(d => d.status === 'approved').length,
      rejected: drafts.filter(d => d.status === 'rejected').length,
      sent: drafts.filter(d => d.status === 'sent').length,
      items: drafts.slice(0, 20),
    },
    campaignContent: {
      total: content.length,
      pending: content.filter(c => c.status === 'pending').length,
      approved: content.filter(c => c.status === 'approved').length,
      rejected: content.filter(c => c.status === 'rejected').length,
      sent: content.filter(c => c.status === 'sent').length,
      items: content.slice(0, 20),
    },
    alerts: {
      total: alerts.length,
      unresolved: alerts.filter(a => !a.resolved).length,
      resolved: alerts.filter(a => a.resolved).length,
      items: alerts.slice(0, 20),
    },
    leads: {
      total: leads.length,
      items: leads.slice(0, 20),
    },
    files: {
      total: files.length,
      items: files.slice(0, 20),
    },
  };
}

// ============ SUMMARY STATS PER COMPANY ============

export async function getCompanySummaryStats() {
  const companies = await listAllCompanies();
  
  const summaries = await Promise.all(
    companies.map(async (company) => {
      const [tasks, campaigns, drafts, alerts] = await Promise.all([
        getTasksByCompany(company.companyName),
        getCampaignsByCompany(company.companyName),
        getEmailDraftsByCompany(company.companyName, 'all'),
        getAlertsByCompany(company.companyName),
      ]);

      return {
        clientId: company.clientId,
        companyName: company.companyName,
        status: company.status,
        plan: company.plan,
        tasks: tasks.length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        campaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        emailDrafts: drafts.length,
        pendingEmails: drafts.filter(d => d.status === 'pending').length,
        unresolvedAlerts: alerts.filter(a => !a.resolved).length,
      };
    })
  );

  return summaries;
}
