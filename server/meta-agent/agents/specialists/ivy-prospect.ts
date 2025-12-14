
import { BaseAgent } from "../base-agent";

export class IvyProspect extends BaseAgent {
    constructor() {
        super("ivy-prospect", "Ivy-Prospect", "Lead Researcher");

        // Tools specific to research
        this.registerTool({
            name: "find_leads",
            description: "Find potential leads based on criteria",
            parameters: { industry: "string", location: "string", count: "number" },
            handler: async (args) => {
                // In v2, this would query a real B2B database. 
                // For now, we simulate finding leads which Logic can then pass to Closer.
                console.log(`[Ivy-Prospect] Mining leads for: ${args.industry} in ${args.location}`);

                const leads = Array.from({ length: args.count || 3 }).map((_, i) => ({
                    name: `Lead ${i + 1} (${args.industry})`,
                    company: `${args.industry} Corp ${i + 1}`,
                    phone: `+5255000000${i}`, // Mock Mexico numbers
                    email: `contact@corp${i}.com`
                }));

                return {
                    source: "Ivy-Intelligence-Network",
                    leads
                };
            }
        });

        this.registerTool({
            name: "web_search",
            description: "Search the internet for company information",
            parameters: { query: "string" },
            handler: async (args) => {
                // Implement or delegate to existing search capabilities
                console.log(`[Ivy-Prospect] Searching web for: ${args.query}`);
                // Return mock for v1 setup
                return { title: "Company Info", snippet: "Found relevant data..." };
            }
        });

        this.registerTool({
            name: "perform_deep_research",
            description: "Perform comprehensive deep research on a topic",
            parameters: { topic: "string" },
            handler: async (args) => {
                const { deepResearch } = await import("../../capabilities/deep-research");
                return await deepResearch(args.topic);
            }
        });

        this.registerTool({
            name: "score_lead",
            description: "Calculate qualification score for a lead",
            parameters: { leadData: "object" },
            handler: async (args) => {
                // Logic from server/marketing.ts (calculateLeadScore)
                return { score: 85, level: "A" };
            }
        });
    }

    protected buildSystemPrompt(goal: string, memories: string[]): string {
        return `
You are Ivy-Prospect, a specialized AI agent focused on Market Intelligence and Lead Qualification.
Your goal is to gather accurate data about potential clients and assess their fit.

CONTEXT:
${memories.join('\n')}

TOOLS AVAILABLE:
- web_search(query): Find info about companies.
- perform_deep_research(topic): Comprehensive report generation.
- score_lead(leadData): Rate a prospect.
- query_memory(query): Check past findings.

INSTRUCTIONS:
1. Analyze the goal: "${goal}"
2. Use tools to gather missing information.
3. Be objective, data-driven, and analytical.
`;
    }
}
