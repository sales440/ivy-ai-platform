import { invokeLLM } from "./_core/llm";

// ============ AGENT TYPES ============

export type AgentType = "email" | "call" | "analytics" | "coordinator";

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  specialization: string;
  performance: {
    successRate: number;
    totalTasks: number;
    avgResponseTime: number;
  };
  learningData: {
    rewards: number[];
    actions: string[];
    outcomes: string[];
  };
}

export interface AgentTask {
  id: string;
  type: string;
  priority: number;
  assignedTo?: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  result?: any;
  reward?: number;
}

// ============ AGENT REGISTRY ============

const agents: Map<string, Agent> = new Map();

export function createAgent(type: AgentType, name: string, specialization: string): Agent {
  const agent: Agent = {
    id: `agent_${type}_${Date.now()}`,
    type,
    name,
    specialization,
    performance: {
      successRate: 0.5,
      totalTasks: 0,
      avgResponseTime: 0,
    },
    learningData: {
      rewards: [],
      actions: [],
      outcomes: [],
    },
  };
  agents.set(agent.id, agent);
  return agent;
}

export function getAgent(agentId: string): Agent | undefined {
  return agents.get(agentId);
}

export function getAllAgents(): Agent[] {
  return Array.from(agents.values());
}

export function getAgentsByType(type: AgentType): Agent[] {
  return Array.from(agents.values()).filter((a) => a.type === type);
}

// ============ REINFORCEMENT LEARNING ============

/**
 * Calculate reward based on task outcome
 */
export function calculateReward(task: AgentTask, outcome: {
  success: boolean;
  conversionRate?: number;
  responseTime?: number;
  customerSatisfaction?: number;
}): number {
  let reward = 0;

  // Base reward for success/failure
  reward += outcome.success ? 10 : -5;

  // Bonus for high conversion
  if (outcome.conversionRate) {
    reward += outcome.conversionRate * 20;
  }

  // Bonus for fast response
  if (outcome.responseTime && outcome.responseTime < 2000) {
    reward += 5;
  }

  // Bonus for customer satisfaction
  if (outcome.customerSatisfaction) {
    reward += outcome.customerSatisfaction * 10;
  }

  return reward;
}

/**
 * Update agent learning data with new experience
 */
export function updateAgentLearning(
  agentId: string,
  action: string,
  outcome: string,
  reward: number
): void {
  const agent = agents.get(agentId);
  if (!agent) return;

  agent.learningData.rewards.push(reward);
  agent.learningData.actions.push(action);
  agent.learningData.outcomes.push(outcome);

  // Keep only last 100 experiences
  if (agent.learningData.rewards.length > 100) {
    agent.learningData.rewards.shift();
    agent.learningData.actions.shift();
    agent.learningData.outcomes.shift();
  }

  // Update performance metrics
  const totalReward = agent.learningData.rewards.reduce((sum, r) => sum + r, 0);
  const avgReward = totalReward / agent.learningData.rewards.length;
  agent.performance.successRate = Math.max(0, Math.min(1, (avgReward + 10) / 20));
  agent.performance.totalTasks++;
}

/**
 * Select best agent for a task using epsilon-greedy strategy
 */
export function selectBestAgent(
  taskType: string,
  agentType: AgentType,
  epsilon: number = 0.1
): Agent | undefined {
  const candidates = getAgentsByType(agentType);
  if (candidates.length === 0) return undefined;

  // Epsilon-greedy: explore vs exploit
  if (Math.random() < epsilon) {
    // Explore: random agent
    return candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    // Exploit: best performing agent
    return candidates.reduce((best, current) =>
      current.performance.successRate > best.performance.successRate ? current : best
    );
  }
}

// ============ MULTI-AGENT COLLABORATION ============

export interface CollaborationTask {
  id: string;
  goal: string;
  subtasks: AgentTask[];
  coordinatorId?: string;
  status: "planning" | "executing" | "completed" | "failed";
  result?: any;
}

/**
 * Coordinator agent breaks down complex tasks into subtasks
 */
export async function coordinateTask(goal: string): Promise<CollaborationTask> {
  const coordinator = selectBestAgent("coordination", "coordinator");
  
  // Use LLM to break down task
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a coordinator agent. Break down complex goals into specific subtasks.
Each subtask should specify: type (email/call/analytics), description, priority (1-5).
Return JSON array of subtasks.`,
      },
      {
        role: "user",
        content: `Break down this goal into subtasks: ${goal}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "task_breakdown",
        strict: true,
        schema: {
          type: "object",
          properties: {
            subtasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["email", "call", "analytics", "coordination"] },
                  description: { type: "string" },
                  priority: { type: "number" },
                },
                required: ["type", "description", "priority"],
                additionalProperties: false,
              },
            },
          },
          required: ["subtasks"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Failed to coordinate task");
  }

  const breakdown = JSON.parse(content);
  const subtasks: AgentTask[] = breakdown.subtasks.map((st: any, idx: number) => ({
    id: `subtask_${Date.now()}_${idx}`,
    type: st.type,
    priority: st.priority,
    status: "pending" as const,
  }));

  const task: CollaborationTask = {
    id: `collab_${Date.now()}`,
    goal,
    subtasks,
    coordinatorId: coordinator?.id,
    status: "planning",
  };

  return task;
}

/**
 * Execute subtasks in parallel using specialized agents
 */
export async function executeCollaborativeTask(task: CollaborationTask): Promise<void> {
  task.status = "executing";

  // Assign each subtask to best agent
  for (const subtask of task.subtasks) {
    const agent = selectBestAgent(subtask.type, subtask.type as AgentType);
    if (agent) {
      subtask.assignedTo = agent.id;
    }
  }

  // Execute subtasks (simplified - in real system would be parallel)
  const results: any[] = [];
  for (const subtask of task.subtasks) {
    subtask.status = "in_progress";
    
    // Simulate execution
    const success = Math.random() > 0.2;
    const result = { success, data: `Result for ${subtask.type}` };
    
    subtask.status = success ? "completed" : "failed";
    subtask.result = result;
    
    // Calculate reward and update learning
    if (subtask.assignedTo) {
      const reward = calculateReward(subtask, {
        success,
        conversionRate: Math.random() * 0.5,
        responseTime: Math.random() * 3000,
      });
      subtask.reward = reward;
      updateAgentLearning(subtask.assignedTo, subtask.type, success ? "success" : "failure", reward);
    }
    
    results.push(result);
  }

  // Aggregate results
  const allSuccess = task.subtasks.every((st) => st.status === "completed");
  task.status = allSuccess ? "completed" : "failed";
  task.result = { success: allSuccess, subtaskResults: results };
}

/**
 * Learn from campaign outcomes
 */
export async function learnFromCampaign(campaignData: {
  id: string;
  channel: string;
  outcome: {
    success: boolean;
    conversions: number;
    totalLeads: number;
    revenue: number;
  };
  agentsInvolved: string[];
}): Promise<void> {
  const conversionRate = campaignData.outcome.conversions / campaignData.outcome.totalLeads;
  
  // Calculate reward based on campaign success
  const baseReward = campaignData.outcome.success ? 15 : -10;
  const conversionBonus = conversionRate * 30;
  const revenueBonus = Math.min(campaignData.outcome.revenue / 1000, 20);
  const totalReward = baseReward + conversionBonus + revenueBonus;

  // Update all involved agents
  for (const agentId of campaignData.agentsInvolved) {
    updateAgentLearning(
      agentId,
      `campaign_${campaignData.channel}`,
      campaignData.outcome.success ? "success" : "failure",
      totalReward
    );
  }
}

/**
 * Get agent recommendations based on learning
 */
export function getAgentRecommendations(agentId: string): string[] {
  const agent = agents.get(agentId);
  if (!agent) return [];

  const recommendations: string[] = [];

  // Analyze performance
  if (agent.performance.successRate < 0.6) {
    recommendations.push("Consider additional training or parameter tuning");
  }

  if (agent.performance.totalTasks < 10) {
    recommendations.push("Agent needs more experience - assign more tasks");
  }

  // Analyze learning patterns
  const recentRewards = agent.learningData.rewards.slice(-10);
  const avgRecentReward = recentRewards.reduce((sum, r) => sum + r, 0) / recentRewards.length;
  
  if (avgRecentReward < 0) {
    recommendations.push("Recent performance declining - review recent actions");
  }

  if (agent.learningData.rewards.length > 50) {
    const firstHalf = agent.learningData.rewards.slice(0, 25);
    const secondHalf = agent.learningData.rewards.slice(-25);
    const improvement =
      secondHalf.reduce((sum, r) => sum + r, 0) / 25 - firstHalf.reduce((sum, r) => sum + r, 0) / 25;
    
    if (improvement > 2) {
      recommendations.push("Agent showing strong learning - continue current strategy");
    }
  }

  return recommendations;
}

// ============ INITIALIZATION ============

// Create default agents
export function initializeDefaultAgents(): void {
  createAgent("email", "EmailBot Alpha", "Email campaign optimization");
  createAgent("email", "EmailBot Beta", "Follow-up sequences");
  createAgent("call", "CallBot Alpha", "Cold calling scripts");
  createAgent("call", "CallBot Beta", "Warm lead conversations");
  createAgent("analytics", "AnalyticsBot", "Campaign performance analysis");
  createAgent("coordinator", "CoordinatorBot", "Multi-channel campaign orchestration");
}

// Initialize on module load
initializeDefaultAgents();
