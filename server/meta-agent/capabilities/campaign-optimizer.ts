/**
 * Campaign Optimizer
 * 
 * Auto-optimizes campaigns based on real-time market data and performance metrics
 */

import { searchWeb } from './web-search';
import { CampaignTemplate, EmailTemplate } from '../campaign-templates';
import { ClientEnvironment } from './client-environment-monitor';

export interface OptimizationResult {
    originalTemplate: CampaignTemplate;
    optimizedTemplate: CampaignTemplate;
    changes: OptimizationChange[];
    expectedImprovement: number;
}

export interface OptimizationChange {
    type: 'messaging' | 'timing' | 'audience' | 'content';
    description: string;
    reason: string;
}

/**
 * Optimize campaign based on market data
 */
export async function optimizeCampaign(
    template: CampaignTemplate,
    environment: ClientEnvironment
): Promise<OptimizationResult> {
    console.log(`[Campaign Optimizer] Optimizing campaign for ${template.industry}...`);

    const optimizedTemplate = { ...template };
    const changes: OptimizationChange[] = [];

    // 1. Adjust messaging based on competitor activity
    if (environment.competitors.length > 0) {
        const highImpactActivities = environment.competitors.filter(c => c.impact === 'high');

        if (highImpactActivities.length > 0) {
            // Add differentiation messaging
            optimizedTemplate.emails = optimizedTemplate.emails.map(email => ({
                ...email,
                body: addDifferentiationMessaging(email.body, highImpactActivities[0]),
            }));

            changes.push({
                type: 'messaging',
                description: 'Added competitive differentiation',
                reason: `Competitor ${highImpactActivities[0].competitor} recently: ${highImpactActivities[0].activity}`,
            });
        }
    }

    // 2. Incorporate trending keywords
    if (environment.marketTrends.length > 0) {
        const topTrends = environment.marketTrends.slice(0, 3);

        optimizedTemplate.emails = optimizedTemplate.emails.map(email => ({
            ...email,
            subject: incorporateTrendKeywords(email.subject, topTrends.map(t => t.trend)),
            body: incorporateTrendKeywords(email.body, topTrends.map(t => t.trend)),
        }));

        changes.push({
            type: 'content',
            description: 'Incorporated trending keywords',
            reason: `Top trends: ${topTrends.map(t => t.trend).join(', ')}`,
        });
    }

    // 3. Adjust timing based on industry news
    if (environment.industryNews.length > 0) {
        const urgentNews = environment.industryNews.filter(n => n.relevance > 80);

        if (urgentNews.length > 0) {
            // Accelerate campaign timing
            optimizedTemplate.emails = optimizedTemplate.emails.map(email => ({
                ...email,
                dayOffset: Math.max(0, email.dayOffset - 1), // Send 1 day earlier
            }));

            changes.push({
                type: 'timing',
                description: 'Accelerated campaign timing',
                reason: `Urgent industry news: ${urgentNews[0].title}`,
            });
        }
    }

    // 4. Highlight opportunities
    if (environment.opportunities.length > 0) {
        const actionableOpps = environment.opportunities.filter(o => o.actionable && o.potential === 'high');

        if (actionableOpps.length > 0) {
            // Add opportunity messaging to first email
            optimizedTemplate.emails[0].body = addOpportunityMessaging(
                optimizedTemplate.emails[0].body,
                actionableOpps[0]
            );

            changes.push({
                type: 'content',
                description: 'Added opportunity messaging',
                reason: `Identified opportunity: ${actionableOpps[0].description.substring(0, 100)}`,
            });
        }
    }

    // Calculate expected improvement
    const expectedImprovement = calculateExpectedImprovement(changes);

    console.log(`[Campaign Optimizer] Made ${changes.length} optimizations, expected improvement: ${expectedImprovement}%`);

    return {
        originalTemplate: template,
        optimizedTemplate,
        changes,
        expectedImprovement,
    };
}

/**
 * Personalize campaign for specific company
 */
export async function personalizeCampaign(
    template: CampaignTemplate,
    companyName: string,
    companyIndustry: string
): Promise<CampaignTemplate> {
    console.log(`[Campaign Optimizer] Personalizing campaign for ${companyName}...`);

    const personalizedTemplate = { ...template };

    try {
        // Research company
        const companyResults = await searchWeb(`${companyName} ${companyIndustry}`, 3);

        if (companyResults.length > 0) {
            const companyInfo = companyResults[0].snippet;

            // Personalize each email
            personalizedTemplate.emails = personalizedTemplate.emails.map(email => ({
                ...email,
                subject: email.subject.replace('{{company}}', companyName),
                body: personalizeEmailBody(email.body, companyName, companyInfo),
            }));
        }

        return personalizedTemplate;
    } catch (error) {
        console.error('[Campaign Optimizer] Error personalizing campaign:', error);
        return template;
    }
}

/**
 * A/B test email variations
 */
export async function generateEmailVariations(
    email: EmailTemplate,
    count: number = 3
): Promise<EmailTemplate[]> {
    console.log(`[Campaign Optimizer] Generating ${count} email variations...`);

    const variations: EmailTemplate[] = [email]; // Include original

    // Generate subject line variations
    const subjectVariations = [
        email.subject,
        makeSubjectMoreUrgent(email.subject),
        makeSubjectMorePersonal(email.subject),
        makeSubjectQuestionBased(email.subject),
    ];

    // Create variations
    for (let i = 1; i < count; i++) {
        variations.push({
            ...email,
            number: email.number + i * 0.1, // e.g., 1.1, 1.2
            subject: subjectVariations[i % subjectVariations.length],
        });
    }

    return variations;
}

/**
 * Determine optimal send time based on industry
 */
export function getOptimalSendTime(industry: string, timezone: string = 'America/New_York'): {
    hour: number;
    dayOfWeek: number;
} {
    // Industry-specific optimal times (based on research)
    const optimalTimes: Record<string, { hour: number; dayOfWeek: number }> = {
        'saas': { hour: 10, dayOfWeek: 2 }, // Tuesday 10am
        'manufacturing': { hour: 8, dayOfWeek: 3 }, // Wednesday 8am
        'pet-services': { hour: 14, dayOfWeek: 6 }, // Saturday 2pm
        'default': { hour: 10, dayOfWeek: 2 }, // Tuesday 10am
    };

    return optimalTimes[industry] || optimalTimes['default'];
}

// Helper functions

function addDifferentiationMessaging(body: string, competitorActivity: any): string {
    const differentiation = `\n\n**Unlike ${competitorActivity.competitor}**, we offer:\n- Proven ROI with real case studies\n- 24/7 support and dedicated account manager\n- No long-term contracts required\n`;

    // Insert before CTA
    const ctaIndex = body.lastIndexOf('\n\n');
    if (ctaIndex > -1) {
        return body.substring(0, ctaIndex) + differentiation + body.substring(ctaIndex);
    }

    return body + differentiation;
}

function incorporateTrendKeywords(text: string, keywords: string[]): string {
    // Add trending keywords naturally
    const keyword = keywords[0];

    if (!text.toLowerCase().includes(keyword.toLowerCase())) {
        // Add to first sentence
        const firstPeriod = text.indexOf('.');
        if (firstPeriod > -1) {
            return text.substring(0, firstPeriod) + ` leveraging ${keyword}` + text.substring(firstPeriod);
        }
    }

    return text;
}

function addOpportunityMessaging(body: string, opportunity: any): string {
    const oppMessage = `\n\n**Timely Opportunity:** ${opportunity.description.substring(0, 150)}...\n\nThis is the perfect time to explore how we can help you capitalize on this trend.\n`;

    // Insert after first paragraph
    const firstDoubleNewline = body.indexOf('\n\n');
    if (firstDoubleNewline > -1) {
        return body.substring(0, firstDoubleNewline) + oppMessage + body.substring(firstDoubleNewline);
    }

    return body + oppMessage;
}

function personalizeEmailBody(body: string, companyName: string, companyInfo: string): string {
    // Replace placeholders
    let personalized = body
        .replace(/\{\{company\}\}/g, companyName)
        .replace(/\{\{name\}\}/g, '[Name]');

    // Add company-specific insight
    const insight = `\n\nI noticed that ${companyName} ${extractRelevantInfo(companyInfo)}. This makes you an ideal fit for our solution.\n`;

    const firstParagraphEnd = personalized.indexOf('\n\n');
    if (firstParagraphEnd > -1) {
        personalized = personalized.substring(0, firstParagraphEnd) + insight + personalized.substring(firstParagraphEnd);
    }

    return personalized;
}

function extractRelevantInfo(companyInfo: string): string {
    // Extract relevant snippet from company info
    const sentences = companyInfo.split('.');
    return sentences[0] || 'is a leader in your industry';
}

function makeSubjectMoreUrgent(subject: string): string {
    return `⏰ ${subject} - Limited Time`;
}

function makeSubjectMorePersonal(subject: string): string {
    return `Quick question about ${subject.toLowerCase()}`;
}

function makeSubjectQuestionBased(subject: string): string {
    return `How can ${subject.toLowerCase()}?`;
}

function calculateExpectedImprovement(changes: OptimizationChange[]): number {
    // Each optimization type has different expected impact
    const impactMap: Record<string, number> = {
        'messaging': 10,
        'timing': 5,
        'audience': 15,
        'content': 8,
    };

    let totalImprovement = 0;
    for (const change of changes) {
        totalImprovement += impactMap[change.type] || 5;
    }

    return Math.min(totalImprovement, 50); // Cap at 50%
}

export const campaignOptimizer = {
    optimizeCampaign,
    personalizeCampaign,
    generateEmailVariations,
    getOptimalSendTime,
};
