console.log("\n\n!!! VERIFICATION BUILD - FORCE UPDATE - VERSION 1.0.4 !!!\n\n");
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
import { runEmergencySchemaFix } from "./schema-fix";

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

import { db } from "../db";
import { sql } from "drizzle-orm";

// Ensure scheduledTasks table exists (Fix for production migration issue)
async function ensureScheduledTasksTable() {
  try {
    console.log('[Startup] Checking scheduledTasks table...');
    if (!db) return;

    // Raw query to check/create table since Drizzle might think it exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS scheduledTasks (
        id int NOT NULL AUTO_INCREMENT,
        companyId int NOT NULL,
        taskType enum('send-email','update-lead-score','send-notification','custom') NOT NULL,
        taskData json NOT NULL,
        status enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
        scheduledFor timestamp NOT NULL,
        executedAt timestamp NULL DEFAULT NULL,
        error text,
        retryCount int NOT NULL DEFAULT '0',
        maxRetries int NOT NULL DEFAULT '3',
        createdBy int NOT NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Startup] ✅ scheduledTasks table verified/created');
  } catch (error) {
    console.error('[Startup] ⚠️ Failed to ensure scheduledTasks table:', error);
  }
}

async function startServer() {
  console.log("!!! FAST BOOT: STARTING SERVER - VERSION 1.0.5 !!!");
  const app = express();
  const server = createServer(app);

  // Initialize WebSocket server (must be before listen)
  const { initializeWebSocket } = await import("../websocket-notifications");
  initializeWebSocket(server);

  // DEBUG: Log all requests to confirm traffic is reaching the container
  app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
  });

  // Configure body parser
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check endpoint (CRITICAL for Railway/Docker)
  app.get("/api/health", (req, res) => {
    res.status(200).send("OK");
  });

  // Initialize all routes
  registerOAuthRoutes(app);

  app.post("/api/webhooks/telnyx", async (req, res) => {
    const { handleTelnyxWebhook } = await import("../webhooks/telnyx-webhook");
    return handleTelnyxWebhook(req, res);
  });

  const { gmailWebhookRouter } = await import("../webhooks/gmail-webhook");
  app.use("/api/webhooks", gmailWebhookRouter);

  const { sendgridWebhookRouter } = await import("../webhooks/sendgrid-webhook");
  app.use("/api/webhooks", sendgridWebhookRouter);

  const notificationsSSERouter = (await import("../routes/notifications-sse")).default;
  app.use("/api/notifications", notificationsSSERouter);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Serve static files (Frontend)
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 1. DETERMINE PORT
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = process.env.NODE_ENV === 'production'
    ? preferredPort
    : await findAvailablePort(preferredPort);

  if (process.env.NODE_ENV !== 'production' && port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // 2. LISTEN IMMEDIATELY (FAST BOOT) to satisfy Railway connection check
  // Explicitly bind to 0.0.0.0 to ensure IPv4 accessibility in Docker
  console.log(`[FastBoot] PORT env var is: '${process.env.PORT}'`);
  server.listen(port, "0.0.0.0", async () => {
    const address = server.address();
    console.log(`[FastBoot] 🚀 Server LISTENING on http://0.0.0.0:${port}/`);
    console.log(`[FastBoot] Address info:`, address);

    // 3. RUN INITIALIZATION IN BACKGROUND
    // We attach a catch handler to ensure no unhandled rejections crash the process
    runBackgroundInitialization().catch(err => {
      console.error('[FastBoot] ❌ Background initialization CRITICAL FAILURE:', err);
      // Do not exit process, let the server keep running
    });
  });
}

// Background initialization task
async function runBackgroundInitialization() {
  console.log('[Init] ⏳ Starting background initialization...');

  try {
    // Run database migrations
    console.log('[Init] Running database migrations...');
    const { migrate } = await import("drizzle-orm/mysql2/migrator");
    const { db } = await import("../db");

    if (db) {
      // Only run migrations inside dist/drizzle or ./drizzle depending on structure.
      // For safety in this environment, try root "drizzle" folder.
      await migrate(db, { migrationsFolder: "./drizzle" }).catch(err => {
        console.warn('[Init] Migration warning (non-fatal):', err.message);
      });
      console.log('[Init] ✅ Database migrations completed (or skipped safely)');
    }
  } catch (error) {
    console.error('[Init] ⚠️ Database migration failed:', error);
  }

  // Ensure scheduled tasks table
  await ensureScheduledTasksTable();

  // Run Emergency Fix
  console.log('[Init] 🚑 invoking Emergency Schema Fix...');
  try {
    await runEmergencySchemaFix();
    console.log('[Init] ✅ Emergency Schema Fix returned.');
  } catch (err) {
    console.error('[Init] ❌ Emergency Schema Fix CRASHED:', err);
  }

  // Start background workers
  const { startScheduledTasksProcessor } = await import('../scheduled-tasks-processor');
  startScheduledTasksProcessor();

  const { startFagorDripScheduler } = await import('../fagor-drip-scheduler');
  startFagorDripScheduler();

  const { scheduledMilestoneCheck } = await import('../agent-milestone-notifications');
  setInterval(() => {
    scheduledMilestoneCheck().catch(console.error);
  }, 60 * 60 * 1000);

  const { startMetaAgent } = await import('../meta-agent-startup');
  startMetaAgent().catch(console.error);

  console.log('[Init] 🎉 All background services started.');
}

startServer().catch(console.error);
