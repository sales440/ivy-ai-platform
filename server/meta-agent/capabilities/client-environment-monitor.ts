/**
 * Client Environment Monitor
 * 
 * Monitors each client's business environment in real-time
 * Tracks industry news, competitors, market conditions, and opportunities
 */

import { searchWeb, scrapeWebPage } from './web-search';
import { detectTriggerEvents } from './lead-intelligence';

export interface ClientEnvironment {
    clientId: number;
    clientName: string;
    industry: string;
    lastUpdated: Date;
    industryNews: NewsItem[];
    competitors: CompetitorActivity[];
    marketTrends: MarketTrend[];
    opportunities: Opportunity[];
    threats: Threat[];
}

export interface NewsItem {
    title: string;
    url: string;
    snippet: string;
    date: Date;
    relevance: number;
}

export interface CompetitorActivity {
    competitor: string;
    activity: string;
    type: 'product-launch' | 'pricing-change' | 'funding' | 'partnership' | 'expansion';
    date: Date;
    impact: 'low' | 'medium' | 'high';
}

export interface MarketTrend {
    trend: string;
    direction: 'rising' | 'falling' | 'stable';
    strength: number;
    keywords: string[];
    sources: string[];
}

export interface Opportunity {
    type: 'expansion' | 'partnership' | 'new-market' | 'technology';
    description: string;
    potential: 'low' | 'medium' | 'high';
    actionable: boolean;
}

export interface Threat {
    type: 'competition' | 'regulation' | 'market-shift' | 'technology';
    description: string;
    severity: 'low' | 'medium' | 'high';
    timeframe: 'immediate' | 'short-term' | 'long-term';
}

/**
 * Monitor industry news for a client
 */
export async function monitorIndustryNews(industry: string, clientName: string): Promise<NewsItem[]> {
    console.log(`[Client Monitor] Monitoring ${industry} news for ${clientName}...`);

    const news: NewsItem[] = [];

    try {
        // Search for recent industry news
        const queries = [
            `${industry} news latest`,
            `${industry} trends 2025`,
            `${industry} market update`,
        ];

        for (const query of queries) {
            const results = await searchWeb(query, 5);

            for (const result of results) {
                news.push({
                    title: result.title,
                    url: result.url,
                    snippet: result.snippet,
                    date: new Date(),
                    relevance: calculateNewsRelevance(result.snippet, industry),
                });
            }
        }

        // Sort by relevance
        news.sort((a, b) => b.relevance - a.relevance);

        console.log(`[Client Monitor] Found ${news.length} relevant news items`);
        return news.slice(0, 10); // Top 10
    } catch (error) {
        console.error('[Client Monitor] Error monitoring industry news:', error);
        return [];
    }
}

/**
 * Monitor competitor activity
 */
export async function monitorCompetitors(
    clientName: string,
    competitors: string[]
): Promise<CompetitorActivity[]> {
    console.log(`[Client Monitor] Monitoring ${competitors.length} competitors for ${clientName}...`);

    const activities: CompetitorActivity[] = [];

    try {
        for (const competitor of competitors) {
            // Check for product launches
            const productResults = await searchWeb(`${competitor} new product launch`, 2);
            for (const result of productResults) {
                if (isRecent(result.snippet)) {
                    activities.push({
                        competitor,
                        activity: result.title,
                        type: 'product-launch',
                        date: new Date(),
                        impact: 'high',
                    });
                }
            }

            // Check for pricing changes
            const pricingResults = await searchWeb(`${competitor} pricing new plans`, 2);
            for (const result of pricingResults) {
                if (isRecent(result.snippet)) {
                    activities.push({
                        competitor,
                        activity: result.title,
                        type: 'pricing-change',
                        date: new Date(),
                        impact: 'medium',
                    });
                }
            }

            // Check for funding
            const fundingResults = await searchWeb(`${competitor} funding raised Series`, 2);
            for (const result of fundingResults) {
                if (isRecent(result.snippet)) {
                    activities.push({
                        competitor,
                        activity: result.title,
                        type: 'funding',
                        date: new Date(),
                        impact: 'high',
                    });
                }
            }
        }

        console.log(`[Client Monitor] Found ${activities.length} competitor activities`);
        return activities.sort((a, b) => {
            const impactOrder = { high: 3, medium: 2, low: 1 };
            return impactOrder[b.impact] - impactOrder[a.impact];
        });
    } catch (error) {
        console.error('[Client Monitor] Error monitoring competitors:', error);
        return [];
    }
}

/**
 * Detect market trends
 */
export async function detectMarketTrends(industry: string): Promise<MarketTrend[]> {
    console.log(`[Client Monitor] Detecting market trends for ${industry}...`);

    const trends: MarketTrend[] = [];

    try {
        // Search for trending topics
        const trendQueries = [
            `${industry} trends 2025`,
            `future of ${industry}`,
            `${industry} innovation`,
        ];

        const trendKeywords: Map<string, number> = new Map();

        for (const query of trendQueries) {
            const results = await searchWeb(query, 5);

            for (const result of results) {
                // Extract keywords from title and snippet
                const text = `${result.title} ${result.snippet}`.toLowerCase();
                const words = text.split(/\s+/);

                // Count keyword frequency
                for (const word of words) {
                    if (word.length > 4 && !commonWords.includes(word)) {
                        trendKeywords.set(word, (trendKeywords.get(word) || 0) + 1);
                    }
                }
            }
        }

        // Convert to trends
        const sortedKeywords = Array.from(trendKeywords.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        for (const [keyword, count] of sortedKeywords) {
            trends.push({
                trend: keyword,
                direction: 'rising',
                strength: Math.min(count * 10, 100),
                keywords: [keyword],
                sources: ['Web Search'],
            });
        }

        console.log(`[Client Monitor] Detected ${trends.length} market trends`);
        return trends;
    } catch (error) {
        console.error('[Client Monitor] Error detecting market trends:', error);
        return [];
    }
}

/**
 * Identify opportunities for client
 */
export async function identifyOpportunities(
    clientName: string,
    industry: string
): Promise<Opportunity[]> {
    console.log(`[Client Monitor] Identifying opportunities for ${clientName}...`);

    const opportunities: Opportunity[] = [];

    try {
        // Search for expansion opportunities
        const expansionResults = await searchWeb(`${industry} market expansion opportunities`, 3);
        for (const result of expansionResults) {
            opportunities.push({
                type: 'expansion',
                description: result.snippet,
                potential: 'medium',
                actionable: true,
            });
        }

        // Search for partnership opportunities
        const partnershipResults = await searchWeb(`${industry} partnership opportunities`, 3);
        for (const result of partnershipResults) {
            opportunities.push({
                type: 'partnership',
                description: result.snippet,
                potential: 'medium',
                actionable: true,
            });
        }

        // Search for new market opportunities
        const marketResults = await searchWeb(`emerging ${industry} markets`, 3);
        for (const result of marketResults) {
            opportunities.push({
                type: 'new-market',
                description: result.snippet,
                potential: 'high',
                actionable: false,
            });
        }

        console.log(`[Client Monitor] Identified ${opportunities.length} opportunities`);
        return opportunities;
    } catch (error) {
        console.error('[Client Monitor] Error identifying opportunities:', error);
        return [];
    }
}

/**
 * Identify threats for client
 */
export async function identifyThreats(
    clientName: string,
    industry: string,
    competitors: string[]
): Promise<Threat[]> {
    console.log(`[Client Monitor] Identifying threats for ${clientName}...`);

    const threats: Threat[] = [];

    try {
        // Check competitor threats
        const competitorActivities = await monitorCompetitors(clientName, competitors);
        for (const activity of competitorActivities) {
            if (activity.impact === 'high') {
                threats.push({
                    type: 'competition',
                    description: `${activity.competitor}: ${activity.activity}`,
                    severity: 'high',
                    timeframe: 'immediate',
                });
            }
        }

        // Check for regulatory threats
        const regulationResults = await searchWeb(`${industry} new regulations 2025`, 3);
        for (const result of regulationResults) {
            threats.push({
                type: 'regulation',
                description: result.snippet,
                severity: 'medium',
                timeframe: 'short-term',
            });
        }

        // Check for market shifts
        const marketResults = await searchWeb(`${industry} market disruption`, 3);
        for (const result of marketResults) {
            threats.push({
                type: 'market-shift',
                description: result.snippet,
                severity: 'medium',
                timeframe: 'long-term',
            });
        }

        console.log(`[Client Monitor] Identified ${threats.length} threats`);
        return threats.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity] - severityOrder[a.severity];
        });
    } catch (error) {
        console.error('[Client Monitor] Error identifying threats:', error);
        return [];
    }
}

/**
 * Get complete environment snapshot for a client
 */
export async function getClientEnvironment(
    clientId: number,
    clientName: string,
    industry: string,
    competitors: string[]
): Promise<ClientEnvironment> {
    console.log(`[Client Monitor] Getting complete environment for ${clientName}...`);

    const [news, competitorActivities, trends, opportunities, threats] = await Promise.all([
        monitorIndustryNews(industry, clientName),
        monitorCompetitors(clientName, competitors),
        detectMarketTrends(industry),
        identifyOpportunities(clientName, industry),
        identifyThreats(clientName, industry, competitors),
    ]);

    return {
        clientId,
        clientName,
        industry,
        lastUpdated: new Date(),
        industryNews: news,
        competitors: competitorActivities,
        marketTrends: trends,
        opportunities,
        threats,
    };
}

// Helper functions

function calculateNewsRelevance(snippet: string, industry: string): number {
    let relevance = 50;

    // Check if industry is mentioned
    if (snippet.toLowerCase().includes(industry.toLowerCase())) {
        relevance += 20;
    }

    // Check for important keywords
    const importantKeywords = ['breakthrough', 'innovation', 'growth', 'market', 'trend'];
    for (const keyword of importantKeywords) {
        if (snippet.toLowerCase().includes(keyword)) {
            relevance += 5;
        }
    }

    return Math.min(relevance, 100);
}

function isRecent(text: string): boolean {
    // Simple check for recent time indicators
    const recentIndicators = ['today', 'yesterday', 'this week', 'recently', 'just', 'new', 'latest'];
    return recentIndicators.some(indicator => text.toLowerCase().includes(indicator));
}

const commonWords = [
    'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'been',
    'will', 'your', 'more', 'about', 'their', 'which', 'there', 'would'
];

export const clientEnvironmentMonitor = {
    monitorIndustryNews,
    monitorCompetitors,
    detectMarketTrends,
    identifyOpportunities,
    identifyThreats,
    getClientEnvironment,
};
