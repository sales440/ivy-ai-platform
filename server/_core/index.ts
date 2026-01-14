import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeROPA } from "../ropa-autonomous";
import { handleGoogleCallback } from "../google-callback-handler";
import { initializeBackupScheduler } from "../backup-scheduler";
import { initializeCleanupScheduler } from "../backup-retention";
import { startPerformanceMonitoring } from "../performance-monitor";

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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health check endpoint for Railway
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Google Drive OAuth callback
  app.get("/api/google/callback", handleGoogleCallback);
  
  // Google Drive OAuth initiation - redirect to Google
  app.get("/api/google-drive/auth", (req, res) => {
    const { getAuthUrl } = require("../google-drive");
    const authUrl = getAuthUrl();
    res.redirect(authUrl);
  });
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

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Initialize ROPA autonomous system
    try {
      await initializeROPA();
    } catch (error) {
      console.error("[ROPA] Failed to initialize:", error);
    }
    
    // Initialize automatic backup scheduler
    try {
      initializeBackupScheduler();
    } catch (error) {
      console.error("[Backup Scheduler] Failed to initialize:", error);
    }
    
    // Initialize automatic cleanup scheduler
    try {
      initializeCleanupScheduler();
    } catch (error) {
      console.error("[Backup Retention] Failed to initialize:", error);
    }
    
    // Start performance monitoring (every 1 minute)
    try {
      startPerformanceMonitoring(60000);
    } catch (error) {
      console.error("[Performance Monitor] Failed to initialize:", error);
    }
  });
}

startServer().catch(console.error);
