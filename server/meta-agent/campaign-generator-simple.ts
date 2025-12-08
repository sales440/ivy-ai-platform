/**
 * Simplified Campaign Generator - Production Ready
 * 
 * This version works WITHOUT intelligence modules to ensure it runs in production
 */

import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { agentOrchestrator } from './agent-orchestrator';
import { getCampaignTemplate } from './campaign-templates';
import { eq, and, or } from 'drizzle-orm';

interface ClientProfile {
    userId: number;
    name: string;
    email: string;
    industry: string;
    hasCampaign: boolean;
}

export class CampaignGenerator {
    /**
     * Detects clients without campaigns
     */
    async detectNewClients(): Promise<ClientProfile[]> {
        console.log('[Campaign Generator] Detecting clients without campaigns...');

        const db = await getDb();
        if (!db) {
            console.error('[Campaign Generator] Database not available');
            return [];
        }

        const allUsers = await db.query.users.findMany({
            where: (u: any, { eq }: any) => eq(u.role, 'admin'),
        });

        const clientProfiles: ClientProfile[] = [];

        for (const user of allUsers) {
            // Determine industry based on user name/email
            const industry = this.detectIndustry(user.name || '', user.email);

            // Check if client has active campaigns
            const hasCampaign = await this.hasActiveCampaign(user.id);

            clientProfiles.push({
                userId: user.id,
                name: user.name || 'Unknown',
                email: user.email,
                industry,
                hasCampaign,
            });
        }

        const newClients = clientProfiles.filter(c => !c.hasCampaign);

        console.log(`[Campaign Generator] Found ${newClients.length} clients without campaigns`);

        return newClients;
    }

    /**
     * Detects industry from client name/email
     */
    private detectIndustry(name: string, email: string): string {
        const text = `${name} ${email}`.toLowerCase();

        if (text.includes('ivy') || text.includes('ai') || text.includes('platform')) {
            return 'saas';
        }

        if (text.includes('fagor') || text.includes('automation') || text.includes('manufacturing')) {
            return 'manufacturing';
        }

        if (text.includes('pet') || text.includes('life') || text.includes('360')) {
            return 'pet-services';
        }

        return 'other';
    }

    /**
     * Checks if client has active campaigns
     */
    private async hasActiveCampaign(userId: number): Promise<boolean> {
        const db = await getDb();
        if (!db) return false;

        const tasks = await db.query.scheduledTasks.findMany({
            where: (t: any, { eq, and, or }: any) =>
                and(
                    eq(t.companyId, userId),
                    or(
                        eq(t.status, 'pending'),
                        eq(t.status, 'processing')
                    )
                ),
            limit: 1,
        });

        return tasks.length > 0;
    }

    /**
     * Generates campaigns for new clients
     */
    async generateCampaignsForNewClients(): Promise<void> {
        console.log('[Campaign Generator] Starting campaign generation...');

        const newClients = await this.detectNewClients();

        if (newClients.length === 0) {
            console.log('[Campaign Generator] No new clients found');
            return;
        }

        for (const client of newClients) {
            await this.generateCampaignForClient(client);
        }

        console.log(`[Campaign Generator] Generated campaigns for ${newClients.length} clients`);
    }

    /**
     * Generates a complete campaign for a specific client
     */
    async generateCampaignForClient(client: ClientProfile): Promise<void> {
        console.log(`[Campaign Generator] 🚀 Generating campaign for ${client.name} (${client.industry})...`);

        const template = getCampaignTemplate(client.industry);

        if (!template) {
            console.log(`[Campaign Generator] No template found for industry: ${client.industry}`);
            return;
        }

        console.log(`[Campaign Generator] Using ${template.industry} template`);
        console.log(`[Campaign Generator] Target audience: ${template.targetAudience}`);
        console.log(`[Campaign Generator] ${template.emails.length} emails in sequence`);

        // Create campaign workflow using agent orchestrator
        await agentOrchestrator.createCampaignWorkflow(client.userId, client.industry);

        console.log(`[Campaign Generator] ✅ Campaign created for ${client.name}`);
        console.log(`[Campaign Generator] 📧 Campaign Details:`);
        console.log(`   - ${template.emails.length} emails scheduled`);
        console.log(`   - Target: ${template.targetAudience}`);
        console.log(`   - Lead sources: ${template.leadSources.join(', ')}`);
    }

    /**
     * Optimizes existing campaigns based on performance
     */
    async optimizeCampaigns(): Promise<void> {
        console.log('[Campaign Generator] Optimizing campaigns...');

        const db = await getDb();
        if (!db) {
            console.error('[Campaign Generator] Database not available');
            return;
        }

        const allUsers = await db.query.users.findMany({
            where: (u: any, { eq }: any) => eq(u.role, 'admin'),
        });

        for (const user of allUsers) {
            const status = await agentOrchestrator.getCampaignStatus(user.id);

            if (status.stats.failed > 3) {
                console.log(`[Campaign Generator] ⚠️  Client ${user.id} has ${status.stats.failed} failed tasks`);
                console.log(`[Campaign Generator] Triggering agent performance monitoring...`);

                await agentOrchestrator.monitorAgentPerformance();
            }

            if (status.stats.completed > 10) {
                console.log(`[Campaign Generator] ✅ Client ${user.id} campaign performing well (${status.stats.completed} completed tasks)`);
            }
        }

        console.log('[Campaign Generator] Campaign optimization complete');
    }

    /**
     * Gets campaign summary for all clients
     */
    async getCampaignSummary(): Promise<any> {
        const db = await getDb();
        if (!db) {
            console.error('[Campaign Generator] Database not available');
            return { totalClients: 0, clients: [] };
        }

        const allUsers = await db.query.users.findMany({
            where: (u: any, { eq }: any) => eq(u.role, 'admin'),
        });

        const summary = [];

        for (const user of allUsers) {
            const industry = this.detectIndustry(user.name || '', user.email);
            const status = await agentOrchestrator.getCampaignStatus(user.id);

            summary.push({
                clientId: user.id,
                clientName: user.name,
                industry,
                campaignStatus: status,
            });
        }

        return {
            totalClients: summary.length,
            clients: summary,
        };
    }
}

export const campaignGenerator = new CampaignGenerator();
