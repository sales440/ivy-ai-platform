
import { getDb } from "../../db";
import { agents } from "../../../drizzle/schema";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

/**
 * Default Agents Configuration
 */
const DEFAULT_AGENTS = [
    {
        agentId: 'ivy-prospect-001',
        name: "Ivy-Prospect",
        type: "prospect" as const,
        department: "sales" as const,
        capabilities: ["lead_scoring", "prospect_research", "email_outreach", "linkedin_integration"],
        kpis: { leads_generated: 0, conversion_rate: 0, response_rate: 0 },
        configuration: {
            tone: "professional",
            outreach_limit_daily: 50,
            target_industries: ["manufacturing", "technology"]
        }
    },
    {
        agentId: 'ivy-closer-001',
        name: "Ivy-Closer",
        type: "closer" as const,
        department: "sales" as const,
        capabilities: ["negotiation", "contract_generation", "objection_handling", "follow_up"],
        kpis: { deals_closed: 0, revenue_generated: 0, avg_deal_size: 0 },
        configuration: {
            tone: "persuasive",
            negotiation_style: "value_based",
            follow_up_interval_days: 2
        }
    },
    {
        agentId: 'ivy-solve-001',
        name: "Ivy-Solve",
        type: "solve" as const,
        department: "customer_service" as const,
        capabilities: ["ticket_resolution", "faq_answering", "sentiment_analysis", "escalation_management"],
        kpis: { tickets_resolved: 0, avg_resolution_time: 0, csat_score: 0 },
        configuration: {
            tone: "empathetic",
            auto_response_enabled: true,
            sla_minutes: 60
        }
    },
    {
        agentId: 'ivy-logic-001',
        name: "Ivy-Logic",
        type: "logic" as const,
        department: "operations" as const,
        capabilities: ["workflow_optimization", "resource_allocation", "process_automation", "data_validation"],
        kpis: { workflows_optimized: 0, cost_savings: 0, efficiency_gain: 0 },
        configuration: {
            optimization_strategy: "balanced",
            alert_threshold: "medium"
        }
    },
    {
        agentId: 'ivy-talent-001',
        name: "Ivy-Talent",
        type: "talent" as const,
        department: "hr" as const,
        capabilities: ["candidate_screening", "interview_scheduling", "onboarding_automation", "employee_engagement"],
        kpis: { candidates_screened: 0, time_to_hire: 0, offer_acceptance_rate: 0 },
        configuration: {
            screening_criteria_strictness: "moderate",
            diversity_focus: true
        }
    },
    {
        agentId: 'ivy-insight-001',
        name: "Ivy-Insight",
        type: "insight" as const,
        department: "strategy" as const,
        capabilities: ["market_analysis", "competitor_tracking", "trend_forecasting", "strategic_planning"],
        kpis: { reports_generated: 0, accuracy_score: 0, insights_actionable: 0 },
        configuration: {
            data_sources: ["internal", "market_reports", "news"],
            report_frequency: "weekly"
        }
    }
];

/**
 * Seed default agents if they don't exist
 */
export async function seedDefaultAgents(): Promise<void> {
    console.log("[Agent Seeder] Checking if agents exist...");

    const db = await getDb();
    if (!db) {
        console.error("[Agent Seeder] Database not available");
        return;
    }

    try {
        // Check count of agents
        const [rows] = await db.execute(sql`SELECT COUNT(*) as count FROM agents`) as unknown as [any[], any];
        const count = rows[0]?.count || 0;

        if (count > 0) {
            console.log(`[Agent Seeder] ✅ Found ${count} existing agents. Skipping seed.`);
            return;
        }

        console.log("[Agent Seeder] ⚠️ No agents found. Seeding default agents...");

        for (const agent of DEFAULT_AGENTS) {
            await db.insert(agents).values({
                ...agent,
                capabilities: agent.capabilities,
                kpis: agent.kpis,
                configuration: agent.configuration,
                status: "active"
            });
            console.log(`[Agent Seeder] Created agent: ${agent.name}`);
        }

        console.log("[Agent Seeder] ✅ All default agents seeded successfully.");

    } catch (error) {
        console.error("[Agent Seeder] Failed to seed agents:", error);
    }
}
