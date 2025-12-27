
import { appRouter } from "../server/routers";
import dotenv from 'dotenv';
dotenv.config();

const mockUser = {
    id: 1,
    email: 'admin@ivybai.com',
    role: 'admin',
    name: 'Admin User'
};

async function main() {
    console.log('Testing Ivy Cloud API Endpoints...');

    // Create a caller for the router with a mock context
    // Note: The context structure depends on your _core/trpc.ts definition
    // We'll approximate it here. If it fails due to context mismatch, we'll know.
    const caller = appRouter.createCaller({
        user: mockUser,
        req: {} as any,
        res: {} as any
    });

    try {
        // 1. Test ROPA Endpoint
        console.log('\n--- Calling ivyCloud.askRopa ---');
        const ropaResult = await caller.ivyCloud.askRopa({
            message: "Status check via API"
        });
        console.log(`ROPA Response: ${JSON.stringify(ropaResult, null, 2)}`);

        // 2. Test Voice Endpoint
        console.log('\n--- Calling ivyCloud.askVoice ---');
        const voiceResult = await caller.ivyCloud.askVoice({
            message: "Test voice agent via API"
        });
        console.log(`Voice Response: ${JSON.stringify(voiceResult, null, 2)}`);

    } catch (error) {
        console.error('API Call Failed:', error);
    }
}

main();
