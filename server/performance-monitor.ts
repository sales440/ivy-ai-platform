import os from "os";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";

/**
 * Performance Monitoring Service
 * Collects system metrics and detects anomalies
 */

export interface PerformanceMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // Percentage
    loadAverage: number[];
  };
  memory: {
    total: number; // MB
    used: number; // MB
    free: number; // MB
    usagePercent: number;
  };
  database: {
    activeConnections: number;
    responseTime: number; // ms
    errorRate: number; // Percentage
  };
  server: {
    uptime: number; // seconds
    requestCount: number;
    averageResponseTime: number; // ms
    errorCount: number;
  };
}

export interface AnomalyAlert {
  type: "cpu" | "memory" | "database" | "server";
  severity: "warning" | "critical";
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

// Thresholds for anomaly detection
const THRESHOLDS = {
  cpu: {
    warning: 70, // 70% CPU usage
    critical: 90, // 90% CPU usage
  },
  memory: {
    warning: 75, // 75% memory usage
    critical: 90, // 90% memory usage
  },
  database: {
    responseTime: {
      warning: 1000, // 1 second
      critical: 3000, // 3 seconds
    },
    errorRate: {
      warning: 5, // 5% error rate
      critical: 10, // 10% error rate
    },
  },
  server: {
    responseTime: {
      warning: 500, // 500ms
      critical: 2000, // 2 seconds
    },
    errorRate: {
      warning: 5, // 5% error rate
      critical: 10, // 10% error rate
    },
  },
};

// In-memory metrics storage (last 100 data points)
const metricsHistory: PerformanceMetrics[] = [];
const MAX_HISTORY_SIZE = 100;

// Request tracking
let requestCount = 0;
let totalResponseTime = 0;
let errorCount = 0;
let lastResetTime = Date.now();

/**
 * Track incoming request
 */
export function trackRequest(responseTime: number, isError: boolean = false) {
  requestCount++;
  totalResponseTime += responseTime;
  if (isError) errorCount++;
}

/**
 * Reset request tracking (called every monitoring interval)
 */
function resetRequestTracking() {
  requestCount = 0;
  totalResponseTime = 0;
  errorCount = 0;
  lastResetTime = Date.now();
}

/**
 * Collect current performance metrics
 */
export async function collectMetrics(): Promise<PerformanceMetrics> {
  // CPU metrics
  const cpus = os.cpus();
  const cpuUsage = cpus.reduce((acc, cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    const idle = cpu.times.idle;
    return acc + ((total - idle) / total) * 100;
  }, 0) / cpus.length;

  // Memory metrics
  const totalMem = os.totalmem() / (1024 * 1024); // Convert to MB
  const freeMem = os.freemem() / (1024 * 1024);
  const usedMem = totalMem - freeMem;
  const memUsagePercent = (usedMem / totalMem) * 100;

  // Database metrics
  let dbMetrics = {
    activeConnections: 0,
    responseTime: 0,
    errorRate: 0,
  };

  try {
    const db = await getDb();
    if (db) {
      const startTime = Date.now();
      await db.execute("SELECT 1");
      const responseTime = Date.now() - startTime;
      
      dbMetrics = {
        activeConnections: 1, // Simplified - would need connection pool stats
        responseTime,
        errorRate: 0, // Would track from error logs
      };
    }
  } catch (error) {
    dbMetrics.errorRate = 100;
    dbMetrics.responseTime = 5000; // Timeout
  }

  // Server metrics
  const uptime = process.uptime();
  const avgResponseTime = requestCount > 0 ? totalResponseTime / requestCount : 0;
  const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

  const metrics: PerformanceMetrics = {
    timestamp: new Date(),
    cpu: {
      usage: cpuUsage,
      loadAverage: os.loadavg(),
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usagePercent: memUsagePercent,
    },
    database: dbMetrics,
    server: {
      uptime,
      requestCount,
      averageResponseTime: avgResponseTime,
      errorCount,
    },
  };

  // Store in history
  metricsHistory.push(metrics);
  if (metricsHistory.length > MAX_HISTORY_SIZE) {
    metricsHistory.shift();
  }

  // Reset request tracking for next interval
  resetRequestTracking();

  return metrics;
}

/**
 * Detect anomalies in current metrics
 */
export function detectAnomalies(metrics: PerformanceMetrics): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  // CPU anomalies
  if (metrics.cpu.usage >= THRESHOLDS.cpu.critical) {
    alerts.push({
      type: "cpu",
      severity: "critical",
      message: `CPU usage crítico: ${metrics.cpu.usage.toFixed(1)}%`,
      value: metrics.cpu.usage,
      threshold: THRESHOLDS.cpu.critical,
      timestamp: metrics.timestamp,
    });
  } else if (metrics.cpu.usage >= THRESHOLDS.cpu.warning) {
    alerts.push({
      type: "cpu",
      severity: "warning",
      message: `CPU usage alto: ${metrics.cpu.usage.toFixed(1)}%`,
      value: metrics.cpu.usage,
      threshold: THRESHOLDS.cpu.warning,
      timestamp: metrics.timestamp,
    });
  }

  // Memory anomalies
  if (metrics.memory.usagePercent >= THRESHOLDS.memory.critical) {
    alerts.push({
      type: "memory",
      severity: "critical",
      message: `Memoria crítica: ${metrics.memory.usagePercent.toFixed(1)}% (${metrics.memory.used.toFixed(0)}MB/${metrics.memory.total.toFixed(0)}MB)`,
      value: metrics.memory.usagePercent,
      threshold: THRESHOLDS.memory.critical,
      timestamp: metrics.timestamp,
    });
  } else if (metrics.memory.usagePercent >= THRESHOLDS.memory.warning) {
    alerts.push({
      type: "memory",
      severity: "warning",
      message: `Memoria alta: ${metrics.memory.usagePercent.toFixed(1)}% (${metrics.memory.used.toFixed(0)}MB/${metrics.memory.total.toFixed(0)}MB)`,
      value: metrics.memory.usagePercent,
      threshold: THRESHOLDS.memory.warning,
      timestamp: metrics.timestamp,
    });
  }

  // Database anomalies
  if (metrics.database.responseTime >= THRESHOLDS.database.responseTime.critical) {
    alerts.push({
      type: "database",
      severity: "critical",
      message: `Base de datos lenta: ${metrics.database.responseTime}ms`,
      value: metrics.database.responseTime,
      threshold: THRESHOLDS.database.responseTime.critical,
      timestamp: metrics.timestamp,
    });
  } else if (metrics.database.responseTime >= THRESHOLDS.database.responseTime.warning) {
    alerts.push({
      type: "database",
      severity: "warning",
      message: `Base de datos lenta: ${metrics.database.responseTime}ms`,
      value: metrics.database.responseTime,
      threshold: THRESHOLDS.database.responseTime.warning,
      timestamp: metrics.timestamp,
    });
  }

  if (metrics.database.errorRate >= THRESHOLDS.database.errorRate.critical) {
    alerts.push({
      type: "database",
      severity: "critical",
      message: `Errores de base de datos: ${metrics.database.errorRate.toFixed(1)}%`,
      value: metrics.database.errorRate,
      threshold: THRESHOLDS.database.errorRate.critical,
      timestamp: metrics.timestamp,
    });
  }

  // Server anomalies
  const serverErrorRate = metrics.server.requestCount > 0 
    ? (metrics.server.errorCount / metrics.server.requestCount) * 100 
    : 0;

  if (serverErrorRate >= THRESHOLDS.server.errorRate.critical) {
    alerts.push({
      type: "server",
      severity: "critical",
      message: `Tasa de errores alta: ${serverErrorRate.toFixed(1)}% (${metrics.server.errorCount}/${metrics.server.requestCount})`,
      value: serverErrorRate,
      threshold: THRESHOLDS.server.errorRate.critical,
      timestamp: metrics.timestamp,
    });
  }

  if (metrics.server.averageResponseTime >= THRESHOLDS.server.responseTime.critical) {
    alerts.push({
      type: "server",
      severity: "critical",
      message: `Servidor lento: ${metrics.server.averageResponseTime.toFixed(0)}ms promedio`,
      value: metrics.server.averageResponseTime,
      threshold: THRESHOLDS.server.responseTime.critical,
      timestamp: metrics.timestamp,
    });
  }

  return alerts;
}

/**
 * Send alert notifications
 */
async function sendAlertNotifications(alerts: AnomalyAlert[]) {
  if (alerts.length === 0) return;

  // Group alerts by severity
  const critical = alerts.filter(a => a.severity === "critical");
  const warnings = alerts.filter(a => a.severity === "warning");

  if (critical.length > 0) {
    const message = `🚨 ALERTAS CRÍTICAS:\n\n${critical.map(a => `• ${a.message}`).join("\n")}`;
    // Email notifications disabled to avoid inbox spam
    // await notifyOwner({
    //   title: "⚠️ Anomalías Críticas Detectadas",
    //   content: message,
    // });
    console.log("[Performance Monitor] Critical anomalies detected (email disabled):", message);
  } else if (warnings.length > 0) {
    const message = `⚠️ ADVERTENCIAS:\n\n${warnings.map(a => `• ${a.message}`).join("\n")}`;
    // Email notifications disabled to avoid inbox spam
    // await notifyOwner({
    //   title: "⚠️ Advertencias de Rendimiento",
    //   content: message,
    // });
    console.log("[Performance Monitor] Warning anomalies detected (email disabled):", message);
  }
}

/**
 * Get metrics history
 */
export function getMetricsHistory(): PerformanceMetrics[] {
  return [...metricsHistory];
}

/**
 * Get latest metrics
 */
export function getLatestMetrics(): PerformanceMetrics | null {
  return metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1] : null;
}

/**
 * Start performance monitoring
 */
let monitoringInterval: NodeJS.Timeout | null = null;

export function startPerformanceMonitoring(intervalMs: number = 300000) {
  if (monitoringInterval) {
    console.log("[Performance Monitor] Already running");
    return;
  }

  console.log(`[Performance Monitor] Starting with ${intervalMs}ms interval`);

  // Initial collection
  collectMetrics().then(metrics => {
    const anomalies = detectAnomalies(metrics);
    if (anomalies.length > 0) {
      console.log(`[Performance Monitor] Detected ${anomalies.length} anomalies`);
      sendAlertNotifications(anomalies);
    }
  });

  // Periodic collection
  monitoringInterval = setInterval(async () => {
    try {
      const metrics = await collectMetrics();
      const anomalies = detectAnomalies(metrics);
      
      if (anomalies.length > 0) {
        console.log(`[Performance Monitor] Detected ${anomalies.length} anomalies:`, 
          anomalies.map(a => `${a.type}:${a.severity}`).join(", "));
        await sendAlertNotifications(anomalies);
      }
    } catch (error) {
      console.error("[Performance Monitor] Error collecting metrics:", error);
    }
  }, intervalMs);

  console.log("[Performance Monitor] ✅ Started successfully");
}

/**
 * Stop performance monitoring
 */
export function stopPerformanceMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log("[Performance Monitor] Stopped");
  }
}
