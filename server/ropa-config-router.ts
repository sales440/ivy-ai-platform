/**
 * ROPA Configuration Router
 * 
 * Handles persisting and retrieving ROPA configuration settings
 * (operation mode, language, personality, campaign limits, notifications).
 * 
 * Uses the existing ropa_config table (key/value JSON pattern from ropa-schema.ts).
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { setRopaConfig, getRopaConfig } from "./ropa-db";

const SETTINGS_KEY = "ropa_user_settings";

// Zod schema for config validation
const ropaConfigSchema = z.object({
  operationMode: z.enum(["autonomous", "guided", "hybrid"]).default("autonomous"),
  language: z.string().min(2).max(10).default("es"),
  personality: z.enum(["professional", "friendly", "technical"]).default("professional"),
  maxEmailsPerDay: z.number().int().min(1).max(10000).default(100),
  maxCallsPerDay: z.number().int().min(1).max(5000).default(50),
  sendingHoursStart: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
  sendingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).default("18:00"),
  notifications: z.object({
    criticalAlerts: z.boolean().default(true),
    dailyReports: z.boolean().default(true),
    campaignMilestones: z.boolean().default(true),
    newLeads: z.boolean().default(false),
  }).default({ criticalAlerts: true, dailyReports: true, campaignMilestones: true, newLeads: false }),
});

export const ropaConfigRouter = router({
  /**
   * Get the current ROPA configuration
   */
  getConfig: protectedProcedure.query(async () => {
    try {
      const savedConfig = await getRopaConfig(SETTINGS_KEY);
      
      if (!savedConfig || typeof savedConfig !== 'object') {
        return getDefaultConfig();
      }

      // Merge saved config with defaults to ensure all fields exist
      const defaults = getDefaultConfig();
      return {
        operationMode: (savedConfig as any).operationMode || defaults.operationMode,
        language: (savedConfig as any).language || defaults.language,
        personality: (savedConfig as any).personality || defaults.personality,
        maxEmailsPerDay: (savedConfig as any).maxEmailsPerDay ?? defaults.maxEmailsPerDay,
        maxCallsPerDay: (savedConfig as any).maxCallsPerDay ?? defaults.maxCallsPerDay,
        sendingHoursStart: (savedConfig as any).sendingHoursStart || defaults.sendingHoursStart,
        sendingHoursEnd: (savedConfig as any).sendingHoursEnd || defaults.sendingHoursEnd,
        notifications: {
          ...defaults.notifications,
          ...((savedConfig as any).notifications || {}),
        },
      };
    } catch (error) {
      console.error("[ROPA Config] Error fetching config:", error);
      return getDefaultConfig();
    }
  }),

  /**
   * Save ROPA configuration
   */
  saveConfig: protectedProcedure
    .input(ropaConfigSchema)
    .mutation(async ({ input }) => {
      try {
        await setRopaConfig(SETTINGS_KEY, input, "User-configurable ROPA settings");

        console.log("[ROPA Config] Configuration saved successfully:", {
          mode: input.operationMode,
          lang: input.language,
          personality: input.personality,
        });

        return { success: true };
      } catch (error: any) {
        console.error("[ROPA Config] Error saving config:", error);
        throw new Error(`Failed to save configuration: ${error.message}`);
      }
    }),
});

function getDefaultConfig() {
  return {
    operationMode: "autonomous" as const,
    language: "es",
    personality: "professional" as const,
    maxEmailsPerDay: 100,
    maxCallsPerDay: 50,
    sendingHoursStart: "09:00",
    sendingHoursEnd: "18:00",
    notifications: {
      criticalAlerts: true,
      dailyReports: true,
      campaignMilestones: true,
      newLeads: false,
    },
  };
}
