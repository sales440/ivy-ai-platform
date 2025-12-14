
import { Logic } from "./agents/logic";
import { IvyProspect } from "./agents/specialists/ivy-prospect";
import { IvyCloser } from "./agents/specialists/ivy-closer";

async function testSquad() {
    console.log("🤖 Initializing Ivy.AI Agent Squad...");

    const logic = new Logic();

    // Simulate a high-level goal from a user
    const userGoal = "I need to find 3 transport companies in Mexico City and send them a WhatsApp introduction.";

    console.log(`\n🎯 User Goal: "${userGoal}"`);
    console.log("-----------------------------------");

    // 1. Logic analyzes and delegates to Prospect
    console.log("\n[Logic] Analyzed goal. Delegating research to Ivy-Prospect...");
    const prospect = new IvyProspect();
    const leadsResult = await prospect.executeGoal("Find 3 transport companies in Mexico City");

    // In a real scenario, Logic would parse this JSON. For this test, we assume Logic passes it to Closer.
    if (!leadsResult || !leadsResult.leads) {
        console.error("❌ Ivy-Prospect failed to find leads.");
        return;
    }

    console.log(`\n[Ivy-Prospect] Found ${leadsResult.leads.length} leads:`);
    leadsResult.leads.forEach((l: any) => console.log(`   - ${l.company} (${l.phone})`));

    // 2. Logic delegates to Closer
    console.log("\n[Logic] Delegating outreach to Ivy-Closer...");
    const closer = new IvyCloser();

    for (const lead of leadsResult.leads) {
        const message = `Hola ${lead.name}, I represent Ivy.AI. We help transport companies reduce theft by 30%. Can we chat?`;
        console.log(`\n[Ivy-Closer] Sending WhatsApp to ${lead.phone}...`);

        // This should trigger the Omni-Channel simulation log
        const result = await closer.executeGoal(`Send WhatsApp to ${lead.phone}: "${message}"`);
        console.log(`   ✅ Result: ${JSON.stringify(result)}`);
    }

    console.log("\n-----------------------------------");
    console.log("✅ Squad Mission Complete.");
}

testSquad().catch(console.error);
