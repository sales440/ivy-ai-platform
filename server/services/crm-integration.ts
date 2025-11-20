/**
 * CRM Integration Service
 * Supports Salesforce and HubSpot integrations
 */

import { getDb } from '../db';
import { crmIntegrations, leads } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export type CRMProvider = 'salesforce' | 'hubspot';

export interface CRMConfig {
  provider: CRMProvider;
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string; // For Salesforce
}

/**
 * Save CRM configuration
 */
export async function saveCRMConfig(
  companyId: number,
  config: CRMConfig
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  await db.insert(crmIntegrations).values({
    companyId,
    crmType: config.provider,
    credentials: {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
    },
    config: {
      instanceUrl: config.instanceUrl,
    },
    isActive: true,
  }).onDuplicateKeyUpdate({
    set: {
      credentials: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        accessToken: config.accessToken,
        refreshToken: config.refreshToken,
      },
      config: {
        instanceUrl: config.instanceUrl,
      },
      isActive: true,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get CRM configuration for a company
 */
export async function getCRMConfig(
  companyId: number,
  provider: CRMProvider
): Promise<CRMConfig | null> {
  const db = await getDb();
  if (!db) return null;

  const [integration] = await db
    .select()
    .from(crmIntegrations)
    .where(eq(crmIntegrations.companyId, companyId))
    .limit(1);

  if (!integration || integration.crmType !== provider) {
    return null;
  }

  const credentials = integration.credentials as any;
  const configData = integration.config as any;

  return {
    provider: integration.crmType as CRMProvider,
    clientId: credentials?.clientId,
    clientSecret: credentials?.clientSecret,
    accessToken: credentials?.accessToken,
    refreshToken: credentials?.refreshToken,
    instanceUrl: configData?.instanceUrl,
  };
}

/**
 * Sync lead to Salesforce
 */
export async function syncLeadToSalesforce(
  leadId: number,
  companyId: number
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  try {
    const config = await getCRMConfig(companyId, 'salesforce');
    if (!config || !config.accessToken || !config.instanceUrl) {
      return { success: false, error: 'Salesforce not configured' };
    }

    const db = await getDb();
    if (!db) return { success: false, error: 'Database not available' };

    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    // Salesforce API call
    const response = await fetch(`${config.instanceUrl}/services/data/v57.0/sobjects/Lead`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        FirstName: lead.name?.split(' ')[0] || '',
        LastName: lead.name?.split(' ').slice(1).join(' ') || 'Unknown',
        Email: lead.email,
        Company: lead.company || 'Unknown',
        Title: lead.title,
        Industry: lead.industry,
        Status: mapStatusToSalesforce(lead.status),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Salesforce API error: ${error}` };
    }

    const result = await response.json();
    return { success: true, externalId: result.id };
  } catch (error) {
    console.error('[CRM] Salesforce sync error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Sync lead to HubSpot
 */
export async function syncLeadToHubSpot(
  leadId: number,
  companyId: number
): Promise<{ success: boolean; externalId?: string; error?: string }> {
  try {
    const config = await getCRMConfig(companyId, 'hubspot');
    if (!config || !config.accessToken) {
      return { success: false, error: 'HubSpot not configured' };
    }

    const db = await getDb();
    if (!db) return { success: false, error: 'Database not available' };

    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    // HubSpot API call
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          email: lead.email,
          firstname: lead.name?.split(' ')[0] || '',
          lastname: lead.name?.split(' ').slice(1).join(' ') || '',
          company: lead.company,
          jobtitle: lead.title,
          industry: lead.industry,
          hs_lead_status: mapStatusToHubSpot(lead.status),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `HubSpot API error: ${error}` };
    }

    const result = await response.json();
    return { success: true, externalId: result.id };
  } catch (error) {
    console.error('[CRM] HubSpot sync error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Map internal status to Salesforce status
 */
function mapStatusToSalesforce(status: string): string {
  const statusMap: Record<string, string> = {
    'new': 'Open - Not Contacted',
    'contacted': 'Working - Contacted',
    'qualified': 'Qualified',
    'converted': 'Closed - Converted',
    'lost': 'Closed - Not Converted',
  };
  return statusMap[status] || 'Open - Not Contacted';
}

/**
 * Map internal status to HubSpot status
 */
function mapStatusToHubSpot(status: string): string {
  const statusMap: Record<string, string> = {
    'new': 'NEW',
    'contacted': 'OPEN',
    'qualified': 'IN_PROGRESS',
    'converted': 'OPEN_DEAL',
    'lost': 'UNQUALIFIED',
  };
  return statusMap[status] || 'NEW';
}

/**
 * Test CRM connection
 */
export async function testCRMConnection(
  companyId: number,
  provider: CRMProvider
): Promise<{ success: boolean; message: string }> {
  const config = await getCRMConfig(companyId, provider);
  
  if (!config || !config.accessToken) {
    return { 
      success: false, 
      message: `${provider} not configured or access token missing` 
    };
  }

  try {
    if (provider === 'salesforce') {
      const response = await fetch(`${config.instanceUrl}/services/data/v57.0/sobjects`, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      });
      
      if (response.ok) {
        return { success: true, message: 'Salesforce connection successful' };
      } else {
        return { success: false, message: 'Salesforce authentication failed' };
      }
    } else if (provider === 'hubspot') {
      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      });
      
      if (response.ok) {
        return { success: true, message: 'HubSpot connection successful' };
      } else {
        return { success: false, message: 'HubSpot authentication failed' };
      }
    }
    
    return { success: false, message: 'Unknown CRM provider' };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Connection test failed' 
    };
  }
}
