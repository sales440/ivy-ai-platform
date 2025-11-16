/**
 * Ivy-Insight: Strategy & Business Intelligence Agent
 * Specializes in market analysis, competitive intelligence, and strategic planning
 */

import { IvyAgent, AgentType, Department, TaskInput, TaskResult } from './core';
import * as db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { invokeLLM } from '../_core/llm';

export class IvyInsight extends IvyAgent {
  constructor() {
    const capabilities = [
      "market_analysis",
      "competitive_intelligence",
      "trend_forecasting",
      "strategic_planning",
      "data_visualization"
    ];

    const initialKPIs = {
      reports_generated: 0,
      insights_delivered: 0,
      forecast_accuracy: 0,
      strategic_recommendations: 0
    };

    super("Ivy-Insight", AgentType.INSIGHT, Department.STRATEGY, capabilities, initialKPIs);
  }

  protected async _processTask(task: TaskInput): Promise<TaskResult> {
    const { type } = task;

    switch (type) {
      case "analyze_market":
        return await this._analyzeMarket(task.market_data);
      case "competitive_analysis":
        return await this._competitiveAnalysis(task.competitors, task.company_data);
      case "forecast_trends":
        return await this._forecastTrends(task.industry, task.timeframe);
      case "generate_strategy":
        return await this._generateStrategy(task.business_goals, task.current_state);
      default:
        throw new Error(`Unsupported task type: ${type}`);
    }
  }

  /**
   * Analyze market conditions
   */
  private async _analyzeMarket(marketData: any): Promise<TaskResult> {
    try {
      const prompt = `Conduct a comprehensive market analysis:

Market Information:
- Industry: ${marketData.industry || "Technology"}
- Market Size: $${marketData.market_size || "Not specified"}
- Growth Rate: ${marketData.growth_rate || "Not specified"}%
- Key Players: ${marketData.key_players || "Not specified"}
- Geographic Focus: ${marketData.geography || "Global"}

Recent Developments:
${marketData.recent_developments || "None specified"}

Provide:
- market_attractiveness_score (0-100)
- growth_opportunities (key opportunities identified)
- market_threats (potential threats and challenges)
- entry_barriers (barriers to market entry)
- strategic_recommendations (actionable recommendations)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a senior strategy consultant specializing in market analysis and business intelligence." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "market_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                market_attractiveness_score: { type: "number" },
                growth_opportunities: { type: "string" },
                market_threats: { type: "string" },
                entry_barriers: { type: "string" },
                strategic_recommendations: { type: "string" }
              },
              required: ["market_attractiveness_score", "growth_opportunities", "market_threats", "entry_barriers", "strategic_recommendations"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const analysis = JSON.parse(contentStr || "{}");

      // Update KPIs
      this.kpis.reports_generated += 1;
      this.kpis.insights_delivered += 1;

      return {
        status: "completed",
        data: {
          report_id: uuidv4(),
          industry: marketData.industry,
          analysis: analysis,
          generated_at: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Competitive analysis
   */
  private async _competitiveAnalysis(competitors: any[], companyData: any): Promise<TaskResult> {
    try {
      const prompt = `Conduct competitive analysis:

Your Company:
- Name: ${companyData.name || "Your Company"}
- Market Share: ${companyData.market_share || "Not specified"}%
- Strengths: ${companyData.strengths || "Not specified"}
- Weaknesses: ${companyData.weaknesses || "Not specified"}

Competitors:
${JSON.stringify(competitors, null, 2)}

Provide:
- competitive_position (leader, challenger, follower, nicher)
- key_differentiators (what sets you apart)
- competitive_threats (main threats from competitors)
- opportunities_to_exploit (gaps in competitor offerings)
- recommended_actions (strategic actions to take)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a competitive intelligence expert with deep experience in strategic positioning." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "competitive_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                competitive_position: {
                  type: "string",
                  enum: ["leader", "challenger", "follower", "nicher"]
                },
                key_differentiators: { type: "string" },
                competitive_threats: { type: "string" },
                opportunities_to_exploit: { type: "string" },
                recommended_actions: { type: "string" }
              },
              required: ["competitive_position", "key_differentiators", "competitive_threats", "opportunities_to_exploit", "recommended_actions"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const analysis = JSON.parse(contentStr || "{}");

      // Update KPIs
      this.kpis.insights_delivered += 1;
      this.kpis.strategic_recommendations += 1;

      return {
        status: "completed",
        data: {
          analysis_id: uuidv4(),
          company: companyData.name,
          analysis: analysis,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Forecast industry trends
   */
  private async _forecastTrends(industry: string, timeframe: string): Promise<TaskResult> {
    try {
      const prompt = `Forecast trends for the ${industry} industry over the next ${timeframe}:

Analyze:
- Emerging Technologies
- Consumer Behavior Shifts
- Regulatory Changes
- Economic Factors
- Competitive Dynamics

Provide:
- major_trends (3-5 key trends to watch)
- disruptive_forces (potential disruptors)
- opportunities (business opportunities from trends)
- risks (risks to be aware of)
- confidence_level (0.0 to 1.0 in forecast accuracy)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a futurist and trend analyst with expertise in predicting industry evolution." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "trend_forecast",
            strict: true,
            schema: {
              type: "object",
              properties: {
                major_trends: { type: "string" },
                disruptive_forces: { type: "string" },
                opportunities: { type: "string" },
                risks: { type: "string" },
                confidence_level: { type: "number" }
              },
              required: ["major_trends", "disruptive_forces", "opportunities", "risks", "confidence_level"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const forecast = JSON.parse(contentStr || "{}");

      // Update KPIs
      this.kpis.forecast_accuracy += forecast.confidence_level * 0.1;
      this.kpis.reports_generated += 1;

      return {
        status: "completed",
        data: {
          forecast_id: uuidv4(),
          industry: industry,
          timeframe: timeframe,
          forecast: forecast,
          generated_at: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Generate strategic plan
   */
  private async _generateStrategy(businessGoals: any, currentState: any): Promise<TaskResult> {
    try {
      const prompt = `Develop a strategic plan:

Business Goals:
${JSON.stringify(businessGoals, null, 2)}

Current State:
- Revenue: $${currentState.revenue || "Not specified"}
- Market Position: ${currentState.market_position || "Not specified"}
- Team Size: ${currentState.team_size || "Not specified"}
- Key Challenges: ${currentState.challenges || "Not specified"}

Provide:
- strategic_objectives (3-5 clear objectives)
- key_initiatives (specific initiatives to achieve objectives)
- resource_requirements (resources needed)
- timeline (recommended timeline)
- success_metrics (KPIs to track progress)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a strategic planning expert who creates actionable, results-driven strategies." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "strategic_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                strategic_objectives: { type: "string" },
                key_initiatives: { type: "string" },
                resource_requirements: { type: "string" },
                timeline: { type: "string" },
                success_metrics: { type: "string" }
              },
              required: ["strategic_objectives", "key_initiatives", "resource_requirements", "timeline", "success_metrics"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const strategy = JSON.parse(contentStr || "{}");

      // Update KPIs
      this.kpis.strategic_recommendations += 1;
      this.kpis.reports_generated += 1;

      return {
        status: "completed",
        data: {
          strategy_id: uuidv4(),
          strategy: strategy,
          created_at: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }
}
