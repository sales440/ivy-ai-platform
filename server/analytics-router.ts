import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const analyticsRouter = router({
  prospectMetrics: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const searches = await db.getProspectSearchMetrics(input.companyId, {
        startDate: input.startDate,
        endDate: input.endDate,
      });

      if (!searches || searches.length === 0) {
        return {
          totalSearches: 0,
          avgResults: 0,
          conversionRate: 0,
          searchesByDay: [],
          topQueries: [],
          industryDistribution: [],
          seniorityDistribution: [],
        };
      }

      // Calculate total searches
      const totalSearches = searches.length;

      // Calculate average results
      const avgResults = Math.round(
        searches.reduce((sum, s) => sum + s.resultCount, 0) / totalSearches
      );

      // Calculate searches by day
      const searchesByDay = searches.reduce((acc: any[], search) => {
        const date = new Date(search.createdAt).toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, []).sort((a, b) => a.date.localeCompare(b.date));

      // Calculate top queries
      const queryCount = searches.reduce((acc: Record<string, number>, search) => {
        acc[search.query] = (acc[search.query] || 0) + 1;
        return acc;
      }, {});
      
      const topQueries = Object.entries(queryCount)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate industry distribution
      const industryCount = searches.reduce((acc: Record<string, number>, search) => {
        const industry = search.industry || 'Unknown';
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {});
      
      const industryDistribution = Object.entries(industryCount)
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate seniority distribution
      const seniorityCount = searches.reduce((acc: Record<string, number>, search) => {
        const seniority = search.seniority || 'Any';
        acc[seniority] = (acc[seniority] || 0) + 1;
        return acc;
      }, {});
      
      const seniorityDistribution = Object.entries(seniorityCount)
        .map(([seniority, count]) => ({ seniority, count }))
        .sort((a, b) => b.count - a.count);

      // TODO: Calculate conversion rate (requires tracking which searches led to leads)
      const conversionRate = 0;

      return {
        totalSearches,
        avgResults,
        conversionRate,
        searchesByDay,
        topQueries,
        industryDistribution,
        seniorityDistribution,
      };
    }),
});
