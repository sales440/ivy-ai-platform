/**
 * Health Check Endpoint
 * 
 * Verifies that all critical services are operational:
 * - Database connection
 * - External API availability
 * - System resources
 */

import { getDb } from '../db';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    llm: ServiceHealth;
    memory: ServiceHealth;
  };
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  error?: string;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) {
      return {
        status: 'down',
        error: 'Database connection not available',
      };
    }

    // Simple query to verify connection
    await db.execute('SELECT 1');
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error: any) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Check LLM service availability
 */
async function checkLLM(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    // Check if LLM environment variables are set
    const hasForgeAPI = !!process.env.BUILT_IN_FORGE_API_URL && !!process.env.BUILT_IN_FORGE_API_KEY;
    
    if (!hasForgeAPI) {
      return {
        status: 'degraded',
        error: 'LLM API credentials not configured',
      };
    }

    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error: any) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Check memory service (agent memory)
 */
async function checkMemory(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) {
      return {
        status: 'degraded',
        error: 'Database not available for memory service',
      };
    }

    // Check if memory tables exist
    await db.execute('SELECT 1 FROM agentMemory LIMIT 1');
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error: any) {
    // If table doesn't exist yet, it's degraded but not down
    if (error.message.includes('doesn\'t exist')) {
      return {
        status: 'degraded',
        responseTime: Date.now() - start,
        error: 'Memory tables not yet migrated',
      };
    }
    
    return {
      status: 'down',
      responseTime: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Get overall health status
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const [database, llm, memory] = await Promise.all([
    checkDatabase(),
    checkLLM(),
    checkMemory(),
  ]);

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  if (database.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (
    database.status === 'degraded' ||
    llm.status === 'degraded' ||
    memory.status === 'degraded'
  ) {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database,
      llm,
      memory,
    },
    system: {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    },
  };
}

/**
 * Simple health check for load balancers
 * Returns 200 if healthy, 503 if unhealthy
 */
export async function isHealthy(): Promise<boolean> {
  try {
    const health = await getHealthStatus();
    return health.status !== 'unhealthy';
  } catch (error) {
    console.error('[Health Check] Error checking health:', error);
    return false;
  }
}
