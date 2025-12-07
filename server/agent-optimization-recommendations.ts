/**
 * AI-Powered Optimization Recommendations for FAGOR Agents
 * 
 * Analyzes agent performance data and generates specific, actionable recommendations
 * using LLM to improve conversion rates, open rates, and overall ROI
 */

import { invokeLLM } from "./_core/llm";

interface AgentPerformanceData {
  agentId: string;
  agentName: string;
  campaignName: string;
  metrics: {
    emailsSent: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    roi: number;
    avgResponseTime: number;
  };
  recentTrends: {
    conversionRateChange: number;
    openRateChange: number;
    roiChange: number;
  };
}

interface Recommendation {
  category: 'subject_lines' | 'timing' | 'targeting' | 'content' | 'follow_up';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  actionSteps: string[];
}

interface AgentRecommendations {
  agentId: string;
  agentName: string;
  overallAssessment: string;
  recommendations: Recommendation[];
  generatedAt: Date;
}

/**
 * Generate AI-powered recommendations for a single agent
 */
export async function generateAgentRecommendations(
  agentData: AgentPerformanceData
): Promise<AgentRecommendations> {
  const prompt = buildRecommendationPrompt(agentData);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert email marketing analyst specializing in B2B industrial equipment sales campaigns. 
Your role is to analyze agent performance data and provide specific, actionable recommendations to improve conversion rates, open rates, and ROI.

Focus on:
- Subject line optimization
- Email timing and frequency
- Audience targeting and segmentation
- Content personalization
- Follow-up strategies

Provide concrete, data-driven recommendations with clear action steps.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "agent_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallAssessment: {
                type: "string",
                description: "A brief overall assessment of the agent's performance (2-3 sentences)",
              },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: {
                      type: "string",
                      enum: ["subject_lines", "timing", "targeting", "content", "follow_up"],
                      description: "Category of the recommendation",
                    },
                    priority: {
                      type: "string",
                      enum: ["high", "medium", "low"],
                      description: "Priority level of the recommendation",
                    },
                    title: {
                      type: "string",
                      description: "Short title for the recommendation (max 10 words)",
                    },
                    description: {
                      type: "string",
                      description: "Detailed description of the recommendation (2-3 sentences)",
                    },
                    expectedImpact: {
                      type: "string",
                      description: "Expected impact on metrics (e.g., '+5-10% open rate')",
                    },
                    actionSteps: {
                      type: "array",
                      items: {
                        type: "string",
                        description: "Specific action step",
                      },
                      description: "List of 2-4 specific action steps to implement the recommendation",
                    },
                  },
                  required: ["category", "priority", "title", "description", "expectedImpact", "actionSteps"],
                  additionalProperties: false,
                },
                description: "List of 3-5 prioritized recommendations",
              },
            },
            required: ["overallAssessment", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from LLM");
    }

    const parsed = JSON.parse(content);

    return {
      agentId: agentData.agentId,
      agentName: agentData.agentName,
      overallAssessment: parsed.overallAssessment,
      recommendations: parsed.recommendations,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error(`[AgentRecommendations] Error generating recommendations for ${agentData.agentName}:`, error);
    
    // Return fallback recommendations
    return {
      agentId: agentData.agentId,
      agentName: agentData.agentName,
      overallAssessment: `${agentData.agentName} is performing with a ${agentData.metrics.conversionRate.toFixed(1)}% conversion rate. Analysis of performance trends suggests opportunities for optimization.`,
      recommendations: getFallbackRecommendations(agentData),
      generatedAt: new Date(),
    };
  }
}

/**
 * Build the prompt for LLM recommendation generation
 */
function buildRecommendationPrompt(agentData: AgentPerformanceData): string {
  const { agentName, campaignName, metrics, recentTrends } = agentData;

  return `
Analyze the performance of ${agentName} in the ${campaignName} campaign and provide specific optimization recommendations.

**Current Performance Metrics:**
- Emails Sent: ${metrics.emailsSent}
- Open Rate: ${metrics.openRate.toFixed(1)}%
- Click Rate: ${metrics.clickRate.toFixed(1)}%
- Conversion Rate: ${metrics.conversionRate.toFixed(1)}%
- ROI: ${metrics.roi.toFixed(0)}%
- Average Response Time: ${metrics.avgResponseTime.toFixed(1)} hours

**Recent Trends (vs. previous period):**
- Conversion Rate: ${recentTrends.conversionRateChange > 0 ? '+' : ''}${recentTrends.conversionRateChange.toFixed(1)}%
- Open Rate: ${recentTrends.openRateChange > 0 ? '+' : ''}${recentTrends.openRateChange.toFixed(1)}%
- ROI: ${recentTrends.roiChange > 0 ? '+' : ''}${recentTrends.roiChange.toFixed(1)}%

**Campaign Context:**
This is a B2B industrial equipment campaign targeting manufacturing decision-makers (CTOs, Operations Managers, Plant Managers) for FAGOR CNC machines and training programs.

**Task:**
Provide 3-5 specific, actionable recommendations to improve this agent's performance. Focus on areas with the most potential for improvement based on the metrics and trends.

For each recommendation:
1. Identify the specific category (subject_lines, timing, targeting, content, or follow_up)
2. Assign priority (high, medium, or low) based on potential impact
3. Provide a clear title and detailed description
4. Estimate the expected impact on key metrics
5. List 2-4 concrete action steps to implement the recommendation

Be specific and practical. Avoid generic advice.
  `.trim();
}

/**
 * Get fallback recommendations when LLM fails
 */
function getFallbackRecommendations(agentData: AgentPerformanceData): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Low open rate recommendation
  if (agentData.metrics.openRate < 25) {
    recommendations.push({
      category: 'subject_lines',
      priority: 'high',
      title: 'Optimize Subject Lines for Higher Open Rates',
      description: `Current open rate of ${agentData.metrics.openRate.toFixed(1)}% is below industry average (25-30%). Subject line optimization can significantly improve open rates.`,
      expectedImpact: '+8-12% open rate',
      actionSteps: [
        'A/B test subject lines with urgency vs. curiosity angles',
        'Keep subject lines under 50 characters for mobile optimization',
        'Include numbers or specific benefits (e.g., "Save 30% on CNC Training")',
        'Personalize with company name or role when available',
      ],
    });
  }

  // Low conversion rate recommendation
  if (agentData.metrics.conversionRate < 20) {
    recommendations.push({
      category: 'content',
      priority: 'high',
      title: 'Enhance Email Content Personalization',
      description: `Conversion rate of ${agentData.metrics.conversionRate.toFixed(1)}% suggests content may not be resonating with the target audience. Personalized content can double conversion rates.`,
      expectedImpact: '+5-10% conversion rate',
      actionSteps: [
        'Segment audience by industry vertical and customize messaging',
        'Include specific use cases relevant to recipient\'s role',
        'Add social proof (case studies, testimonials) from similar companies',
        'Simplify CTA to one clear action per email',
      ],
    });
  }

  // Timing recommendation
  if (agentData.metrics.openRate > 0) {
    recommendations.push({
      category: 'timing',
      priority: 'medium',
      title: 'Optimize Send Times for B2B Audience',
      description: 'B2B decision-makers have specific email engagement patterns. Timing optimization can improve both open and response rates.',
      expectedImpact: '+3-5% open rate',
      actionSteps: [
        'Test Tuesday-Thursday sends (highest B2B engagement)',
        'Send between 10-11 AM or 2-3 PM in recipient\'s timezone',
        'Avoid Monday mornings and Friday afternoons',
        'Implement timezone-aware sending for international contacts',
      ],
    });
  }

  // Follow-up recommendation
  recommendations.push({
    category: 'follow_up',
    priority: 'medium',
    title: 'Implement Strategic Follow-Up Sequence',
    description: 'Multi-touch follow-up sequences can increase conversion rates by 50-100% compared to single emails.',
    expectedImpact: '+10-15% conversion rate',
    actionSteps: [
      'Create 3-email sequence with 3-5 day intervals',
      'Vary messaging angle in each follow-up (value → urgency → social proof)',
      'Track engagement and adjust sequence based on opens/clicks',
      'Add conditional logic to skip follow-ups for responders',
    ],
  });

  // Targeting recommendation
  if (agentData.metrics.clickRate < 10) {
    recommendations.push({
      category: 'targeting',
      priority: 'medium',
      title: 'Refine Audience Targeting Criteria',
      description: `Low click rate of ${agentData.metrics.clickRate.toFixed(1)}% may indicate targeting misalignment. Better audience segmentation improves relevance.`,
      expectedImpact: '+4-6% click rate',
      actionSteps: [
        'Analyze company size and industry of high-converters',
        'Exclude companies that recently purchased similar products',
        'Focus on companies with active manufacturing operations',
        'Use intent signals (website visits, content downloads) for prioritization',
      ],
    });
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Generate recommendations for all agents
 */
export async function generateAllAgentRecommendations(
  agentsData: AgentPerformanceData[]
): Promise<AgentRecommendations[]> {
  const results: AgentRecommendations[] = [];

  for (const agentData of agentsData) {
    try {
      const recommendations = await generateAgentRecommendations(agentData);
      results.push(recommendations);
    } catch (error) {
      console.error(`[AgentRecommendations] Failed to generate recommendations for ${agentData.agentName}:`, error);
    }
  }

  return results;
}
