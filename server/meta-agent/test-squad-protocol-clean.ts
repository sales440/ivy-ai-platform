
// Minimal Event Bus implementation (Mirroring AgentOrchestrator logic)
// avoiding imports from broken db.ts/schema.ts

export interface AgentMessage {
    id: string;
    fromAgent: string;
    type: string;
    payload: any;
    timestamp: Date;
}

type MessageHandler = (msg: AgentMessage) => void;

class CleanOrchestrator {
    private listeners: MessageHandler[] = [];

    subscribe(handler: MessageHandler) {
        this.listeners.push(handler);
        return () => this.listeners = this.listeners.filter(l => l !== handler);
    }

    broadcastMessage(from: string, type: string, payload: any) {
        const msg: AgentMessage = {
            id: Math.random().toString(36).substring(7),
            fromAgent: from,
            type,
            payload,
            timestamp: new Date()
        };

        console.log(`[Hive Mind] 📡 Broadcast from ${from}: [${type}]`, payload);

        this.listeners.forEach(handler => {
            try {
                handler(msg);
            } catch (err) {
                console.error("[Hive Mind] Listener error:", err);
            }
        });
    }
}

const orchestrator = new CleanOrchestrator();

async function testHiveMind() {
    console.log("🐝 Testing Ivy.AI Hive Mind Protocol (Clean Environment)...");

    orchestrator.subscribe((msg) => {
        if (msg.fromAgent === "Ivy-Prospect" && msg.type === "LEAD_FOUND") {
            console.log(`[Logic] 🧠 Received intel: ${msg.payload.name} found. Dispatching Closer...`);
            orchestrator.broadcastMessage("Logic", "COMMAND_ATTACK", {
                targetId: msg.payload.id,
                strategy: "Aggressive"
            });
        }
    });

    orchestrator.subscribe((msg) => {
        if (msg.fromAgent === "Logic" && msg.type === "COMMAND_ATTACK") {
            console.log(`[Ivy-Closer] 💼 Received orders. Engaging target ${msg.payload.targetId} with strategy: ${msg.payload.strategy}.`);
        }
    });

    console.log("... Squad initialized. Waiting for activity ...");

    setTimeout(() => {
        orchestrator.broadcastMessage("Ivy-Prospect", "LEAD_FOUND", {
            id: 101,
            name: "MegaCorp CEO"
        });
    }, 1000);
}

testHiveMind().catch(console.error);
