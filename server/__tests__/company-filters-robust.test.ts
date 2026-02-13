import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('../db', () => ({
  getDb: vi.fn(),
}));

// Mock drizzle schema to avoid import issues
vi.mock('../../drizzle/schema', () => ({
  ropaTasks: { createdAt: 'created_at' },
  ropaAlerts: { createdAt: 'created_at', resolved: 'resolved' },
  salesCampaigns: { createdAt: 'created_at' },
  emailDrafts: { createdAt: 'created_at', status: 'status' },
  ivyClients: { createdAt: 'created_at' },
  campaignContent: { createdAt: 'created_at', status: 'status' },
  clientLeads: { createdAt: 'created_at' },
  companyFiles: { createdAt: 'created_at' },
  clientLists: {},
}));

import { getDb } from '../db';

describe('Company Filters - Robust Error Handling', () => {
  const mockGetDb = getDb as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findCompanyByName', () => {
    it('should return null when db is not available', async () => {
      mockGetDb.mockResolvedValue(null);
      const { findCompanyByName } = await import('../ropa-company-filters');
      const result = await findCompanyByName('FAGOR');
      expect(result).toBeNull();
    });

    it('should handle Drizzle query failure and use raw SQL fallback', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockRejectedValue(new Error('Failed query: some error')),
        }),
        execute: vi.fn().mockResolvedValue([[
          { company_name: 'FAGOR', client_id: 'FAG-001', status: 'active' },
        ]]),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { findCompanyByName } = await import('../ropa-company-filters');
      const result = await findCompanyByName('FAGOR');
      expect(result).toBeTruthy();
      expect(result.company_name).toBe('FAGOR');
    });

    it('should return null when both Drizzle and raw SQL fail', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockRejectedValue(new Error('Drizzle failed')),
        }),
        execute: vi.fn().mockRejectedValue(new Error('Raw SQL also failed')),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { findCompanyByName } = await import('../ropa-company-filters');
      const result = await findCompanyByName('FAGOR');
      expect(result).toBeNull();
    });
  });

  describe('getCampaignsByCompany', () => {
    it('should return empty array when db is not available', async () => {
      mockGetDb.mockResolvedValue(null);
      const { getCampaignsByCompany } = await import('../ropa-company-filters');
      const result = await getCampaignsByCompany('FAGOR');
      expect(result).toEqual([]);
    });

    it('should use raw SQL fallback when Drizzle fails', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error('Failed query')),
          }),
        }),
        execute: vi.fn().mockResolvedValue([[
          { name: 'FAGOR Email Campaign', status: 'active', type: 'email', created_at: new Date() },
          { name: 'Other Campaign', status: 'draft', type: 'phone', created_at: new Date() },
        ]]),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { getCampaignsByCompany } = await import('../ropa-company-filters');
      const result = await getCampaignsByCompany('FAGOR');
      expect(result.length).toBe(1); // Only FAGOR campaign matches
      expect(result[0].name).toBe('FAGOR Email Campaign');
    });

    it('should return empty array when both queries fail', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error('Drizzle failed')),
          }),
        }),
        execute: vi.fn().mockRejectedValue(new Error('Raw SQL failed')),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { getCampaignsByCompany } = await import('../ropa-company-filters');
      const result = await getCampaignsByCompany('FAGOR');
      expect(result).toEqual([]);
    });
  });

  describe('getTasksByCompany', () => {
    it('should return empty array when db is not available', async () => {
      mockGetDb.mockResolvedValue(null);
      const { getTasksByCompany } = await import('../ropa-company-filters');
      const result = await getTasksByCompany('FAGOR');
      expect(result).toEqual([]);
    });

    it('should handle both taskType and type field names', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              { type: 'fagor_email_gen', status: 'completed', priority: 'high' },
              { type: 'health_check', status: 'completed', priority: 'low' },
            ]),
          }),
        }),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { getTasksByCompany } = await import('../ropa-company-filters');
      const result = await getTasksByCompany('FAGOR');
      expect(result.length).toBe(1); // Only FAGOR task matches
    });
  });

  describe('getEmailDraftsByCompany', () => {
    it('should filter by company name using both field name formats', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([
              { company: 'FAGOR', subject: 'Test email 1', status: 'pending' },
              { company: 'EPM', subject: 'Test email 2', status: 'pending' },
            ]),
          }),
        }),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { getEmailDraftsByCompany } = await import('../ropa-company-filters');
      const result = await getEmailDraftsByCompany('FAGOR', 'all');
      expect(result.length).toBe(1);
      expect(result[0].company).toBe('FAGOR');
    });

    it('should handle status filter with raw SQL fallback', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockRejectedValue(new Error('Failed query')),
            }),
            orderBy: vi.fn().mockRejectedValue(new Error('Failed query')),
          }),
        }),
        execute: vi.fn().mockResolvedValue([[
          { company: 'FAGOR', subject: 'Pending email', status: 'pending' },
        ]]),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { getEmailDraftsByCompany } = await import('../ropa-company-filters');
      const result = await getEmailDraftsByCompany('FAGOR', 'pending');
      expect(result.length).toBe(1);
    });
  });

  describe('listAllCompanies', () => {
    it('should return empty array when db is not available', async () => {
      mockGetDb.mockResolvedValue(null);
      const { listAllCompanies } = await import('../ropa-company-filters');
      const result = await listAllCompanies();
      expect(result).toEqual([]);
    });

    it('should use raw SQL fallback when Drizzle fails', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(new Error('Failed query')),
          }),
        }),
        execute: vi.fn().mockResolvedValue([[
          { company_name: 'FAGOR', status: 'active' },
          { company_name: 'EPM', status: 'active' },
        ]]),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { listAllCompanies } = await import('../ropa-company-filters');
      const result = await listAllCompanies();
      expect(result.length).toBe(2);
    });
  });

  describe('normalizeCompanyName fuzzy matching', () => {
    it('should match case-insensitive company names', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue([
            { companyName: 'FAGOR Automation', client_id: 'FAG-001' },
          ]),
        }),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { findCompanyByName } = await import('../ropa-company-filters');
      
      // Should match "fagor" against "FAGOR Automation"
      const result = await findCompanyByName('fagor');
      expect(result).toBeTruthy();
    });

    it('should match partial company names', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue([
            { companyName: 'FAGOR Industrial Automation S.A.', client_id: 'FAG-001' },
          ]),
        }),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { findCompanyByName } = await import('../ropa-company-filters');
      
      const result = await findCompanyByName('FAGOR');
      expect(result).toBeTruthy();
    });
  });

  describe('getCompanyOverview', () => {
    it('should return overview even when some queries fail', async () => {
      // Mock a db where some queries succeed and some fail
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        execute: vi.fn().mockResolvedValue([[]]),
      };
      mockGetDb.mockResolvedValue(mockDb);
      const { getCompanyOverview } = await import('../ropa-company-filters');
      const result = await getCompanyOverview('FAGOR');
      expect(result).toBeTruthy();
      expect(result.tasks.total).toBe(0);
      expect(result.campaigns.total).toBe(0);
    });
  });
});
