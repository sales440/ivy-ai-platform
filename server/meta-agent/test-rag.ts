
import { rag } from "./capabilities/rag";

async function testRAG() {
    console.log("🧠 Testing RAG (Retrieval-Augmented Generation)...");

    const COMPANY_ID = 1;

    // 1. Memorize a fact
    const fact = "The Ivy.AI platform Enterprise Plan costs $5000/month and includes unlimited agents.";
    console.log(`\n📚 Memorizing new fact: "${fact}"`);
    const id = await rag.saveMemory(fact, COMPANY_ID, { source: "test-script", type: "pricing" });
    console.log(`   ✅ Stored with ID: ${id}`);

    // 2. Query with a semantic match (not exact keywords)
    const query = "What is the price for the big corporate plan?";
    console.log(`\n🔍 Querying: "${query}"`);

    // 3. Augment Prompt
    const augmentedPrompt = await rag.augmentPrompt(query, COMPANY_ID);

    console.log("\n📝 Augmented Context Block:");
    console.log(augmentedPrompt);

    if (augmentedPrompt.includes("$5000/month")) {
        console.log("\n✅ SUCCESS: RAG successfully retrieved the pricing info!");
    } else {
        console.error("\n❌ FAILURE: RAG did not find the relevant fact.");
    }
}

testRAG().catch(console.error);
