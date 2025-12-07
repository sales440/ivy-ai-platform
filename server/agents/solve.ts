/**
 * Ivy-Solve: Customer Support Agent
 * Specializes in resolving customer tickets, searching knowledge base, and escalating issues
 */

import { IvyAgent, AgentType, Department } from './core';
import type { TaskInput, TaskResult } from './core';
import * as db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { invokeLLM } from '../_core/llm';

export class IvySolve extends IvyAgent {
  private knowledgeBase: any[] = [];

  constructor() {
    const capabilities = [
      "troubleshooting",
      "knowledge_base_search",
      "ticket_management",
      "multi_channel_support",
      "escalation_handling"
    ];

    const initialKPIs = {
      tickets_resolved: 0,
      first_contact_resolution: 0,
      avg_resolution_time: 0,
      customer_satisfaction: 0
    };

    super("Ivy-Solve", AgentType.SOLVE, Department.CUSTOMER_SERVICE, capabilities, initialKPIs);
  }

  async initialize(): Promise<void> {
    await super.initialize();
    // Load knowledge base
    this.knowledgeBase = await db.searchKnowledgeBase("");
  }

  protected async _processTask(task: TaskInput): Promise<TaskResult> {
    const { type } = task;

    switch (type) {
      case "resolve_ticket":
        return await this._resolveTicket(task.ticket);
      case "search_knowledge":
        return await this._searchKnowledgeBase(task.query);
      case "escalate_issue":
        return await this._escalateIssue(task.ticket, task.reason);
      case "auto_escalate":
        return await this._autoEscalate(task.ticket);
      case "generate_kb_response":
        return await this._generateResponseFromKB(task.query, task.context);
      default:
        throw new Error(`Unsupported task type: ${type}`);
    }
  }

  /**
   * Resolve a support ticket
   */
  private async _resolveTicket(ticket: any): Promise<TaskResult> {
    try {
      const issue = ticket.issue || ticket.description || "";
      
      // Use LLM to analyze the issue and provide a solution
      const kbContext = this.knowledgeBase.slice(0, 5).map(article => 
        `Title: ${article.title}\nContent: ${article.content}`
      ).join("\n\n");

      const prompt = `You are a customer support expert. Analyze this support ticket and provide a solution.

Ticket Information:
Subject: ${ticket.subject || "N/A"}
Issue: ${issue}
Customer Tier: ${ticket.customerTier || "standard"}
Priority: ${ticket.priority || "medium"}

Available Knowledge Base Articles:
${kbContext}

Provide:
- category (one of: login, billing, technical, feature, account, general)
- confidence (0.0 to 1.0, how confident you are in the solution)
- solution (detailed solution steps)
- escalation_required (true/false)
- recommended_department (if escalation needed: technical_support, billing_department, product_team, customer_success, general_support)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert customer support agent. Provide clear, helpful solutions." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ticket_resolution",
            strict: true,
            schema: {
              type: "object",
              properties: {
                category: { 
                  type: "string",
                  enum: ["login", "billing", "technical", "feature", "account", "general"]
                },
                confidence: { type: "number" },
                solution: { type: "string" },
                escalation_required: { type: "boolean" },
                recommended_department: { 
                  type: "string",
                  enum: ["technical_support", "billing_department", "product_team", "customer_success", "general_support"]
                }
              },
              required: ["category", "confidence", "solution", "escalation_required"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const analysis = JSON.parse(contentStr || "{}");

      // Determine resolution
      let resolution;
      let ticketStatus: "resolved" | "escalated" = "resolved";

      if (analysis.confidence > 0.8 && !analysis.escalation_required) {
        resolution = {
          status: "resolved",
          solution: analysis.solution,
          resolution_time: "immediate",
          escalation_required: false
        };
        this.kpis.tickets_resolved += 1;
        this.kpis.first_contact_resolution += 1;
      } else {
        resolution = {
          status: "escalated",
          reason: "requires_human_expertise",
          recommended_expert: analysis.recommended_department || "general_support",
          escalation_required: true,
          partial_solution: analysis.solution
        };
        ticketStatus = "escalated";
      }

      // Save or update ticket in database
      let savedTicket;
      if (ticket.id) {
        await db.updateTicketStatus(ticket.id, ticketStatus, analysis.solution);
        savedTicket = await db.getTicketById(ticket.id);
      } else {
        savedTicket = await db.createTicket({
          ticketId: uuidv4(),
          customerId: ticket.customerId,
          customerEmail: ticket.customerEmail,
          subject: ticket.subject || "Support Request",
          issue: issue,
          category: analysis.category,
          priority: ticket.priority || "medium",
          status: ticketStatus,
          assignedTo: this.getId(),
          resolution: analysis.solution,
          escalationReason: analysis.escalation_required ? "requires_human_expertise" : undefined,
          metadata: { analysis }
        });
      }

      return {
        status: "completed",
        data: {
          ticket_id: savedTicket?.ticketId,
          customer_id: ticket.customerId,
          issue_category: analysis.category,
          resolution: resolution,
          resolved_at: new Date().toISOString()
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
   * Search knowledge base
   */
  private async _searchKnowledgeBase(query: string): Promise<TaskResult> {
    try {
      // Use LLM to find relevant articles
      const kbContext = this.knowledgeBase.map(article => 
        `ID: ${article.articleId}\nTitle: ${article.title}\nContent: ${article.content.substring(0, 200)}...`
      ).join("\n\n");

      const prompt = `Find the most relevant knowledge base articles for this query:
Query: ${query}

Available Articles:
${kbContext}

Return the IDs of the top 3 most relevant articles and their relevance scores (0.0 to 1.0).`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a knowledge base search expert." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "search_results",
            strict: true,
            schema: {
              type: "object",
              properties: {
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      article_id: { type: "string" },
                      relevance_score: { type: "number" }
                    },
                    required: ["article_id", "relevance_score"],
                    additionalProperties: false
                  }
                }
              },
              required: ["results"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const searchResults = JSON.parse(contentStr || "{}");

      // Get full articles
      const relevantArticles = searchResults.results
        .map((r: any) => {
          const article = this.knowledgeBase.find(a => a.articleId === r.article_id);
          return article ? { ...article, relevance_score: r.relevance_score } : null;
        })
        .filter((a: any) => a !== null);

      return {
        status: "completed",
        data: {
          query: query,
          results: relevantArticles,
          total_found: relevantArticles.length
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
   * Escalate an issue to human agent
   */
  private async _escalateIssue(ticket: any, reason: string): Promise<TaskResult> {
    try {
      // Determine escalation path
      const escalationMatrix: Record<string, { team: string; priority: string }> = {
        "technical_issue": { team: "technical_support", priority: "high" },
        "billing_dispute": { team: "billing_department", priority: "medium" },
        "feature_request": { team: "product_team", priority: "low" },
        "complaint": { team: "customer_success", priority: "high" }
      };

      const escalationPath = escalationMatrix[reason] || { team: "general_support", priority: "medium" };

      // Update ticket status
      if (ticket.id) {
        await db.updateTicketStatus(ticket.id, "escalated");
      }

      return {
        status: "completed",
        data: {
          ticket_id: ticket.ticketId || ticket.id,
          escalation_reason: reason,
          assigned_to: escalationPath.team,
          priority: escalationPath.priority,
          escalated_at: new Date().toISOString()
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
   * Auto-escalate ticket based on intelligent analysis
   */
  private async _autoEscalate(ticket: any): Promise<TaskResult> {
    try {
      const prompt = `Analyze this support ticket and determine if it should be escalated:

Ticket:
Subject: ${ticket.subject}
Issue: ${ticket.issue}
Priority: ${ticket.priority}
Customer: ${ticket.customerEmail}

Determine:
- should_escalate (boolean)
- escalation_reason (technical_issue, billing_dispute, complaint, feature_request, or none)
- urgency_level (low, medium, high, critical)
- recommended_team (technical_support, billing_department, customer_success, product_team)
- estimated_resolution_time (in hours)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert support ticket triage specialist." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "escalation_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                should_escalate: { type: "boolean" },
                escalation_reason: { type: "string" },
                urgency_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                recommended_team: { type: "string" },
                estimated_resolution_time: { type: "number" }
              },
              required: ["should_escalate", "escalation_reason", "urgency_level", "recommended_team", "estimated_resolution_time"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const analysis = JSON.parse(contentStr || "{}");

      if (analysis.should_escalate && ticket.id) {
        await db.updateTicketStatus(ticket.id, "escalated");
      }

      return {
        status: "completed",
        data: {
          ticket_id: ticket.id,
          should_escalate: analysis.should_escalate,
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
   * Generate response from knowledge base
   */
  private async _generateResponseFromKB(query: string, context: any): Promise<TaskResult> {
    try {
      // First search KB
      const searchResult = await this._searchKnowledgeBase(query);
      const relevantArticles = searchResult.data?.results || [];

      if (relevantArticles.length === 0) {
        return {
          status: "completed",
          data: {
            response: "I couldn't find relevant information in our knowledge base. Let me escalate this to a human agent.",
            source: "none",
            confidence: 0
          }
        };
      }

      const kbContent = relevantArticles.map((a: any) => 
        `Article: ${a.title}\nContent: ${a.content}`
      ).join("\n\n");

      const prompt = `Generate a helpful customer support response based on this knowledge base content:

Customer Query: ${query}

Context: ${JSON.stringify(context, null, 2)}

Knowledge Base:
${kbContent}

Provide:
- response (clear, helpful answer to the customer)
- confidence (0.0 to 1.0 how confident you are in this answer)
- follow_up_actions (suggested next steps)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a helpful customer support agent. Provide clear, accurate responses based on the knowledge base." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "kb_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                response: { type: "string" },
                confidence: { type: "number" },
                follow_up_actions: { type: "string" }
              },
              required: ["response", "confidence", "follow_up_actions"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const kbResponse = JSON.parse(contentStr || "{}");

      return {
        status: "completed",
        data: {
          response: kbResponse.response,
          confidence: kbResponse.confidence,
          follow_up_actions: kbResponse.follow_up_actions,
          sources: relevantArticles.map((a: any) => a.articleId),
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
}
