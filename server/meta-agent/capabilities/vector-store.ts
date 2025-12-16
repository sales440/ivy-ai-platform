import { getDb } from "../../db";
import { knowledgeVectors } from "../../../drizzle/schema";
import { desc, sql, eq } from "drizzle-orm";

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
    companyId: number,
    source: string = 'interaction'
): Promise<number> {
    const db = await getDb();
    if (!db) {
        console.warn("[Vector Store] DB unavailable, skipping storage.");
        return 0;
    }

    const embedding = await computeEmbedding(content);

    const [result] = await db.insert(knowledgeVectors).values({
        companyId,
        content,
        embedding,
        metadata,
        source
    });

    console.log(`[Vector Store] Stored knowledge used DB: ${result.insertId}`);
    return result.insertId;
}

/**
 * Search for similar knowledge using in-memory cosine similarity (Hybrid Approach).
 * Fetches company vectors -> Sorts in Node.js.
 * Efficient enough for < 10,000 records per company.
 */
export async function searchKnowledge(
    query: string,
    companyId: number,
    limit: number = 5
): Promise<VectorSearchResult[]> {
    const db = await getDb();
    if (!db) return [];

    const queryVector = await computeEmbedding(query);

    // 1. Fetch ALL vectors for this company (Optimization: Select only specific columns if valid)
    const allVectors = await db.select().from(knowledgeVectors).where(eq(knowledgeVectors.companyId, companyId));

    if (allVectors.length === 0) return [];

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
    const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return isNaN(score) ? 0 : score;
}
