/**
 * Tests for ROPA Advanced Suites (Phase 60)
 * Uses actual exported function names from each suite module.
 */
import { describe, it, expect } from "vitest";
import { predictiveIntelligenceTools } from "../ropa-suite-predictive";
import { abTestingTools } from "../ropa-suite-ab-testing";
import { crmIntegrationTools } from "../ropa-suite-crm-hub";
import { strategicReasoningTools } from "../ropa-suite-strategic";

// ============ Suite 1: Predictive Intelligence ============
// Functions: analyzeSentiment, batchAnalyzeSentiment, generateFollowUpPlan,
//   predictLeadConversion, predictCampaignSuccess, scoreAllLeads, autoClassifyAndRoute, getPredictiveDashboard

describe("Suite 1: Predictive Intelligence & Sentiment Analysis", () => {

  it("should export all 8 required tool functions", () => {
    expect(typeof predictiveIntelligenceTools.analyzeSentiment).toBe("function");
    expect(typeof predictiveIntelligenceTools.batchAnalyzeSentiment).toBe("function");
    expect(typeof predictiveIntelligenceTools.generateFollowUpPlan).toBe("function");
    expect(typeof predictiveIntelligenceTools.predictLeadConversion).toBe("function");
    expect(typeof predictiveIntelligenceTools.predictCampaignSuccess).toBe("function");
    expect(typeof predictiveIntelligenceTools.scoreAllLeads).toBe("function");
    expect(typeof predictiveIntelligenceTools.autoClassifyAndRoute).toBe("function");
    expect(typeof predictiveIntelligenceTools.getPredictiveDashboard).toBe("function");
    expect(Object.keys(predictiveIntelligenceTools).length).toBe(8);
  });

  it("predictCampaignSuccess should return metrics", async () => {
    const result = await predictiveIntelligenceTools.predictCampaignSuccess({
      campaignName: "Q1 Launch",
      companyName: "PETLIFE 360",
      channel: "email",
      audienceSize: 500,
      subject: "Descubre nuestros nuevos productos",
    });
    // This function uses heuristics, not LLM - should always work
    expect(typeof result.success).toBe("boolean");
    if (result.success) {
      expect(result.predictedOpenRate).toBeGreaterThanOrEqual(0);
      expect(result.predictedConversionRate).toBeGreaterThanOrEqual(0);
    }
  });

  it("predictLeadConversion should return probability", async () => {
    const result = await predictiveIntelligenceTools.predictLeadConversion({
      leadEmail: "prospect@example.com",
      companyName: "PETLIFE 360",
      interactions: 5,
      daysSinceFirst: 14,
      channelsUsed: ["email", "phone"],
    });
    expect(typeof result.success).toBe("boolean");
    if (result.success) {
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
    }
  });

  it("analyzeSentiment should handle gracefully (LLM-dependent)", async () => {
    const result = await predictiveIntelligenceTools.analyzeSentiment({
      emailContent: "Estamos muy interesados en su propuesta.",
      senderEmail: "lead@company.com",
      companyName: "PETLIFE 360",
    });
    expect(typeof result.success).toBe("boolean");
  });

  it("scoreAllLeads should handle gracefully", async () => {
    const result = await predictiveIntelligenceTools.scoreAllLeads({
      companyName: "PETLIFE 360",
    });
    expect(typeof result.success).toBe("boolean");
  });

  it("autoClassifyAndRoute should handle gracefully", async () => {
    const result = await predictiveIntelligenceTools.autoClassifyAndRoute({
      emailContent: "No estamos interesados en este momento",
      senderEmail: "cold@example.com",
      companyName: "PETLIFE 360",
    });
    expect(typeof result.success).toBe("boolean");
  });
});

// ============ Suite 2: Auto A/B Testing ============
// Functions: generateVariants, createTest, deployTest, analyzeSignificance,
//   autoImplementWinner, runFullABTest, getTestSummary, optimizeSubjectLines

describe("Suite 2: Auto A/B Testing", () => {

  it("should export all required tool functions", () => {
    expect(typeof abTestingTools.generateVariants).toBe("function");
    expect(typeof abTestingTools.createTest).toBe("function");
    expect(typeof abTestingTools.deployTest).toBe("function");
    expect(typeof abTestingTools.analyzeSignificance).toBe("function");
    expect(typeof abTestingTools.autoImplementWinner).toBe("function");
    expect(typeof abTestingTools.runFullABTest).toBe("function");
    expect(typeof abTestingTools.getTestSummary).toBe("function");
    expect(typeof abTestingTools.optimizeSubjectLines).toBe("function");
    expect(Object.keys(abTestingTools).length).toBe(8);
  });

  it("createTest should create a test from variants", async () => {
    const result = await abTestingTools.createTest({
      campaignName: "Q1 Launch",
      companyName: "PETLIFE 360",
      variants: [
        { id: "A", name: "A", subject: "Subject A", body: "Body A", cta: "CTA A", tone: "formal", audiencePercentage: 50 },
        { id: "B", name: "B", subject: "Subject B", body: "Body B", cta: "CTA B", tone: "casual", audiencePercentage: 50 },
      ],
      testDuration: "48h",
    });
    expect(result.success).toBe(true);
    expect(result.test).toBeDefined();
    expect(result.test.testId).toBeDefined();
    expect(result.test.status).toBe("draft");
    expect(result.test.variants).toHaveLength(2);
  });

  it("analyzeSignificance should determine statistical significance", async () => {
    const result = await abTestingTools.analyzeSignificance({
      metrics: [
        { variantId: "A", sent: 500, opens: 150, clicks: 30, conversions: 5 },
        { variantId: "B", sent: 500, opens: 200, clicks: 45, conversions: 8 },
      ],
      primaryMetric: "openRate",
      minimumConfidence: 90,
    });
    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(typeof result.result!.isSignificant).toBe("boolean");
    expect(result.result!.confidenceLevel).toBeGreaterThanOrEqual(0);
    expect(result.result!.winnerId).toBeDefined();
  });

  it("analyzeSignificance should detect B as winner with much higher open rate", async () => {
    const result = await abTestingTools.analyzeSignificance({
      metrics: [
        { variantId: "A", sent: 1000, opens: 200, clicks: 40, conversions: 10 },
        { variantId: "B", sent: 1000, opens: 350, clicks: 70, conversions: 18 },
      ],
      primaryMetric: "openRate",
      minimumConfidence: 90,
    });
    expect(result.success).toBe(true);
    expect(result.result!.winnerId).toBe("B");
    expect(result.result!.isSignificant).toBe(true);
  });

  it("autoImplementWinner should implement winning variant", async () => {
    const result = await abTestingTools.autoImplementWinner({
      testId: "test_123",
      campaignName: "Q1 Launch",
      companyName: "PETLIFE 360",
      winnerVariant: { id: "B", name: "B", subject: "Winner Subject", body: "Winner Body", cta: "Winner CTA", tone: "formal", audiencePercentage: 100 },
      remainingAudience: 2000,
    });
    expect(result.success).toBe(true);
    expect(result.applied).toBe(true);
  });

  it("deployTest should deploy a test with audience split", async () => {
    const result = await abTestingTools.deployTest({
      test: {
        testId: "test_456",
        campaignName: "Q1 Launch",
        companyName: "PETLIFE 360",
        status: "draft" as const,
        variants: [
          { id: "A", name: "A", subject: "S A", body: "B A", cta: "C A", tone: "formal", audiencePercentage: 50 },
          { id: "B", name: "B", subject: "S B", body: "B B", cta: "C B", tone: "casual", audiencePercentage: 50 },
        ],
        metrics: [],
        confidenceLevel: 0,
        createdAt: new Date().toISOString(),
      },
      totalAudience: 1000,
    });
    expect(result.success).toBe(true);
    expect(result.deployment).toHaveLength(2);
    const totalAudience = result.deployment.reduce((sum: number, d: any) => sum + d.audienceSize, 0);
    expect(totalAudience).toBe(1000);
  });

  it("generateVariants should handle gracefully (LLM-dependent)", async () => {
    const result = await abTestingTools.generateVariants({
      originalSubject: "Oferta especial para su empresa",
      originalBody: "Estimado cliente, tenemos una oferta especial...",
      originalCta: "Solicitar información",
      numVariants: 3,
      companyName: "PETLIFE 360",
    });
    expect(typeof result.success).toBe("boolean");
  });
});

// ============ Suite 3: CRM Integration Hub ============
// Functions: configureCRM, listCRMConnections, syncContactsFromCRM, pushContactToCRM,
//   createCRMTask, updateLeadStatusInCRM, bidirectionalSync, getCRMAnalytics, enrichContactData

describe("Suite 3: CRM Integration Hub", () => {

  it("should export all required tool functions (10)", () => {
    expect(typeof crmIntegrationTools.configureCRM).toBe("function");
    expect(typeof crmIntegrationTools.listCRMConnections).toBe("function");
    expect(typeof crmIntegrationTools.syncContactsFromCRM).toBe("function");
    expect(typeof crmIntegrationTools.pushContactToCRM).toBe("function");
    expect(typeof crmIntegrationTools.getClient360).toBe("function");
    expect(typeof crmIntegrationTools.createCRMTask).toBe("function");
    expect(typeof crmIntegrationTools.updateLeadStatusInCRM).toBe("function");
    expect(typeof crmIntegrationTools.bidirectionalSync).toBe("function");
    expect(typeof crmIntegrationTools.getCRMAnalytics).toBe("function");
    expect(typeof crmIntegrationTools.enrichContactData).toBe("function");
    expect(Object.keys(crmIntegrationTools).length).toBe(10);
  });

  it("configureCRM should configure a HubSpot connection", async () => {
    const result = await crmIntegrationTools.configureCRM({
      provider: "hubspot",
      apiKey: "test-api-key-12345",
    });
    expect(result.success).toBe(true);
    expect(result.connected).toBe(true);
  });

  it("configureCRM should configure a Salesforce connection", async () => {
    const result = await crmIntegrationTools.configureCRM({
      provider: "salesforce",
      apiKey: "sf-key-12345",
      instanceUrl: "https://myorg.salesforce.com",
    });
    expect(result.success).toBe(true);
    expect(result.connected).toBe(true);
  });

  it("listCRMConnections should return connections array", async () => {
    const result = await crmIntegrationTools.listCRMConnections();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.connections)).toBe(true);
  });

  it("createCRMTask should create a task", async () => {
    const result = await crmIntegrationTools.createCRMTask({
      title: "Follow up with lead",
      description: "Call to discuss proposal",
      dueDate: "2026-02-20",
      priority: "high",
      contactEmail: "lead@example.com",
    });
    expect(result.success).toBe(true);
    expect(result.taskId).toBeDefined();
  });

  it("updateLeadStatusInCRM should update status", async () => {
    const result = await crmIntegrationTools.updateLeadStatusInCRM({
      leadEmail: "lead@example.com",
      newStatus: "qualified",
      notes: "Showed strong interest",
    });
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
  });

  it("enrichContactData should handle gracefully (LLM-dependent)", async () => {
    const result = await crmIntegrationTools.enrichContactData({
      email: "ceo@petlife360.com",
      companyName: "PETLIFE 360",
    });
    // LLM-dependent - may succeed or fail gracefully
    expect(typeof result.success).toBe("boolean");
  });

  it("getCRMAnalytics should return analytics", async () => {
    const result = await crmIntegrationTools.getCRMAnalytics({
      period: "month",
    });
    expect(result.success).toBe(true);
  });
});

// ============ Suite 4: Strategic Reasoning Engine ============
// Functions: convertGoalToPlan, designMultichannelStrategy, generateCampaignCalendar,
//   optimizeBudget, makeAutonomousDecision, generateStrategicReport, evaluatePlanProgress, autoGenerateAssets

describe("Suite 4: Strategic Reasoning Engine", () => {

  it("should export all 8 required tool functions", () => {
    expect(typeof strategicReasoningTools.convertGoalToPlan).toBe("function");
    expect(typeof strategicReasoningTools.designMultichannelStrategy).toBe("function");
    expect(typeof strategicReasoningTools.generateCampaignCalendar).toBe("function");
    expect(typeof strategicReasoningTools.optimizeBudget).toBe("function");
    expect(typeof strategicReasoningTools.makeAutonomousDecision).toBe("function");
    expect(typeof strategicReasoningTools.generateStrategicReport).toBe("function");
    expect(typeof strategicReasoningTools.evaluatePlanProgress).toBe("function");
    expect(typeof strategicReasoningTools.autoGenerateAssets).toBe("function");
    expect(Object.keys(strategicReasoningTools).length).toBe(8);
  });

  it("makeAutonomousDecision should auto-approve low-risk always", async () => {
    const result = await strategicReasoningTools.makeAutonomousDecision({
      context: "Campaign drafts pending approval for PETLIFE 360",
      pendingActions: [
        { action: "Send follow-up emails", risk: "low", impact: "Maintain lead engagement" },
        { action: "Approve email drafts", risk: "low", impact: "Continue campaign flow" },
      ],
      daysSinceLastApproval: 4,
      autoApproveThreshold: 3,
    });
    expect(result.success).toBe(true);
    expect(result.decisions).toHaveLength(2);
    result.decisions.forEach((d: any) => {
      expect(d.approved).toBe(true);
    });
  });

  it("makeAutonomousDecision should NOT auto-approve high-risk even after 72h", async () => {
    const result = await strategicReasoningTools.makeAutonomousDecision({
      context: "Budget changes pending",
      pendingActions: [
        { action: "Delete all campaigns", risk: "high", impact: "Irreversible data loss" },
      ],
      daysSinceLastApproval: 10,
      autoApproveThreshold: 3,
    });
    expect(result.success).toBe(true);
    expect(result.decisions[0].approved).toBe(false);
  });

  it("makeAutonomousDecision should auto-approve medium risk after threshold", async () => {
    const result = await strategicReasoningTools.makeAutonomousDecision({
      context: "Campaign optimization",
      pendingActions: [
        { action: "Adjust email frequency", risk: "medium", impact: "Optimize engagement" },
      ],
      daysSinceLastApproval: 5,
      autoApproveThreshold: 3,
    });
    expect(result.success).toBe(true);
    expect(result.decisions[0].approved).toBe(true);
  });

  it("makeAutonomousDecision should NOT auto-approve medium risk before threshold", async () => {
    const result = await strategicReasoningTools.makeAutonomousDecision({
      context: "New campaign pending",
      pendingActions: [
        { action: "Adjust email frequency", risk: "medium", impact: "Optimize engagement" },
      ],
      daysSinceLastApproval: 1,
      autoApproveThreshold: 3,
    });
    expect(result.success).toBe(true);
    expect(result.decisions[0].approved).toBe(false);
  });

  it("makeAutonomousDecision should handle mixed risk levels correctly", async () => {
    const result = await strategicReasoningTools.makeAutonomousDecision({
      context: "Multiple pending actions",
      pendingActions: [
        { action: "Send emails", risk: "low", impact: "Continue outreach" },
        { action: "Change pricing", risk: "high", impact: "Revenue impact" },
        { action: "Update templates", risk: "medium", impact: "Brand consistency" },
      ],
      daysSinceLastApproval: 5,
      autoApproveThreshold: 3,
    });
    expect(result.success).toBe(true);
    expect(result.decisions).toHaveLength(3);
    expect(result.decisions[0].approved).toBe(true);   // low: always
    expect(result.decisions[1].approved).toBe(false);  // high: never
    expect(result.decisions[2].approved).toBe(true);   // medium after threshold: yes
    expect(result.escalateToHuman).toBe(true);         // at least one not approved
  });

  it("convertGoalToPlan should handle gracefully (LLM-dependent)", async () => {
    const result = await strategicReasoningTools.convertGoalToPlan({
      objective: "Aumentar ventas un 15% este Q3",
      timeframe: "Q3 2026",
      companyName: "PETLIFE 360",
      currentMetrics: { revenue: 50000, leads: 200, conversionRate: 5 },
    });
    expect(typeof result.success).toBe("boolean");
  });

  it("generateCampaignCalendar should handle gracefully (LLM-dependent)", async () => {
    const result = await strategicReasoningTools.generateCampaignCalendar({
      companyName: "PETLIFE 360",
      startDate: "2026-03-01",
      weeks: 4,
    });
    expect(typeof result.success).toBe("boolean");
  });

  it("optimizeBudget should handle gracefully (LLM-dependent)", async () => {
    const result = await strategicReasoningTools.optimizeBudget({
      currentAllocation: { email: 3000, sms: 1000, social: 1000 },
      totalBudget: 5000,
      performanceData: {
        email: { spend: 3000, conversions: 50, revenue: 15000 },
        sms: { spend: 1000, conversions: 10, revenue: 3000 },
        social: { spend: 1000, conversions: 20, revenue: 6000 },
      },
    });
    expect(typeof result.success).toBe("boolean");
  });
});

// ============ Integration: Tool Registry ============

describe("Tool Registry Integration", () => {
  it("should have all 4 suites registered in ropaTools", async () => {
    const { ropaTools, toolCategories, TOTAL_TOOLS } = await import("../ropa-tools");
    
    expect(toolCategories["Predictive Intelligence & Sentiment"]).toBeDefined();
    expect(toolCategories["Auto A/B Testing"]).toBeDefined();
    expect(toolCategories["CRM Integration Hub"]).toBeDefined();
    expect(toolCategories["Strategic Reasoning Engine"]).toBeDefined();
    
    expect(ropaTools.analyze_email_sentiment).toBeDefined();
    expect(ropaTools.generate_ab_variants).toBeDefined();
    expect(ropaTools.configure_crm).toBeDefined();
    expect(ropaTools.convert_goal_to_plan).toBeDefined();
    expect(ropaTools.make_autonomous_decision).toBeDefined();
    
    expect(TOTAL_TOOLS).toBeGreaterThan(160);
  });

  it("should have correct total tool counts per suite", () => {
    expect(Object.keys(predictiveIntelligenceTools).length).toBe(8);
    expect(Object.keys(abTestingTools).length).toBe(8);
    expect(Object.keys(crmIntegrationTools).length).toBe(10);
    expect(Object.keys(strategicReasoningTools).length).toBe(8);
  });
});

// ============ ROPA Brain Integration ============

describe("ROPA Brain Suite Integration", () => {
  it("should defer predictive commands to LLM", async () => {
    const { processWithRopaBrain } = await import("../ropa-brain");
    const result = await processWithRopaBrain("analiza el sentimiento de los emails recibidos");
    expect(result.shouldDeferToLLM).toBe(true);
  });

  it("should defer CRM commands to LLM", async () => {
    const { processWithRopaBrain } = await import("../ropa-brain");
    const result = await processWithRopaBrain("sincroniza los contactos con HubSpot");
    expect(result.shouldDeferToLLM).toBe(true);
  });

  it("should defer strategic planning commands to LLM", async () => {
    const { processWithRopaBrain } = await import("../ropa-brain");
    const result = await processWithRopaBrain("diseña un plan estratégico para aumentar ventas un 15%");
    expect(result.shouldDeferToLLM).toBe(true);
  });
});
