import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initSentry, addSentryErrorHandler } from "./sentry";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Initialize Sentry (must be first)
  // TEMPORARILY DISABLED - Sentry causing crashes
  // initSentry(app);
  
  // Initialize WebSocket server for real-time notifications
  const { initializeWebSocket } = await import("../websocket-notifications");
  initializeWebSocket(server);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health check endpoint (before OAuth for load balancers)
  app.get("/health", async (req, res) => {
    const { isHealthy, getHealthStatus } = await import("./health");
    const healthy = await isHealthy();
    
    if (healthy) {
      const status = await getHealthStatus();
      res.status(200).json(status);
    } else {
      const status = await getHealthStatus();
      res.status(503).json(status);
    }
  });

  // Simple ping endpoint for basic checks
  app.get("/ping", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Debug endpoint to check environment variables (TEMPORARY)
  app.get("/debug-env", (req, res) => {
    res.status(200).json({
      hasBuiltInForgeApiKey: !!process.env.BUILT_IN_FORGE_API_KEY,
      hasBuiltInForgeApiUrl: !!process.env.BUILT_IN_FORGE_API_URL,
      builtInForgeApiUrl: process.env.BUILT_IN_FORGE_API_URL,
      hasViteFrontendForgeApiKey: !!process.env.VITE_FRONTEND_FORGE_API_KEY,
      hasViteFrontendForgeApiUrl: !!process.env.VITE_FRONTEND_FORGE_API_URL,
      nodeEnv: process.env.NODE_ENV,
    });
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Telnyx webhook endpoint
  app.post("/api/webhooks/telnyx", async (req, res) => {
    const { handleTelnyxWebhook } = await import("../webhooks/telnyx-webhook");
    return handleTelnyxWebhook(req, res);
  });

  // Gmail webhook endpoints
  const { gmailWebhookRouter } = await import("../webhooks/gmail-webhook");
  app.use("/api/webhooks", gmailWebhookRouter);

  // SendGrid webhook endpoints
  const { sendgridWebhookRouter } = await import("../webhooks/sendgrid-webhook");
  app.use("/api/webhooks", sendgridWebhookRouter);
  
  // SSE notifications endpoint
  const notificationsSSERouter = (await import("../routes/notifications-sse")).default;
  app.use("/api/notifications", notificationsSSERouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Add Sentry error handler (must be after all routes)
  // TEMPORARILY DISABLED - Sentry causing crashes
  // addSentryErrorHandler(app);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start scheduled tasks processor
    const { startScheduledTasksProcessor } = await import('../scheduled-tasks-processor');
    startScheduledTasksProcessor();

    // Start FAGOR drip campaign scheduler
    const { startFagorDripScheduler } = await import('../fagor-drip-scheduler');
    startFagorDripScheduler();

    // Start agent milestone checker (runs every hour)
    const { scheduledMilestoneCheck } = await import('../agent-milestone-notifications');
    setInterval(() => {
      scheduledMilestoneCheck().catch(err => {
        console.error('[AgentMilestones] Error in scheduled check:', err);
      });
    }, 60 * 60 * 1000); // Every hour
    // Run initial check after 1 minute
    setTimeout(() => {
      scheduledMilestoneCheck().catch(err => {
        console.error('[AgentMilestones] Error in initial check:', err);
      });
    }, 60 * 1000);

    // Start Meta-Agent (autonomous maintenance system)
    const { startMetaAgent } = await import('../meta-agent-startup');
    setTimeout(() => {
      startMetaAgent().catch(err => {
        console.error('[Meta-Agent] Error starting Meta-Agent:', err);
      });
    }, 5000); // Start after 5 seconds to allow server to fully initialize
  });
}

startServer().catch(console.error);
