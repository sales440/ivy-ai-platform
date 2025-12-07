/**
 * Base CRM Connector
 * Abstract class that defines the interface for all CRM integrations
 */

export interface CRMCredentials {
  apiKey?: string;
  apiToken?: string;
  accessToken?: string;
  refreshToken?: string;
  instanceUrl?: string;
  [key: string]: any;
}

export interface CRMConfig {
  fieldMappings?: Record<string, string>;
  syncInterval?: number;
  syncDirection?: 'bidirectional' | 'to_crm' | 'from_crm';
  [key: string]: any;
}

export interface Lead {
  id?: number;
  externalId?: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: string;
  score?: number;
  source?: string;
  notes?: string;
  companyId: number;
}

export interface Ticket {
  id?: number;
  externalId?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
  companyId: number;
}

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  errors: string[];
  lastSyncAt: Date;
}

export abstract class BaseCRMConnector {
  protected credentials: CRMCredentials;
  protected config: CRMConfig;
  protected companyId: number;

  constructor(credentials: CRMCredentials, config: CRMConfig, companyId: number) {
    this.credentials = credentials;
    this.config = config;
    this.companyId = companyId;
  }

  /**
   * Test connection to CRM
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Sync leads from CRM to Ivy.AI
   */
  abstract syncLeadsFromCRM(): Promise<SyncResult>;

  /**
   * Sync leads from Ivy.AI to CRM
   */
  abstract syncLeadsToCRM(leads: Lead[]): Promise<SyncResult>;

  /**
   * Sync tickets from CRM to Ivy.AI
   */
  abstract syncTicketsFromCRM(): Promise<SyncResult>;

  /**
   * Sync tickets from Ivy.AI to CRM
   */
  abstract syncTicketsToCRM(tickets: Ticket[]): Promise<SyncResult>;

  /**
   * Get field mappings for leads
   */
  protected getLeadFieldMapping(): Record<string, string> {
    return this.config.fieldMappings || {
      name: 'name',
      email: 'email',
      phone: 'phone',
      company: 'company',
      status: 'status',
    };
  }

  /**
   * Get field mappings for tickets
   */
  protected getTicketFieldMapping(): Record<string, string> {
    return this.config.fieldMappings || {
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
    };
  }
}
