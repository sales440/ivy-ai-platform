/**
 * The Hive - Central Orchestration System
 * Manages all Ivy.AI agents, workflows, and inter-agent communication
 */

import { IvyAgent, AgentType } from '../agents/core';
import { IvyProspect, IvySolve, IvyCloser, IvyLogic, IvyTalent, IvyInsight } from '../agents';
import * as db from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowStep {
  name: string;
  agentType: AgentType;
  task: {
    type: string;
    [key: string]: any;
  };
  breakCondition?: {
    field: string;
    operator: string;
    value: any;
  };
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface WorkflowResult {
  workflow: string;
  results: Record<string, any>;
  completed_at: string;
  success: boolean;
  error?: string;
}

export class HiveOrchestrator {
  private agents: Map<number, IvyAgent> = new Map();
  private agentsByType: Map<AgentType, IvyAgent> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private performanceMetrics: Record<string, any> = {};
  private agentCommunications: any[] = [];

  constructor() {
    this.initializeDefaultWorkflows();
  }

  /**
   * Initialize the orchestrator and create default agents
   */
  async initialize(): Promise<void> {
    // Create default agents
    const prospect = new IvyProspect();
    const solve = new IvySolve();
    const closer = new IvyCloser();
    const logic = new IvyLogic();
    const talent = new IvyTalent();
    const insight = new IvyInsight();

    // Initialize all agents
    await prospect.initialize();
    await solve.initialize();
    await closer.initialize();
    await logic.initialize();
    await talent.initialize();
    await insight.initialize();

    // Register agents
    this.registerAgent(prospect);
    this.registerAgent(solve);
    this.registerAgent(closer);
    this.registerAgent(logic);
    this.registerAgent(talent);
    this.registerAgent(insight);

    console.log("[The Hive] Orchestrator initialized with 6 agents");
  }

  /**
   * Register an agent in The Hive
   */
  registerAgent(agent: IvyAgent): void {
    const id = agent.getId();
    if (id === null) {
      throw new Error("Agent must be initialized before registration");
    }

    this.agents.set(id, agent);
    this.agentsByType.set(agent.getType(), agent);
    
    console.log(`[The Hive] Agent registered: ${agent.getName()} (${agent.getType()})`);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowName: string, initialData: Record<string, any>): Promise<WorkflowResult> {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowName}`);
    }

    // Create workflow execution record
    const execution = await db.createWorkflowExecution({
      executionId: uuidv4(),
      workflowId: 0, // Will be updated if workflow is saved in DB
      status: "running",
      initialData: initialData,
      currentStep: 0,
      totalSteps: workflow.steps.length
    });

    let currentData = { ...initialData };
    const workflowResults: Record<string, any> = {};

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        
        // Get agent for this step
        const agent = this.agentsByType.get(step.agentType);
        if (!agent) {
          throw new Error(`Agent not found for type: ${step.agentType}`);
        }

        // Prepare task data (replace references to previous step data)
        const taskData = this._prepareTaskData(step.task, currentData);

        // Execute task
        console.log(`[The Hive] Executing step ${i + 1}/${workflow.steps.length}: ${step.name} with ${agent.getName()}`);
        const result = await agent.executeTask(taskData);

        // Save result
        workflowResults[step.name] = result;
        currentData = { ...currentData, ...result.data };

        // Update execution progress
        await db.updateWorkflowExecution(execution.id, {
          currentStep: i + 1,
          results: workflowResults
        });

        // Log communication
        await this._logCommunication(agent.getId()!, step.task.type, result);

        // Check break condition
        if (step.breakCondition && this._evaluateCondition(step.breakCondition, result.data)) {
          console.log(`[The Hive] Workflow interrupted by condition at step: ${step.name}`);
          break;
        }

        // If step failed, stop workflow
        if (result.status === "failed") {
          throw new Error(`Step ${step.name} failed: ${result.error}`);
        }
      }

      // Update workflow metrics
      this._updateWorkflowMetrics(workflowName, workflowResults);

      // Mark execution as completed
      await db.updateWorkflowExecution(execution.id, {
        status: "completed",
        results: workflowResults
      });

      return {
        workflow: workflowName,
        results: workflowResults,
        completed_at: new Date().toISOString(),
        success: true
      };
    } catch (error: any) {
      // Mark execution as failed
      await db.updateWorkflowExecution(execution.id, {
        status: "failed",
        error: error.message
      });

      return {
        workflow: workflowName,
        results: workflowResults,
        completed_at: new Date().toISOString(),
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get system status
   */
  getSystemStatus(): any {
    const agentStatuses: Record<string, any> = {};
    
    this.agents.forEach((agent, id) => {
      agentStatuses[agent.getName()] = {
        id: id,
        type: agent.getType(),
        status: agent.getStatus(),
        kpis: agent.getKPIs()
      };
    });

    const allIdle = Array.from(this.agents.values()).every(a => a.getStatus() === "idle");

    return {
      total_agents: this.agents.size,
      agent_statuses: agentStatuses,
      active_workflows: this.workflows.size,
      system_health: allIdle ? "optimal" : "active",
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get agent by type
   */
  getAgentByType(type: AgentType): IvyAgent | undefined {
    return this.agentsByType.get(type);
  }

  /**
   * Get all agents
   */
  getAllAgents(): IvyAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get available workflows
   */
  getAvailableWorkflows(): string[] {
    return Array.from(this.workflows.keys());
  }

  /**
   * Create a custom workflow
   */
  createWorkflow(name: string, definition: WorkflowDefinition): void {
    this.workflows.set(name, definition);
    console.log(`[The Hive] Workflow created: ${name}`);
  }

  /**
   * Initialize default workflows
   */
  private initializeDefaultWorkflows(): void {
    // Automated Sales Workflow
    this.workflows.set("automated_sales", {
      name: "Automated Sales Process",
      description: "Complete workflow from lead generation to outreach",
      steps: [
        {
          name: "lead_generation",
          agentType: AgentType.PROSPECT,
          task: {
            type: "find_leads",
            criteria: {
              industry: "technology",
              companySize: "50-200"
            }
          }
        },
        {
          name: "lead_qualification",
          agentType: AgentType.PROSPECT,
          task: {
            type: "qualify_lead",
            lead_data: { from_previous: "qualified" }
          }
        },
        {
          name: "outreach_campaign",
          agentType: AgentType.PROSPECT,
          task: {
            type: "send_outreach",
            template: "Hello {name}, we'd love to connect with {company}..."
          }
        }
      ]
    });

    // Support Workflow
    this.workflows.set("support_resolution", {
      name: "Support Ticket Resolution",
      description: "Automated ticket resolution with escalation",
      steps: [
        {
          name: "ticket_analysis",
          agentType: AgentType.SOLVE,
          task: {
            type: "resolve_ticket",
            ticket: { from_input: "ticket" }
          }
        }
      ]
    });

    console.log("[The Hive] Default workflows initialized");
  }

  /**
   * Prepare task data by replacing references
   */
  private _prepareTaskData(task: any, currentData: Record<string, any>): any {
    const prepared = { ...task };

    for (const key in prepared) {
      if (typeof prepared[key] === 'object' && prepared[key] !== null) {
        if (prepared[key].from_previous) {
          const dataKey = prepared[key].from_previous;
          prepared[key] = currentData[dataKey];
        } else if (prepared[key].from_input) {
          const inputKey = prepared[key].from_input;
          prepared[key] = currentData[inputKey];
        } else {
          prepared[key] = this._prepareTaskData(prepared[key], currentData);
        }
      }
    }

    return prepared;
  }

  /**
   * Evaluate break condition
   */
  private _evaluateCondition(condition: any, data: any): boolean {
    const { field, operator, value } = condition;
    const actualValue = data[field];

    switch (operator) {
      case "equals":
        return actualValue === value;
      case "greater_than":
        return actualValue > value;
      case "less_than":
        return actualValue < value;
      case "contains":
        return String(actualValue).includes(value);
      default:
        return false;
    }
  }

  /**
   * Log agent communication
   */
  private async _logCommunication(agentId: number, taskType: string, result: any): Promise<void> {
    const comm = {
      communicationId: uuidv4(),
      fromAgent: `agent_${agentId}`,
      toAgent: "hive",
      messageType: taskType,
      content: JSON.stringify({ result: result }),
      status: "delivered" as const
    };

    this.agentCommunications.push(comm as any);
    await db.logAgentCommunication(comm);
  }

  /**
   * Update workflow metrics
   */
  private _updateWorkflowMetrics(workflowName: string, results: Record<string, any>): void {
    if (!this.performanceMetrics[workflowName]) {
      this.performanceMetrics[workflowName] = {
        execution_count: 0,
        success_rate: 0,
        average_duration: 0,
        last_execution: null
      };
    }

    const metrics = this.performanceMetrics[workflowName];
    metrics.execution_count += 1;
    metrics.last_execution = new Date().toISOString();
  }
}

// Singleton instance
let hiveInstance: HiveOrchestrator | null = null;

export async function getHive(): Promise<HiveOrchestrator> {
  if (!hiveInstance) {
    hiveInstance = new HiveOrchestrator();
    await hiveInstance.initialize();
  }
  return hiveInstance;
}
