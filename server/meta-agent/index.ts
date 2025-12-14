/**
 * Meta-Agent Core System
 * 
 * Autonomous AI agent that maintains the Ivy.AI platform:
 * - Fixes TypeScript errors automatically
 * - Trains other agents
 * - Maintains platform health 24/7
 * - Responds to conversational commands
 */


import { META_AGENT_CONFIG } from "./config";
import type {
  MetaAgentStatus,
  MetaAgentTask,
  TaskType,
  TaskPriority,
  AuditResult,
  PlatformHealth,
  ChatMessage,
  ChatContext,
} from "./types";
import { getDb } from "../db";
import { metaAgentMemory, users } from "../../drizzle/schema";
import { desc, eq, and, or, like } from "drizzle-orm";

class MetaAgent {
  private static instance: MetaAgent;
  private status: MetaAgentStatus = "idle";
  private tasks: Map<string, MetaAgentTask> = new Map();
  private chatHistory: ChatMessage[] = [];
  private lastAudit?: AuditResult;
  private isRunning = false;
  private auditIntervalId?: NodeJS.Timeout;
  private trainingIntervalId?: NodeJS.Timeout;

  private constructor() {
    console.log("[Meta-Agent] Initializing...");
  }

  static getInstance(): MetaAgent {
    if (!MetaAgent.instance) {
      MetaAgent.instance = new MetaAgent();
    }
    return MetaAgent.instance;
  }

  /**
   * Start the Meta-Agent system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("[Meta-Agent] Already running");
      return;
    }

    console.log("[Meta-Agent] Starting autonomous system...");
    this.isRunning = true;
    this.status = "running";

    // Load persistent memory
    await this.loadChatHistory();

    // Run initial audit
    await this.runAudit();

    // Schedule periodic audits
    if (META_AGENT_CONFIG.auditInterval > 0) {
      this.auditIntervalId = setInterval(
        () => this.runAudit(),
        META_AGENT_CONFIG.auditInterval * 60 * 1000
      );
      console.log(`[Meta-Agent] Scheduled audits every ${META_AGENT_CONFIG.auditInterval} minutes`);
    }

    // Schedule periodic training
    if (META_AGENT_CONFIG.autoTrain && META_AGENT_CONFIG.trainingInterval > 0) {
      this.trainingIntervalId = setInterval(
        () => this.autoTrainAgents(),
        META_AGENT_CONFIG.trainingInterval * 60 * 60 * 1000
      );
      console.log(`[Meta-Agent] Scheduled auto-training every ${META_AGENT_CONFIG.trainingInterval} hours`);
    }

    console.log("[Meta-Agent] ✅ System started successfully");
  }

  /**
   * Stop the Meta-Agent system
   */
  stop(): void {
    console.log("[Meta-Agent] Stopping...");
    this.isRunning = false;
    this.status = "idle";

    if (this.auditIntervalId) {
      clearInterval(this.auditIntervalId);
      this.auditIntervalId = undefined;
    }

    if (this.trainingIntervalId) {
      clearInterval(this.trainingIntervalId);
      this.trainingIntervalId = undefined;
    }

    console.log("[Meta-Agent] Stopped");
  }

  /**
   * Load chat history from database
   */
  async loadChatHistory(): Promise<void> {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[Meta-Agent] No database connection, using in-memory chat history");
        return;
      }

      // Default to companyId 1 for now if we don't have user context in loadChatHistory
      // In a real scenario, this should maybe load based on active user or just be empty until needed
      const history = await db.query.metaAgentMemory.findMany({
        where: eq(metaAgentMemory.companyId, 1),
        orderBy: [desc(metaAgentMemory.timestamp)],
        limit: 20, // Reduced from 100 to save context window
      });

      this.chatHistory = history.reverse().map(entry => ({
        id: entry.id.toString(),
        role: entry.role as "user" | "assistant" | "system",
        content: entry.content,
        timestamp: entry.timestamp,
        metadata: entry.metadata as any
      }));

      console.log(`[Meta-Agent] Loaded ${this.chatHistory.length} messages from persistent memory`);
    } catch (error) {
      console.error("[Meta-Agent] Failed to load chat history:", error);
    }
  }

  /**
   * Retrieve relevant memory context based on query (Simulated RAG)
   */
  async retrieveRelevantMemory(query: string, companyId: number): Promise<string[]> {
    if (!query) return [];

    try {
      const db = await getDb();
      if (!db) return [];

      // Extract keywords (simplistic approach replacing vector search for now)
      const keywords = query.split(' ').filter(w => w.length > 4).slice(0, 3);
      if (keywords.length === 0) return [];

      const searchPattern = `%${keywords[0]}%`;

      const memories = await db.query.metaAgentMemory.findMany({
        where: (mem, { and, eq, or, like }) => and(
          eq(mem.companyId, companyId),
          or(
            eq(mem.role, 'system'), // Always check relevant system instructions
            like(mem.content, searchPattern)
          )
        ),
        orderBy: [desc(metaAgentMemory.importance), desc(metaAgentMemory.timestamp)],
        limit: 5
      });

      return memories.map(m => `[${m.role.toUpperCase()} - ${m.timestamp.toISOString().split('T')[0]}] ${m.content}`);
    } catch (error) {
      console.error("[Meta-Agent] Error retrieving memory:", error);
      return [];
    }
  }

  /**
   * Run a comprehensive platform audit
   */
  async runAudit(): Promise<AuditResult> {
    console.log("[Meta-Agent] Running platform audit...");
    this.status = "auditing";

    try {
      // Import capabilities dynamically to avoid circular dependencies
      const { detectTypeScriptErrors } = await import("./capabilities/typescript-fixer");
      const { checkPlatformHealth } = await import("./capabilities/platform-healer");

      // Check TypeScript errors
      const tsErrors = await detectTypeScriptErrors();
      console.log(`[Meta-Agent] Found ${tsErrors.length} TypeScript errors`);

      // Check platform health
      const platformHealth = await checkPlatformHealth();
      console.log(`[Meta-Agent] Platform health: ${platformHealth.status}`);

      // Create audit result
      const auditResult: AuditResult = {
        timestamp: new Date(),
        typeScriptErrors: tsErrors.length,
        codeQualityScore: this.calculateCodeQualityScore(tsErrors.length, platformHealth),
        platformHealth,
        recommendations: this.generateRecommendations(tsErrors.length, platformHealth),
        criticalIssues: platformHealth.issues.filter(i => i.severity === "critical"),
        tasksCreated: [],
      };

      // Auto-fix if enabled and there are critical issues
      if (META_AGENT_CONFIG.autoFix) {
        if (tsErrors.length > 0) {
          const taskId = await this.createTask({
            type: "fix_typescript_errors",
            priority: "high",
            description: `Fix ${tsErrors.length} TypeScript errors`,
          });
          auditResult.tasksCreated.push(taskId);
        }

        if (platformHealth.status === "critical") {
          const taskId = await this.createTask({
            type: "heal_system",
            priority: "critical",
            description: "Heal critical platform issues",
          });
          auditResult.tasksCreated.push(taskId);
        }
      }

      this.lastAudit = auditResult;
      this.status = "running";

      console.log(`[Meta-Agent] Audit complete. Created ${auditResult.tasksCreated.length} tasks`);
      return auditResult;
    } catch (error) {
      console.error("[Meta-Agent] Audit failed:", error);
      this.status = "error";
      throw error;
    }
  }

  /**
   * Create a new task
   */
  async createTask(params: {
    type: TaskType;
    priority: TaskPriority;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task: MetaAgentTask = {
      id: taskId,
      type: params.type,
      priority: params.priority,
      status: "pending",
      description: params.description,
      createdAt: new Date(),
      metadata: params.metadata,
    };

    this.tasks.set(taskId, task);
    console.log(`[Meta-Agent] Created task: ${taskId} - ${params.description}`);

    // Execute task immediately if high priority and auto-fix is enabled
    if (META_AGENT_CONFIG.autoFix && (params.priority === "critical" || params.priority === "high")) {
      this.executeTask(taskId).catch(error => {
        console.error(`[Meta-Agent] Failed to execute task ${taskId}:`, error);
      });
    }

    return taskId;
  }

  /**
   * Execute a task
   */
  async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status === "running") {
      console.log(`[Meta-Agent] Task ${taskId} is already running`);
      return;
    }

    console.log(`[Meta-Agent] Executing task: ${taskId} - ${task.description}`);
    task.status = "running";
    task.startedAt = new Date();

    try {
      let result: any;

      switch (task.type) {
        case "fix_typescript_errors":
          const { fixTypeScriptErrors } = await import("./capabilities/typescript-fixer");
          result = await fixTypeScriptErrors();
          break;

        case "train_agent":
          const { trainAgent } = await import("./capabilities/agent-trainer");
          result = await trainAgent(task.metadata?.agentId);
          break;

        case "auto_train":
          result = await this.autoTrainAgents();
          break;

        case "heal_system":
          const { healPlatform } = await import("./capabilities/platform-healer");
          result = await healPlatform();
          break;

        case "audit_platform":
          result = await this.runAudit();
          break;

        case "chat_response":
          const { generateChatResponse } = await import("./capabilities/chat-handler");
          // Pass companyId from metadata which we now ensure is present
          result = await generateChatResponse(
            task.metadata?.message,
            this.chatHistory,
            task.metadata?.companyId || 1
          );
          break;

        case "predict_performance":
          const { predictAllAgentsPerformance } = await import("./capabilities/predictive-analytics");
          result = await predictAllAgentsPerformance();
          break;

        case "send_omni_message":
          const { sendMessage } = await import("./capabilities/omni-channel");
          result = await sendMessage(task.metadata?.message);
          break;

        case "make_call":
          const { makeCall } = await import("./capabilities/voice-handler");
          result = await makeCall(task.metadata?.to, task.metadata?.message);
          break;

        case "propose_code_change":
          const { proposeCodeChanges } = await import("./capabilities/self-coder");
          result = await proposeCodeChanges(task.metadata?.request);
          break;

        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.status = "completed";
      task.completedAt = new Date();
      task.result = result;

      console.log(`[Meta-Agent] ✅ Task completed: ${taskId}`);
    } catch (error: any) {
      task.status = "failed";
      task.completedAt = new Date();
      task.error = error.message;

      console.error(`[Meta-Agent] ❌ Task failed: ${taskId}`, error);
    }
  }

  /**
   * Auto-train all agents based on recent performance
   */
  async autoTrainAgents(): Promise<void> {
    console.log("[Meta-Agent] Starting auto-training for all agents...");
    console.log("[Meta-Agent] 🌍 Enabling market intelligence for training session...");
    this.status = "training";

    try {
      const { analyzeAllAgentsPerformance, generateTrainingRecommendations } =
        await import("./capabilities/agent-trainer");

      // Analyze performance of all agents
      const performances = await analyzeAllAgentsPerformance();
      console.log(`[Meta-Agent] Analyzed ${performances.length} agents`);

      // Generate training recommendations
      const recommendations = await generateTrainingRecommendations(performances);
      console.log(`[Meta-Agent] Generated ${recommendations.length} training recommendations`);

      // Create training tasks for agents that need improvement
      for (const recommendation of recommendations) {
        if (recommendation.priority === "high" || recommendation.priority === "critical") {
          await this.createTask({
            type: "train_agent",
            priority: recommendation.priority,
            description: `Train ${recommendation.agentName}: ${recommendation.recommendation}`,
            metadata: {
              agentId: recommendation.agentId,
              recommendation,
            },
          });
        }
      }

      this.status = "running";
      console.log("[Meta-Agent] ✅ Auto-training complete");
    } catch (error) {
      console.error("[Meta-Agent] Auto-training failed:", error);
      this.status = "error";
    }
  }

  /**
   * Handle chat message from user
   */
  async handleChatMessage(message: string, userId: string): Promise<ChatMessage> {
    console.log(`[Meta-Agent] Received chat message from ${userId}: ${message}`);

    const db = await getDb();
    const userIdNum = parseInt(userId, 10) || 1;
    let companyId = 1;

    // Resolve companyId
    if (db) {
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.id, userIdNum),
          columns: { companyId: true }
        });
        if (user && user.companyId) {
          companyId = user.companyId;
        }
      } catch (err) {
        console.warn("[Meta-Agent] Could not resolve companyId for user:", userId);
      }
    }

    // 1. Save user message to persistent memory
    try {
      if (db) {
        await db.insert(metaAgentMemory).values({
          companyId,
          userId: userIdNum,
          role: "user",
          content: message,
          timestamp: new Date(),
        });
      }
    } catch (err) {
      console.error("[Meta-Agent] Failed to save user message:", err);
    }

    // Update in-memory history
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    this.chatHistory.push(userMessage);

    // Create chat response task with companyId context
    const taskId = await this.createTask({
      type: "chat_response",
      priority: "medium",
      description: "Generate chat response",
      metadata: { message, userId, companyId },
    });

    // Execute task and wait for result
    await this.executeTask(taskId);

    const task = this.tasks.get(taskId);
    const responseContent = task?.result?.response || "I'm sorry, I couldn't process that request.";

    // 2. Save assistant response to persistent memory
    try {
      if (db) {
        await db.insert(metaAgentMemory).values({
          companyId,
          userId: userIdNum,
          role: "assistant",
          content: responseContent,
          metadata: { taskId },
          timestamp: new Date(),
        });
      }
    } catch (err) {
      console.error("[Meta-Agent] Failed to save assistant message:", err);
    }

    // Add assistant response to history
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: "assistant",
      content: responseContent,
      timestamp: new Date(),
      metadata: { taskId },
    };
    this.chatHistory.push(assistantMessage);

    // Trim history if too long
    if (this.chatHistory.length > 50) { // Reduced memory footprint
      this.chatHistory = this.chatHistory.slice(-50);
    }

    return assistantMessage;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      status: this.status,
      isRunning: this.isRunning,
      lastAudit: this.lastAudit,
      activeTasks: Array.from(this.tasks.values()).filter(t => t.status === "running").length,
      pendingTasks: Array.from(this.tasks.values()).filter(t => t.status === "pending").length,
      completedTasks: Array.from(this.tasks.values()).filter(t => t.status === "completed").length,
      failedTasks: Array.from(this.tasks.values()).filter(t => t.status === "failed").length,
      chatMessages: this.chatHistory.length,
    };
  }

  /**
   * Get all tasks
   */
  getTasks() {
    return Array.from(this.tasks.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get chat history
   */
  getChatHistory() {
    return this.chatHistory;
  }

  /**
   * Calculate code quality score (0-100)
   */
  private calculateCodeQualityScore(tsErrors: number, health: PlatformHealth): number {
    let score = 100;

    // Deduct points for TypeScript errors
    score -= Math.min(tsErrors * 0.5, 50);

    // Deduct points for health issues
    if (health.status === "critical") score -= 30;
    else if (health.status === "degraded") score -= 15;

    return Math.max(0, Math.round(score));
  }

  /**
   * Generate recommendations based on audit results
   */
  private generateRecommendations(tsErrors: number, health: PlatformHealth): string[] {
    const recommendations: string[] = [];

    if (tsErrors > 50) {
      recommendations.push("High number of TypeScript errors detected. Run auto-fix to resolve.");
    }

    if (health.status === "critical") {
      recommendations.push("Platform health is critical. Immediate healing required.");
    }

    if (health.components.database.status !== "healthy") {
      recommendations.push("Database health issues detected. Check connections and queries.");
    }

    if (health.components.agents.errorRate > 0.1) {
      recommendations.push("High error rate in agents. Review agent configurations and training.");
    }

    return recommendations;
  }
}

// Export singleton instance
export const metaAgent = MetaAgent.getInstance();
export default metaAgent;
