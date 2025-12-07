import { drizzle } from "drizzle-orm/mysql2";
import { eq, and, gte, lte } from "drizzle-orm";
import { agents, tasks, leads, emailSequences, emailSequenceSteps } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { sendEmail } from "../services/sendgrid";
import { getDb } from "../db";

/**
 * Marketing Automation Workflows
 * 
 * This module implements automated workflows for Ivy.AI's self-marketing campaign:
 * 1. Email Nurturing Sequences
 * 2. LinkedIn Post Automation
 * 3. Lead Qualification Pipeline
 * 4. Demo Scheduling Automation
 * 5. Content Generation Pipeline
 */

const db = drizzle(process.env.DATABASE_URL!);

// ============================================================================
// WORKFLOW 1: Email Nurturing Automation
// ============================================================================

export interface EmailNurturingWorkflow {
  leadId: number;
  sequenceName: "awareness" | "consideration" | "decision" | "post_demo";
  trigger: "whitepaper_download" | "calculator_usage" | "demo_request" | "demo_completed";
}

export async function executeEmailNurturingWorkflow(workflow: EmailNurturingWorkflow) {
  console.log(`[EmailNurturing] Starting workflow for lead ${workflow.leadId}, sequence: ${workflow.sequenceName}`);

  // 1. Get Ivy-Nurture agent
  const nurtureAgent = await db
    .select()
    .from(agents)
    .where(eq(agents.agentId, "ivy-nurture-001"))
    .limit(1);

  if (!nurtureAgent || nurtureAgent.length === 0) {
    throw new Error("Ivy-Nurture agent not found");
  }

  const agent = nurtureAgent[0];

  // 2. Get lead details
  const leadData = await db
    .select()
    .from(leads)
    .where(eq(leads.id, workflow.leadId))
    .limit(1);

  if (!leadData || leadData.length === 0) {
    throw new Error(`Lead ${workflow.leadId} not found`);
  }

  const lead = leadData[0];

  // 3. Get email sequence
  const sequence = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.name, workflow.sequenceName))
    .limit(1);

  if (!sequence || sequence.length === 0) {
    throw new Error(`Email sequence ${workflow.sequenceName} not found`);
  }

  // 4. Get sequence steps
  const steps = await db
    .select()
    .from(emailSequenceSteps)
    .where(eq(emailSequenceSteps.sequenceId, sequence[0].id))
    .orderBy(emailSequenceSteps.stepNumber);

  console.log(`[EmailNurturing] Found ${steps.length} steps in sequence`);

  // 5. Schedule each email step
  for (const step of steps) {
    const taskId = `email-${workflow.leadId}-${sequence[0].id}-${step.stepNumber}-${Date.now()}`;

    // Create task for agent
    await db.insert(tasks).values([{
      taskId,
      agentId: agent.id,
      type: "send_email",
      status: "pending",
      input: {
        leadId: lead.id,
        leadEmail: lead.email,
        leadName: lead.name,
        leadCompany: lead.company,
        sequenceName: workflow.sequenceName,
        stepNumber: step.stepNumber,
        subject: step.subject,
        body: step.body,
        delayDays: step.delayDays,
        scheduledAt: new Date(Date.now() + step.delayDays * 24 * 60 * 60 * 1000),
      },
      createdAt: new Date(),
    }]);

    console.log(`[EmailNurturing] Scheduled email step ${step.stepNumber} for ${step.delayDays} days from now`);
  }

  // 6. Update agent KPIs
  const currentKPIs = agent.kpis as Record<string, number>;
  await db
    .update(agents)
    .set({
      kpis: {
        ...currentKPIs,
        emails_sent: (currentKPIs.emails_sent || 0) + steps.length,
      },
    })
    .where(eq(agents.id, agent.id));

  console.log(`[EmailNurturing] Workflow completed for lead ${workflow.leadId}`);

  return {
    success: true,
    emailsScheduled: steps.length,
    agentId: agent.agentId,
  };
}

// ============================================================================
// WORKFLOW 2: LinkedIn Post Automation
// ============================================================================

export interface LinkedInPostWorkflow {
  postType: "hook_controversial" | "case_study" | "data_viz" | "storytelling" | "myth_busting";
  scheduledTime: Date;
  targetAudience: string[];
}

export async function executeLinkedInPostWorkflow(workflow: LinkedInPostWorkflow) {
  console.log(`[LinkedInPost] Starting workflow for post type: ${workflow.postType}`);

  // 1. Get Ivy-LinkedIn agent
  const linkedInAgentData = await db
    .select()
    .from(agents)
    .where(eq(agents.agentId, "ivy-linkedin-001"))
    .limit(1);

  if (!linkedInAgentData || linkedInAgentData.length === 0) {
    throw new Error("Ivy-LinkedIn agent not found");
  }

  const linkedInAgent = linkedInAgentData[0];

  // 2. Get Ivy-Content agent to generate post
  const contentAgentData = await db
    .select()
    .from(agents)
    .where(eq(agents.agentId, "ivy-content-001"))
    .limit(1);

  if (!contentAgentData || contentAgentData.length === 0) {
    throw new Error("Ivy-Content agent not found");
  }

  const contentAgent = contentAgentData[0];

  // 3. Generate post content using LLM
  const postPrompt = generateLinkedInPostPrompt(workflow.postType, workflow.targetAudience);

  const llmResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are Ivy-Content, a professional B2B marketing copywriter for Ivy.AI. 
        
Your task is to write engaging LinkedIn posts that:
- Hook attention in the first line
- Provide value (education, insights, or data)
- Include a clear call-to-action
- Use short paragraphs and line breaks for readability
- Avoid emojis (professional tone)
- Target VPs of Sales, Directors of Revenue, and Sales Ops Managers

Brand voice: Data-driven, transparent, innovative, helpful
Avoid: Salesy language, hype, jargon, vague promises`,
      },
      {
        role: "user",
        content: postPrompt,
      },
    ],
  });

  const postContent = llmResponse.choices[0].message.content;

  // 4. Create task for LinkedIn agent to publish post
  const taskId = `linkedin-post-${workflow.postType}-${Date.now()}`;

  await db.insert(tasks).values([{
    taskId,
    agentId: linkedInAgent.id,
    type: "publish_linkedin_post",
    status: "pending",
    input: {
      postType: workflow.postType,
      content: postContent,
      scheduledTime: workflow.scheduledTime,
      targetAudience: workflow.targetAudience,
    },
    createdAt: new Date(),
  }]);

  // 5. Update agent KPIs
  const linkedInKPIs = linkedInAgent.kpis as Record<string, number>;
  await db
    .update(agents)
    .set({
      kpis: {
        ...linkedInKPIs,
        posts_published: (linkedInKPIs.posts_published || 0) + 1,
      },
    })
    .where(eq(agents.id, linkedInAgent.id));

  const contentKPIs = contentAgent.kpis as Record<string, number>;
  await db
    .update(agents)
    .set({
      kpis: {
        ...contentKPIs,
        posts_created: (contentKPIs.posts_created || 0) + 1,
      },
    })
    .where(eq(agents.id, contentAgent.id));

  console.log(`[LinkedInPost] Post scheduled for ${workflow.scheduledTime}`);

  return {
    success: true,
    postContent,
    scheduledTime: workflow.scheduledTime,
    agentId: linkedInAgent.agentId,
  };
}

function generateLinkedInPostPrompt(postType: string, targetAudience: string[]): string {
  const prompts = {
    hook_controversial: `Write a controversial but data-backed LinkedIn post about the cost of SDRs vs AI agents.

Target audience: ${targetAudience.join(", ")}

Structure:
- Hook: Bold statement about SDR costs
- Body: Break down hidden costs (benefits, tools, training, turnover)
- Data: Use specific numbers ($168K total cost vs $2.4K for AI)
- CTA: "Comment 'WHITEPAPER' and I'll send you the full analysis"

Tone: Professional but provocative
Length: 150-200 words`,

    case_study: `Write a LinkedIn post showcasing Born Into Glory's success story with Ivy.AI.

Target audience: ${targetAudience.join(", ")}

Key metrics to highlight:
- Replaced 2 SDRs with AI agents
- 4x pipeline increase in 60 days
- $160K annual savings
- 3-minute response time (vs 6 hours before)

Structure:
- Hook: "How [Company] 4x'd their pipeline without hiring"
- Challenge: What they struggled with before
- Solution: How they implemented AI agents
- Results: Specific metrics
- CTA: "Want similar results? Comment 'DEMO'"

Tone: Story-driven, credible
Length: 180-220 words`,

    data_viz: `Write a LinkedIn post to accompany a data visualization comparing SDR costs.

Target audience: ${targetAudience.join(", ")}

The image shows:
- Human SDR: $168,000/year
- AI Agent: $2,400/year
- Savings: $165,600 (98.5%)

Structure:
- Hook: "This graph explains why 68% of B2B companies are evaluating AI for sales"
- Context: What the data shows
- Breakdown: List the cost components
- Insight: What this means for the industry
- CTA: "Comment 'CALCULATE' to see your specific savings"

Tone: Data-driven, analytical
Length: 120-150 words`,

    storytelling: `Write a personal storytelling LinkedIn post about a VP of Sales who resisted AI but now uses it.

Target audience: ${targetAudience.join(", ")}

Story arc:
- 6 months ago: VP said "AI will never replace my SDRs"
- Turning point: Lost 3 deals due to slow response time
- Realization: It's not human vs AI, it's human + AI
- Current state: 5 AI agents generating 200 meetings/month
- Lesson: Market doesn't wait for you to adapt

Structure:
- Hook: Quote from the VP
- Story: What changed their mind
- Transformation: Before and after
- Insight: Broader lesson for the industry
- CTA: "What's your take? Comment below"

Tone: Reflective, human
Length: 200-250 words`,

    myth_busting: `Write a LinkedIn post debunking 5 common myths about AI agents in sales.

Target audience: ${targetAudience.join(", ")}

Myths to address:
1. "AI can't do cold calling" → Reality: AI can make 500+ calls/day with natural voice
2. "Prospects detect it's AI" → Reality: 73% don't notice in blind tests
3. "It's too expensive" → Reality: ROI positive in 30-60 days
4. "It will replace my team" → Reality: Hybrid model works best
5. "My industry is too complex" → Reality: Already used in finance, healthcare, manufacturing

Structure:
- Hook: "5 myths I hear about AI in sales"
- Format: Myth → Reality for each
- Data: Include specific stats
- CTA: "Which myth has held you back? Comment the number (1-5)"

Tone: Educational, myth-busting
Length: 180-220 words`,
  };

  return prompts[postType as keyof typeof prompts] || prompts.hook_controversial;
}

// ============================================================================
// WORKFLOW 3: Lead Qualification Pipeline
// ============================================================================

export interface LeadQualificationWorkflow {
  leadId: number;
  source: string;
}

export async function executeLeadQualificationWorkflow(workflow: LeadQualificationWorkflow) {
  console.log(`[LeadQualification] Starting workflow for lead ${workflow.leadId}`);

  // 1. Get Ivy-Qualifier agent
  const qualifierAgentData = await db
    .select()
    .from(agents)
    .where(eq(agents.agentId, "ivy-qualifier-001"))
    .limit(1);

  if (!qualifierAgentData || qualifierAgentData.length === 0) {
    throw new Error("Ivy-Qualifier agent not found");
  }

  const qualifierAgent = qualifierAgentData[0];

  // 2. Get lead details
  const leadData = await db
    .select()
    .from(leads)
    .where(eq(leads.id, workflow.leadId))
    .limit(1);

  if (!leadData || leadData.length === 0) {
    throw new Error(`Lead ${workflow.leadId} not found`);
  }

  const lead = leadData[0];

  // 3. Calculate lead score using scoring model
  const scoringModel = (qualifierAgent.configuration as any).scoring_model;
  let totalScore = 0;

  // Company size score
  const companySize = lead.companySize || "1-50";
  const companySizeScore = scoringModel.company_size.ranges[companySize] || 0;
  totalScore += (companySizeScore * scoringModel.company_size.weight) / 100;

  // Job title score
  const jobTitle = lead.title || "Other";
  const titleScore = Object.entries(scoringModel.job_title.values).find(([key]) =>
    jobTitle.includes(key)
  )?.[1] || 20;
  totalScore += ((titleScore as number) * scoringModel.job_title.weight) / 100;

  // Industry score
  const industry = lead.industry || "Other";
  const industryScore = scoringModel.industry.values[industry] || 40;
  totalScore += (industryScore * scoringModel.industry.weight) / 100;

  // Engagement score
  const engagementScore = scoringModel.engagement.actions[workflow.source] || 10;
  totalScore += (engagementScore * scoringModel.engagement.weight) / 100;

  // Budget indicators score (based on notes or custom fields)
  const budgetScore = 50; // Default, would be calculated from enrichment data
  totalScore += (budgetScore * scoringModel.budget_indicators.weight) / 100;

  // 4. Update lead with calculated score
  await db
    .update(leads)
    .set({
      qualificationScore: Math.round(totalScore),
      status: totalScore >= scoringModel.qualification_threshold ? "qualified" : "new",
    })
    .where(eq(leads.id, lead.id));

  // 5. If high priority, trigger notification
  if (totalScore >= scoringModel.high_priority_threshold) {
    console.log(`[LeadQualification] High priority lead detected (score: ${Math.round(totalScore)})`);

    // Create notification task
    const taskId = `notify-high-priority-${workflow.leadId}-${Date.now()}`;

    await db.insert(tasks).values([{
      taskId,
      agentId: qualifierAgent.id,
      type: "send_notification",
      status: "pending",
      input: {
        leadId: lead.id,
        leadName: lead.name,
        leadCompany: lead.company,
        score: Math.round(totalScore),
        source: workflow.source,
        priority: "high",
      },
      createdAt: new Date(),
    }]);
  }

  // 6. Update agent KPIs
  const qualifierKPIs = qualifierAgent.kpis as Record<string, number>;
  const isQualified = totalScore >= scoringModel.qualification_threshold;

  await db
    .update(agents)
    .set({
      kpis: {
        ...qualifierKPIs,
        leads_qualified: (qualifierKPIs.leads_qualified || 0) + (isQualified ? 1 : 0),
        leads_disqualified: (qualifierKPIs.leads_disqualified || 0) + (isQualified ? 0 : 1),
        average_score: ((qualifierKPIs.average_score || 0) * (qualifierKPIs.leads_qualified || 0) + totalScore) /
          ((qualifierKPIs.leads_qualified || 0) + 1),
        high_priority_leads: (qualifierKPIs.high_priority_leads || 0) +
          (totalScore >= scoringModel.high_priority_threshold ? 1 : 0),
      },
    })
    .where(eq(agents.id, qualifierAgent.id));

  console.log(`[LeadQualification] Lead scored: ${Math.round(totalScore)} (${isQualified ? "qualified" : "not qualified"})`);

  return {
    success: true,
    score: Math.round(totalScore),
    qualified: isQualified,
    highPriority: totalScore >= scoringModel.high_priority_threshold,
    agentId: qualifierAgent.agentId,
  };
}

// ============================================================================
// WORKFLOW 4: Demo Scheduling Automation
// ============================================================================

export interface DemoSchedulingWorkflow {
  leadId: number;
  preferredDate?: Date;
  preferredTime?: string;
  timezone?: string;
}

export async function executeDemoSchedulingWorkflow(workflow: DemoSchedulingWorkflow) {
  console.log(`[DemoScheduling] Starting workflow for lead ${workflow.leadId}`);

  // 1. Get Ivy-Scheduler agent
  const schedulerAgentData = await db
    .select()
    .from(agents)
    .where(eq(agents.agentId, "ivy-scheduler-001"))
    .limit(1);

  if (!schedulerAgentData || schedulerAgentData.length === 0) {
    throw new Error("Ivy-Scheduler agent not found");
  }

  const schedulerAgent = schedulerAgentData[0];

  // 2. Get lead details
  const leadData = await db
    .select()
    .from(leads)
    .where(eq(leads.id, workflow.leadId))
    .limit(1);

  if (!leadData || leadData.length === 0) {
    throw new Error(`Lead ${workflow.leadId} not found`);
  }

  const lead = leadData[0];

  // 3. Find available slot
  const config = schedulerAgent.configuration as any;
  const availableSlots = findAvailableSlots(config.available_slots, workflow.preferredDate);

  if (availableSlots.length === 0) {
    throw new Error("No available slots found");
  }

  const selectedSlot = availableSlots[0]; // Select first available slot

  // 4. Create demo booking task
  const taskId = `demo-booking-${workflow.leadId}-${Date.now()}`;

  await db.insert(tasks).values([{
    taskId,
    agentId: schedulerAgent.id,
    type: "schedule_demo",
    status: "pending",
    input: {
      leadId: lead.id,
      leadEmail: lead.email,
      leadName: lead.name,
      leadCompany: lead.company,
      demoDate: selectedSlot.date,
      demoTime: selectedSlot.time,
      duration: config.demo_duration,
      timezone: workflow.timezone || "America/New_York",
      calendarPlatform: config.calendar_platform,
    },
    createdAt: new Date(),
  }]);

  // 5. Schedule reminder emails
  for (const reminder of config.reminder_schedule) {
    const reminderTaskId = `demo-reminder-${workflow.leadId}-${reminder.timing}-${Date.now()}`;

    const reminderTime = calculateReminderTime(selectedSlot.date, reminder.timing);

    await db.insert(tasks).values([{
      taskId: reminderTaskId,
      agentId: schedulerAgent.id,
      type: "send_demo_reminder",
      status: "pending",
      input: {
        leadId: lead.id,
        leadEmail: lead.email,
        leadName: lead.name,
        demoDate: selectedSlot.date,
        demoTime: selectedSlot.time,
        reminderType: reminder.type,
        scheduledAt: reminderTime,
      },
      createdAt: new Date(),
    }]);
  }

  // 6. Update agent KPIs
  const schedulerKPIs = schedulerAgent.kpis as Record<string, number>;
  await db
    .update(agents)
    .set({
      kpis: {
        ...schedulerKPIs,
        demos_scheduled: (schedulerKPIs.demos_scheduled || 0) + 1,
      },
    })
    .where(eq(agents.id, schedulerAgent.id));

  console.log(`[DemoScheduling] Demo scheduled for ${selectedSlot.date} at ${selectedSlot.time}`);

  return {
    success: true,
    demoDate: selectedSlot.date,
    demoTime: selectedSlot.time,
    remindersScheduled: config.reminder_schedule.length,
    agentId: schedulerAgent.agentId,
  };
}

function findAvailableSlots(availableSlots: any, preferredDate?: Date): Array<{ date: Date; time: string }> {
  // Simplified slot finding logic
  // In production, this would integrate with actual calendar API
  const slots: Array<{ date: Date; time: string }> = [];

  const startDate = preferredDate || new Date();
  const daysToCheck = 7;

  for (let i = 0; i < daysToCheck; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + i);

    const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const daySlots = availableSlots[dayName];

    if (daySlots) {
      for (const timeRange of daySlots) {
        // Parse time range (e.g., "9am-12pm")
        const [start] = timeRange.split("-");
        slots.push({ date: checkDate, time: start });
      }
    }
  }

  return slots;
}

function calculateReminderTime(demoDate: Date, timing: string): Date {
  const reminderDate = new Date(demoDate);

  if (timing === "24h_before") {
    reminderDate.setHours(reminderDate.getHours() - 24);
  } else if (timing === "1h_before") {
    reminderDate.setHours(reminderDate.getHours() - 1);
  }

  return reminderDate;
}

// ============================================================================
// WORKFLOW ORCHESTRATOR
// ============================================================================

export async function triggerWorkflow(
  workflowType: "email_nurturing" | "linkedin_post" | "lead_qualification" | "demo_scheduling",
  workflowData: any
) {
  console.log(`[WorkflowOrchestrator] Triggering ${workflowType} workflow`);

  try {
    let result;

    switch (workflowType) {
      case "email_nurturing":
        result = await executeEmailNurturingWorkflow(workflowData);
        break;
      case "linkedin_post":
        result = await executeLinkedInPostWorkflow(workflowData);
        break;
      case "lead_qualification":
        result = await executeLeadQualificationWorkflow(workflowData);
        break;
      case "demo_scheduling":
        result = await executeDemoSchedulingWorkflow(workflowData);
        break;
      default:
        throw new Error(`Unknown workflow type: ${workflowType}`);
    }

    console.log(`[WorkflowOrchestrator] ${workflowType} workflow completed successfully`);
    return result;
  } catch (error) {
    console.error(`[WorkflowOrchestrator] ${workflowType} workflow failed:`, error);
    throw error;
  }
}
