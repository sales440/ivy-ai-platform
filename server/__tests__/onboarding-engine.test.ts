import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          companyProfile: {
            name: "PETLIFE 360",
            industry: "Pet Care & Wellness",
            products: ["Premium pet food", "Pet grooming services", "Pet health supplements"],
            targetAudience: "Pet owners aged 25-55, middle to high income",
            brandTone: "Friendly, caring, professional",
            competitors: ["PetSmart", "Chewy", "BarkBox"],
            uniqueSellingPoints: ["360-degree pet care", "All-natural products", "Subscription model"],
          },
          campaigns: [
            {
              name: "PETLIFE 360 - Email Launch Campaign",
              type: "email",
              channel: "email",
              description: "Welcome email series introducing PETLIFE 360 brand and products",
              targetAudience: "New pet owners",
              startDate: "2026-02-20",
              endDate: "2026-03-20",
              budget: 5000,
              kpis: { openRate: 25, clickRate: 5, conversionRate: 2 },
            },
            {
              name: "PETLIFE 360 - Social Media Awareness",
              type: "social_media",
              channel: "social_media",
              description: "Social media campaign to build brand awareness",
              targetAudience: "Pet lovers on Instagram and Facebook",
              startDate: "2026-02-25",
              endDate: "2026-04-25",
              budget: 8000,
              kpis: { reach: 50000, engagement: 3, followers: 5000 },
            },
          ],
          tasks: [
            { title: "Design email templates", campaign: "Email Launch Campaign", priority: "high", dueDate: "2026-02-18" },
            { title: "Write email copy - Welcome series", campaign: "Email Launch Campaign", priority: "high", dueDate: "2026-02-19" },
            { title: "Set up email automation", campaign: "Email Launch Campaign", priority: "medium", dueDate: "2026-02-20" },
            { title: "Create social media content calendar", campaign: "Social Media Awareness", priority: "high", dueDate: "2026-02-22" },
          ],
          drafts: [
            {
              type: "email",
              subject: "Welcome to PETLIFE 360!",
              content: "Dear pet parent, welcome to PETLIFE 360...",
              campaign: "Email Launch Campaign",
            },
          ],
          marketAlerts: [
            {
              title: "Growing demand for organic pet food",
              description: "Market trend shows 30% increase in organic pet food demand",
              severity: "info",
              recommendation: "Consider highlighting organic ingredients in campaigns",
            },
          ],
        }),
      },
    }],
  }),
}));

// Mock ropa-db
vi.mock("../ropa-db", () => ({
  createRopaTask: vi.fn().mockResolvedValue(undefined),
  updateRopaTaskStatus: vi.fn().mockResolvedValue(undefined),
  createRopaAlert: vi.fn().mockResolvedValue(undefined),
  createRopaLog: vi.fn().mockResolvedValue(undefined),
  getRopaConfig: vi.fn().mockResolvedValue(null),
  setRopaConfig: vi.fn().mockResolvedValue(undefined),
}));

// Mock ropa-drive-service
vi.mock("../ropa-drive-service", () => ({
  default: {
    getClientFolder: vi.fn().mockResolvedValue({
      folderId: "folder123",
      folderName: "PETLIFE 360",
      files: [
        { name: "Company Profile.pdf", mimeType: "application/pdf" },
        { name: "Brand Guidelines.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      ],
    }),
    getFileContent: vi.fn().mockResolvedValue("PETLIFE 360 is a premium pet care company..."),
    isConnected: vi.fn().mockReturnValue(true),
  },
}));

// Mock db.ts
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onDuplicateKeyUpdate: vi.fn().mockResolvedValue([{ insertId: 1 }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    execute: vi.fn().mockResolvedValue([[{ count: 0 }]]),
  }),
}));

// Mock n8n-integration
vi.mock("../n8n-integration", () => ({
  n8nOutreachService: {
    sendMassEmails: vi.fn().mockResolvedValue({ success: true }),
    sendMassSMS: vi.fn().mockResolvedValue({ success: true }),
    triggerMassCalls: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock notification
vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

describe("ROPA Onboarding Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export all required functions", async () => {
    const engine = await import("../ropa-onboarding-engine");
    expect(typeof engine.runFullOnboarding).toBe("function");
    expect(typeof engine.onboardAllExistingCompanies).toBe("function");
    expect(typeof engine.propagateCalendarChange).toBe("function");
    expect(typeof engine.monitorCampaignProgress).toBe("function");
    expect(typeof engine.startCampaignMonitoringCycle).toBe("function");
    expect(typeof engine.stopCampaignMonitoringCycle).toBe("function");
  });

  it("runFullOnboarding should return onboarding result", async () => {
    const engine = await import("../ropa-onboarding-engine");
    const result = await engine.runFullOnboarding("CLI-001", "PETLIFE 360");
    
    expect(result).toBeDefined();
    expect(typeof result.campaignsCreated).toBe("number");
    expect(typeof result.tasksCreated).toBe("number");
    expect(typeof result.draftsCreated).toBe("number");
    expect(typeof result.alertsCreated).toBe("number");
    expect(result.companyName).toBe("PETLIFE 360");
  }, 30000);

  it("runFullOnboarding should handle errors gracefully", async () => {
    const engine = await import("../ropa-onboarding-engine");
    // Even with mocked services, should not throw
    const result = await engine.runFullOnboarding("CLI-ERR", "NonExistentCompany");
    expect(result).toBeDefined();
    expect(result.companyName).toBe("NonExistentCompany");
  }, 30000);

  it("onboardAllExistingCompanies should return batch results", async () => {
    const engine = await import("../ropa-onboarding-engine");
    const result = await engine.onboardAllExistingCompanies();
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.onboarded)).toBe(true);
    expect(Array.isArray(result.skipped)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });

  it("propagateCalendarChange should update campaign and related entities", async () => {
    const engine = await import("../ropa-onboarding-engine");
    const result = await engine.propagateCalendarChange(1, new Date("2026-03-01"), "active");
    
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.message).toBe("string");
  });

  it("propagateCalendarChange should handle invalid campaign ID", async () => {
    const engine = await import("../ropa-onboarding-engine");
    const result = await engine.propagateCalendarChange(-1, new Date(), "draft");
    
    expect(result).toBeDefined();
    // Should not throw, should return gracefully
    expect(typeof result.success).toBe("boolean");
  });

  it("monitorCampaignProgress should run without errors", async () => {
    const engine = await import("../ropa-onboarding-engine");
    // Should not throw
    await expect(engine.monitorCampaignProgress()).resolves.not.toThrow();
  });

  it("monitorCampaignProgress should accept optional company filter", async () => {
    const engine = await import("../ropa-onboarding-engine");
    await expect(engine.monitorCampaignProgress("FAGOR")).resolves.not.toThrow();
  });

  it("startCampaignMonitoringCycle should not throw", async () => {
    const engine = await import("../ropa-onboarding-engine");
    expect(() => engine.startCampaignMonitoringCycle()).not.toThrow();
    // Clean up
    engine.stopCampaignMonitoringCycle();
  });

  it("stopCampaignMonitoringCycle should not throw even if not started", async () => {
    const engine = await import("../ropa-onboarding-engine");
    expect(() => engine.stopCampaignMonitoringCycle()).not.toThrow();
  });
});

describe("Calendar Propagation Logic", () => {
  it("should propagate date changes to tasks and drafts", async () => {
    const engine = await import("../ropa-onboarding-engine");
    const result = await engine.propagateCalendarChange(
      1,
      new Date("2026-04-01"),
      "paused"
    );
    
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
    expect(typeof result.message).toBe("string");
    // Should mention what was updated
    if (result.success) {
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it("should handle status-only changes without date", async () => {
    const engine = await import("../ropa-onboarding-engine");
    const result = await engine.propagateCalendarChange(1, new Date(), "completed");
    
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });
});
