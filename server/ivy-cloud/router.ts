
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { IvyCloudService } from "./service";

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'peppy-house-476405-d6';

// Singleton instance to reuse connections
let ivyService: IvyCloudService | null = null;

function getIvyService() {
    if (!ivyService) {
        ivyService = new IvyCloudService(PROJECT_ID);
    }
    return ivyService;
}

export const ivyCloudRouter = router({
    // Trigger ROPA (Meta-Agent)
    askRopa: protectedProcedure
        .input(z.object({
            message: z.string(),
        }))
        .mutation(async ({ input }) => {
            const service = getIvyService();
            const response = await service.runRopaCycle(input.message);
            return { response };
        }),

    // Trigger Voice Agent
    askVoice: protectedProcedure
        .input(z.object({
            message: z.string(),
        }))
        .mutation(async ({ input }) => {
            const service = getIvyService();
            const response = await service.runVoiceAgent(input.message);
            return { response };
        }),

    // Trigger Mail Agent
    askMail: protectedProcedure
        .input(z.object({
            message: z.string(),
        }))
        .mutation(async ({ input }) => {
            const service = getIvyService();
            const response = await service.runMailAgent(input.message);
            return { response };
        }),

    // Trigger Intel Agent
    askIntel: protectedProcedure
        .input(z.object({
            companyName: z.string(),
        }))
        .mutation(async ({ input }) => {
            const service = getIvyService();
            try {
                const response = await service.runIntelAgent(input.companyName);
                return { response };
            } catch (error: any) {
                return {
                    response: "Intel Agent Unavailable (Check Grounding configuration)",
                    error: error.message
                };
            }
        }),
});
