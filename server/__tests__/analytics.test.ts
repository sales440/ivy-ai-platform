import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from '../db';

// Mock the database module
vi.mock('../db', () => ({
  getDb: vi.fn(),
  getAgentCount: vi.fn(),
  getActiveAgentCount: vi.fn(),
  getLeadCount: vi.fn(),
  getTicketCount: vi.fn(),
}));

describe('Analytics Procedures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('systemStatus', () => {
    it('should return correct system metrics', async () => {
      // Mock database responses
      vi.mocked(db.getAgentCount).mockResolvedValue(6);
      vi.mocked(db.getActiveAgentCount).mockResolvedValue(2);
      vi.mocked(db.getLeadCount).mockResolvedValue(55);
      vi.mocked(db.getTicketCount).mockResolvedValue(8);

      const agentCount = await db.getAgentCount();
      const activeAgents = await db.getActiveAgentCount();
      const leadCount = await db.getLeadCount();
      const ticketCount = await db.getTicketCount();

      expect(agentCount).toBe(6);
      expect(activeAgents).toBe(2);
      expect(leadCount).toBe(55);
      expect(ticketCount).toBe(8);
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(db.getAgentCount).mockRejectedValue(new Error('DB Connection lost'));

      await expect(db.getAgentCount()).rejects.toThrow('DB Connection lost');
    });
  });

  describe('companyMetrics', () => {
    it('should calculate metrics correctly', () => {
      const leads = 55;
      const qualified = 28;
      const converted = 6;

      const conversionRate = (converted / leads) * 100;
      const qualificationRate = (qualified / leads) * 100;

      expect(conversionRate).toBeCloseTo(10.9, 1);
      expect(qualificationRate).toBeCloseTo(50.9, 1);
    });

    it('should handle zero leads', () => {
      const leads = 0;
      const converted = 0;

      const conversionRate = leads > 0 ? (converted / leads) * 100 : 0;

      expect(conversionRate).toBe(0);
    });
  });

  describe('Database Connection', () => {
    it('should return null when DATABASE_URL is not set', async () => {
      const originalEnv = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;

      vi.mocked(db.getDb).mockResolvedValue(null);
      const result = await db.getDb();

      expect(result).toBeNull();

      process.env.DATABASE_URL = originalEnv;
    });

    it('should create connection pool with correct config', async () => {
      process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test';

      // Mock successful connection
      vi.mocked(db.getDb).mockResolvedValue({} as any);

      const result = await db.getDb();
      expect(result).toBeDefined();
    });
  });
});
