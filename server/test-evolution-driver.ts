
import * as fs from 'fs/promises';
import * as path from 'path';
import { analyzeCodeIssue, applyFix } from './meta-agent/capabilities/self-evolution';

const BROKEN_FILE_PATH = path.join(process.cwd(), 'server', 'meta-agent', 'broken-test-file.ts');

async function testSelfEvolution() {
    console.log("🧬 Starting Self-Evolution Simulation...");

    // 1. Create a broken file
    const brokenCode = `
export function calculateBudget(price: number, qty: number) {
    // BUG: Division by zero possible here if qty is 0, but logical error in formula too
    // Intention: price * qty
    if (qty === 0) return Infinity; 
    return price / 0; // SYNTAX/RUNTIME ERROR SIMULATION
}

// Execute
calculateBudget(100, 2);
`;
    await fs.writeFile(BROKEN_FILE_PATH, brokenCode);
    console.log(`❌ Created broken file at: ${BROKEN_FILE_PATH}`);

    // 2. Simulate running it and getting an error
    console.log("💥 Simulating Runtime Error: 'Infinity' or 'Division by zero'...");
    const fakeError = "Error: Division by zero or Infinity detected in calculateBudget";

    // 3. Trigger Agent Analysis
    console.log("🕵️ Agent Analyzing Issue...");
    const fix = await analyzeCodeIssue(BROKEN_FILE_PATH, fakeError);

    if (fix) {
        console.log(`💡 Fix Proposed (Confidence: ${fix.confidence}%):`);
        console.log(`   Explanation: ${fix.explanation}`);
        console.log(`   Patch Preview: ${fix.patch.substring(0, 50)}...`);

        // 4. Apply Fix
        const applied = await applyFix(fix);
        if (applied) {
            console.log("✅ Fix Applied Successfully!");

            // 5. Verify Content
            const fixedContent = await fs.readFile(BROKEN_FILE_PATH, 'utf-8');
            console.log("\n📄 Fixed File Content:");
            console.log(fixedContent);

            if (fixedContent.includes("return 0") || fixedContent.includes("b === 0")) {
                console.log("\n🎉 SUCCESS: The agent autonomously healed the code!");
            }
        }
    } else {
        console.error("❌ Agent failed to propose a fix.");
    }
}

testSelfEvolution().catch(console.error);
