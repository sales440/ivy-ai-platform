
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/trpc/metaAgent.sendChatMessage';

async function sendCommand(command, description) {
    console.log(`\n--- TESTING: ${description} ---`);
    console.log(`Sending command: "${command}"`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-bypass-auth': 'true' // Bypass auth for local testing
            },
            body: JSON.stringify({
                json: { message: command }
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('❌ Error:', data.error);
        } else {
            // Log the result structure to debug
            if (data.result && data.result.data && data.result.data.json && data.result.data.json.response) {
                console.log('✅ Response:', data.result.data.json.response);
            } else {
                console.log('✅ Full Response Object:', JSON.stringify(data, null, 2));
            }
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

async function runTests() {
    console.log("🚀 STARTING CAPABILITY TESTS (Simulation Mode)\n");

    // Query Agent Status
    await sendCommand(
        "Dime el estado y métricas del agente agent_9301kbxk5t94fwa9045cha517bjz",
        "🔍 Inspect Agent"
    );

    console.log("\n✨ ALL TESTS COMPLETED");
}

runTests();
