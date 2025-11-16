/**
 * Predefined Workflows for Ivy.AI
 * Common automation workflows across departments
 */

import { v4 as uuidv4 } from 'uuid';
import * as db from '../db';
import { HiveOrchestrator } from '../hive/orchestrator';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  department: string;
  steps: WorkflowStep[];
  triggers?: string[];
  expectedDuration?: number; // in minutes
}

export interface WorkflowStep {
  stepNumber: number;
  agentType: string;
  taskType: string;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  condition?: string;
  onSuccess?: string; // next step or action
  onFailure?: string; // fallback step or action
}

/**
 * Sales Pipeline Workflow: Prospect → Closer
 * Automates lead generation through deal closing
 */
export const SALES_PIPELINE_WORKFLOW: WorkflowDefinition = {
  id: "sales_pipeline_v1",
  name: "Sales Pipeline Automation",
  description: "Automated workflow from lead generation to deal closing",
  department: "sales",
  expectedDuration: 120, // 2 hours
  triggers: ["new_lead_request", "manual_trigger"],
  steps: [
    {
      stepNumber: 1,
      agentType: "prospect",
      taskType: "find_leads",
      inputMapping: {
        criteria: "workflow.input.lead_criteria"
      },
      outputMapping: {
        leads: "workflow.context.generated_leads"
      },
      onSuccess: "step_2",
      onFailure: "notify_owner"
    },
    {
      stepNumber: 2,
      agentType: "prospect",
      taskType: "score_lead",
      inputMapping: {
        lead_data: "workflow.context.generated_leads[0]",
        scoring_criteria: "workflow.input.scoring_criteria"
      },
      outputMapping: {
        scored_lead: "workflow.context.qualified_lead"
      },
      condition: "workflow.context.generated_leads.length > 0",
      onSuccess: "step_3",
      onFailure: "complete"
    },
    {
      stepNumber: 3,
      agentType: "prospect",
      taskType: "send_outreach",
      inputMapping: {
        lead: "workflow.context.qualified_lead",
        template: "workflow.input.email_template"
      },
      outputMapping: {
        outreach_result: "workflow.context.outreach_status"
      },
      condition: "workflow.context.qualified_lead.overall_score > 70",
      onSuccess: "step_4",
      onFailure: "complete"
    },
    {
      stepNumber: 4,
      agentType: "closer",
      taskType: "analyze_response",
      inputMapping: {
        lead: "workflow.context.qualified_lead",
        outreach_result: "workflow.context.outreach_status"
      },
      outputMapping: {
        next_action: "workflow.context.sales_action"
      },
      onSuccess: "step_5",
      onFailure: "notify_sales_team"
    },
    {
      stepNumber: 5,
      agentType: "closer",
      taskType: "generate_proposal",
      inputMapping: {
        lead: "workflow.context.qualified_lead",
        requirements: "workflow.context.sales_action"
      },
      outputMapping: {
        proposal: "workflow.output.final_proposal"
      },
      onSuccess: "complete",
      onFailure: "notify_sales_team"
    }
  ]
};

/**
 * Support Escalation Workflow: Solve L1 → L2 → Human
 * Intelligent ticket routing and escalation
 */
export const SUPPORT_ESCALATION_WORKFLOW: WorkflowDefinition = {
  id: "support_escalation_v1",
  name: "Support Ticket Escalation",
  description: "Automated support ticket resolution with intelligent escalation",
  department: "customer_service",
  expectedDuration: 30, // 30 minutes
  triggers: ["new_ticket", "ticket_update"],
  steps: [
    {
      stepNumber: 1,
      agentType: "solve",
      taskType: "search_knowledge",
      inputMapping: {
        query: "workflow.input.ticket.issue"
      },
      outputMapping: {
        kb_results: "workflow.context.knowledge_articles"
      },
      onSuccess: "step_2",
      onFailure: "step_4"
    },
    {
      stepNumber: 2,
      agentType: "solve",
      taskType: "generate_kb_response",
      inputMapping: {
        query: "workflow.input.ticket.issue",
        context: "workflow.context.knowledge_articles"
      },
      outputMapping: {
        response: "workflow.context.suggested_response"
      },
      condition: "workflow.context.knowledge_articles.length > 0",
      onSuccess: "step_3",
      onFailure: "step_4"
    },
    {
      stepNumber: 3,
      agentType: "solve",
      taskType: "resolve_ticket",
      inputMapping: {
        ticket: "workflow.input.ticket"
      },
      outputMapping: {
        resolution: "workflow.output.ticket_resolution"
      },
      condition: "workflow.context.suggested_response.confidence > 0.7",
      onSuccess: "complete",
      onFailure: "step_4"
    },
    {
      stepNumber: 4,
      agentType: "solve",
      taskType: "auto_escalate",
      inputMapping: {
        ticket: "workflow.input.ticket"
      },
      outputMapping: {
        escalation: "workflow.context.escalation_decision"
      },
      onSuccess: "step_5",
      onFailure: "notify_owner"
    },
    {
      stepNumber: 5,
      agentType: "solve",
      taskType: "escalate_issue",
      inputMapping: {
        ticket: "workflow.input.ticket",
        reason: "workflow.context.escalation_decision.escalation_reason"
      },
      outputMapping: {
        escalation_result: "workflow.output.escalation_details"
      },
      condition: "workflow.context.escalation_decision.should_escalate === true",
      onSuccess: "notify_support_team",
      onFailure: "complete"
    }
  ]
};

/**
 * Employee Onboarding Workflow: Talent → Logic → System
 * Automated new employee onboarding process
 */
export const EMPLOYEE_ONBOARDING_WORKFLOW: WorkflowDefinition = {
  id: "employee_onboarding_v1",
  name: "Employee Onboarding Automation",
  description: "Streamlined onboarding process for new hires",
  department: "hr",
  expectedDuration: 240, // 4 hours
  triggers: ["new_hire_approved", "manual_trigger"],
  steps: [
    {
      stepNumber: 1,
      agentType: "talent",
      taskType: "generate_interview_questions",
      inputMapping: {
        role: "workflow.input.employee.role",
        level: "workflow.input.employee.level"
      },
      outputMapping: {
        interview_pack: "workflow.context.onboarding_materials"
      },
      onSuccess: "step_2",
      onFailure: "notify_hr"
    },
    {
      stepNumber: 2,
      agentType: "talent",
      taskType: "assess_cultural_fit",
      inputMapping: {
        candidate_data: "workflow.input.employee",
        company_values: "workflow.input.company_values"
      },
      outputMapping: {
        fit_assessment: "workflow.context.cultural_assessment"
      },
      onSuccess: "step_3",
      onFailure: "notify_hr"
    },
    {
      stepNumber: 3,
      agentType: "logic",
      taskType: "provision_resources",
      inputMapping: {
        employee: "workflow.input.employee",
        department: "workflow.input.employee.department"
      },
      outputMapping: {
        resources: "workflow.context.provisioned_items"
      },
      onSuccess: "step_4",
      onFailure: "notify_it"
    },
    {
      stepNumber: 4,
      agentType: "talent",
      taskType: "schedule_orientation",
      inputMapping: {
        employee: "workflow.input.employee",
        start_date: "workflow.input.employee.start_date"
      },
      outputMapping: {
        schedule: "workflow.output.onboarding_schedule"
      },
      onSuccess: "complete",
      onFailure: "notify_hr"
    }
  ]
};

/**
 * Market Analysis Workflow: Insight → Prospect → Closer
 * Strategic market analysis to sales execution
 */
export const MARKET_ANALYSIS_WORKFLOW: WorkflowDefinition = {
  id: "market_analysis_v1",
  name: "Market Analysis to Sales",
  description: "From market intelligence to targeted sales campaigns",
  department: "strategy",
  expectedDuration: 180, // 3 hours
  triggers: ["market_research_request", "quarterly_analysis"],
  steps: [
    {
      stepNumber: 1,
      agentType: "insight",
      taskType: "analyze_market",
      inputMapping: {
        market_data: "workflow.input.market_info"
      },
      outputMapping: {
        market_analysis: "workflow.context.analysis_report"
      },
      onSuccess: "step_2",
      onFailure: "notify_strategy_team"
    },
    {
      stepNumber: 2,
      agentType: "insight",
      taskType: "competitive_analysis",
      inputMapping: {
        competitors: "workflow.input.competitors",
        company_data: "workflow.input.our_company"
      },
      outputMapping: {
        competitive_intel: "workflow.context.competitive_position"
      },
      onSuccess: "step_3",
      onFailure: "notify_strategy_team"
    },
    {
      stepNumber: 3,
      agentType: "prospect",
      taskType: "find_leads",
      inputMapping: {
        criteria: "workflow.context.competitive_position.opportunities"
      },
      outputMapping: {
        target_leads: "workflow.context.identified_leads"
      },
      onSuccess: "step_4",
      onFailure: "complete"
    },
    {
      stepNumber: 4,
      agentType: "prospect",
      taskType: "generate_campaign",
      inputMapping: {
        leads: "workflow.context.identified_leads",
        campaign_goal: "workflow.input.campaign_objective"
      },
      outputMapping: {
        campaign: "workflow.output.sales_campaign"
      },
      onSuccess: "complete",
      onFailure: "notify_sales_team"
    }
  ]
};

/**
 * Get all predefined workflows
 */
export function getAllPredefinedWorkflows(): WorkflowDefinition[] {
  return [
    SALES_PIPELINE_WORKFLOW,
    SUPPORT_ESCALATION_WORKFLOW,
    EMPLOYEE_ONBOARDING_WORKFLOW,
    MARKET_ANALYSIS_WORKFLOW
  ];
}

/**
 * Get workflow by ID
 */
export function getWorkflowById(workflowId: string): WorkflowDefinition | undefined {
  return getAllPredefinedWorkflows().find(w => w.id === workflowId);
}

/**
 * Get workflows by department
 */
export function getWorkflowsByDepartment(department: string): WorkflowDefinition[] {
  return getAllPredefinedWorkflows().filter(w => w.department === department);
}

/**
 * Execute a predefined workflow
 */
export async function executePredefinedWorkflow(
  workflowId: string,
  input: Record<string, any>,
  hive: HiveOrchestrator
): Promise<any> {
  const workflow = getWorkflowById(workflowId);
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  // Create workflow execution record
  const executionId = uuidv4();
  
  // Convert steps to DB format
  const dbSteps = workflow.steps.map(step => ({
    name: `Step ${step.stepNumber}: ${step.taskType}`,
    agentType: step.agentType,
    task: {
      type: step.taskType,
      input: step.inputMapping,
      output: step.outputMapping
    },
    breakCondition: step.condition ? { condition: step.condition } : undefined
  }));
  
  const workflowRecord = await db.createWorkflow({
    workflowId: workflow.id,
    name: workflow.name,
    description: workflow.description,
    steps: dbSteps,
    createdBy: 0, // System
    isActive: true
  });

  // Execute through Hive orchestrator
  const result = await hive.executeWorkflow(workflow.id, input);

  return {
    execution_id: executionId,
    workflow_id: workflow.id,
    workflow_name: workflow.name,
    result: result,
    started_at: new Date().toISOString()
  };
}
