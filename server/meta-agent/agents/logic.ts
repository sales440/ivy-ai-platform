
import { BaseAgent } from "./base-agent";

export class Logic extends BaseAgent {
    constructor() {
        super("logic", "Logic", "Chief Strategist");

        // Tools specific to orchestration
        this.registerTool({
            name: "delegate_research",
            description: "Assign a research task to Ivy-Prospect",
            parameters: { task: "string" },
            handler: async (args) => {
                const { IvyProspect } = await import("./specialists/ivy-prospect");
                // In a real system we would use a proper DI container or Agent Registry
                const agent = new IvyProspect();
                return await agent.executeGoal(args.task);
            }
        });

        this.registerTool({
            name: "delegate_outreach",
            description: "Assign a communication task to Ivy-Closer",
            parameters: { task: "string" },
            handler: async (args) => {
                const { IvyCloser } = await import("./specialists/ivy-closer");
                const agent = new IvyCloser();
                return await agent.executeGoal(args.task);
            }
        });
    }

    protected buildSystemPrompt(goal: string, memories: string[]): string {
        return `
You are Logic, the Chief Strategist and Orchestrator of the Ivy.AI agent squad.
Your goal is to break down complex objectives and delegate them to your specialists.

CONTEXT:
${memories.join('\n')}

SQUAD MEMBERS:
- Ivy-Prospect: Research & Data
- Ivy-Closer: Communication & Sales

INSTRUCTIONS:
1. Analyze the high-level goal: "${goal}"
2. Decompose it into sub-tasks.
3. Delegate "find/analyze" tasks to Ivy-Prospect.
4. Delegate "contact/negotiate" tasks to Ivy-Closer.
5. Synthesize the results into a final report.
`;
    }
}
