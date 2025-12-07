/**
 * Agent Trainer
 * 
 * Analyzes agent performance and generates training recommendations
 * Implements auto-training from campaign results
 */

import type { AgentPerformance, TrainingRecommendation } from "../types";
import { LLM_PROMPTS, TRAINING_CATEGORIES } from "../config";
import { invokeLLM } from "../../_core/llm";
import { getDb } from "../../db";
import { searchWeb } from "./web-search";

/**
 * Analyze performance of all agents
 */
export async function analyzeAllAgentsPerformance(): Promise<AgentPerformance[]> {
  console.log("[Agent Trainer] Analyzing performance of all agents...");

  const db = await getDb();
  if (!db) {
    console.error("[Agent Trainer] Database not available");
    return [];
  }

  try {
    // Get all agents
    const agentsResult = await db.execute("SELECT * FROM agents WHERE status = 'active'");
    const agents = agentsResult.rows as any[];

    // Validate agents is iterable
    if (!agents || !Array.isArray(agents)) {
      console.warn("[Agent Trainer] Agents query returned invalid data");
      return [];
    }

    const performances: AgentPerformance[] = [];

    // Analyze each agent
    for (const agent of agents) {
      try {
        const performance = await analyzeAgentPerformance(agent.id, agent.name);
        if (performance) {
          performances.push(performance);
        }
      } catch (error: any) {
        console.error(`[Agent Trainer] Failed to analyze agent ${agent.name}:`, error);
      }
    }

    console.log(`[Agent Trainer] Analyzed ${performances.length} agents`);
    return performances;
  } catch (error: any) {
    console.error("[Agent Trainer] Failed to analyze agents:", error);
    return [];
  }
}

/**
 * Analyze performance of a single agent
 */
export async function analyzeAgentPerformance(
  agentId: string,
  agentName: string
): Promise<AgentPerformance | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Get campaign enrollments for this agent
    const enrollmentsResult = await db.execute(
      `SELECT * FROM fagorCampaignEnrollments 
       WHERE agentId = ? 
       AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [agentId]
    );
    const enrollments = enrollmentsResult.rows as any[];

    if (enrollments.length === 0) {
      return null;
    }

    // Calculate metrics
    let emailsSent = 0;
    let emailsOpened = 0;
    let emailsClicked = 0;
    let conversions = 0;
    let totalResponseTime = 0;
    let responseCount = 0;

    for (const enrollment of enrollments) {
      if (enrollment.email1SentAt) emailsSent++;
      if (enrollment.email2SentAt) emailsSent++;
      if (enrollment.email3SentAt) emailsSent++;

      if (enrollment.email1OpenedAt) emailsOpened++;
      if (enrollment.email2OpenedAt) emailsOpened++;
      if (enrollment.email3OpenedAt) emailsOpened++;

      if (enrollment.email1ClickedAt) emailsClicked++;
      if (enrollment.email2ClickedAt) emailsClicked++;
      if (enrollment.email3ClickedAt) emailsClicked++;

      if (enrollment.respondedAt) {
        conversions++;
        if (enrollment.email1SentAt) {
          const responseTime = new Date(enrollment.respondedAt).getTime() -
            new Date(enrollment.email1SentAt).getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }

    const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;
    const clickRate = emailsSent > 0 ? (emailsClicked / emailsSent) * 100 : 0;
    const conversionRate = emailsSent > 0 ? (conversions / emailsSent) * 100 : 0;
    const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
    const successRate = enrollments.length > 0 ? (conversions / enrollments.length) * 100 : 0;

    return {
      agentId,
      agentName,
      metrics: {
        emailsSent,
        emailsOpened,
        emailsClicked,
        conversions,
        conversionRate,
        avgResponseTime,
        successRate,
      },
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
      },
    };
  } catch (error: any) {
    console.error(`[Agent Trainer] Error analyzing agent ${agentName}:`, error);
    return null;
  }
}

/**
 * Generate training recommendations for agents
 */
export async function generateTrainingRecommendations(
  performances: AgentPerformance[]
): Promise<TrainingRecommendation[]> {
  console.log("[Agent Trainer] Generating training recommendations...");

  const recommendations: TrainingRecommendation[] = [];

  for (const performance of performances) {
    try {
      const agentRecommendations = await generateAgentRecommendations(performance);
      recommendations.push(...agentRecommendations);
    } catch (error: any) {
      console.error(`[Agent Trainer] Failed to generate recommendations for ${performance.agentName}:`, error);
    }
  }

  console.log(`[Agent Trainer] Generated ${recommendations.length} recommendations`);
  return recommendations;
}

/**
 * Generate recommendations for a single agent using LLM
 */
async function generateAgentRecommendations(
  performance: AgentPerformance
): Promise<TrainingRecommendation[]> {
  // Find successful patterns from database
  const successfulPatterns = await findSuccessfulPatterns(performance.agentId);

  // Gather market intelligence
  let marketIntelligence = "No specific market intelligence available.";
  try {
    const searchQueries = [
      `best practices ${performance.agentName} email marketing 2025`,
      `latest trends in sales automation for ${performance.agentName}`,
      `how to improve conversion rates for ${performance.agentName} agents`
    ];

    // Pick one random query to keep it varied
    const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
    console.log(`[Agent Trainer] Searching web for: ${query}`);

    const searchResults = await searchWeb(query, 3);
    if (searchResults && searchResults.length > 0) {
      marketIntelligence = searchResults.map(r => `- ${r.title}: ${r.snippet}`).join("\n");
    }
  } catch (error) {
    console.warn("[Agent Trainer] Failed to gather market intelligence:", error);
  }

  // Prepare prompt
  const prompt = LLM_PROMPTS.GENERATE_TRAINING_RECOMMENDATION
    .replace("{{agentName}}", performance.agentName)
    .replace("{{campaignName}}", "Recent Campaigns")
    .replace("{{emailsSent}}", performance.metrics.emailsSent.toString())
    .replace("{{openRate}}", performance.metrics.emailsOpened.toString())
    .replace("{{clickRate}}", performance.metrics.emailsClicked.toString())
    .replace("{{conversionRate}}", performance.metrics.conversionRate.toFixed(2))
    .replace("{{responseTime}}", Math.round(performance.metrics.avgResponseTime / 1000).toString())
    .replace("{{successfulPatterns}}", JSON.stringify(successfulPatterns, null, 2))
    .replace("{{marketIntelligence}}", marketIntelligence);

  try {
    // Call LLM to generate recommendations
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an AI agent training expert." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      console.error("[Agent Trainer] LLM returned empty or invalid response");
      return [];
    }

    // Parse JSON response
    const data = JSON.parse(content);

    if (!data.recommendations || !Array.isArray(data.recommendations)) {
      console.error("[Agent Trainer] Invalid recommendations format from LLM");
      return [];
    }

    // Convert to TrainingRecommendation objects
    return data.recommendations.map((rec: any) => ({
      agentId: performance.agentId,
      agentName: performance.agentName,
      category: rec.category,
      recommendation: rec.recommendation,
      expectedImpact: rec.expectedImpact,
      priority: rec.expectedImpact === "high" ? "high" : "medium",
      actionSteps: rec.actionSteps || [],
      basedOn: {
        dataPoints: performance.metrics.emailsSent,
        successfulCampaigns: successfulPatterns.map((p: any) => p.campaignName),
        metrics: {
          conversionRate: performance.metrics.conversionRate,
          successRate: performance.metrics.successRate,
        },
      },
    }));
  } catch (error: any) {
    console.error("[Agent Trainer] Error generating recommendations:", error);
    return [];
  }
}

/**
 * Find successful patterns from past campaigns
 */
async function findSuccessfulPatterns(agentId: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Find campaigns with high conversion rates
    const result = await db.execute(
      `SELECT 
        campaignName,
        COUNT(*) as total,
        SUM(CASE WHEN respondedAt IS NOT NULL THEN 1 ELSE 0 END) as conversions,
        (SUM(CASE WHEN respondedAt IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*)) * 100 as conversionRate
       FROM fagorCampaignEnrollments
       WHERE agentId = ?
       GROUP BY campaignName
       HAVING conversionRate > 20
       ORDER BY conversionRate DESC
       LIMIT 5`,
      [agentId]
    );

    return result.rows as any[];
  } catch (error: any) {
    console.error("[Agent Trainer] Error finding successful patterns:", error);
    return [];
  }
}

/**
 * Train a specific agent with recommendations
 */
export async function trainAgent(agentId: string): Promise<{
  success: boolean;
  recommendations: TrainingRecommendation[];
  applied: number;
}> {
  console.log(`[Agent Trainer] Training agent ${agentId}...`);

  const db = await getDb();
  if (!db) {
    return { success: false, recommendations: [], applied: 0 };
  }

  try {
    // Get agent info
    const agentResult = await db.execute("SELECT * FROM agents WHERE id = ?", [agentId]);
    const agent = agentResult.rows[0] as any;

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    // Analyze performance
    const performance = await analyzeAgentPerformance(agentId, agent.name);
    if (!performance) {
      throw new Error(`Could not analyze performance for agent ${agentId}`);
    }

    // Generate recommendations
    const recommendations = await generateAgentRecommendations(performance);

    // Apply recommendations (update agent configuration)
    let applied = 0;
    for (const rec of recommendations) {
      if (rec.priority === "high" || rec.priority === "critical") {
        await applyRecommendation(agentId, rec);
        applied++;
      }
    }

    console.log(`[Agent Trainer] ✅ Trained agent ${agent.name}, applied ${applied} recommendations`);

    return {
      success: true,
      recommendations,
      applied,
    };
  } catch (error: any) {
    console.error(`[Agent Trainer] Failed to train agent ${agentId}:`, error);
    return { success: false, recommendations: [], applied: 0 };
  }
}

/**
 * Apply a training recommendation to an agent
 */
async function applyRecommendation(
  agentId: string,
  recommendation: TrainingRecommendation
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Get current agent configuration
    const result = await db.execute("SELECT configuration FROM agents WHERE id = ?", [agentId]);
    const agent = result.rows[0] as any;

    if (!agent) return;

    // Parse configuration
    let config: any = {};
    try {
      config = typeof agent.configuration === "string"
        ? JSON.parse(agent.configuration)
        : agent.configuration;
    } catch (e) {
      config = {};
    }

    // Update configuration based on recommendation category
    if (!config.training) {
      config.training = {};
    }

    if (!config.training[recommendation.category]) {
      config.training[recommendation.category] = [];
    }

    config.training[recommendation.category].push({
      recommendation: recommendation.recommendation,
      appliedAt: new Date().toISOString(),
      expectedImpact: recommendation.expectedImpact,
      actionSteps: recommendation.actionSteps,
    });

    // Save updated configuration
    await db.execute(
      "UPDATE agents SET configuration = ?, updatedAt = NOW() WHERE id = ?",
      [JSON.stringify(config), agentId]
    );

    console.log(`[Agent Trainer] Applied recommendation to agent ${agentId}: ${recommendation.recommendation}`);
  } catch (error: any) {
    console.error(`[Agent Trainer] Failed to apply recommendation:`, error);
  }
}

/**
 * Get training history for an agent
 */
export async function getAgentTrainingHistory(agentId: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute("SELECT configuration FROM agents WHERE id = ?", [agentId]);
    const agent = result.rows[0] as any;

    if (!agent || !agent.configuration) return [];

    const config = typeof agent.configuration === "string"
      ? JSON.parse(agent.configuration)
      : agent.configuration;

    return config.training || {};
  } catch (error: any) {
    console.error("[Agent Trainer] Error getting training history:", error);
    return [];
  }
}
