
import { IvyProspect } from "./agents/specialists/ivy-prospect";

async function testDeepResearch() {
    console.log("[Test] Initializing Deep Research Test...");

    // 1. Instantiate Ivy-Prospect
    const prospect = new IvyProspect();
    console.log("[Test] Ivy-Prospect instantiated.");

    // 2. Define a deep research goal
    const goal = "perform_deep_research(topic='latest AI trends in sales 2025')";
    console.log(`[Test] Sending goal: "${goal}"`);

    try {
        // Direct tool invocation for testing (bypassing LLM planner for reliability in test)
        // In real agent execution, the LLM would call this tool.
        console.log("[Test] Invoking deepResearch tool directly...");
        const { deepResearch } = await import("./capabilities/deep-research");

        // Mocking the web search for test speed/reliability if needed, 
        // but let's try the real function which uses the 'searchWeb' mock inside web-search.ts if query matches
        // or falls back to DuckDuckGo.

        const result = await deepResearch("Robo de carga logistica Mexico 2025", 2);

        console.log("\n[Test] === Research Report ===");
        console.log(`Topic: ${result.query}`);
        console.log(`Summary: ${result.summary}`);
        console.log(`Sources: ${result.sources.length}`);
        result.sources.forEach(s => console.log(` - ${s.title} (${s.url})`));
        console.log("===========================\n");

        console.log("[Test] ✅ Deep Research Test Passed!");
    } catch (error) {
        console.error("[Test] ❌ Deep Research Test Failed:", error);
        process.exit(1);
    }
}

testDeepResearch();
