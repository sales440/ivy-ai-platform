import { getDb } from "./db";
import { agents } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Campaign-Agent Auto-Assignment Recommendation System
 * 
 * Matches campaigns to optimal agents based on:
 * 1. Agent specialization (type/capabilities)
 * 2. Historical performance metrics
 * 3. Current workload
 * 4. Campaign characteristics
 */

export interface CampaignCharacteristics {
  type: 'cold_outreach' | 'nurture' | 'conversion' | 'reactivation' | 'upsell';
  industry?: string;
  targetAudience?: string;
  expectedVolume?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface AgentRecommendation {
  agentId: number;
  agentName: string;
  agentType: string;
  score: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string[];
  estimatedPerformance: {
    expectedConversionRate: number;
    expectedROI: number;
    expectedOpenRate: number;
  };
}

/**
 * Calculate agent specialization match score (0-100)
 */
function calculateSpecializationScore(
  agentType: string,
  campaignType: CampaignCharacteristics['type']
): number {
  const specializationMatrix: Record<string, Record<string, number>> = {
    prospect: {
      cold_outreach: 95,
      nurture: 60,
      conversion: 50,
      reactivation: 70,
      upsell: 40,
    },
    closer: {
      cold_outreach: 50,
      nurture: 70,
      conversion: 95,
      reactivation: 60,
      upsell: 85,
    },
    solve: {
      cold_outreach: 60,
      nurture: 80,
      conversion: 75,
      reactivation: 85,
      upsell: 70,
    },
    logic: {
      cold_outreach: 70,
      nurture: 75,
      conversion: 80,
      reactivation: 70,
      upsell: 75,
    },
    talent: {
      cold_outreach: 80,
      nurture: 85,
      conversion: 70,
      reactivation: 75,
      upsell: 65,
    },
    insight: {
      cold_outreach: 65,
      nurture: 90,
      conversion: 70,
      reactivation: 80,
      upsell: 75,
    },
  };

  return specializationMatrix[agentType]?.[campaignType] || 50;
}

/**
 * Calculate performance-based score from historical metrics
 */
function calculatePerformanceScore(metrics: {
  conversionRate: number;
  roi: number;
  openRate: number;
  emailsSent: number;
}): number {
  // Weighted scoring based on key metrics
  const conversionWeight = 0.4;
  const roiWeight = 0.3;
  const openRateWeight = 0.2;
  const volumeWeight = 0.1;

  // Normalize metrics to 0-100 scale
  const conversionScore = Math.min(metrics.conversionRate * 5, 100); // 20% = 100 points
  const roiScore = Math.min(metrics.roi / 10, 100); // 1000% ROI = 100 points
  const openRateScore = Math.min(metrics.openRate * 2, 100); // 50% = 100 points
  const volumeScore = Math.min((metrics.emailsSent / 1000) * 100, 100); // 1000 emails = 100 points

  return (
    conversionScore * conversionWeight +
    roiScore * roiWeight +
    openRateScore * openRateWeight +
    volumeScore * volumeWeight
  );
}

/**
 * Calculate workload penalty (reduces score if agent is overloaded)
 */
function calculateWorkloadPenalty(currentEmailsSent: number, expectedVolume: number): number {
  const capacity = 2000; // Max emails per agent per month
  const currentLoad = currentEmailsSent / capacity;
  const projectedLoad = (currentEmailsSent + expectedVolume) / capacity;

  if (projectedLoad > 1.0) {
    return -30; // Heavy penalty for exceeding capacity
  } else if (projectedLoad > 0.8) {
    return -15; // Moderate penalty for high load
  } else if (projectedLoad > 0.6) {
    return -5; // Small penalty
  }

  return 0; // No penalty
}

/**
 * Generate reasoning for recommendation
 */
function generateReasoning(
  agentType: string,
  campaignType: CampaignCharacteristics['type'],
  specializationScore: number,
  performanceScore: number,
  workloadPenalty: number
): string[] {
  const reasons: string[] = [];

  // Specialization reasoning
  if (specializationScore >= 90) {
    reasons.push(`Highly specialized for ${campaignType.replace('_', ' ')} campaigns`);
  } else if (specializationScore >= 70) {
    reasons.push(`Well-suited for ${campaignType.replace('_', ' ')} campaigns`);
  } else if (specializationScore < 60) {
    reasons.push(`Limited experience with ${campaignType.replace('_', ' ')} campaigns`);
  }

  // Performance reasoning
  if (performanceScore >= 80) {
    reasons.push('Excellent historical performance metrics');
  } else if (performanceScore >= 60) {
    reasons.push('Good track record of conversions');
  } else if (performanceScore < 40) {
    reasons.push('Below-average performance history');
  }

  // Workload reasoning
  if (workloadPenalty === 0) {
    reasons.push('Available capacity for new campaigns');
  } else if (workloadPenalty > -15) {
    reasons.push('Moderate current workload');
  } else {
    reasons.push('High current workload - may affect performance');
  }

  return reasons;
}

/**
 * Estimate expected performance based on agent metrics and campaign type
 */
function estimatePerformance(
  agentMetrics: {
    conversionRate: number;
    roi: number;
    openRate: number;
  },
  specializationScore: number
): {
  expectedConversionRate: number;
  expectedROI: number;
  expectedOpenRate: number;
} {
  // Adjust expected performance based on specialization match
  const adjustmentFactor = specializationScore / 100;

  return {
    expectedConversionRate: agentMetrics.conversionRate * adjustmentFactor,
    expectedROI: agentMetrics.roi * adjustmentFactor,
    expectedOpenRate: agentMetrics.openRate * adjustmentFactor,
  };
}

/**
 * Main recommendation function
 */
export async function recommendAgentsForCampaign(
  campaign: CampaignCharacteristics
): Promise<AgentRecommendation[]> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  // Get all active agents
  const activeAgents = await db
    .select()
    .from(agents)
    .where(eq(agents.status, 'active'));

  // Calculate scores for each agent
  const recommendations: AgentRecommendation[] = [];

  for (const agent of activeAgents) {
    // Parse agent metrics (mock data for now - should come from real metrics)
    const agentMetrics = {
      conversionRate: 14.5,
      roi: 485,
      openRate: 32,
      emailsSent: 450,
    };

    // Calculate component scores
    const specializationScore = calculateSpecializationScore(agent.type, campaign.type);
    const performanceScore = calculatePerformanceScore(agentMetrics);
    const workloadPenalty = calculateWorkloadPenalty(
      agentMetrics.emailsSent,
      campaign.expectedVolume || 0
    );

    // Calculate final score (weighted average)
    const finalScore = Math.max(
      0,
      Math.min(
        100,
        specializationScore * 0.5 + performanceScore * 0.4 + workloadPenalty
      )
    );

    // Determine confidence level
    let confidence: 'low' | 'medium' | 'high';
    if (finalScore >= 75) {
      confidence = 'high';
    } else if (finalScore >= 55) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    // Generate reasoning
    const reasoning = generateReasoning(
      agent.type,
      campaign.type,
      specializationScore,
      performanceScore,
      workloadPenalty
    );

    // Estimate expected performance
    const estimatedPerformance = estimatePerformance(agentMetrics, specializationScore);

    recommendations.push({
      agentId: agent.id,
      agentName: agent.name,
      agentType: agent.type,
      score: Math.round(finalScore),
      confidence,
      reasoning,
      estimatedPerformance: {
        expectedConversionRate: Math.round(estimatedPerformance.expectedConversionRate * 10) / 10,
        expectedROI: Math.round(estimatedPerformance.expectedROI),
        expectedOpenRate: Math.round(estimatedPerformance.expectedOpenRate * 10) / 10,
      },
    });
  }

  // Sort by score (descending)
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations;
}

/**
 * Track assignment effectiveness for learning
 */
export async function trackAssignmentEffectiveness(
  agentId: number,
  campaignId: number,
  actualMetrics: {
    conversionRate: number;
    roi: number;
    openRate: number;
  }
): Promise<void> {
  // TODO: Store assignment effectiveness data for ML model training
  // This will be used to improve future recommendations
  console.log('Tracking assignment effectiveness:', {
    agentId,
    campaignId,
    actualMetrics,
  });
}
