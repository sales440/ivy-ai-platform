
import { generateTrainingRecommendations } from '../server/meta-agent/capabilities/agent-trainer';
import { searchWeb } from '../server/meta-agent/capabilities/web-search';

// Mock the web search to avoid actual network calls during test
// But we want to verify it's CALLED.
// Since we can't easily mock ES modules in this simple script without a test runner like Jest/Vitest,
// we will rely on the fact that we modified the code to print logs.
// However, to be safer, we can try to run a real "dry run" if possible, or just check if the function runs without error.

// Actually, we can't easily mock the import in a simple node script without a loader.
// So we will run it and expect it to try to search (which might fail or succeed depending on network).
// We will look for the log message "[Agent Trainer] Searching web for: ..."

async function main() {
    console.log('🧪 Testing Market Intelligence Integration...');

    // Mock performance data
    const mockPerformance = [{
        agentId: 'test-agent-1',
        agentName: 'Test Sales Agent',
        metrics: {
            emailsSent: 100,
            emailsOpened: 20,
            emailsClicked: 5,
            conversions: 1,
            conversionRate: 1.0,
            avgResponseTime: 3600000,
            successRate: 1.0
        },
        period: {
            start: new Date(),
            end: new Date()
        }
    }];

    console.log('Running generateTrainingRecommendations...');
    try {
        // We expect this to trigger the web search logic we added
        // It might fail if DB is not connected, so we might need to mock getDb too?
        // The generateTrainingRecommendations function calls generateAgentRecommendations
        // which calls findSuccessfulPatterns (needs DB) and searchWeb.

        // If we run this script directly, it will try to connect to DB.
        // This might be flaky if DB is not set up in this environment.
        // Let's see if we can just import the internal function... we can't easily because it's not exported.

        // Plan B: We will run the script and catch DB errors, but hope that the search part runs BEFORE or INDEPENDENTLY?
        // Looking at the code:
        // 1. findSuccessfulPatterns (DB)
        // 2. searchWeb (Network)
        // So DB failure will block search.

        // We should probably use the existing test infrastructure if possible, or just rely on manual verification via the "auto train" command if the server is running.
        // But the user wants us to "take control".

        // Let's try to run it. If it fails due to DB, we know we need a better test strategy (e.g. mocking DB).
        // But for now, let's write a script that TRIES to run it.

        const recommendations = await generateTrainingRecommendations(mockPerformance);
        console.log('Recommendations generated:', JSON.stringify(recommendations, null, 2));

    } catch (error) {
        console.error('Test failed (expected if DB not ready):', error.message);
        if (error.message.includes('searchWeb')) {
            console.log('✅ It seems to have tried to use searchWeb!');
        }
    }
}

main().catch(console.error);
