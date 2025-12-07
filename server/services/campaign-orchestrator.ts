import { getDb } from "../db";
import { campaignExecutions, campaignSteps, leads, multiChannelCampaigns } from "../../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";
import { executeEmailWorkflow } from "../email-workflow-executor";
import { invokeLLM } from "../_core/llm";

/**
 * Multi-Channel Campaign Orchestrator
 * Executes campaign steps across email and LinkedIn channels
 */

interface CampaignStepConfig {
  emailSequenceId?: number;
  linkedInPostType?: string;
  customMessage?: string;
}

/**
 * Execute the next step for a campaign execution
 */
export async function executeNextCampaignStep(executionId: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
    // Get execution details
    const [execution] = await db
      .select()
      .from(campaignExecutions)
      .where(eq(campaignExecutions.id, executionId))
      .limit(1);

    if (!execution) {
      return { success: false, message: "Execution not found" };
    }

    // Get next step
    const nextStepNumber = execution.currentStepNumber + 1;
    const [nextStep] = await db
      .select()
      .from(campaignSteps)
      .where(
        and(
          eq(campaignSteps.campaignId, execution.campaignId),
          eq(campaignSteps.stepNumber, nextStepNumber)
        )
      )
      .limit(1);

    if (!nextStep) {
      // No more steps - mark as completed
      await db
        .update(campaignExecutions)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(campaignExecutions.id, executionId));

      return { success: true, message: "Campaign completed" };
    }

    // Get lead details
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, execution.leadId))
      .limit(1);

    if (!lead) {
      return { success: false, message: "Lead not found" };
    }

    // Parse action config
    const config: CampaignStepConfig = JSON.parse(nextStep.actionConfig);

    // Execute step based on channel type
    let stepResult: { success: boolean; message: string };

    if (nextStep.channelType === "email") {
      stepResult = await executeEmailStep(lead, config);
    } else if (nextStep.channelType === "linkedin") {
      stepResult = await executeLinkedInStep(lead, config);
    } else {
      return { success: false, message: `Unknown channel type: ${nextStep.channelType}` };
    }

    if (!stepResult.success) {
      // Mark execution as failed
      await db
        .update(campaignExecutions)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(campaignExecutions.id, executionId));

      return stepResult;
    }

    // Update execution to next step
    await db
      .update(campaignExecutions)
      .set({
        currentStepNumber: nextStepNumber,
        lastExecutedAt: new Date(),
        status: "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(campaignExecutions.id, executionId));

    return { success: true, message: `Step ${nextStepNumber} executed successfully` };
  } catch (error) {
    console.error("[CampaignOrchestrator] Error executing step:", error);
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Execute email step
 */
async function executeEmailStep(
  lead: any,
  config: CampaignStepConfig
): Promise<{ success: boolean; message: string }> {
  try {
    if (!config.emailSequenceId) {
      return { success: false, message: "Email sequence ID not provided" };
    }

    const result = await executeEmailWorkflow({
      leadId: lead.id,
      sequenceId: config.emailSequenceId,
      variables: {
        leadName: lead.name || "there",
        company: lead.company || "your company",
        industry: lead.industry || "your industry",
        painPoint: lead.painPoint || "your business challenges",
      },
    });

    return result;
  } catch (error) {
    console.error("[CampaignOrchestrator] Email step error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Email step failed" };
  }
}

/**
 * Execute LinkedIn step
 */
async function executeLinkedInStep(
  lead: any,
  config: CampaignStepConfig
): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Generate LinkedIn post using LLM
    const postType = config.linkedInPostType || "thought_leadership";
    const prompt = generateLinkedInPrompt(postType, lead);

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are Ivy-Content, an AI agent specialized in creating engaging LinkedIn posts for B2B technology companies. Write professional, insightful content that provides value to the audience.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content || "";

    if (!content) {
      return { success: false, message: "Failed to generate LinkedIn post" };
    }

    // Save post to linkedInPosts table (status: pending for manual review)
    const { linkedInPosts } = await import("../../drizzle/schema");
    
    await db.insert(linkedInPosts).values({
      content,
      postType,
      status: "pending",
      scheduledFor: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: `LinkedIn post generated and saved (type: ${postType})`,
    };
  } catch (error) {
    console.error("[CampaignOrchestrator] LinkedIn step error:", error);
    return { success: false, message: error instanceof Error ? error.message : "LinkedIn step failed" };
  }
}

/**
 * Generate LinkedIn post prompt based on type
 */
function generateLinkedInPrompt(postType: string, lead: any): string {
  const company = lead.company || "businesses";
  const industry = lead.industry || "technology";

  const prompts: Record<string, string> = {
    thought_leadership: `Write a thought leadership LinkedIn post about AI automation in ${industry}. Focus on how companies like ${company} can leverage intelligent agents to transform their operations. Include 1-2 actionable insights. Keep it under 200 words.`,
    
    case_study: `Write a LinkedIn post sharing a success story about how AI agents helped a ${industry} company improve efficiency. Make it relatable to ${company}. Include specific metrics (e.g., "40% reduction in manual work"). Keep it under 200 words.`,
    
    product_update: `Write a LinkedIn post announcing a new feature in Ivy.AI Platform that helps ${industry} companies automate workflows. Explain the benefit for companies like ${company}. Keep it under 200 words.`,
    
    industry_insight: `Write a LinkedIn post sharing an industry insight about digital transformation in ${industry}. Make it relevant to ${company} and their challenges. Include a forward-looking perspective. Keep it under 200 words.`,
    
    customer_success: `Write a LinkedIn post celebrating customer success in the ${industry} sector. Highlight how automation is changing the game for companies like ${company}. Keep it under 200 words.`,
  };

  return prompts[postType] || prompts.thought_leadership;
}

/**
 * Process pending campaign executions
 * Called by scheduler to execute steps that are due
 */
export async function processPendingCampaignExecutions(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[CampaignOrchestrator] Database not available");
    return;
  }

  try {
    // Get all in-progress executions
    const executions = await db
      .select()
      .from(campaignExecutions)
      .where(eq(campaignExecutions.status, "in_progress"));

    for (const execution of executions) {
      // Get next step
      const nextStepNumber = execution.currentStepNumber + 1;
      const [nextStep] = await db
        .select()
        .from(campaignSteps)
        .where(
          and(
            eq(campaignSteps.campaignId, execution.campaignId),
            eq(campaignSteps.stepNumber, nextStepNumber)
          )
        )
        .limit(1);

      if (!nextStep) {
        continue; // No more steps
      }

      // Check if enough time has passed since last execution
      const daysSinceLastExecution = execution.lastExecutedAt
        ? Math.floor((Date.now() - execution.lastExecutedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      if (daysSinceLastExecution >= nextStep.delayDays) {
        console.log(`[CampaignOrchestrator] Executing step ${nextStepNumber} for execution ${execution.id}`);
        await executeNextCampaignStep(execution.id);
      }
    }
  } catch (error) {
    console.error("[CampaignOrchestrator] Error processing pending executions:", error);
  }
}

/**
 * Start a campaign for a lead
 */
export async function startCampaignForLead(
  campaignId: number,
  leadId: number
): Promise<{ success: boolean; message: string; executionId?: number }> {
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }

  try {
    // Create execution record
    const [result] = await db.insert(campaignExecutions).values({
      campaignId,
      leadId,
      currentStepNumber: 0,
      status: "in_progress",
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const executionId = result.insertId;

    // Execute first step immediately
    await executeNextCampaignStep(executionId);

    return {
      success: true,
      message: "Campaign started successfully",
      executionId,
    };
  } catch (error) {
    console.error("[CampaignOrchestrator] Error starting campaign:", error);
    return { success: false, message: error instanceof Error ? error.message : "Failed to start campaign" };
  }
}
