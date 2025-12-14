
import { searchKnowledge, storeKnowledge } from "./vector-store";

export class RAGService {
    private static instance: RAGService;

    private constructor() { }

    public static getInstance(): RAGService {
        if (!RAGService.instance) {
            RAGService.instance = new RAGService();
        }
        return RAGService.instance;
    }

    /**
     * Retrieve context from Knowledge Graph to augment the system prompt.
     */
    async augmentPrompt(query: string, companyId: number): Promise<string> {
        console.log(`[RAG] Augmenting prompt for: "${query}"`);

        try {
            const results = await searchKnowledge(query, companyId, 3);

            if (results.length === 0) {
                return "";
            }

            const contextBlock = results.map(r => `- ${r.content} (Confidence: ${r.similarity.toFixed(2)})`).join("\n");

            return `
\n### 🧠 RECALLED MEMORY (RAG):
The following information was retrieved from your long-term memory. Use it if relevant:
${contextBlock}
###
`;
        } catch (error) {
            console.error("[RAG] Failed to augment prompt:", error);
            return "";
        }
    }

    /**
     * Save a new fact or interaction to long-term memory.
     */
    async saveMemory(content: string, companyId: number, metadata: any = {}) {
        return await storeKnowledge(content, metadata, companyId);
    }
}

export const rag = RAGService.getInstance();
