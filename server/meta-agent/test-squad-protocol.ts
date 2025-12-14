
import { agentOrchestrator } from "./agent-orchestrator";

async function testHiveMind() {
    console.log("🐝 Testing Ivy.AI Hive Mind Protocol...");

    // 1. Simulating 'Logic' Agent subscribing to updates
    const unsubscribe = agentOrchestrator.subscribe((msg) => {
        if (msg.fromAgent === "Ivy-Prospect" && msg.type === "LEAD_FOUND") {
            console.log(`[Logic] 🧠 Received intel: ${msg.payload.name} found. Dispatching Closer...`);

            // Logic reacts by sending a command (simulation)
            agentOrchestrator.broadcastMessage("Logic", "COMMAND_ATTACK", {
                targetId: msg.payload.id,
                strategy: "Aggressive"
            });
        }
    });

    // 2. Simulating 'Ivy-Closer' listening for commands
    agentOrchestrator.subscribe((msg) => {
        if (msg.fromAgent === "Logic" && msg.type === "COMMAND_ATTACK") {
            console.log(`[Ivy-Closer] 💼 Received orders. Engaging target ${msg.payload.targetId} with strategy: ${msg.payload.strategy}.`);
        }
    });

    console.log("... Squad initialized. Waiting for activity ...");

    // 3. Simulating 'Ivy-Prospect' finding a lead
    setTimeout(() => {
        agentOrchestrator.broadcastMessage("Ivy-Prospect", "LEAD_FOUND", {
            id: 101,
            name: "MegaCorp CEO"
        });
    }, 1000);
}

testHiveMind().catch(console.error);
