import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { createRopaLog, createRopaAlert } from "./ropa-db";

// ============ NATURAL LANGUAGE REPORTING ============

export async function generateNaturalLanguageReport(data: {
  type: "daily" | "weekly" | "monthly" | "campaign";
  metrics: Record<string, any>;
  context?: string;
}): Promise<{ report: string; insights: string[]; recommendations: string[] }> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an executive reporting assistant. Generate clear, concise reports in Spanish with insights and recommendations.`,
      },
      {
        role: "user",
        content: `Generate a ${data.type} report based on these metrics: ${JSON.stringify(data.metrics)}${data.context ? `\nContext: ${data.context}` : ""}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "nl_report",
        strict: true,
        schema: {
          type: "object",
          properties: {
            report: { type: "string" },
            insights: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
          },
          required: ["report", "insights", "recommendations"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Failed to generate report");
  }

  return JSON.parse(content);
}

export async function explainDecision(decision: {
  action: string;
  reasoning: string;
  data: Record<string, any>;
}): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are ROPA explaining your decisions in clear Spanish. Be concise and transparent.",
      },
      {
        role: "user",
        content: `Explain why you took this action: ${decision.action}\nReasoning: ${decision.reasoning}\nData: ${JSON.stringify(decision.data)}`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.toString() || "No explanation available";
}

// ============ SELF-HEALING ============

export interface HealthIssue {
  severity: "low" | "medium" | "high" | "critical";
  component: string;
  description: string;
  autoFixable: boolean;
}

export async function detectIssues(): Promise<HealthIssue[]> {
  const issues: HealthIssue[] = [];

  // Check database connection
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) {
      issues.push({
        severity: "critical",
        component: "database",
        description: "Database connection unavailable",
        autoFixable: false,
      });
    }
  } catch (error) {
    issues.push({
      severity: "critical",
      component: "database",
      description: "Database error detected",
      autoFixable: false,
    });
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
    issues.push({
      severity: "high",
      component: "memory",
      description: "High memory usage detected",
      autoFixable: true,
    });
  }

  return issues;
}

export async function autoFixIssue(issue: HealthIssue): Promise<{ fixed: boolean; message: string }> {
  if (!issue.autoFixable) {
    return { fixed: false, message: "Issue requires manual intervention" };
  }

  switch (issue.component) {
    case "memory":
      if (global.gc) {
        global.gc();
        return { fixed: true, message: "Garbage collection triggered" };
      }
      return { fixed: false, message: "GC not available" };

    default:
      return { fixed: false, message: "No auto-fix available" };
  }
}

export async function selfHeal(): Promise<{ issuesFound: number; issuesFixed: number }> {
  const issues = await detectIssues();
  let fixed = 0;

  for (const issue of issues) {
    if (issue.autoFixable) {
      const result = await autoFixIssue(issue);
      if (result.fixed) {
        fixed++;
        await createRopaLog({
          taskId: undefined,
          level: "info",
          message: `Self-healed: ${issue.description}`,
          metadata: { component: issue.component },
        });
      }
    }

    if (issue.severity === "critical") {
      await createRopaAlert({
        severity: "critical",
        title: `Critical Issue: ${issue.component}`,
        message: issue.description,
        resolved: false,
      });
    }
  }

  return { issuesFound: issues.length, issuesFixed: fixed };
}

// ============ BUDGET OPTIMIZATION ============

export interface BudgetAllocation {
  campaignId: string;
  currentBudget: number;
  recommendedBudget: number;
  expectedROI: number;
  confidence: number;
}

export async function optimizeBudgetAllocation(campaigns: Array<{
  id: string;
  budget: number;
  performance: { conversions: number; revenue: number; cost: number };
}>): Promise<{ allocations: BudgetAllocation[]; totalSavings: number }> {
  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const allocations: BudgetAllocation[] = [];

  for (const campaign of campaigns) {
    const roi = campaign.performance.revenue / campaign.performance.cost;
    const conversionRate = campaign.performance.conversions / (campaign.performance.cost / 10);

    // Simple optimization: allocate more to high-ROI campaigns
    let recommendedBudget = campaign.budget;
    if (roi > 2) {
      recommendedBudget = campaign.budget * 1.3; // Increase by 30%
    } else if (roi < 1) {
      recommendedBudget = campaign.budget * 0.7; // Decrease by 30%
    }

    allocations.push({
      campaignId: campaign.id,
      currentBudget: campaign.budget,
      recommendedBudget: Math.round(recommendedBudget),
      expectedROI: roi * 1.15, // Expected improvement
      confidence: Math.min(0.95, conversionRate * 0.1),
    });
  }

  // Normalize to total budget
  const totalRecommended = allocations.reduce((sum, a) => sum + a.recommendedBudget, 0);
  const factor = totalBudget / totalRecommended;
  allocations.forEach((a) => {
    a.recommendedBudget = Math.round(a.recommendedBudget * factor);
  });

  const totalSavings = campaigns.reduce((sum, c, i) => {
    const diff = c.budget - allocations[i].recommendedBudget;
    return sum + (diff > 0 ? diff : 0);
  }, 0);

  return { allocations, totalSavings };
}

export async function predictBudgetNeeds(
  historicalData: Array<{ month: string; spent: number; revenue: number }>
): Promise<{ nextMonthBudget: number; confidence: number; reasoning: string }> {
  const avgSpent = historicalData.reduce((sum, d) => sum + d.spent, 0) / historicalData.length;
  const avgRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
  const avgROI = avgRevenue / avgSpent;

  // Simple trend analysis
  const recentSpent = historicalData.slice(-3).reduce((sum, d) => sum + d.spent, 0) / 3;
  const trend = recentSpent > avgSpent ? 1.1 : 0.95;

  const nextMonthBudget = Math.round(avgSpent * trend);
  const confidence = Math.min(0.9, historicalData.length * 0.1);

  return {
    nextMonthBudget,
    confidence,
    reasoning: `Based on ${historicalData.length} months of data with avg ROI of ${avgROI.toFixed(2)}x. ${trend > 1 ? "Upward" : "Downward"} trend detected.`,
  };
}

// ============ VOICE INTERFACE ============

export async function processVoiceCommand(audioUrl: string): Promise<{
  transcript: string;
  intent: string;
  action?: string;
  parameters?: Record<string, any>;
}> {
  // Transcribe audio
  const transcription = await transcribeAudio({ audioUrl });
  
  // Check for error
  if ('error' in transcription) {
    throw new Error(`Transcription failed: ${transcription.error}`);
  }

  // Analyze intent
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are ROPA's voice interface. Parse voice commands and extract intent and parameters.
Possible intents: create_campaign, pause_campaign, get_report, check_status, analyze_performance`,
      },
      {
        role: "user",
        content: `Parse this command: "${transcription.text}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "voice_command",
        strict: true,
        schema: {
          type: "object",
          properties: {
            intent: { type: "string" },
            action: { type: "string" },
            parameters: { type: "object", additionalProperties: true },
          },
          required: ["intent", "action"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Failed to parse voice command");
  }

  const parsed = JSON.parse(content);
  return {
    transcript: 'error' in transcription ? '' : transcription.text,
    ...parsed,
  };
}

// ============ SENTIMENT ANALYSIS ============

export async function analyzeSentiment(text: string): Promise<{
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  emotions: string[];
  urgency: "low" | "medium" | "high";
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a sentiment analysis expert. Analyze text sentiment, emotions, and urgency.",
      },
      {
        role: "user",
        content: `Analyze sentiment: "${text}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "sentiment_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
            score: { type: "number" },
            emotions: { type: "array", items: { type: "string" } },
            urgency: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["sentiment", "score", "emotions", "urgency"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Failed to analyze sentiment");
  }

  return JSON.parse(content);
}

export async function detectAtRiskCustomers(
  customerResponses: Array<{ customerId: string; message: string; timestamp: Date }>
): Promise<Array<{ customerId: string; riskLevel: number; reason: string }>> {
  const atRisk: Array<{ customerId: string; riskLevel: number; reason: string }> = [];

  for (const response of customerResponses) {
    const sentiment = await analyzeSentiment(response.message);

    if (sentiment.sentiment === "negative" || sentiment.urgency === "high") {
      const riskLevel =
        sentiment.sentiment === "negative" ? 0.7 : 0.5 + (sentiment.urgency === "high" ? 0.3 : 0);

      atRisk.push({
        customerId: response.customerId,
        riskLevel,
        reason: `Negative sentiment detected: ${sentiment.emotions.join(", ")}`,
      });
    }
  }

  return atRisk;
}

// ============ COMPETITIVE INTELLIGENCE ============

export async function analyzeCompetitor(competitorName: string, industry: string): Promise<{
  strengths: string[];
  weaknesses: string[];
  marketPosition: string;
  threats: string[];
  opportunities: string[];
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a competitive intelligence analyst. Provide SWOT analysis.",
      },
      {
        role: "user",
        content: `Analyze competitor: ${competitorName} in ${industry} industry`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "competitor_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            marketPosition: { type: "string" },
            threats: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
          },
          required: ["strengths", "weaknesses", "marketPosition", "threats", "opportunities"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Failed to analyze competitor");
  }

  return JSON.parse(content);
}

export async function monitorMarketTrends(industry: string): Promise<{
  trends: Array<{ trend: string; impact: "high" | "medium" | "low"; timeframe: string }>;
  recommendations: string[];
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a market trend analyst. Identify current trends and their business impact.",
      },
      {
        role: "user",
        content: `Identify current market trends in ${industry} industry`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "market_trends",
        strict: true,
        schema: {
          type: "object",
          properties: {
            trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  trend: { type: "string" },
                  impact: { type: "string", enum: ["high", "medium", "low"] },
                  timeframe: { type: "string" },
                },
                required: ["trend", "impact", "timeframe"],
                additionalProperties: false,
              },
            },
            recommendations: { type: "array", items: { type: "string" } },
          },
          required: ["trends", "recommendations"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Failed to analyze trends");
  }

  return JSON.parse(content);
}
