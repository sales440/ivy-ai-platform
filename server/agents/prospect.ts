/**
 * Ivy-Prospect: Sales Lead Generation Agent
 * Specializes in finding, qualifying, and reaching out to potential customers
 */

import { IvyAgent, AgentType, Department, TaskInput, TaskResult } from './core';
import * as db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { invokeLLM } from '../_core/llm';

interface LeadCriteria {
  industry?: string;
  location?: string;
  companySize?: string;
  title?: string;
  [key: string]: any;
}

interface Lead {
  name: string;
  email?: string;
  company?: string;
  title?: string;
  industry?: string;
  location?: string;
  companySize?: string;
  score?: number;
}

export class IvyProspect extends IvyAgent {
  constructor() {
    const capabilities = [
      "lead_generation",
      "prospect_qualification",
      "email_outreach",
      "linkedin_research",
      "crm_integration"
    ];

    const initialKPIs = {
      leads_generated: 0,
      response_rate: 0.0,
      qualified_leads: 0,
      emails_sent: 0
    };

    super("Ivy-Prospect", AgentType.PROSPECT, Department.SALES, capabilities, initialKPIs);
  }

  protected async _processTask(task: TaskInput): Promise<TaskResult> {
    const { type } = task;

    switch (type) {
      case "find_leads":
        return await this._findLeads(task.criteria);
      case "qualify_lead":
        return await this._qualifyLead(task.lead_data);
      case "send_outreach":
        return await this._sendOutreach(task.lead, task.template);
      default:
        throw new Error(`Unsupported task type: ${type}`);
    }
  }

  /**
   * Find leads based on criteria
   */
  private async _findLeads(criteria: LeadCriteria): Promise<TaskResult> {
    try {
      // Use LLM to generate realistic leads based on criteria
      const prompt = `Generate 5 realistic B2B leads for a sales campaign with the following criteria:
${JSON.stringify(criteria, null, 2)}

For each lead, provide:
- name (full name)
- email (professional email)
- company (company name)
- title (job title)
- industry
- location
- companySize (e.g., "50-200", "200-1000")
- score (0-100, how well they match the criteria)

Return as a JSON array.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a B2B lead generation expert. Generate realistic, professional leads." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "leads",
            strict: true,
            schema: {
              type: "object",
              properties: {
                leads: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string" },
                      company: { type: "string" },
                      title: { type: "string" },
                      industry: { type: "string" },
                      location: { type: "string" },
                      companySize: { type: "string" },
                      score: { type: "number" }
                    },
                    required: ["name", "email", "company", "title", "industry", "location", "companySize", "score"],
                    additionalProperties: false
                  }
                }
              },
              required: ["leads"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const parsedLeads = JSON.parse(contentStr || "{}");
      const leads: Lead[] = parsedLeads.leads || [];

      // Qualify and save leads to database
      const qualifiedLeads = [];
      for (const lead of leads) {
        if (lead.score && lead.score >= 60) {
          // Save to database
          const savedLead = await db.createLead({
            leadId: uuidv4(),
            name: lead.name,
            email: lead.email,
            company: lead.company,
            title: lead.title,
            industry: lead.industry,
            location: lead.location,
            companySize: lead.companySize,
            qualificationScore: lead.score,
            qualificationLevel: lead.score >= 80 ? "A" : lead.score >= 70 ? "B" : "C",
            status: "new",
            source: "ai_generated",
            metadata: { criteria },
            createdBy: this.getId()
          });

          qualifiedLeads.push(savedLead);
        }
      }

      // Update KPIs
      this.kpis.leads_generated += qualifiedLeads.length;
      this.kpis.qualified_leads += qualifiedLeads.filter(l => l.qualificationLevel === "A" || l.qualificationLevel === "B").length;

      return {
        status: "completed",
        data: {
          total_found: leads.length,
          qualified: qualifiedLeads,
          search_criteria: criteria,
          timestamp: new Date().toISOString()
        },
        nextActions: qualifiedLeads.length > 0 ? ["qualify_leads", "start_outreach"] : []
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Qualify a specific lead
   */
  private async _qualifyLead(leadData: any): Promise<TaskResult> {
    try {
      // Use LLM to analyze and qualify the lead
      const prompt = `Analyze this B2B lead and provide a qualification score (0-100) and recommendation:

Lead Information:
${JSON.stringify(leadData, null, 2)}

Consider:
- Job title seniority and decision-making power
- Company size and industry relevance
- Location and market potential
- Any recent activity or signals

Provide:
- score (0-100)
- level ("A", "B", "C", or "D")
- reasoning (brief explanation)
- recommended_action ("contact", "nurture", or "disqualify")`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a B2B sales qualification expert." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "qualification",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                level: { type: "string", enum: ["A", "B", "C", "D"] },
                reasoning: { type: "string" },
                recommended_action: { type: "string", enum: ["contact", "nurture", "disqualify"] }
              },
              required: ["score", "level", "reasoning", "recommended_action"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const qualification = JSON.parse(contentStr || "{}");

      // Update lead in database if it exists
      if (leadData.id) {
        await db.updateLeadStatus(leadData.id, 
          qualification.recommended_action === "contact" ? "qualified" : "nurture"
        );
      }

      return {
        status: "completed",
        data: {
          lead: leadData,
          qualification_score: qualification.score,
          qualification_level: qualification.level,
          reasoning: qualification.reasoning,
          recommended_action: qualification.recommended_action
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
   * Send outreach email to a lead
   */
  private async _sendOutreach(lead: any, template: string): Promise<TaskResult> {
    try {
      // Use LLM to personalize the email template
      const prompt = `Personalize this email template for the following lead:

Lead: ${lead.name}, ${lead.title} at ${lead.company}
Industry: ${lead.industry}
Location: ${lead.location}

Template:
${template}

Create a professional, personalized outreach email. Keep it concise (max 150 words).`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a professional B2B sales copywriter. Write personalized, engaging outreach emails." },
          { role: "user", content: prompt }
        ]
      });

      const emailContent = response.choices[0].message.content || "";

      // In production, this would integrate with an email service
      // For now, we'll just log it and update KPIs
      
      // Update lead status
      if (lead.id) {
        await db.updateLeadStatus(lead.id, "contacted");
      }

      // Update KPIs
      this.kpis.emails_sent += 1;

      return {
        status: "completed",
        data: {
          status: "sent",
          lead_email: lead.email,
          subject: `Connecting ${lead.company} with innovative solutions`,
          content: emailContent,
          sent_at: new Date().toISOString()
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
