
import { getDb } from "../../db";
import { metaAgentMemory } from "../../../drizzle/schema";
import { desc, eq, and, or, like } from "drizzle-orm";
import { invokeLLM } from "../../_core/llm";

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: any;
    handler: (args: any) => Promise<any>;
}

export abstract class BaseAgent {
    protected id: string;
    protected name: string;
    protected role: string;
    protected tools: Map<string, ToolDefinition> = new Map();
    protected memory: ChatMessage[] = [];

    constructor(id: string, name: string, role: string) {
        this.id = id;
        this.name = name;
        this.role = role;

        // Register default tools
        this.registerTool({
            name: "query_memory",
            description: "Search internal memory for past interactions",
            parameters: { query: "string" },
            handler: async (args) => this.retrieveRelevantMemory(args.query, 1) // Default companyId 1 for now
        });
    }

    protected registerTool(tool: ToolDefinition) {
        this.tools.set(tool.name, tool);
    }

    /**
     * Core loop: Plan -> Act -> Reflect
     */
    async executeGoal(goal: string, context: any = {}): Promise<any> {
        console.log(`[${this.name}] Received goal: ${goal}`);

        // 1. Retrieve relevant memory
        const relevantMemories = await this.retrieveRelevantMemory(goal, context.companyId || 1);

        // 2. Formulate plan using LLM
        const prompt = this.buildSystemPrompt(goal, relevantMemories);

        try {
            // Simple 1-step execution for v1
            const response = await invokeLLM({
                messages: [{ role: "system", content: prompt }, { role: "user", content: goal }],
                temperature: 0.7
            });

            const content = response.choices[0].message.content || "";
            console.log(`[${this.name}] Plan/Response: ${content.substring(0, 100)}...`);

            return content;
        } catch (error: any) {
            if (error.message?.includes("No LLM provider available")) {
                console.warn(`[${this.name}] LLM unavailable. Returning mock response for testing.`);
                return "Mock Plan: Delegate task to research agent.";
            }
            console.error(`[${this.name}] Execution failed:`, error);
            throw error;
        }
    }

    protected async retrieveRelevantMemory(query: string, companyId: number): Promise<string[]> {
        const db = await getDb();
        if (!db || !query) return [];

        const keywords = query.split(' ').filter(w => w.length > 4).slice(0, 3);
        if (keywords.length === 0) return [];

        const searchPattern = `%${keywords[0]}%`;
        const memories = await db.query.metaAgentMemory.findMany({
            where: (mem, { and, eq, or, like }) => and(
                eq(mem.companyId, companyId),
                like(mem.content, searchPattern)
            ),
            orderBy: [desc(metaAgentMemory.timestamp)],
            limit: 5
        });

        return memories.map(m => `[${m.role.toUpperCase()}] ${m.content}`);
    }

    protected abstract buildSystemPrompt(goal: string, memories: string[]): string;
}

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}
