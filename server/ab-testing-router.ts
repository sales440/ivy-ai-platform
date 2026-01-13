import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { abTests, abTestVariants, abTestResults } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * A/B Testing Router
 * Statistical testing and campaign optimization
 */

// Statistical significance calculator (Chi-square test)
function calculateSignificance(
  controlConversions: number,
  controlImpressions: number,
  variantConversions: number,
  variantImpressions: number
): { significant: boolean; pValue: number; improvement: number } {
  // Avoid division by zero
  if (controlImpressions === 0 || variantImpressions === 0) {
    return { significant: false, pValue: 1, improvement: 0 };
  }

  const controlRate = controlConversions / controlImpressions;
  const variantRate = variantConversions / variantImpressions;
  
  const improvement = ((variantRate - controlRate) / controlRate) * 100;

  // Pooled probability
  const pooledProb = (controlConversions + variantConversions) / (controlImpressions + variantImpressions);
  
  // Expected values
  const expectedControl = controlImpressions * pooledProb;
  const expectedVariant = variantImpressions * pooledProb;
  
  // Chi-square statistic
  const chiSquare = 
    Math.pow(controlConversions - expectedControl, 2) / expectedControl +
    Math.pow(variantConversions - expectedVariant, 2) / expectedVariant;
  
  // Approximate p-value (1 degree of freedom)
  // For chi-square > 3.84, p < 0.05 (95% confidence)
  const significant = chiSquare > 3.84;
  const pValue = significant ? 0.05 : 0.5; // Simplified
  
  return { significant, pValue, improvement };
}

export const abTestingRouter = router({
  /**
   * Create new A/B test
   */
  create: protectedProcedure
    .input(
      z.object({
        campaignId: z.number().optional(),
        testName: z.string(),
        testType: z.enum(["email_subject", "email_content", "call_script", "sms_content", "landing_page"]),
        hypothesis: z.string().optional(),
        variants: z.array(
          z.object({
            variantName: z.string(),
            isControl: z.boolean(),
            content: z.any(), // JSON content
            trafficPercentage: z.number().default(50),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create test
      const [test] = await db.insert(abTests).values({
        campaignId: input.campaignId,
        testName: input.testName,
        testType: input.testType,
        hypothesis: input.hypothesis,
        status: "draft",
        createdBy: ctx.user?.openId,
      });

      const testId = Number(test.insertId);

      // Create variants
      for (const variant of input.variants) {
        await db.insert(abTestVariants).values({
          testId,
          variantName: variant.variantName,
          isControl: variant.isControl ? 1 : 0,
          content: JSON.stringify(variant.content),
          trafficPercentage: variant.trafficPercentage,
        });
      }

      return { success: true, testId };
    }),

  /**
   * Start A/B test
   */
  start: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(abTests)
        .set({ status: "running", startDate: new Date() })
        .where(eq(abTests.id, input.testId));

      return { success: true };
    }),

  /**
   * Record test result (impression, open, click, conversion)
   */
  recordResult: protectedProcedure
    .input(
      z.object({
        testId: z.number(),
        variantId: z.number(),
        eventType: z.enum(["impression", "open", "click", "conversion", "bounce", "unsubscribe"]),
        revenue: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get or create result record
      const existing = await db
        .select()
        .from(abTestResults)
        .where(and(eq(abTestResults.testId, input.testId), eq(abTestResults.variantId, input.variantId)))
        .limit(1);

      if (existing.length === 0) {
        // Create new result
        await db.insert(abTestResults).values({
          testId: input.testId,
          variantId: input.variantId,
          impressions: input.eventType === "impression" ? 1 : 0,
          opens: input.eventType === "open" ? 1 : 0,
          clicks: input.eventType === "click" ? 1 : 0,
          conversions: input.eventType === "conversion" ? 1 : 0,
          bounces: input.eventType === "bounce" ? 1 : 0,
          unsubscribes: input.eventType === "unsubscribe" ? 1 : 0,
          revenue: input.revenue || 0,
        });
      } else {
        // Update existing
        const field = `${input.eventType}s` as keyof typeof abTestResults.$inferSelect;
        await db
          .update(abTestResults)
          .set({
            [field]: sql`${abTestResults[field]} + 1`,
            revenue: input.revenue ? sql`${abTestResults.revenue} + ${input.revenue}` : undefined,
          })
          .where(and(eq(abTestResults.testId, input.testId), eq(abTestResults.variantId, input.variantId)));

        // Recalculate rates
        const [updated] = await db
          .select()
          .from(abTestResults)
          .where(and(eq(abTestResults.testId, input.testId), eq(abTestResults.variantId, input.variantId)))
          .limit(1);

        if (updated) {
          const openRate = (updated.impressions || 0) > 0 ? ((updated.opens || 0) / (updated.impressions || 1)) * 10000 : 0;
          const clickRate = (updated.opens || 0) > 0 ? ((updated.clicks || 0) / (updated.opens || 1)) * 10000 : 0;
          const conversionRate = (updated.impressions || 0) > 0 ? ((updated.conversions || 0) / (updated.impressions || 1)) * 10000 : 0;

          await db
            .update(abTestResults)
            .set({
              openRate: Math.round(openRate),
              clickRate: Math.round(clickRate),
              conversionRate: Math.round(conversionRate),
            })
            .where(and(eq(abTestResults.testId, input.testId), eq(abTestResults.variantId, input.variantId)));
        }
      }

      return { success: true };
    }),

  /**
   * Get test results with statistical analysis
   */
  getResults: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [test] = await db.select().from(abTests).where(eq(abTests.id, input.testId)).limit(1);

      if (!test) throw new Error("Test not found");

      const variants = await db.select().from(abTestVariants).where(eq(abTestVariants.testId, input.testId));

      const results = await db.select().from(abTestResults).where(eq(abTestResults.testId, input.testId));

      // Find control variant
      const controlVariant = variants.find((v) => v.isControl === 1);
      const controlResult = controlVariant && controlVariant.id ? results.find((r) => r.variantId === controlVariant.id) : null;

      // Calculate significance for each variant vs control
      const analysis = variants.map((variant) => {
        if (!variant.id) {
          return {
            variant,
            result: null,
            significance: null,
          };
        }
        const result = results.find((r) => r.variantId === variant.id);
        
        if (!result) {
          return {
            variant,
            result: null,
            significance: null,
          };
        }

        if (variant.isControl === 1 || !controlResult) {
          return {
            variant,
            result,
            significance: null,
          };
        }

        const sig = controlResult ? calculateSignificance(
          controlResult.conversions || 0,
          controlResult.impressions || 0,
          result.conversions || 0,
          result.impressions || 0
        ) : { significant: false, pValue: 1, improvement: 0 };

        return {
          variant,
          result,
          significance: sig,
        };
      });

      return {
        test,
        analysis,
      };
    }),

  /**
   * Automatically select winner when significance is reached
   */
  selectWinner: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get test results directly
      const [test] = await db.select().from(abTests).where(eq(abTests.id, input.testId)).limit(1);
      if (!test) throw new Error("Test not found");

      const variants = await db.select().from(abTestVariants).where(eq(abTestVariants.testId, input.testId));
      const results = await db.select().from(abTestResults).where(eq(abTestResults.testId, input.testId));

      const controlVariant = variants.find((v) => v.isControl === 1);
      const controlResult = controlVariant && controlVariant.id ? results.find((r) => r.variantId === controlVariant.id) : null;

      // Find best performing variant with statistical significance
      let bestVariant: typeof variants[0] | null = null;
      let bestImprovement = 0;

      for (const variant of variants) {
        if (variant.isControl === 1 || !controlResult || !variant.id) continue;
        
        const result = results.find((r) => r.variantId === variant.id);
        if (!result) continue;

        const sig = controlResult ? calculateSignificance(
          controlResult.conversions || 0,
          controlResult.impressions || 0,
          result.conversions || 0,
          result.impressions || 0
        ) : { significant: false, pValue: 1, improvement: 0 };

        if (sig.significant && sig.improvement > bestImprovement) {
          bestVariant = variant;
          bestImprovement = sig.improvement;
        }
      }

      if (bestVariant) {
        await db
          .update(abTests)
          .set({
            status: "completed",
            endDate: new Date(),
            winnerVariantId: bestVariant.id,
            significanceReached: 1,
          })
          .where(eq(abTests.id, input.testId));

        return { success: true, winnerId: bestVariant.id, improvement: bestImprovement };
      }

      return { success: false, message: "No statistically significant winner found" };
    }),

  /**
   * List all tests
   */
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const tests = await db.select().from(abTests);
    return tests;
  }),

  /**
   * Pause test
   */
  pause: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(abTests).set({ status: "paused" }).where(eq(abTests.id, input.testId));

      return { success: true };
    }),

  /**
   * Delete test
   */
  delete: protectedProcedure
    .input(z.object({ testId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete results
      await db.delete(abTestResults).where(eq(abTestResults.testId, input.testId));

      // Delete variants
      await db.delete(abTestVariants).where(eq(abTestVariants.testId, input.testId));

      // Delete test
      await db.delete(abTests).where(eq(abTests.id, input.testId));

      return { success: true };
    }),
});
