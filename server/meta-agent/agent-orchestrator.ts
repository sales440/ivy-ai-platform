/**
 * Agent Orchestrator
 * 
 * Manages delegation of campaigns to specialized agents with proper isolation
 * and scheduling to prevent conflicts between client campaigns.
 */

import { getDb } from '../db';
import { scheduledTasks } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

interface AgentTask {
    agentType: 'IVY-PROSPECT' | 'IVY-QUALIFY' | 'IVY-ENGAGE' | 'IVY-SCHEDULE' | 'IVY-SUPPORT';
    clientId: number;
    taskData: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    scheduledFor: Date;
}

export class AgentOrchestrator {
    /**
     * Delegates a task to a specialized agent with client isolation
     */
    async delegateTask(task: AgentTask): Promise<void> {
        console.log(`[Agent Orchestrator] Delegating ${task.agentType} task for client ${task.clientId}`);

        const db = await getDb();
        if (!db) {
            console.error('[Agent Orchestrator] Database not available');
            return;
        }

        // Create scheduled task with client isolation
        await db.insert(scheduledTasks).values({
            companyId: task.clientId,
            taskType: 'custom',
            taskData: {
                agentType: task.agentType,
                clientId: task.clientId,
                ...task.taskData,
            },
            status: 'pending',
            scheduledFor: task.scheduledFor,
            createdBy: task.clientId,
            retryCount: 0,
            maxRetries: 3,
        });

        console.log(`[Agent Orchestrator] Task scheduled for ${task.scheduledFor.toISOString()}`);
    }

    /**
     * Creates a complete campaign workflow for a client
     */
    async createCampaignWorkflow(clientId: number, industry: string): Promise<void> {
        console.log(`[Agent Orchestrator] Creating campaign workflow for client ${clientId} (${industry})`);

        const now = new Date();

        // Step 1: Lead Generation (IVY-PROSPECT) - Start immediately
        await this.delegateTask({
            agentType: 'IVY-PROSPECT',
            clientId,
            taskData: {
                action: 'generate-leads',
                industry,
                targetCount: 50,
            },
            priority: 'high',
            scheduledFor: now,
        });

        // Step 2: Lead Qualification (IVY-QUALIFY) - 1 hour after lead generation
        const qualifyTime = new Date(now.getTime() + 60 * 60 * 1000);
        await this.delegateTask({
            agentType: 'IVY-QUALIFY',
            clientId,
            taskData: {
                action: 'score-leads',
                industry,
            },
            priority: 'high',
            scheduledFor: qualifyTime,
        });

        // Step 3: Email Engagement (IVY-ENGAGE) - 2 hours after qualification
        const engageTime = new Date(qualifyTime.getTime() + 2 * 60 * 60 * 1000);
        await this.delegateTask({
            agentType: 'IVY-ENGAGE',
            clientId,
            taskData: {
                action: 'send-campaign-email',
                emailNumber: 1,
                industry,
            },
            priority: 'medium',
            scheduledFor: engageTime,
        });

        // Step 4: Follow-up Email 2 - 3 days later
        const followUp1Time = new Date(engageTime.getTime() + 3 * 24 * 60 * 60 * 1000);
        await this.delegateTask({
            agentType: 'IVY-ENGAGE',
            clientId,
            taskData: {
                action: 'send-campaign-email',
                emailNumber: 2,
                industry,
            },
            priority: 'medium',
            scheduledFor: followUp1Time,
        });

        // Step 5: Follow-up Email 3 - 7 days after first email
        const followUp2Time = new Date(engageTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        await this.delegateTask({
            agentType: 'IVY-ENGAGE',
            clientId,
            taskData: {
                action: 'send-campaign-email',
                emailNumber: 3,
                industry,
            },
            priority: 'medium',
            scheduledFor: followUp2Time,
        });

        console.log(`[Agent Orchestrator] Campaign workflow created with 5 tasks`);
    }

    /**
     * Monitors agent performance and reallocates if needed
     */
    async monitorAgentPerformance(): Promise<void> {
        console.log('[Agent Orchestrator] Monitoring agent performance...');

        const db = await getDb();
        if (!db) {
            console.error('[Agent Orchestrator] Database not available');
            return;
        }

        // Get failed tasks
        const failedTasks = await db.query.scheduledTasks.findMany({
            where: (tasks: any, { eq }: any) => eq(tasks.status, 'failed'),
            limit: 10,
        });

        if (failedTasks.length > 0) {
            console.log(`[Agent Orchestrator] Found ${failedTasks.length} failed tasks`);

            // Retry failed tasks with increased priority
            for (const task of failedTasks) {
                if (task.retryCount < task.maxRetries) {
                    console.log(`[Agent Orchestrator] Retrying task ${task.id} (attempt ${task.retryCount + 1}/${task.maxRetries})`);

                    // Reschedule for 30 minutes from now
                    const retryTime = new Date(Date.now() + 30 * 60 * 1000);

                    await db.update(scheduledTasks)
                        .set({
                            status: 'pending',
                            scheduledFor: retryTime,
                            retryCount: task.retryCount + 1,
                        })
                        .where(eq(scheduledTasks.id, task.id));
                } else {
                    console.log(`[Agent Orchestrator] Task ${task.id} exceeded max retries, marking as cancelled`);

                    await db.update(scheduledTasks)
                        .set({ status: 'cancelled' })
                        .where(eq(scheduledTasks.id, task.id));
                }
            }
        }
    }

    /**
     * Gets campaign status for a specific client
     */
    async getCampaignStatus(clientId: number): Promise<any> {
        const db = await getDb();
        if (!db) {
            console.error('[Agent Orchestrator] Database not available');
            return { clientId, stats: {}, recentTasks: [] };
        }

        const tasks = await db.query.scheduledTasks.findMany({
            where: (t: any, { eq }: any) => eq(t.companyId, clientId),
            orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
            limit: 20,
        });

        const stats = {
            total: tasks.length,
            pending: tasks.filter((t: any) => t.status === 'pending').length,
            processing: tasks.filter((t: any) => t.status === 'processing').length,
            completed: tasks.filter((t: any) => t.status === 'completed').length,
            failed: tasks.filter((t: any) => t.status === 'failed').length,
            cancelled: tasks.filter((t: any) => t.status === 'cancelled').length,
        };

        return {
            clientId,
            stats,
            recentTasks: tasks.slice(0, 5).map((t: any) => ({
                id: t.id,
                type: (t.taskData as any)?.agentType || 'unknown',
                status: t.status,
                scheduledFor: t.scheduledFor,
                executedAt: t.executedAt,
            })),
        };
    }
}

export const agentOrchestrator = new AgentOrchestrator();
