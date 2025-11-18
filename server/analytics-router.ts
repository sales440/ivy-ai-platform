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

      // Calculate conversion rate (leads created from searches / total searches)
      const leadsFromSearches = await db.getLeadsByProspectSearchIds(
        searches.map(s => s.id)
      );
      const conversionRate = totalSearches > 0 
        ? Math.round((leadsFromSearches.length / totalSearches) * 100) 
        : 0;

      // Calculate top converting queries
      const queryConversions = searches.reduce((acc: Record<string, { searches: number, conversions: number }>, search) => {
        if (!acc[search.query]) {
          acc[search.query] = { searches: 0, conversions: 0 };
        }
        acc[search.query].searches++;
        
        const leadsFromThisSearch = leadsFromSearches.filter(
          lead => lead.prospectSearchId === search.id
        );
        acc[search.query].conversions += leadsFromThisSearch.length;
        
        return acc;
      }, {});
      
      const topConvertingQueries = Object.entries(queryConversions)
        .map(([query, data]) => ({
          query,
          searches: data.searches,
          conversions: data.conversions,
          rate: data.searches > 0 ? Math.round((data.conversions / data.searches) * 100) : 0,
        }))
        .filter(item => item.conversions > 0)
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 10);

      return {
        totalSearches,
        avgResults,
        conversionRate,
        totalLeadsFromSearches: leadsFromSearches.length,
        searchesByDay,
        topQueries,
        topConvertingQueries,
        industryDistribution,
        seniorityDistribution,
      };
    }),

  pipelineMetrics: protectedProcedure
    .input(z.object({
      companyId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const pipelineData = await db.getPipelineMetrics({
        companyId: input.companyId,
        startDate: input.startDate,
        endDate: input.endDate,
      });
      return pipelineData;
    }),
});
