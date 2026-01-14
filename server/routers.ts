import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { ropaRouter } from "./ropa-router";
import { campaignsRouter } from "./campaigns-router";
import { campaignContentRouter } from "./campaign-content-router";
import { campaignManagementRouter } from "./campaign-management-router";
import { agentOrchestrationRouter } from "./agent-orchestration";
import { browserAutomationRouter } from "./browser-automation-router";
import { abTestingRouter } from "./ab-testing-router";
import { predictiveAnalyticsRouter } from "./predictive-analytics-router";
import { fileUploadRouter } from "./file-upload-router";
import { googleDriveRouter } from "./google-drive-router";
import { performanceRouter } from "./performance-router";
import { clientManagementRouter } from "./client-management";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ROPA (Meta-Agent) Router
  ropa: ropaRouter,

  // Sales Campaigns Router
  campaigns: campaignsRouter,

  // Campaign Content Validation Router
  campaignContent: campaignContentRouter,

  // Campaign Management Router (ROPA full control)
  campaignManagement: campaignManagementRouter,

  // Agent Orchestration Router (ROPA agent management)
  agentOrchestration: agentOrchestrationRouter,

  // Browser Automation Router (ROPA browser control)
  browserAutomation: browserAutomationRouter,

  // A/B Testing Router (Campaign optimization)
  abTesting: abTestingRouter,

  // Predictive Analytics Router (ML predictions)
  predictiveAnalytics: predictiveAnalyticsRouter,

  // File Upload Router (Company files management)
  fileUpload: fileUploadRouter,

  // Google Drive Router (Centralized storage)
  googleDrive: googleDriveRouter,
  performance: performanceRouter,

  // Client Management Router (ID único + Google Drive)
  clients: clientManagementRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
