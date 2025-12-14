// import { getDb } from "../../db"; 
// import { knowledgeVectors } from "../../../drizzle/schema";
// import { desc, sql } from "drizzle-orm";
// import { invokeLLM } from "../../_core/llm";

// Mock In-Memory DB for V1/Testing (Bypassing faulty db.ts)
const MOCK_VECTOR_DB: any[] = [];
let MOCK_ID_COUNTER = 1;

export interface VectorSearchResult {
    id: number;
    content: string;
    similarity: number;
    metadata: any;
}

/**
 * Compute embedding for a query or text chunk.
 * Uses OpenAI's text-embedding-3-small (1536 dimensions).
 */
export async function computeEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn("[Vector Store] No OpenAI Key. Using random vector (MOCK MODE).");
        const dim = 1536;
        return Array(dim).fill(0).map(() => Math.random() - 0.5);
    }

    try {
        const response = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "text-embedding-3-small",
                input: text
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI Embedding API failed: ${err}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    } catch (error) {
        console.error("[Vector Store] Embedding generation failed:", error);
        throw error;
    }
}

/**
 * Store a piece of knowledge in the vector database.
 */
export async function storeKnowledge(
    content: string,
    metadata: any = {},
    companyId: number
): Promise<number> {
    // const db = await getDb();
    // if (!db) throw new Error("Database unavailable");

    const embedding = await computeEmbedding(content);

    // Mock Insert
    const record = {
        id: MOCK_ID_COUNTER++,
        companyId,
        content,
        embedding,
        metadata,
    };
    MOCK_VECTOR_DB.push(record);

    console.log(`[Vector Store] Stored knowledge (Mock Memory): ${record.id}`);
    return record.id;
}

/**
 * Search for similar knowledge using in-memory cosine similarity.
 * (MySQL doesn't support vector math natively without plugins).
 */
export async function searchKnowledge(
    query: string,
    companyId: number,
    limit: number = 5
): Promise<VectorSearchResult[]> {
    // const db = await getDb();
    // if (!db) return [];

    const queryVector = await computeEmbedding(query);

    // 1. Fetch from Mock DB
    const allVectors = MOCK_VECTOR_DB.filter(v => v.companyId === companyId);

    // 2. Compute similarity in-memory
    const results = allVectors.map(v => {
        const similarity = cosineSimilarity(queryVector, v.embedding as number[]);
        return {
            id: v.id,
            content: v.content,
            similarity,
            metadata: v.metadata
        };
    });

    // 3. Sort and slice
    return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
