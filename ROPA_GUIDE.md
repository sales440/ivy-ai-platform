# 🤖 ROPA - Guía Completa de Uso

## ¿Qué es ROPA?

**ROPA** (Robotic Operational Process Automation) es el sistema autónomo de IA que mantiene la plataforma Ivy.AI funcionando 24/7. Anteriormente conocido como "Meta-Agent", ahora ha sido completamente optimizado y renombrado.

## 🚀 Características Principales

### Sistema Autónomo 24/7
- ✅ **Auto-inicialización**: Se inicia automáticamente con el servidor
- ✅ **Health Checks**: Cada 2 minutos verifica la salud del sistema
- ✅ **Mantenimiento**: Cada 30 minutos ejecuta tareas de optimización
- ✅ **Market Intelligence**: Cada 6 horas analiza tendencias del mercado
- ✅ **Auto-healing**: Detecta y corrige problemas automáticamente

### 50+ Herramientas Autónomas

**1. Agent Management (12 herramientas)**
- createAgent, trainAgent, cloneAgent, deleteAgent
- getAgentMetrics, optimizeAgentPerformance
- autoAssignLeads, retrainUnderperformingAgents
- balanceAgentWorkload, detectAgentAnomalies
- generateAgentReport, scheduleAgentMaintenance

**2. Database Management (8 herramientas)**
- runDatabaseMigration, backupDatabase
- optimizeDatabaseIndexes, cleanupOldData
- analyzeDatabasePerformance, repairDatabaseTables
- syncDatabaseReplicas, monitorDatabaseHealth

**3. Monitoring & Health (10 herramientas)**
- checkPlatformHealth, analyzeSystemLogs
- detectAnomalies, monitorAPIPerformance
- trackResourceUsage, detectSecurityThreats
- monitorUserActivity, checkServiceAvailability
- generateHealthReport, alertOnCriticalIssues

**4. Campaigns & Workflows (12 herramientas)**
- pauseCampaign, resumeCampaign
- optimizeCampaignTiming, analyzeCampaignROI
- autoCreateFollowUps, segmentAudience
- optimizeWorkflow, detectCampaignIssues
- autoAdjustBudget, generateCampaignInsights
- scheduleCampaignOptimization, cloneBestPerformingCampaign

**5. Code & Deployment (8 herramientas)**
- fixTypeScriptErrors, runTests
- deployToProduction, rollbackDeployment
- optimizeCodePerformance, runSecurityScan
- updateDependencies, generateCodeDocumentation

## 📊 Dashboard de ROPA

### Acceso
- URL: `/ropa` o `/ropa-dashboard`
- No requiere autenticación (público)

### Componentes

**Stats Cards (4 tarjetas)**
1. **System Status**: Estado actual (RUNNING/STOPPED)
2. **Platform Health**: Salud general del sistema
3. **TypeScript Errors**: Errores actuales y corregidos
4. **Tasks Completed**: Tareas completadas y en ejecución

**Tabs (4 pestañas)**
1. **💬 Chat**: Interfaz conversacional con ROPA
   - Pregunta cualquier cosa sobre el sistema
   - ROPA responde en español
   - Historial de conversación guardado

2. **⏰ Tasks**: Tareas ejecutadas por ROPA
   - Ver tareas recientes
   - Estado de cada tarea (pending, running, completed, failed)
   - Detalles de ejecución

3. **⚠️ Alerts**: Alertas del sistema
   - Alertas críticas, errores y advertencias
   - Estado de resolución
   - Timestamp de cada alerta

4. **📊 Health**: Métricas de salud
   - Success Rate (tasa de éxito)
   - Avg Response Time (tiempo de respuesta promedio)
   - Total Tasks (total de tareas)

### Auto-Refresh
- Stats: cada 5 segundos
- Status: cada 3 segundos
- Tasks: cada 5 segundos
- Alerts: cada 10 segundos

## 🛠️ API de ROPA (tRPC)

### Endpoints Disponibles

**Status & Stats**
```typescript
trpc.ropa.getStatus.useQuery()
trpc.ropa.getDashboardStats.useQuery()
trpc.ropa.getPlatformHealth.useQuery()
```

**Tasks**
```typescript
trpc.ropa.getTasks.useQuery()
trpc.ropa.getTaskById.useQuery({ taskId: "..." })
trpc.ropa.createTask.useMutation()
```

**Chat**
```typescript
trpc.ropa.getChatHistory.useQuery()
trpc.ropa.sendChatMessage.useMutation({ message: "..." })
```

**Tools**
```typescript
trpc.ropa.listTools.useQuery()
trpc.ropa.executeTool.useMutation({ toolName: "...", params: {...} })
```

**Control**
```typescript
trpc.ropa.start.useMutation()
trpc.ropa.stop.useMutation()
trpc.ropa.runAudit.useMutation()
```

**TypeScript**
```typescript
trpc.ropa.getTypeScriptErrors.useQuery()
trpc.ropa.fixTypeScriptErrors.useMutation()
```

**Alerts & Logs**
```typescript
trpc.ropa.getAlerts.useQuery()
trpc.ropa.getLogs.useQuery({ limit: 100 })
```

## 💾 Base de Datos

### Tablas Creadas

1. **ropa_tasks**: Tareas ejecutadas por ROPA
2. **ropa_logs**: Logs detallados de operaciones
3. **ropa_metrics**: Métricas de rendimiento
4. **ropa_config**: Configuración del sistema
5. **ropa_chat_history**: Historial de chat
6. **ropa_learning**: Patrones de aprendizaje
7. **ropa_alerts**: Alertas del sistema

## 🔧 Uso Programático

### Ejecutar una herramienta desde código

```typescript
import { ropaTools } from "./server/ropa-tools";

// Ejecutar health check
const health = await ropaTools.checkPlatformHealth();
console.log(health);

// Crear backup de base de datos
const backup = await ropaTools.backupDatabase();
console.log(backup.backupId);

// Entrenar un agente
const training = await ropaTools.trainAgent({
  agentId: "agent_123",
  trainingData: {...}
});
```

### Acceder a datos de ROPA

```typescript
import { getRopaStats, getRecentRopaTasks } from "./server/ropa-db";

// Obtener estadísticas
const stats = await getRopaStats();
console.log(stats.successRate);

// Obtener tareas recientes
const tasks = await getRecentRopaTasks(50);
console.log(tasks);
```

## 🎯 Comandos de Chat

Puedes hablar con ROPA en lenguaje natural. Ejemplos:

- "¿Cómo está la plataforma?"
- "¿Cuántos agentes están activos?"
- "Crea un backup de la base de datos"
- "Optimiza el rendimiento"
- "¿Cuántas tareas has completado hoy?"
- "Muéstrame las métricas de salud"

## 📈 Monitoreo

### Logs del Servidor

ROPA registra su actividad en los logs del servidor:

```
[ROPA] 🤖 Initializing autonomous operations...
[ROPA] ✅ Autonomous operations started
[ROPA] Health check completed: 98.5%
[ROPA] Maintenance cycle completed: 12 tasks
```

### Base de Datos

Consulta directamente las tablas de ROPA:

```sql
-- Ver tareas recientes
SELECT * FROM ropa_tasks ORDER BY created_at DESC LIMIT 10;

-- Ver logs de errores
SELECT * FROM ropa_logs WHERE level = 'error' ORDER BY timestamp DESC;

-- Ver alertas no resueltas
SELECT * FROM ropa_alerts WHERE resolved = FALSE;
```

## 🔒 Seguridad

- **Endpoints públicos**: getStatus, getDashboardStats, getTasks, getChatHistory, listTools
- **Endpoints protegidos**: createTask, sendChatMessage, executeTool, start, stop, runAudit

Los endpoints protegidos requieren autenticación de usuario.

## 🚦 Estado del Sistema

### Verificar si ROPA está corriendo

```typescript
const status = await trpc.ropa.getStatus.useQuery();
console.log(status.isRunning); // true/false
console.log(status.status); // "running" | "idle"
```

### Iniciar/Detener ROPA

```typescript
// Iniciar
await trpc.ropa.start.useMutation();

// Detener
await trpc.ropa.stop.useMutation();
```

### Ejecutar Auditoría Completa

```typescript
const audit = await trpc.ropa.runAudit.useMutation();
console.log(audit.results);
// {
//   platform: { health: "healthy", score: 98.5 },
//   database: { health: "excellent", score: 98 },
//   api: { avgResponseTime: 125, errorRate: 0.1 }
// }
```

## 🧪 Testing

Se incluyen 16 tests unitarios que verifican:

- Registro de herramientas
- Ejecución de herramientas
- Operaciones de base de datos
- Gestión de agentes
- Herramientas de campaña
- Herramientas de código

Ejecutar tests:

```bash
pnpm test server/ropa.test.ts
```

## 📝 Notas Importantes

1. **Auto-inicialización**: ROPA se inicia automáticamente cuando el servidor arranca
2. **Persistencia**: Todos los datos se guardan en la base de datos
3. **Escalabilidad**: El sistema está diseñado para manejar múltiples tareas concurrentes
4. **Extensibilidad**: Fácil agregar nuevas herramientas en `server/ropa-tools.ts`

## 🎉 ¡Listo para Usar!

ROPA está completamente operativo y funcionando de manera autónoma. Accede al dashboard en `/ropa` para ver el sistema en acción.
