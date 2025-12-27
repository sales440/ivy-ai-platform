/**
 * Agent Memory Service - Persistent Contextual Memory with RAG
 * 
 * Implements Retrieval-Augmented Generation (RAG) for the Meta-Agent
 * to maintain context across sessions and learn from past interactions.
 */

import { getDb } from '../../db';
import { agentMemory, interactionLogs, trainingHistory } from '../../../drizzle/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { invokeLLM } from '../../_core/llm';

// ============================================================================
// TYPES
// ============================================================================

export interface MemoryContext {
  companyId: number;
  campaignId?: number;
  userId?: number;
  agentName?: string;
}

export interface MemoryQuery {
  query: string;
  context: MemoryContext;
  memoryTypes?: string[];
  limit?: number;
  minRelevance?: number;
}

export interface MemoryResult {
  id: number;
  content: string;
  summary?: string;
  memoryType: string;
  relevanceScore: number;
  metadata?: any;
  createdAt: Date;
}

export interface TrainingPrompt {
  agentName: string;
  prompt: string;
  systemPrompt?: string;
  version: string;
  configuration?: any;
}

// ============================================================================
// EMBEDDING GENERATION
// ============================================================================

/**
 * Generate embeddings for text using OpenAI
 * In production, consider caching embeddings or using a local model
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use OpenAI embeddings API (text-embedding-3-small is cost-effective)
    const response = await invokeLLM({
      messages: [{ role: 'user', content: text }],
      // Note: This is a simplified version. In production, use OpenAI's embeddings endpoint directly
      // For now, we'll return a mock embedding
    });
    
    // TODO: Implement actual OpenAI embeddings API call
    // For now, return a simple hash-based pseudo-embedding
    return generateSimpleEmbedding(text);
  } catch (error) {
    console.error('[Agent Memory] Error generating embedding:', error);
    return generateSimpleEmbedding(text);
  }
}

/**
 * Generate a simple embedding based on text characteristics
 * This is a fallback - in production, use proper embeddings
 */
function generateSimpleEmbedding(text: string): number[] {
  const embedding: number[] = [];
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  
  // Create a 384-dimensional embedding (common size)
  for (let i = 0; i < 384; i++) {
    const hash = hashCode(text + i);
    embedding.push((hash % 1000) / 1000); // Normalize to 0-1
  }
  
  return embedding;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================================================
// MEMORY STORAGE
// ============================================================================

/**
 * Store a new memory in the database
 */
export async function storeMemory(params: {
  companyId: number;
  campaignId?: number;
  userId?: number;
  memoryType: string;
  targetAgent?: string;
  agentVersion?: string;
  content: string;
  summary?: string;
  metadata?: any;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('[Agent Memory] Storing new memory:', {
    companyId: params.companyId,
    memoryType: params.memoryType,
    targetAgent: params.targetAgent
  });

  // Generate embedding for the content
  const embedding = await generateEmbedding(params.content);

  // Insert memory
  const result = await db.insert(agentMemory).values({
    companyId: params.companyId,
    campaignId: params.campaignId,
    userId: params.userId,
    memoryType: params.memoryType as any,
    targetAgent: params.targetAgent,
    agentVersion: params.agentVersion,
    content: params.content,
    summary: params.summary || params.content.substring(0, 200),
    embedding: embedding,
    metadata: params.metadata,
    relevanceScore: 100,
    usageCount: 0,
    version: 1,
    isActive: true,
  });

  console.log('[Agent Memory] Memory stored successfully');
  return result[0].insertId;
}

/**
 * Store an interaction log
 */
export async function logInteraction(params: {
  companyId: number;
  campaignId?: number;
  userId?: number;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  agentName?: string;
  toolCalls?: any[];
  responseTime?: number;
  tokensUsed?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: any;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(interactionLogs).values({
    companyId: params.companyId,
    campaignId: params.campaignId,
    userId: params.userId,
    sessionId: params.sessionId,
    role: params.role,
    content: params.content,
    agentName: params.agentName,
    toolCalls: params.toolCalls,
    responseTime: params.responseTime,
    tokensUsed: params.tokensUsed,
    success: params.success ?? true,
    errorMessage: params.errorMessage,
    metadata: params.metadata,
  });
}

/**
 * Store or update training history
 */
export async function storeTrainingHistory(params: TrainingPrompt & {
  companyId?: number;
  trainedBy?: number;
  notes?: string;
  changelog?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  console.log('[Agent Memory] Storing training history:', {
    agentName: params.agentName,
    version: params.version
  });

  // Deactivate previous versions
  if (params.companyId) {
    await db.update(trainingHistory)
      .set({ isActive: false, deactivatedAt: new Date() })
      .where(and(
        eq(trainingHistory.companyId, params.companyId),
        eq(trainingHistory.agentName, params.agentName),
        eq(trainingHistory.isActive, true)
      ));
  } else {
    await db.update(trainingHistory)
      .set({ isActive: false, deactivatedAt: new Date() })
      .where(and(
        sql`${trainingHistory.companyId} IS NULL`,
        eq(trainingHistory.agentName, params.agentName),
        eq(trainingHistory.isActive, true)
      ));
  }

  // Insert new training
  await db.insert(trainingHistory).values({
    companyId: params.companyId,
    agentName: params.agentName,
    trainingPrompt: params.prompt,
    systemPrompt: params.systemPrompt,
    configuration: params.configuration,
    version: params.version,
    isActive: true,
    trainedBy: params.trainedBy,
    notes: params.notes,
    changelog: params.changelog,
    activatedAt: new Date(),
  });

  console.log('[Agent Memory] Training history stored successfully');
}

// ============================================================================
// MEMORY RETRIEVAL (RAG)
// ============================================================================

/**
 * Retrieve relevant memories based on a query (RAG)
 */
export async function retrieveMemories(query: MemoryQuery): Promise<MemoryResult[]> {
  const db = await getDb();
  if (!db) return [];

  console.log('[Agent Memory] Retrieving memories for query:', query.query);

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query.query);

  // Build where conditions
  const conditions = [
    eq(agentMemory.companyId, query.context.companyId),
    eq(agentMemory.isActive, true),
  ];

  if (query.context.campaignId) {
    conditions.push(eq(agentMemory.campaignId, query.context.campaignId));
  }

  if (query.memoryTypes && query.memoryTypes.length > 0) {
    // Filter by memory types
    conditions.push(sql`${agentMemory.memoryType} IN (${sql.join(query.memoryTypes.map(t => sql`${t}`), sql`, `)})`);
  }

  // Retrieve candidate memories
  const memories = await db
    .select()
    .from(agentMemory)
    .where(and(...conditions))
    .orderBy(desc(agentMemory.relevanceScore), desc(agentMemory.createdAt))
    .limit((query.limit || 10) * 2); // Get more candidates for similarity filtering

  // Calculate similarity scores
  const scoredMemories = memories
    .map(memory => {
      const embedding = memory.embedding as number[] || [];
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return {
        ...memory,
        similarityScore: similarity,
      };
    })
    .filter(m => m.similarityScore >= (query.minRelevance || 0.5))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, query.limit || 10);

  // Update usage count
  for (const memory of scoredMemories) {
    await db.update(agentMemory)
      .set({
        usageCount: sql`${agentMemory.usageCount} + 1`,
        lastUsedAt: new Date(),
      })
      .where(eq(agentMemory.id, memory.id));
  }

  console.log(`[Agent Memory] Retrieved ${scoredMemories.length} relevant memories`);

  return scoredMemories.map(m => ({
    id: m.id,
    content: m.content,
    summary: m.summary || undefined,
    memoryType: m.memoryType,
    relevanceScore: Math.round(m.similarityScore * 100),
    metadata: m.metadata,
    createdAt: m.createdAt,
  }));
}

/**
 * Retrieve specific types of memories with contextual queries
 */
export async function queryMemories(params: {
  companyId: number;
  campaignId?: number;
  question: string;
}): Promise<string> {
  const memories = await retrieveMemories({
    query: params.question,
    context: {
      companyId: params.companyId,
      campaignId: params.campaignId,
    },
    limit: 5,
  });

  if (memories.length === 0) {
    return 'No relevant memories found for this context.';
  }

  // Format memories into a context string
  const context = memories
    .map((m, i) => `${i + 1}. [${m.memoryType}] ${m.content} (Relevance: ${m.relevanceScore}%)`)
    .join('\n\n');

  return context;
}

/**
 * Get active training prompt for an agent
 */
export async function getActiveTraining(
  agentName: string,
  companyId?: number
): Promise<TrainingPrompt | null> {
  const db = await getDb();
  if (!db) return null;

  const conditions = [
    eq(trainingHistory.agentName, agentName),
    eq(trainingHistory.isActive, true),
  ];

  if (companyId) {
    conditions.push(eq(trainingHistory.companyId, companyId));
  } else {
    conditions.push(sql`${trainingHistory.companyId} IS NULL`);
  }

  const training = await db
    .select()
    .from(trainingHistory)
    .where(and(...conditions))
    .orderBy(desc(trainingHistory.createdAt))
    .limit(1);

  if (training.length === 0) return null;

  const t = training[0];
  return {
    agentName: t.agentName,
    prompt: t.trainingPrompt,
    systemPrompt: t.systemPrompt || undefined,
    version: t.version,
    configuration: t.configuration,
  };
}

/**
 * Get conversation history for a session
 */
export async function getConversationHistory(
  sessionId: string,
  limit: number = 50
): Promise<Array<{ role: string; content: string }>> {
  const db = await getDb();
  if (!db) return [];

  const logs = await db
    .select()
    .from(interactionLogs)
    .where(eq(interactionLogs.sessionId, sessionId))
    .orderBy(desc(interactionLogs.createdAt))
    .limit(limit);

  return logs.reverse().map(log => ({
    role: log.role,
    content: log.content,
  }));
}

// ============================================================================
// MEMORY MAINTENANCE
// ============================================================================

/**
 * Decay relevance scores over time for old memories
 */
export async function decayOldMemories(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await db.update(agentMemory)
    .set({
      relevanceScore: sql`GREATEST(0, ${agentMemory.relevanceScore} - 10)`,
    })
    .where(and(
      eq(agentMemory.isActive, true),
      sql`${agentMemory.lastUsedAt} < ${thirtyDaysAgo}`
    ));

  console.log('[Agent Memory] Decayed old memories');
}

/**
 * Clean up expired memories
 */
export async function cleanupExpiredMemories(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(agentMemory)
    .set({ isActive: false })
    .where(and(
      eq(agentMemory.isActive, true),
      sql`${agentMemory.expiresAt} < NOW()`
    ));

  console.log('[Agent Memory] Cleaned up expired memories');
}
