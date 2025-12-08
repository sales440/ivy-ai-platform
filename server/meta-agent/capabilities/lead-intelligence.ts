/**
 * Lead Intelligence Module
 * 
 * Intelligent lead generation using real-time internet data
 * Includes LinkedIn scraping, company discovery, contact enrichment, and lead scoring
 */

import { searchWeb, scrapeWebPage } from './web-search';
import { getDb } from '../db';
import { leads } from '../../drizzle/schema';

export interface LeadProfile {
    name: string;
    title: string;
    company: string;
    industry: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    companyWebsite?: string;
    companySize?: string;
    location?: string;
    score: number;
    signals: string[];
    source: string;
}

export interface CompanyProfile {
    name: string;
    website: string;
    industry: string;
    size: string;
    location: string;
    description: string;
    fundingStage?: string;
    recentNews: string[];
    jobPostings: number;
    techStack: string[];
    socialMedia: {
        linkedin?: string;
        twitter?: string;
        facebook?: string;
    };
}

export interface TriggerEvent {
    type: 'funding' | 'hiring' | 'expansion' | 'leadership-change' | 'product-launch' | 'award';
    company: string;
    description: string;
    date: Date;
    relevance: number;
}

/**
 * Search for decision-makers on LinkedIn (via web search)
 */
export async function findDecisionMakers(params: {
    title: string;
    industry: string;
    companySize?: string;
    location?: string;
    count?: number;
}): Promise<LeadProfile[]> {
    const { title, industry, companySize, location, count = 20 } = params;

    console.log(`[Lead Intelligence] Searching for ${title} in ${industry}...`);

    const leads: LeadProfile[] = [];

    // Build search query
    let query = `"${title}" ${industry}`;
    if (companySize) query += ` "${companySize} employees"`;
    if (location) query += ` ${location}`;
    query += ' site:linkedin.com';

    try {
        // Search web for LinkedIn profiles
        const results = await searchWeb(query, count);

        for (const result of results) {
            if (!result.url.includes('linkedin.com')) continue;

            // Extract information from search result
            const lead: LeadProfile = {
                name: extractNameFromTitle(result.title),
                title: title,
                company: extractCompanyFromSnippet(result.snippet),
                industry: industry,
                linkedinUrl: result.url,
                score: 50, // Base score
                signals: [],
                source: 'LinkedIn Search',
            };

            // Try to scrape LinkedIn page for more details
            const pageContent = await scrapeWebPage(result.url);
            if (pageContent) {
                lead.companyWebsite = extractWebsiteFromContent(pageContent.content);
                lead.location = extractLocationFromContent(pageContent.content);
            }

            leads.push(lead);
        }

        console.log(`[Lead Intelligence] Found ${leads.length} potential leads`);
        return leads;
    } catch (error) {
        console.error('[Lead Intelligence] Error finding decision makers:', error);
        return [];
    }
}

/**
 * Discover companies matching ideal customer profile
 */
export async function discoverCompanies(params: {
    industry: string;
    size?: string;
    location?: string;
    keywords?: string[];
    count?: number;
}): Promise<CompanyProfile[]> {
    const { industry, size, location, keywords = [], count = 20 } = params;

    console.log(`[Lead Intelligence] Discovering companies in ${industry}...`);

    const companies: CompanyProfile[] = [];

    // Build search queries
    const queries = [
        `"${industry}" companies ${location || ''}`,
        `top ${industry} companies ${size || ''}`,
        ...keywords.map(kw => `${industry} ${kw} companies`),
    ];

    try {
        for (const query of queries) {
            if (companies.length >= count) break;

            const results = await searchWeb(query, 10);

            for (const result of results) {
                if (companies.length >= count) break;

                // Skip LinkedIn, job boards, etc.
                if (result.url.includes('linkedin.com') ||
                    result.url.includes('indeed.com') ||
                    result.url.includes('glassdoor.com')) {
                    continue;
                }

                // Try to scrape company website
                const pageContent = await scrapeWebPage(result.url);
                if (!pageContent) continue;

                const company: CompanyProfile = {
                    name: result.title.split('|')[0].trim(),
                    website: result.url,
                    industry: industry,
                    size: size || 'Unknown',
                    location: location || extractLocationFromContent(pageContent.content),
                    description: pageContent.metaDescription || result.snippet,
                    recentNews: [],
                    jobPostings: 0,
                    techStack: [],
                    socialMedia: {
                        linkedin: findSocialLink(pageContent.links, 'linkedin'),
                        twitter: findSocialLink(pageContent.links, 'twitter'),
                        facebook: findSocialLink(pageContent.links, 'facebook'),
                    },
                };

                companies.push(company);
            }
        }

        console.log(`[Lead Intelligence] Discovered ${companies.length} companies`);
        return companies;
    } catch (error) {
        console.error('[Lead Intelligence] Error discovering companies:', error);
        return [];
    }
}

/**
 * Enrich lead with additional data from web sources
 */
export async function enrichLead(lead: LeadProfile): Promise<LeadProfile> {
    console.log(`[Lead Intelligence] Enriching lead: ${lead.name} at ${lead.company}`);

    try {
        // Search for company website if not present
        if (!lead.companyWebsite) {
            const companyResults = await searchWeb(`${lead.company} official website`, 1);
            if (companyResults.length > 0) {
                lead.companyWebsite = companyResults[0].url;
            }
        }

        // Search for email pattern
        if (!lead.email && lead.companyWebsite) {
            const emailPattern = await findEmailPattern(lead.companyWebsite);
            if (emailPattern) {
                lead.email = generateEmail(lead.name, emailPattern);
            }
        }

        // Search for recent company news
        const newsResults = await searchWeb(`${lead.company} news`, 3);
        if (newsResults.length > 0) {
            lead.signals.push(`Recent news: ${newsResults[0].title}`);
        }

        // Check if company is hiring (buying signal)
        const hiringResults = await searchWeb(`${lead.company} careers jobs`, 1);
        if (hiringResults.length > 0) {
            lead.signals.push('Company is actively hiring');
            lead.score += 10;
        }

        console.log(`[Lead Intelligence] Enriched lead with ${lead.signals.length} signals`);
        return lead;
    } catch (error) {
        console.error('[Lead Intelligence] Error enriching lead:', error);
        return lead;
    }
}

/**
 * Score lead based on various signals
 */
export async function scoreLead(lead: LeadProfile): Promise<number> {
    let score = lead.score || 50;

    // Title relevance
    const seniorTitles = ['VP', 'Director', 'Head', 'Chief', 'C-level', 'President'];
    if (seniorTitles.some(t => lead.title.includes(t))) {
        score += 20;
    }

    // Company size (prefer mid-market)
    if (lead.companySize) {
        if (lead.companySize.includes('50-200') || lead.companySize.includes('200-500')) {
            score += 15;
        }
    }

    // Signals
    score += lead.signals.length * 5;

    // Has contact info
    if (lead.email) score += 10;
    if (lead.phone) score += 10;

    // Cap at 100
    return Math.min(score, 100);
}

/**
 * Detect trigger events for a company
 */
export async function detectTriggerEvents(company: string): Promise<TriggerEvent[]> {
    console.log(`[Lead Intelligence] Detecting trigger events for ${company}...`);

    const events: TriggerEvent[] = [];

    try {
        // Search for funding news
        const fundingResults = await searchWeb(`${company} funding raised Series`, 3);
        for (const result of fundingResults) {
            if (result.snippet.toLowerCase().includes('raised') ||
                result.snippet.toLowerCase().includes('funding')) {
                events.push({
                    type: 'funding',
                    company,
                    description: result.snippet,
                    date: new Date(),
                    relevance: 90,
                });
            }
        }

        // Search for hiring activity
        const hiringResults = await searchWeb(`${company} hiring jobs careers`, 3);
        if (hiringResults.length > 0) {
            events.push({
                type: 'hiring',
                company,
                description: `${company} is actively hiring`,
                date: new Date(),
                relevance: 70,
            });
        }

        // Search for expansion news
        const expansionResults = await searchWeb(`${company} expansion new office opening`, 3);
        for (const result of expansionResults) {
            if (result.snippet.toLowerCase().includes('expansion') ||
                result.snippet.toLowerCase().includes('opening')) {
                events.push({
                    type: 'expansion',
                    company,
                    description: result.snippet,
                    date: new Date(),
                    relevance: 80,
                });
            }
        }

        // Search for leadership changes
        const leadershipResults = await searchWeb(`${company} new CEO CTO VP appointed`, 3);
        for (const result of leadershipResults) {
            if (result.snippet.toLowerCase().includes('appointed') ||
                result.snippet.toLowerCase().includes('joins')) {
                events.push({
                    type: 'leadership-change',
                    company,
                    description: result.snippet,
                    date: new Date(),
                    relevance: 85,
                });
            }
        }

        console.log(`[Lead Intelligence] Found ${events.length} trigger events`);
        return events.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
        console.error('[Lead Intelligence] Error detecting trigger events:', error);
        return [];
    }
}

/**
 * Generate leads for a specific industry with real-time data
 */
export async function generateIntelligentLeads(params: {
    industry: string;
    targetAudience: string;
    count: number;
    useRealTimeData: boolean;
}): Promise<LeadProfile[]> {
    const { industry, targetAudience, count, useRealTimeData } = params;

    console.log(`[Lead Intelligence] Generating ${count} intelligent leads for ${industry}...`);

    const allLeads: LeadProfile[] = [];

    try {
        // Extract title from target audience
        const title = extractTitleFromAudience(targetAudience);

        // Find decision makers
        const decisionMakers = await findDecisionMakers({
            title,
            industry,
            count: Math.ceil(count * 1.5), // Get extra to account for filtering
        });

        // Enrich and score leads
        for (const lead of decisionMakers) {
            if (allLeads.length >= count) break;

            // Enrich with real-time data if enabled
            if (useRealTimeData) {
                await enrichLead(lead);
            }

            // Score lead
            lead.score = await scoreLead(lead);

            // Only include leads with score > 60
            if (lead.score >= 60) {
                allLeads.push(lead);
            }
        }

        // Save to database
        const db = await getDb();
        if (db) {
            for (const lead of allLeads) {
                await db.insert(leads).values({
                    name: lead.name,
                    email: lead.email || `${lead.name.toLowerCase().replace(' ', '.')}@${lead.company.toLowerCase().replace(' ', '')}.com`,
                    phone: lead.phone,
                    company: lead.company,
                    title: lead.title,
                    industry: lead.industry,
                    source: lead.source,
                    score: lead.score,
                    status: 'new',
                    assignedTo: null,
                });
            }
            console.log(`[Lead Intelligence] Saved ${allLeads.length} leads to database`);
        }

        console.log(`[Lead Intelligence] Generated ${allLeads.length} qualified leads`);
        return allLeads;
    } catch (error) {
        console.error('[Lead Intelligence] Error generating intelligent leads:', error);
        return [];
    }
}

// Helper functions

function extractNameFromTitle(title: string): string {
    // Extract name from LinkedIn title format: "Name - Title at Company"
    const parts = title.split('-');
    return parts[0].trim();
}

function extractCompanyFromSnippet(snippet: string): string {
    // Try to extract company name from snippet
    const atIndex = snippet.indexOf(' at ');
    if (atIndex > -1) {
        const afterAt = snippet.substring(atIndex + 4);
        return afterAt.split(/[,.\-]/)[0].trim();
    }
    return 'Unknown';
}

function extractWebsiteFromContent(content: string): string | undefined {
    // Look for website URLs in content
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = content.match(urlRegex);
    if (urls && urls.length > 0) {
        return urls[0];
    }
    return undefined;
}

function extractLocationFromContent(content: string): string {
    // Simple location extraction (can be improved)
    const locationKeywords = ['based in', 'located in', 'headquarters in'];
    for (const keyword of locationKeywords) {
        const index = content.toLowerCase().indexOf(keyword);
        if (index > -1) {
            const afterKeyword = content.substring(index + keyword.length);
            return afterKeyword.split(/[,.\n]/)[0].trim();
        }
    }
    return 'Unknown';
}

function findSocialLink(links: string[], platform: string): string | undefined {
    return links.find(link => link.includes(platform));
}

async function findEmailPattern(website: string): Promise<string | null> {
    try {
        const pageContent = await scrapeWebPage(website);
        if (!pageContent) return null;

        // Look for email patterns in content
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = pageContent.content.match(emailRegex);

        if (emails && emails.length > 0) {
            // Extract pattern from first email
            const firstEmail = emails[0];
            const domain = firstEmail.split('@')[1];
            return domain;
        }

        return null;
    } catch (error) {
        return null;
    }
}

function generateEmail(name: string, domain: string): string {
    const nameParts = name.toLowerCase().split(' ');
    if (nameParts.length >= 2) {
        return `${nameParts[0]}.${nameParts[1]}@${domain}`;
    }
    return `${nameParts[0]}@${domain}`;
}

function extractTitleFromAudience(audience: string): string {
    // Extract job title from target audience description
    const titles = ['CEO', 'CTO', 'VP', 'Director', 'Manager', 'Head', 'Chief'];
    for (const title of titles) {
        if (audience.includes(title)) {
            return title;
        }
    }
    return 'Manager'; // Default
}

export const leadIntelligence = {
    findDecisionMakers,
    discoverCompanies,
    enrichLead,
    scoreLead,
    detectTriggerEvents,
    generateIntelligentLeads,
};
