/**
 * Campaign Generator
 * 
 * Automatically generates and manages campaigns for clients based on their industry
 */

import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { agentOrchestrator } from './agent-orchestrator';
import { getCampaignTemplate } from './campaign-templates';
import { eq, and, or } from 'drizzle-orm';

// Optional intelligence modules - gracefully handle if they fail to load
let leadIntelligence: any = null;
let clientEnvironmentMonitor: any = null;
let campaignOptimizer: any = null;

try {
    const leadIntelligenceModule = require('./capabilities/lead-intelligence');
    leadIntelligence = leadIntelligenceModule.leadIntelligence;
} catch (error) {
    console.warn('[Campaign Generator] Lead intelligence module not available:', error);
}

try {
    const clientMonitorModule = require('./capabilities/client-environment-monitor');
    clientEnvironmentMonitor = clientMonitorModule.clientEnvironmentMonitor;
} catch (error) {
    console.warn('[Campaign Generator] Client environment monitor not available:', error);
}

try {
    const optimizerModule = require('./capabilities/campaign-optimizer');
    campaignOptimizer = optimizerModule.campaignOptimizer;
} catch (error) {
    console.warn('[Campaign Generator] Campaign optimizer not available:', error);
}

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
     * Generates a complete campaign for a specific client with real-time intelligence
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

        // Check if intelligence modules are available
        const intelligenceAvailable = leadIntelligence && clientEnvironmentMonitor && campaignOptimizer;

        if (intelligenceAvailable) {
            console.log(`[Campaign Generator] ✅ Intelligence modules available - using advanced features`);

            try {
                // ========== REAL-TIME INTELLIGENCE ==========

                // 1. Monitor client's business environment
                console.log(`[Campaign Generator] 📊 Monitoring ${client.name}'s business environment...`);
                const competitors = this.getCompetitors(client.industry);
                const environment = await clientEnvironmentMonitor.getClientEnvironment(
                    client.userId,
                    client.name,
                    client.industry,
                    competitors
                );

                console.log(`[Campaign Generator] Found ${environment.industryNews.length} news items, ${environment.competitors.length} competitor activities, ${environment.marketTrends.length} trends`);

                // 2. Optimize campaign based on market data
                console.log(`[Campaign Generator] 🎯 Optimizing campaign with real-time data...`);
                const optimizationResult = await campaignOptimizer.optimizeCampaign(template, environment);

                console.log(`[Campaign Generator] Made ${optimizationResult.changes.length} optimizations:`); \n                for (const change of optimizationResult.changes) {
                    console.log(`  - ${change.type}: ${change.description}`);
                }

                // 3. Generate intelligent leads
                console.log(`[Campaign Generator] 🔍 Generating intelligent leads...`);
                const leads = await leadIntelligence.generateIntelligentLeads({
                    industry: client.industry,
                    targetAudience: template.targetAudience,
                    count: 50,
                    useRealTimeData: true,
                });

                console.log(`[Campaign Generator] Generated ${leads.length} qualified leads (avg score: ${this.calculateAverageScore(leads)})`);

                // 4. Detect trigger events
                console.log(`[Campaign Generator] ⚡ Detecting trigger events...`);
                const triggerEvents = await leadIntelligence.detectTriggerEvents(client.name);

                if (triggerEvents.length > 0) {
                    console.log(`[Campaign Generator] Found ${triggerEvents.length} trigger events:`); \n                    for (const event of triggerEvents.slice(0, 3)) {
                        console.log(`  - ${event.type}: ${event.description.substring(0, 100)}...`);
                    }
                }

                // 5. Create optimized campaign workflow
                console.log(`[Campaign Generator] 📅 Creating optimized campaign workflow...`);
                await agentOrchestrator.createCampaignWorkflow(
                    client.userId,
                    client.industry
                );

                // 6. Log intelligence summary
                console.log(`\n[Campaign Generator] ✅ INTELLIGENT CAMPAIGN CREATED FOR ${client.name.toUpperCase()}`);
                console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.log(`📊 Market Intelligence:`);
                console.log(`   - ${environment.industryNews.length} industry news items tracked`);
                console.log(`   - ${environment.competitors.length} competitor activities monitored`);
                console.log(`   - ${environment.marketTrends.length} market trends detected`);
                console.log(`   - ${environment.opportunities.length} opportunities identified`);
                console.log(`   - ${environment.threats.length} threats flagged`);
                console.log(`\n🎯 Campaign Optimization:`);
                console.log(`   - ${optimizationResult.changes.length} optimizations applied`);
                console.log(`   - Expected improvement: ${optimizationResult.expectedImprovement}%`);
                console.log(`\n🔍 Lead Intelligence:`);
                console.log(`   - ${leads.length} qualified leads generated`);
                console.log(`   - Average lead score: ${this.calculateAverageScore(leads)}/100`);
                console.log(`   - ${triggerEvents.length} trigger events detected`);
                console.log(`\n📧 Campaign Details:`);
                console.log(`   - ${optimizationResult.optimizedTemplate.emails.length} emails in sequence`);
                console.log(`   - Target audience: ${template.targetAudience}`);
                console.log(`   - Lead sources: ${template.leadSources.join(', ')}`);
                console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
            } catch (intelligenceError: any) {
                console.error(`[Campaign Generator] ⚠️  Intelligence features failed:`, intelligenceError.message);
                console.log(`[Campaign Generator] Falling back to basic campaign creation...`);

                // Fallback to basic campaign
                await agentOrchestrator.createCampaignWorkflow(client.userId, client.industry);
                console.log(`[Campaign Generator] ✅ Basic campaign created for ${client.name}`);
            }
        } else {
            // Intelligence modules not available - use basic campaign creation
            console.log(`[Campaign Generator] ⚠️  Intelligence modules not available - using basic campaign creation`);
            console.log(`[Campaign Generator] ${template.emails.length} emails in sequence`);

            // Create basic campaign workflow
            await agentOrchestrator.createCampaignWorkflow(client.userId, client.industry);

            console.log(`[Campaign Generator] ✅ Basic campaign created for ${client.name}`);
        }
    }
}

    /**
     * Get competitors for an industry
     */
    private getCompetitors(industry: string): string[] {
    const competitorMap: Record<string, string[]> = {
        'saas': ['Intercom', 'Drift', 'HubSpot', 'Salesforce', 'Zendesk'],
        'manufacturing': ['Siemens', 'ABB', 'Schneider Electric', 'Rockwell Automation'],
        'pet-services': ['Rover', 'Wag', 'Chewy', 'PetSmart', 'Petco'],
    };

    return competitorMap[industry] || [];
}

    /**
     * Calculate average lead score
     */
    private calculateAverageScore(leads: any[]): number {
    if (leads.length === 0) return 0;
    const total = leads.reduce((sum, lead) => sum + (lead.score || 0), 0);
    return Math.round(total / leads.length);
}

    /**
     * Optimizes existing campaigns based on performance
     */
    async optimizeCampaigns(): Promise < void> {
    console.log('[Campaign Generator] Optimizing campaigns...');

    const db = await getDb();
    if(!db) {
        console.error('[Campaign Generator] Database not available');
        return;
    }

        const allUsers = await db.query.users.findMany({
        where: (u: any, { eq }: any) => eq(u.role, 'admin'),
    });

    for(const user of allUsers) {
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
    async getCampaignSummary(): Promise < any > {
    const db = await getDb();
    if(!db) {
        console.error('[Campaign Generator] Database not available');
        return { totalClients: 0, clients: [] };
    }

        const allUsers = await db.query.users.findMany({
        where: (u: any, { eq }: any) => eq(u.role, 'admin'),
    });

    const summary = [];

    for(const user of allUsers) {
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
