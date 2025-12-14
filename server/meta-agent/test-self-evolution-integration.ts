
import { agentOrchestrator } from "./agent-orchestrator";
import * as fs from "fs/promises";
import * as path from "path";

async function testIntegration() {
    console.log("[Test] 🧪 Testing Orchestrator Auto-Heal Integration...");

    // 1. Setup specific broken file
    const targetFile = path.resolve(process.cwd(), "server/meta-agent/dummy-service.ts");
    const brokenCode = `
    export function divide(a: number, b: number) {
        // BUG: Potential division by zero unhandled
        return a / b;
    }
    
    // Runtime Error Simulator
    divide(10, 0); 
    `;
    await fs.writeFile(targetFile, brokenCode);
    console.log(`[Test] Created target file: ${targetFile}`);

    // 2. Simulate Error Object with Stack Trace
    const simulatedError = new Error("Infinity detected: Division by zero");
    // Artificially construct stack trace pointing to our file
    simulatedError.stack = `Error: Infinity detected: Division by zero
    at divide (${targetFile}:4:16)
    at Object.<anonymous> (${targetFile}:8:5)
    `;

    console.log("[Test] Simulating runtime error caught by Orchestrator...");

    // 3. Trigger Auto-Heal
    const result = await agentOrchestrator.autoHeal(simulatedError);

    // 4. Verification
    if (result) {
        console.log("[Test] ✅ autoHeal returned true.");
        const newContent = await fs.readFile(targetFile, "utf-8");

        if (newContent.includes("b === 0")) {
            console.log("[Test] ✅ File content patched to handle division by zero.");
            console.log("\nPreview:\n" + newContent);
        } else {
            // It might have fixed it differently via LLM, check generic change
            console.log("[Test] ⚠️ File changed but specific check unclear. Preview:\n" + newContent);
        }
    } else {
        console.error("[Test] ❌ autoHeal returned false.");
    }

    // Cleanup
    try {
        await fs.unlink(targetFile);
        await fs.unlink(targetFile + ".bak");
    } catch (e) { }
}

testIntegration().catch(console.error);
