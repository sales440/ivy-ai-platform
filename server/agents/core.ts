/**
 * Ivy.AI - Core Agent Architecture
 * Base classes and types for all Ivy.AI agents
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent } from '../../drizzle/schema';
import * as db from '../db';

export enum AgentStatus {
  IDLE = "idle",
  ACTIVE = "active",
  TRAINING = "training",
  ERROR = "error"
}

export enum Department {
  SALES = "sales",
  MARKETING = "marketing",
  CUSTOMER_SERVICE = "customer_service",
  OPERATIONS = "operations",
  HR = "hr",
  STRATEGY = "strategy"
}

export enum AgentType {
  PROSPECT = "prospect",
  CLOSER = "closer",
  SOLVE = "solve",
  LOGIC = "logic",
  TALENT = "talent",
  INSIGHT = "insight",
  CALL = "call"
}

export interface TaskInput {
  type: string;
  [key: string]: any;
}

export interface TaskResult {
  status: "completed" | "failed";
  data?: any;
  error?: string;
  executionTime?: number;
  nextActions?: string[];
}

export interface AgentKPIs {
  [key: string]: number;
}

/**
 * Base class for all Ivy.AI agents
 */
export abstract class IvyAgent {
  protected id: number | null = null;
  protected agentId: string;
  protected name: string;
  protected type: AgentType;
  protected department: Department;
  protected status: AgentStatus;
  protected capabilities: string[];
  protected kpis: AgentKPIs;
  protected configuration: Record<string, any>;
  protected learningData: any[] = [];

  constructor(
    name: string,
    type: AgentType,
    department: Department,
    capabilities: string[],
    initialKPIs: AgentKPIs = {}
  ) {
    this.agentId = uuidv4();
    this.name = name;
    this.type = type;
    this.department = department;
    this.status = AgentStatus.IDLE;
    this.capabilities = capabilities;
    this.kpis = initialKPIs;
    this.configuration = {};
  }

  /**
   * Initialize agent in database
   */
  async initialize(): Promise<void> {
    const agent = await db.createAgent({
      agentId: this.agentId,
      name: this.name,
      type: this.type,
      department: this.department,
      status: this.status,
      capabilities: this.capabilities,
      kpis: this.kpis,
      configuration: this.configuration
    });
    
    this.id = agent.id;
  }

  /**
   * Execute a task
   */
  async executeTask(task: TaskInput): Promise<TaskResult> {
    if (!this.id) {
      throw new Error("Agent not initialized. Call initialize() first.");
    }

    const startTime = Date.now();
    
    // Update status to active
    this.status = AgentStatus.ACTIVE;
    await db.updateAgentStatus(this.id, this.status);

    // Create task record
    const taskRecord = await db.createTask({
      taskId: uuidv4(),
      agentId: this.id,
      type: task.type,
      status: "running",
      input: task
    });

    try {
      // Process the task (implemented by subclasses)
      const result = await this._processTask(task);
      
      // Update KPIs
      await this._updateKPIs(result);
      
      // Calculate execution time
      const executionTime = Date.now() - startTime;
      
      // Update task record
      await db.updateTaskStatus(taskRecord.id, "completed", result.data);
      
      // Update status back to idle
      this.status = AgentStatus.IDLE;
      await db.updateAgentStatus(this.id, this.status);

      return {
        ...result,
        executionTime
      };
    } catch (error: any) {
      // Update status to error
      this.status = AgentStatus.ERROR;
      await db.updateAgentStatus(this.id, this.status);
      
      // Update task record
      await db.updateTaskStatus(taskRecord.id, "failed", undefined, error.message);

      // Reset to idle after error
      this.status = AgentStatus.IDLE;
      await db.updateAgentStatus(this.id, this.status);

      return {
        status: "failed",
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Abstract method to process tasks - must be implemented by subclasses
   */
  protected abstract _processTask(task: TaskInput): Promise<TaskResult>;

  /**
   * Update agent KPIs
   */
  protected async _updateKPIs(result: TaskResult): Promise<void> {
    if (!this.id) return;
    
    // Subclasses can override this to update specific KPIs
    await db.updateAgentKPIs(this.id, this.kpis);
  }

  /**
   * Learn from interaction
   */
  learnFromInteraction(data: any): void {
    this.learningData.push({
      timestamp: new Date(),
      data
    });
  }

  /**
   * Get agent information
   */
  getInfo() {
    return {
      id: this.id,
      agentId: this.agentId,
      name: this.name,
      type: this.type,
      department: this.department,
      status: this.status,
      capabilities: this.capabilities,
      kpis: this.kpis
    };
  }

  /**
   * Get current KPIs
   */
  getKPIs(): AgentKPIs {
    return { ...this.kpis };
  }

  /**
   * Update configuration
   */
  async updateConfiguration(config: Record<string, any>): Promise<void> {
    this.configuration = { ...this.configuration, ...config };
  }

  /**
   * Get agent ID
   */
  getId(): number | null {
    return this.id;
  }

  /**
   * Get agent UUID
   */
  getAgentId(): string {
    return this.agentId;
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get agent type
   */
  getType(): AgentType {
    return this.type;
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get agent capabilities
   */
  getCapabilities(): string[] {
    return [...this.capabilities];
  }
}
