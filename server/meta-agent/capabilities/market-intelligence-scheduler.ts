/**
 * Market Intelligence Scheduler
 * 
 * Automatic scheduler that runs Market Intelligence cycles every 24-48 hours
 * to keep all agents (Prospect, Closer, Solve, Logic, Talent, Insight, IvyCall)
 * continuously trained with fresh market data, trends, and best practices.
 */

import { runMarketIntelligenceCycle } from './market-intelligence';
import { trainIvyCall } from './ivycall-trainer';
import { getDb } from '../../db';
import { eq } from 'drizzle-orm';
import { agents } from '../../../drizzle/schema';

export interface SchedulerConfig {
  enabled: boolean;
  intervalHours: number; // 24 or 48
  industries: string[];
  competitorUrls: string[];
  keywords: string[];
  trainIvyCallEnabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

let schedulerInterval: NodeJS.Timeout | null = null;
let currentConfig: SchedulerConfig = {
  enabled: false,
  intervalHours: 24,
  industries: [],
  competitorUrls: [],
  keywords: [],
  trainIvyCallEnabled: true
};

/**
 * Start the Market Intelligence scheduler
 */
export async function startMarketIntelligenceScheduler(config: Partial<SchedulerConfig>): Promise<void> {
  // Update configuration
  currentConfig = {
    ...currentConfig,
    ...config,
    enabled: true,
    lastRun: new Date()
  };

  // Calculate next run time
  const nextRunTime = new Date();
  nextRunTime.setHours(nextRunTime.getHours() + currentConfig.intervalHours);
  currentConfig.nextRun = nextRunTime;

  console.log('[Market Intelligence Scheduler] Starting scheduler with config:', {
    intervalHours: currentConfig.intervalHours,
    industries: currentConfig.industries,
    competitorUrls: currentConfig.competitorUrls.length,
    keywords: currentConfig.keywords.length,
    nextRun: currentConfig.nextRun
  });

  // Stop existing scheduler if running
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  // Run immediately on start
  await runMarketIntelligenceCycleTask();

  // Schedule recurring runs
  const intervalMs = currentConfig.intervalHours * 60 * 60 * 1000;
  schedulerInterval = setInterval(async () => {
    await runMarketIntelligenceCycleTask();
  }, intervalMs);

  console.log(`[Market Intelligence Scheduler] Scheduler started. Next run in ${currentConfig.intervalHours} hours`);
}

/**
 * Stop the Market Intelligence scheduler
 */
export function stopMarketIntelligenceScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    currentConfig.enabled = false;
    console.log('[Market Intelligence Scheduler] Scheduler stopped');
  }
}

/**
 * Get current scheduler status
 */
export function getSchedulerStatus(): SchedulerConfig {
  return { ...currentConfig };
}

/**
 * Update scheduler configuration
 */
export async function updateSchedulerConfig(config: Partial<SchedulerConfig>): Promise<void> {
  const wasEnabled = currentConfig.enabled;
  
  currentConfig = {
    ...currentConfig,
    ...config
  };

  // Restart scheduler if it was running
  if (wasEnabled && currentConfig.enabled) {
    await startMarketIntelligenceScheduler(currentConfig);
  }
}

/**
 * Execute Market Intelligence cycle task
 */
async function runMarketIntelligenceCycleTask(): Promise<void> {
  try {
    console.log('[Market Intelligence Scheduler] Starting scheduled cycle...');
    
    currentConfig.lastRun = new Date();

    // Get active client industries from database
    const db = await getDb();
    const clientIndustries = currentConfig.industries.length > 0 
      ? currentConfig.industries 
      : await getActiveClientIndustries(db);

    console.log(`[Market Intelligence Scheduler] Processing ${clientIndustries.length} industries`);

    // Run Market Intelligence cycle for each industry
    for (const industry of clientIndustries) {
      try {
        console.log(`[Market Intelligence Scheduler] Running cycle for industry: ${industry}`);
        
        await runMarketIntelligenceCycle({
          industry,
          keywords: currentConfig.keywords.length > 0 
            ? currentConfig.keywords 
            : ['trends', 'innovations', 'best practices', 'market analysis'],
          competitorUrls: currentConfig.competitorUrls
        });

        // Train IvyCall specifically for this industry if enabled
        if (currentConfig.trainIvyCallEnabled) {
          console.log(`[Market Intelligence Scheduler] Training IvyCall for ${industry}`);
          await trainIvyCall({
            industry,
            objectives: ['prospecting', 'qualification', 'follow-up', 'closing']
          });
        }

        // Add delay between industries to avoid rate limiting
        await sleep(5000);
      } catch (error) {
        console.error(`[Market Intelligence Scheduler] Error processing industry ${industry}:`, error);
      }
    }

    // Calculate next run time
    const nextRunTime = new Date();
    nextRunTime.setHours(nextRunTime.getHours() + currentConfig.intervalHours);
    currentConfig.nextRun = nextRunTime;

    console.log(`[Market Intelligence Scheduler] Cycle completed. Next run: ${currentConfig.nextRun}`);
  } catch (error) {
    console.error('[Market Intelligence Scheduler] Error in scheduled task:', error);
  }
}

/**
 * Get active client industries from database
 */
async function getActiveClientIndustries(db: any): Promise<string[]> {
  if (!db) return ['technology', 'saas', 'b2b']; // Default industries

  try {
    // Get unique industries from active agents
    const activeAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.status, 'active'));

    // Extract unique industries (assuming agents have industry metadata)
    const industries = new Set<string>();
    for (const agent of activeAgents) {
      if (agent.metadata && typeof agent.metadata === 'object') {
        const metadata = agent.metadata as any;
        if (metadata.industry) {
          industries.add(metadata.industry);
        }
      }
    }

    return industries.size > 0 
      ? Array.from(industries) 
      : ['technology', 'saas', 'b2b']; // Fallback defaults
  } catch (error) {
    console.error('[Market Intelligence Scheduler] Error fetching industries:', error);
    return ['technology', 'saas', 'b2b'];
  }
}

/**
 * Utility: Sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Manual trigger of Market Intelligence cycle
 */
export async function triggerMarketIntelligenceCycle(options?: {
  industry?: string;
  keywords?: string[];
  competitorUrls?: string[];
}): Promise<void> {
  console.log('[Market Intelligence Scheduler] Manual trigger requested');
  
  const industry = options?.industry || currentConfig.industries[0] || 'technology';
  const keywords = options?.keywords || currentConfig.keywords;
  const competitorUrls = options?.competitorUrls || currentConfig.competitorUrls;

  await runMarketIntelligenceCycle({
    industry,
    keywords,
    competitorUrls
  });

  if (currentConfig.trainIvyCallEnabled) {
    await trainIvyCall({
      industry,
      objectives: ['prospecting', 'qualification', 'follow-up', 'closing']
    });
  }

  console.log('[Market Intelligence Scheduler] Manual cycle completed');
}

/**
 * Get scheduler statistics
 */
export function getSchedulerStats(): {
  enabled: boolean;
  intervalHours: number;
  lastRun: Date | undefined;
  nextRun: Date | undefined;
  industriesMonitored: number;
  competitorsMonitored: number;
  keywordsTracked: number;
} {
  return {
    enabled: currentConfig.enabled,
    intervalHours: currentConfig.intervalHours,
    lastRun: currentConfig.lastRun,
    nextRun: currentConfig.nextRun,
    industriesMonitored: currentConfig.industries.length,
    competitorsMonitored: currentConfig.competitorUrls.length,
    keywordsTracked: currentConfig.keywords.length
  };
}
