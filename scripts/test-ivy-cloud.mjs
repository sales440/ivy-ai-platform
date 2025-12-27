
import { IvyCloudService } from '../server/ivy-cloud/service';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'peppy-house-476405-d6';
    console.log(`Initializing Ivy Cloud Service with Project ID: ${projectId}`);

    try {
        const ivy = new IvyCloudService(projectId);

        // 1. Test ROPA (Meta-Agent)
        console.log('\n--- Testing ROPA (Meta-Agent) ---');
        const ropaResponse = await ivy.runRopaCycle("Alerta: Se detectó una nueva oportunidad en Acme Corp. Investiga y decide.");
        console.log(`ROPA Response:\n${ropaResponse}`);

        // 2. Test Voice Agent
        console.log('\n--- Testing Ivy Voice Agent ---');
        const voiceResponse = await ivy.runVoiceAgent("El cliente contestó 'No me interesa'. ¿Qué respondo?");
        console.log(`Voice Agent Response:\n${voiceResponse}`);

        // 3. Test Mail Agent
        console.log('\n--- Testing Ivy Mail Agent ---');
        const mailResponse = await ivy.runMailAgent("Genera un asunto disruptivo para una empresa de logística.");
        console.log(`Mail Agent Response:\n${mailResponse}`);

        // 4. Test Intel Agent
        // Note: This requires active Grounding access which might need extra setup, but we'll try.
        console.log('\n--- Testing Ivy Intel Agent ---');
        try {
            const intelResponse = await ivy.runIntelAgent("Tesla Inc.");
            console.log(`Intel Agent Response:\n${intelResponse}`);
        } catch (e) {
            console.log("Intel Agent validation skipped or failed (might need advanced Grounding setup):", e.message);
        }

    } catch (error) {
        console.error('Error running Ivy Cloud Service:', error);
    }
}

main();
