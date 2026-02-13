import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('../db', () => ({
  getApprovedEmailDrafts: vi.fn(),
  markDraftsAsSent: vi.fn(),
  getEmailDraftById: vi.fn(),
  createCampaignFromApprovedDraft: vi.fn(),
  createEmailDraft: vi.fn(),
  getEmailDrafts: vi.fn(),
  updateEmailDraftStatus: vi.fn(),
  updateEmailDraftContent: vi.fn(),
  deleteEmailDraft: vi.fn(),
}));

// Mock fetch for n8n webhook calls
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

describe('Email Approval Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Email Send Service', () => {
    it('should generate FAGOR HTML template with correct branding', async () => {
      const { generateFagorHtmlTemplate } = await import('../email-send-service');
      
      const html = generateFagorHtmlTemplate({
        subject: 'Test Subject',
        body: '<p>Hello World</p>',
        company: 'FAGOR Automation',
        recipientName: 'John Doe',
      });

      // Check FAGOR branding elements from Brand Firewall
      expect(html).toContain('FAGOR');
      expect(html).toContain('E31937'); // FAGOR red color
      expect(html).toContain('4020 Winnetka Ave');
      expect(html).toContain('Rolling Meadows');
      expect(html).toContain('FAGOR AUTOMATION');
      expect(html).toContain('<p>Hello World</p>');
    });

    it('should send approved emails via n8n webhook', async () => {
      const db = await import('../db');
      const { sendApprovedEmailsViaN8n } = await import('../email-send-service');

      // Mock draft data
      const mockDraft = {
        id: 1,
        draftId: 'draft_123',
        type: 'email',
        company: 'FAGOR',
        subject: 'Test Email',
        body: '<p>Test body</p>',
        campaign: 'Q1 Campaign',
        status: 'approved',
        recipientEmail: 'test@example.com',
        recipientName: 'Test User',
        htmlContent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedBy: null,
        approvedAt: null,
        phoneNumber: null,
      };

      (db.getEmailDraftById as any).mockResolvedValue(mockDraft);
      (db.markDraftsAsSent as any).mockResolvedValue(true);

      // Mock successful n8n webhook response
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('OK'),
      });

      const result = await sendApprovedEmailsViaN8n(['draft_123']);

      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(1);
      expect(result.failedCount).toBe(0);
      expect(result.results[0].status).toBe('sent');
      expect(db.markDraftsAsSent).toHaveBeenCalledWith(['draft_123']);
    });

    it('should handle n8n webhook failure gracefully', async () => {
      const db = await import('../db');
      const { sendApprovedEmailsViaN8n } = await import('../email-send-service');

      const mockDraft = {
        id: 1,
        draftId: 'draft_456',
        type: 'email',
        company: 'FAGOR',
        subject: 'Test',
        body: 'Test',
        campaign: 'Campaign',
        status: 'approved',
        recipientEmail: 'test@example.com',
        recipientName: null,
        htmlContent: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedBy: null,
        approvedAt: null,
        phoneNumber: null,
      };

      (db.getEmailDraftById as any).mockResolvedValue(mockDraft);

      // Mock failed n8n webhook response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const result = await sendApprovedEmailsViaN8n(['draft_456']);

      expect(result.success).toBe(false);
      expect(result.sentCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0].status).toBe('failed');
    });

    it('should skip drafts that are not approved', async () => {
      const db = await import('../db');
      const { sendApprovedEmailsViaN8n } = await import('../email-send-service');

      (db.getEmailDraftById as any).mockResolvedValue({
        draftId: 'draft_789',
        status: 'pending', // Not approved
      });

      const result = await sendApprovedEmailsViaN8n(['draft_789']);

      expect(result.failedCount).toBe(1);
      expect(result.results[0].error).toContain('not approved');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should process email callback correctly', async () => {
      const db = await import('../db');
      const { processEmailCallback } = await import('../email-send-service');

      (db.markDraftsAsSent as any).mockResolvedValue(true);

      const result = await processEmailCallback({
        draftId: 'draft_123',
        status: 'delivered',
        messageId: 'msg_abc',
      });

      expect(result.success).toBe(true);
      expect(db.markDraftsAsSent).toHaveBeenCalledWith(['draft_123']);
    });
  });

  describe('Campaign Creation from Approved Drafts', () => {
    it('should create campaign in DB when drafts are approved', async () => {
      const db = await import('../db');
      const { createCampaignFromDrafts } = await import('../email-send-service');

      (db.createCampaignFromApprovedDraft as any).mockResolvedValue(42);

      const mockDrafts = [
        {
          id: 1,
          draftId: 'draft_1',
          company: 'FAGOR Automation',
          campaign: 'Q1 Upgrade Campaign',
          type: 'email',
          subject: 'Test',
          body: 'Test',
          status: 'approved',
        },
      ] as any[];

      const campaignId = await createCampaignFromDrafts(mockDrafts);

      expect(campaignId).toBe(42);
      expect(db.createCampaignFromApprovedDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringContaining('Q1 Upgrade Campaign'),
          company: 'FAGOR Automation',
          type: 'email',
          draftCount: 1,
        })
      );
    });

    it('should return null for empty drafts array', async () => {
      const { createCampaignFromDrafts } = await import('../email-send-service');

      const result = await createCampaignFromDrafts([]);
      expect(result).toBeNull();
    });
  });

  describe('DB Functions', () => {
    it('should export getApprovedEmailDrafts function', async () => {
      const db = await import('../db');
      expect(typeof db.getApprovedEmailDrafts).toBe('function');
    });

    it('should export markDraftsAsSent function', async () => {
      const db = await import('../db');
      expect(typeof db.markDraftsAsSent).toBe('function');
    });

    it('should export createCampaignFromApprovedDraft function', async () => {
      const db = await import('../db');
      expect(typeof db.createCampaignFromApprovedDraft).toBe('function');
    });
  });
});
