/**
 * Ivy-Closer: Sales Closing Agent
 * Specializes in deal negotiation, objection handling, and closing sales
 */

import { IvyAgent, AgentType, Department } from './core';
import type { TaskInput, TaskResult } from './core';
import * as db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { invokeLLM } from '../_core/llm';

export class IvyCloser extends IvyAgent {
  constructor() {
    const capabilities = [
      "sales_negotiation",
      "meeting_management",
      "objection_handling",
      "contract_generation",
      "tone_analysis"
    ];

    const initialKPIs = {
      deals_closed: 0,
      avg_deal_value: 0,
      conversion_rate: 0,
      sales_cycle_time: 0
    };

    super("Ivy-Closer", AgentType.CLOSER, Department.SALES, capabilities, initialKPIs);
  }

  protected async _processTask(task: TaskInput): Promise<TaskResult> {
    const { type } = task;

    switch (type) {
      case "handle_objection":
        return await this._handleObjection(task.objection, task.context);
      case "negotiate_deal":
        return await this._negotiateDeal(task.deal_info);
      case "generate_proposal":
        return await this._generateProposal(task.client_info, task.product_info);
      case "analyze_sentiment":
        return await this._analyzeSentiment(task.conversation);
      default:
        throw new Error(`Unsupported task type: ${type}`);
    }
  }

  /**
   * Handle sales objections
   */
  private async _handleObjection(objection: string, context: any): Promise<TaskResult> {
    try {
      const prompt = `You are an expert sales closer. A prospect has raised the following objection:

Objection: "${objection}"

Context:
- Product/Service: ${context.product || "Enterprise software"}
- Price Point: ${context.price || "Not specified"}
- Competitor: ${context.competitor || "Unknown"}
- Stage: ${context.stage || "Negotiation"}

Provide:
- objection_type (one of: price, timing, authority, need, competition, trust)
- severity (1-10, how serious is this objection)
- response (compelling response to overcome the objection)
- next_steps (recommended actions to move forward)
- success_probability (0.0 to 1.0)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a master sales closer with 20 years of experience handling objections." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "objection_handling",
            strict: true,
            schema: {
              type: "object",
              properties: {
                objection_type: {
                  type: "string",
                  enum: ["price", "timing", "authority", "need", "competition", "trust"]
                },
                severity: { type: "number" },
                response: { type: "string" },
                next_steps: { type: "string" },
                success_probability: { type: "number" }
              },
              required: ["objection_type", "severity", "response", "next_steps", "success_probability"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const analysis = JSON.parse(contentStr || "{}");

      // Update KPIs
      if (analysis.success_probability > 0.7) {
        this.kpis.conversion_rate += 0.01;
      }

      return {
        status: "completed",
        data: {
          objection: objection,
          analysis: analysis,
          recommended_response: analysis.response,
          next_steps: analysis.next_steps
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
   * Negotiate deal terms
   */
  private async _negotiateDeal(dealInfo: any): Promise<TaskResult> {
    try {
      const prompt = `You are negotiating a B2B deal. Analyze the situation and provide negotiation strategy:

Deal Information:
- Client: ${dealInfo.client_name}
- Proposed Value: $${dealInfo.proposed_value}
- Client Budget: $${dealInfo.client_budget || "Unknown"}
- Competition: ${dealInfo.has_competition ? "Yes" : "No"}
- Timeline: ${dealInfo.timeline || "Not specified"}
- Decision Makers: ${dealInfo.decision_makers || "Unknown"}

Provide:
- negotiation_strategy (brief strategy description)
- recommended_price (optimal price point)
- concessions (list of potential concessions to offer)
- deal_breakers (things to avoid)
- closing_probability (0.0 to 1.0)
- estimated_close_date (days from now)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert B2B sales negotiator focused on win-win outcomes." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "negotiation_strategy",
            strict: true,
            schema: {
              type: "object",
              properties: {
                negotiation_strategy: { type: "string" },
                recommended_price: { type: "number" },
                concessions: { type: "string" },
                deal_breakers: { type: "string" },
                closing_probability: { type: "number" },
                estimated_close_date: { type: "number" }
              },
              required: ["negotiation_strategy", "recommended_price", "concessions", "deal_breakers", "closing_probability", "estimated_close_date"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const strategy = JSON.parse(contentStr || "{}");

      return {
        status: "completed",
        data: {
          deal_id: dealInfo.id || uuidv4(),
          client: dealInfo.client_name,
          strategy: strategy,
          recommended_action: strategy.closing_probability > 0.6 ? "proceed" : "nurture"
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
   * Generate sales proposal
   */
  private async _generateProposal(clientInfo: any, productInfo: any): Promise<TaskResult> {
    try {
      const prompt = `Generate a compelling B2B sales proposal:

Client Information:
- Company: ${clientInfo.company_name}
- Industry: ${clientInfo.industry}
- Pain Points: ${clientInfo.pain_points || "Not specified"}
- Goals: ${clientInfo.goals || "Growth and efficiency"}

Product/Service:
- Name: ${productInfo.name}
- Value Proposition: ${productInfo.value_prop}
- Price: $${productInfo.price}
- Implementation Time: ${productInfo.implementation_time || "4-6 weeks"}

Create a professional proposal with:
1. Executive Summary (2-3 sentences)
2. Problem Statement (addressing their pain points)
3. Proposed Solution (how your product solves their problems)
4. ROI Analysis (quantifiable benefits)
5. Next Steps

Keep it concise and compelling (max 400 words total).`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert B2B proposal writer. Write clear, compelling proposals that close deals." },
          { role: "user", content: prompt }
        ]
      });

      const proposalContent = response.choices[0].message.content || "";

      // Update KPIs
      this.kpis.deals_closed += 0.5; // Partial credit for proposal generation

      return {
        status: "completed",
        data: {
          proposal_id: uuidv4(),
          client: clientInfo.company_name,
          content: proposalContent,
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
   * Analyze conversation sentiment
   */
  private async _analyzeSentiment(conversation: string): Promise<TaskResult> {
    try {
      const prompt = `Analyze the sentiment and tone of this sales conversation:

Conversation:
${conversation}

Provide:
- overall_sentiment (positive, neutral, negative)
- buyer_interest_level (1-10)
- objections_detected (list of any objections mentioned)
- buying_signals (list of positive buying signals)
- recommended_action (what the sales rep should do next)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert at analyzing sales conversations and buyer psychology." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sentiment_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overall_sentiment: {
                  type: "string",
                  enum: ["positive", "neutral", "negative"]
                },
                buyer_interest_level: { type: "number" },
                objections_detected: { type: "string" },
                buying_signals: { type: "string" },
                recommended_action: { type: "string" }
              },
              required: ["overall_sentiment", "buyer_interest_level", "objections_detected", "buying_signals", "recommended_action"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const analysis = JSON.parse(contentStr || "{}");

      return {
        status: "completed",
        data: {
          conversation_length: conversation.length,
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
}
