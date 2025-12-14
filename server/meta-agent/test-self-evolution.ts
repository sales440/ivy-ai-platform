
import { analyzeCodeIssue, applyFix } from "./capabilities/self-evolution";
import * as fs from "fs/promises";
import * as path from "path";

async function testSelfEvolution() {
    console.log("[Test] Initializing Self-Evolution Test...");

    // 1. Create a broken file relative to CWD
    const brokenFile = path.resolve(process.cwd(), "server/meta-agent/dummy-broken.ts");
    const brokenCode = `
    function calculateSum(a: number, b: number) {
        return a + b;
    }

    // ERROR: Type 'string' is not assignable to type 'number'
    const result = calculateSum(10, "20"); 
    console.log(result);
    `;

    await fs.writeFile(brokenFile, brokenCode);
    console.log("[Test] Created dummy-broken.ts with type error.");

    // 2. Run Analysis
    const errorMsg = "Argument of type 'string' is not assignable to parameter of type 'number'.";
    console.log(`[Test] Analyzing error: "${errorMsg}"`);

    const fix = await analyzeCodeIssue(brokenFile, errorMsg);

    if (!fix) {
        console.error("[Test] ❌ Analysis returned null.");
        return;
    }

    console.log("\n[Test] === Proposed Fix ===");
    console.log(`Explanation: ${fix.explanation}`);
    console.log(`Confidence: ${fix.confidence}`);
    console.log("=========================\n");

    // 3. Apply Fix
    if (fix.confidence > 80) {
        const success = await applyFix(fix);
        if (success) {
            console.log("[Test] ✅ Fix applied successfully.");

            // Verify content
            const newContent = await fs.readFile(brokenFile, "utf-8");
            console.log("\n[Test] New Content Preview:");
            console.log(newContent.substring(0, 200));

            // Cleanup
            await fs.unlink(brokenFile);
            await fs.unlink(brokenFile + ".bak");
        } else {
            console.error("[Test] ❌ Failed to apply fix.");
        }
    } else {
        console.warn("[Test] Confidence too low, skipping application.");
    }
}

testSelfEvolution();
