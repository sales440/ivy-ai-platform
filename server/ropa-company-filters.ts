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
 * 
 * Uses raw SQL fallback for TiDB/MySQL compatibility when Drizzle ORM queries fail.
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
    console.warn(`[CompanyFilters] Drizzle query failed for ${label}:`, err.message?.substring(0, 200));
    if (rawSqlFallback) {
      try {
        return await rawSqlFallback();
      } catch (rawErr: any) {
        console.warn(`[CompanyFilters] Raw SQL fallback also failed for ${label}:`, rawErr.message?.substring(0, 200));
      }
    }
    return null;
  }
}

/**
 * Find a company by fuzzy name match
 */
export async function findCompanyByName(companyName: string) {
  const db = await getDb();
  if (!db) return null;

  const normalized = normalizeCompanyName(companyName);
  
  const clients = await safeQuery(
    'findCompanyByName',
    async () => db.select().from(ivyClients),
    async () => {
      const [rows] = await db.execute(sql`SELECT * FROM ivy_clients`);
      return rows as any[];
    }
  );
  
  if (!clients || !Array.isArray(clients)) return null;
  
  // Fuzzy match: check if the search term is contained in company name or vice versa
  const match = clients.find((c: any) => {
    const cn = normalizeCompanyName(c.companyName || c.company_name || '');
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

  const result = await safeQuery(
    'listAllCompanies',
    async () => db.select().from(ivyClients).orderBy(desc(ivyClients.createdAt)),
    async () => {
      const [rows] = await db.execute(sql`SELECT * FROM ivy_clients ORDER BY created_at DESC`);
      return rows as any[];
    }
  );
  
  return result || [];
}

// ============ TASKS BY COMPANY ============

export async function getTasksByCompany(companyName: string, statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  const allTasks = await safeQuery(
    'getTasksByCompany',
    async () => db.select().from(ropaTasks).orderBy(desc(ropaTasks.createdAt)),
    async () => {
      const [rows] = await db.execute(sql`SELECT * FROM ropa_tasks ORDER BY created_at DESC`);
      return rows as any[];
    }
  );
  
  if (!allTasks || !Array.isArray(allTasks)) return [];
  
  return allTasks.filter((task: any) => {
    const taskStr = JSON.stringify(task).toLowerCase();
    const taskType = task.taskType || task.type || task.task_type || '';
    const matchesCompany = taskStr.includes(normalized) || 
      (taskType && normalizeCompanyName(taskType).includes(normalized));
    const matchesStatus = !statusFilter || task.status === statusFilter;
    return matchesCompany && matchesStatus;
  });
}

// ============ CAMPAIGNS BY COMPANY ============

export async function getCampaignsByCompany(companyName: string, statusFilter?: string) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  const allCampaigns = await safeQuery(
    'getCampaignsByCompany',
    async () => db.select().from(salesCampaigns).orderBy(desc(salesCampaigns.createdAt)),
    async () => {
      const [rows] = await db.execute(sql`SELECT * FROM sales_campaigns ORDER BY created_at DESC`);
      return rows as any[];
    }
  );
  
  if (!allCampaigns || !Array.isArray(allCampaigns)) return [];
  
  return allCampaigns.filter((campaign: any) => {
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
  
  let drafts: any[] | null;
  if (statusFilter && statusFilter !== 'all') {
    drafts = await safeQuery(
      'getEmailDraftsByCompany_filtered',
      async () => db.select().from(emailDrafts)
        .where(eq(emailDrafts.status, statusFilter))
        .orderBy(desc(emailDrafts.createdAt)),
      async () => {
        const [rows] = await db.execute(sql`SELECT * FROM email_drafts WHERE status = ${statusFilter} ORDER BY created_at DESC`);
        return rows as any[];
      }
    );
  } else {
    drafts = await safeQuery(
      'getEmailDraftsByCompany_all',
      async () => db.select().from(emailDrafts)
        .orderBy(desc(emailDrafts.createdAt)),
      async () => {
        const [rows] = await db.execute(sql`SELECT * FROM email_drafts ORDER BY created_at DESC`);
        return rows as any[];
      }
    );
  }
  
  if (!drafts || !Array.isArray(drafts)) return [];
  
  return drafts.filter((draft: any) => {
    const draftCompany = draft.company || draft.companyName || draft.company_name || '';
    return normalizeCompanyName(draftCompany).includes(normalized) ||
           normalized.includes(normalizeCompanyName(draftCompany));
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
  
  let content: any[] | null;
  if (statusFilter && statusFilter !== 'all') {
    content = await safeQuery(
      'getCampaignContentByCompany_filtered',
      async () => db.select().from(campaignContent)
        .where(eq(campaignContent.status, statusFilter))
        .orderBy(desc(campaignContent.createdAt)),
      async () => {
        const [rows] = await db.execute(sql`SELECT * FROM campaign_content WHERE status = ${statusFilter} ORDER BY created_at DESC`);
        return rows as any[];
      }
    );
  } else {
    content = await safeQuery(
      'getCampaignContentByCompany_all',
      async () => db.select().from(campaignContent)
        .orderBy(desc(campaignContent.createdAt)),
      async () => {
        const [rows] = await db.execute(sql`SELECT * FROM campaign_content ORDER BY created_at DESC`);
        return rows as any[];
      }
    );
  }
  
  if (!content || !Array.isArray(content)) return [];
  
  return content.filter((c: any) => {
    const cName = c.companyName || c.company_name || '';
    return normalizeCompanyName(cName).includes(normalized) ||
           normalized.includes(normalizeCompanyName(cName));
  });
}

// ============ ALERTS BY COMPANY ============

export async function getAlertsByCompany(companyName: string, resolvedFilter?: boolean) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  let alerts: any[] | null;
  if (resolvedFilter !== undefined) {
    alerts = await safeQuery(
      'getAlertsByCompany_filtered',
      async () => db.select().from(ropaAlerts)
        .where(eq(ropaAlerts.resolved, resolvedFilter))
        .orderBy(desc(ropaAlerts.createdAt)),
      async () => {
        const resolvedVal = resolvedFilter ? 1 : 0;
        const [rows] = await db.execute(sql`SELECT * FROM ropa_alerts WHERE resolved = ${resolvedVal} ORDER BY created_at DESC`);
        return rows as any[];
      }
    );
  } else {
    alerts = await safeQuery(
      'getAlertsByCompany_all',
      async () => db.select().from(ropaAlerts)
        .orderBy(desc(ropaAlerts.createdAt)),
      async () => {
        const [rows] = await db.execute(sql`SELECT * FROM ropa_alerts ORDER BY created_at DESC`);
        return rows as any[];
      }
    );
  }
  
  if (!alerts || !Array.isArray(alerts)) return [];
  
  return alerts.filter((alert: any) => {
    const alertStr = JSON.stringify(alert).toLowerCase();
    return alertStr.includes(normalized);
  });
}

// ============ LEADS BY COMPANY ============

export async function getLeadsByCompany(companyName: string) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  const leads = await safeQuery(
    'getLeadsByCompany',
    async () => db.select().from(clientLeads)
      .orderBy(desc(clientLeads.createdAt)),
    async () => {
      const [rows] = await db.execute(sql`SELECT * FROM client_leads ORDER BY created_at DESC`);
      return rows as any[];
    }
  );
  
  if (!leads || !Array.isArray(leads)) return [];
  
  return leads.filter((lead: any) => {
    const leadCompany = lead.companyName || lead.company_name || '';
    return normalizeCompanyName(leadCompany).includes(normalized) ||
           normalized.includes(normalizeCompanyName(leadCompany));
  });
}

// ============ FILES BY COMPANY ============

export async function getFilesByCompany(companyName: string) {
  const db = await getDb();
  if (!db) return [];

  const normalized = normalizeCompanyName(companyName);
  
  const files = await safeQuery(
    'getFilesByCompany',
    async () => db.select().from(companyFiles)
      .orderBy(desc(companyFiles.createdAt)),
    async () => {
      const [rows] = await db.execute(sql`SELECT * FROM company_files ORDER BY created_at DESC`);
      return rows as any[];
    }
  );
  
  if (!files || !Array.isArray(files)) return [];
  
  return files.filter((file: any) => {
    const fileCompany = file.companyName || file.company_name || '';
    return normalizeCompanyName(fileCompany).includes(normalized) ||
           normalized.includes(normalizeCompanyName(fileCompany));
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
    companies.map(async (company: any) => {
      const companyName = company.companyName || company.company_name || '';
      const [tasks, campaigns, drafts, alerts] = await Promise.all([
        getTasksByCompany(companyName),
        getCampaignsByCompany(companyName),
        getEmailDraftsByCompany(companyName, 'all'),
        getAlertsByCompany(companyName),
      ]);

      return {
        clientId: company.clientId || company.client_id,
        companyName: companyName,
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
