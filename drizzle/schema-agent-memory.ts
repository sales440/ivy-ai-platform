import { int, mysqlTable, text, timestamp, varchar, json, mysqlEnum, index } from "drizzle-orm/mysql-core";

/**
 * Agent Memory - Persistent Contextual Memory for Meta-Agent
 * 
 * This table stores all interactions, instructions, and learnings from the Meta-Agent
 * to maintain context across sessions and enable RAG (Retrieval-Augmented Generation)
 */
export const agentMemory = mysqlTable("agentMemory", {
  id: int("id").autoincrement().primaryKey(),
  
  // Context identifiers
  companyId: int("companyId").notNull(), // Which company this memory belongs to
  campaignId: int("campaignId"), // Optional: specific campaign context
  userId: int("userId"), // User who triggered this interaction
  
  // Memory type and classification
  memoryType: mysqlEnum("memoryType", [
    "instruction",      // Training instructions given to agents
    "preference",       // Client preferences and approved suggestions
    "decision",         // Strategic decisions made
    "objection",        // Common objections encountered
    "success",          // Successful tactics and approaches
    "failure",          // Failed attempts to learn from
    "conversation",     // General conversation context
    "training_prompt"   // Versioned training prompts for sub-agents
  ]).notNull(),
  
  // Agent context
  targetAgent: varchar("targetAgent", { length: 50 }), // Which agent this memory is for (Prospect, Closer, etc.)
  agentVersion: varchar("agentVersion", { length: 20 }), // Version of the agent training
  
  // Memory content
  content: text("content").notNull(), // The actual memory/instruction/conversation
  summary: text("summary"), // Brief summary for quick retrieval
  
  // Embeddings for semantic search (stored as JSON array of floats)
  // In production, consider using pgvector for PostgreSQL or a dedicated vector DB
  embedding: json("embedding").$type<number[]>(), // Vector embedding of the content
  
  // Metadata
  metadata: json("metadata").$type<{
    tone?: string;
    industry?: string;
    sector?: string;
    keywords?: string[];
    relatedCampaigns?: number[];
    confidence?: number;
    source?: string;
    [key: string]: any;
  }>(),
  
  // Relevance and usage tracking
  relevanceScore: int("relevanceScore").default(100), // 0-100, decreases over time or with failures
  usageCount: int("usageCount").default(0), // How many times this memory was retrieved
  lastUsedAt: timestamp("lastUsedAt"),
  
  // Versioning and lifecycle
  version: int("version").default(1),
  isActive: boolean("isActive").default(true).notNull(),
  expiresAt: timestamp("expiresAt"), // Optional: for temporary memories
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Indexes for efficient retrieval
  companyIdx: index("company_idx").on(table.companyId),
  campaignIdx: index("campaign_idx").on(table.campaignId),
  memoryTypeIdx: index("memory_type_idx").on(table.memoryType),
  targetAgentIdx: index("target_agent_idx").on(table.targetAgent),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  relevanceIdx: index("relevance_idx").on(table.relevanceScore),
  companyMemoryTypeIdx: index("company_memory_type_idx").on(table.companyId, table.memoryType),
}));

export type AgentMemory = typeof agentMemory.$inferSelect;
export type InsertAgentMemory = typeof agentMemory.$inferInsert;

/**
 * Interaction Logs - Detailed logs of all Meta-Agent interactions
 * 
 * Stores complete conversation history for audit and learning purposes
 */
export const interactionLogs = mysqlTable("interactionLogs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Context
  companyId: int("companyId").notNull(),
  campaignId: int("campaignId"),
  userId: int("userId"),
  
  // Interaction details
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // Groups related interactions
  role: mysqlEnum("role", ["user", "assistant", "system", "tool"]).notNull(),
  content: text("content").notNull(),
  
  // Agent information
  agentName: varchar("agentName", { length: 50 }), // Which agent was involved
  toolCalls: json("toolCalls").$type<Array<{
    name: string;
    arguments: any;
    result: any;
  }>>(), // Tools called during this interaction
  
  // Performance metrics
  responseTime: int("responseTime"), // Milliseconds
  tokensUsed: int("tokensUsed"),
  success: boolean("success").default(true),
  errorMessage: text("errorMessage"),
  
  // Metadata
  metadata: json("metadata").$type<{
    userIntent?: string;
    sentiment?: string;
    topics?: string[];
    [key: string]: any;
  }>(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  companyIdx: index("interaction_company_idx").on(table.companyId),
  sessionIdx: index("session_idx").on(table.sessionId),
  createdAtIdx: index("interaction_created_at_idx").on(table.createdAt),
  companySessionIdx: index("company_session_idx").on(table.companyId, table.sessionId),
}));

export type InteractionLog = typeof interactionLogs.$inferSelect;
export type InsertInteractionLog = typeof interactionLogs.$inferInsert;

/**
 * Training History - Versioned history of agent training prompts
 * 
 * Ensures agents never "forget" their training after restarts
 */
export const trainingHistory = mysqlTable("trainingHistory", {
  id: int("id").autoincrement().primaryKey(),
  
  // Context
  companyId: int("companyId"), // null = global training, not null = company-specific
  agentName: varchar("agentName", { length: 50 }).notNull(),
  
  // Training content
  trainingPrompt: text("trainingPrompt").notNull(),
  systemPrompt: text("systemPrompt"),
  examples: json("examples").$type<Array<{
    input: string;
    output: string;
  }>>(),
  
  // Configuration
  configuration: json("configuration").$type<{
    temperature?: number;
    maxTokens?: number;
    tools?: string[];
    [key: string]: any;
  }>(),
  
  // Versioning
  version: varchar("version", { length: 20 }).notNull(),
  previousVersion: varchar("previousVersion", { length: 20 }),
  isActive: boolean("isActive").default(true).notNull(),
  
  // Performance tracking
  successRate: int("successRate"), // 0-100
  avgResponseTime: int("avgResponseTime"), // Milliseconds
  totalInteractions: int("totalInteractions").default(0),
  
  // Metadata
  trainedBy: int("trainedBy"), // userId who created this training
  notes: text("notes"),
  changelog: text("changelog"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  activatedAt: timestamp("activatedAt"),
  deactivatedAt: timestamp("deactivatedAt"),
}, (table) => ({
  agentIdx: index("training_agent_idx").on(table.agentName),
  companyIdx: index("training_company_idx").on(table.companyId),
  versionIdx: index("version_idx").on(table.version),
  activeIdx: index("active_idx").on(table.isActive),
  companyAgentIdx: index("company_agent_idx").on(table.companyId, table.agentName),
}));

export type TrainingHistory = typeof trainingHistory.$inferSelect;
export type InsertTrainingHistory = typeof trainingHistory.$inferInsert;
