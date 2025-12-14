
import { searchWeb, scrapeWebPage } from "./web-search";
import { invokeLLM } from "../../_core/llm";

export interface ResearchResult {
    query: string;
    summary: string;
    sources: { title: string; url: string }[];
    rawFindings: string[];
}

/**
 * Conduct deep research on a topic by searching, scraping, and synthesizing.
 * @param query The research topic
 * @param breadth Number of pages to read (default 3)
 */
export async function deepResearch(query: string, breadth: number = 3): Promise<ResearchResult> {
    console.log(`[Deep Research] Starting research on: "${query}"`);

    // 1. Search the web
    const searchResults = await searchWeb(query, breadth);
    if (searchResults.length === 0) {
        return {
            query,
            summary: "No information found.",
            sources: [],
            rawFindings: []
        };
    }

    const findings: string[] = [];
    const sources: { title: string; url: string }[] = [];

    // 2. Scrape top results
    for (const result of searchResults) {
        console.log(`[Deep Research] Scraping: ${result.url}`);
        const content = await scrapeWebPage(result.url);

        if (content) {
            findings.push(`SOURCE: ${result.title} (${result.url})\nCONTENT: ${content.content.substring(0, 2000)}...`);
            sources.push({ title: result.title, url: result.url });
        }
    }

    // 3. Synthesize with LLM
    console.log(`[Deep Research] Synthesizing ${findings.length} documents...`);

    if (findings.length === 0) {
        return { query, summary: "Could not access any of the found pages.", sources: [], rawFindings: [] };
    }

    const synthesisPrompt = `
You are a Deep Research AI. Synthesize the following raw data into a comprehensive report on "${query}".
Focus on facts, figures, and key insights. Cite sources where possible.

RAW DATA:
${findings.join('\n\n')}
`;

    try {
        const response = await invokeLLM({
            messages: [{ role: "system", content: "You are a helpful research assistant." }, { role: "user", content: synthesisPrompt }],
            temperature: 0.5
        });

        const summary = response.choices[0].message.content as string;

        return {
            query,
            summary,
            sources,
            rawFindings: findings
        };
    } catch (error) {
        console.error("[Deep Research] Synthesis failed:", error);
        return {
            query,
            summary: "Error synthesizing results. See raw findings.",
            sources,
            rawFindings: findings
        };
    }
}
