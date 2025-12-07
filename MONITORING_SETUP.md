# Monitoring Setup Guide - Ivy.AI Platform

**Status:** ✅ FAGOR Campaign Metrics Verified | ⏳ Sentry & UptimeRobot Pending Configuration  
**Date:** 25 de noviembre de 2025

---

## 📊 Current Monitoring Status

### ✅ FAGOR Campaign Metrics (Completed)

**Campaign Status:**
- **20 contactos** enrollados y activos
- **Email 1:** ✅ Enviado a todos (100%)
- **Email 2:** ⏳ Programado para Day 3 (27 nov 2025)
- **Email 3:** ⏳ Programado para Day 7 (1 dic 2025)
- **Respuestas:** 0 (esperadas después de Email 2 y 3)

**Empresas Contactadas:** 20 empresas manufactureras incluyendo:
- MARKFORGED
- LSP INDUSTRIAL CERAMICS
- JBT FOODTECH
- GUILLEVIN INTERNATIONAL
- QSI AUTOMATION
- METALMORPHOSIS INC
- Y 14 más...

**Herramienta de Monitoreo:**
```bash
# Ejecutar desde el proyecto:
node scripts/check-fagor-metrics.mjs
```

**Próximos Hitos:**
- **27 Nov 2025:** Email 2 se enviará automáticamente (Day 3)
- **1 Dic 2025:** Email 3 se enviará automáticamente (Day 7)

---

## 🔧 Sentry Error Tracking Setup

### Paso 1: Crear Cuenta en Sentry

1. **Registrarse:** https://sentry.io/signup/
2. **Crear Organización:** Nombre sugerido: "Ivy-AI"
3. **Crear Proyecto:**
   - Platform: **Node.js** (para backend)
   - Project name: **ivy-ai-platform**

### Paso 2: Obtener DSN

1. En Sentry Dashboard → Settings → Projects → ivy-ai-platform
2. Click en **Client Keys (DSN)**
3. Copiar el DSN (formato: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### Paso 3: Configurar en Railway

1. Ir a Railway Dashboard → ivy-ai-platform project
2. Click en **Variables**
3. Agregar nueva variable:
   ```
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
4. Deploy automáticamente

### Paso 4: Verificar Integración

Después del deploy, revisar logs de Railway:
```
[Sentry] Initialized for backend (env: production)
[Sentry] Initialized for frontend (env: production)
```

### Características Implementadas

**Backend (Node.js):**
- ✅ Captura automática de excepciones no manejadas
- ✅ Tracking de requests HTTP
- ✅ Performance monitoring (10% sample rate)
- ✅ Breadcrumbs para debugging
- ✅ User context tracking

**Frontend (React):**
- ✅ Captura automática de errores React
- ✅ Session Replay (10% de sesiones, 100% con errores)
- ✅ Performance monitoring
- ✅ Error Boundary integration
- ✅ User context tracking

### Archivos Creados

```
sentry.config.ts                    # Configuración compartida
server/_core/sentry.ts              # Backend integration
client/src/lib/sentry.ts            # Frontend integration
```

### Uso Manual

```typescript
// Backend
import { captureException, captureMessage } from './server/_core/sentry';

try {
  // código
} catch (error) {
  captureException(error, { context: 'additional info' });
}

// Frontend
import { captureException } from '@/lib/sentry';

try {
  // código
} catch (error) {
  captureException(error, { page: 'dashboard' });
}
```

---

## 📡 UptimeRobot Monitoring Setup

### Paso 1: Crear Cuenta

1. **Registrarse:** https://uptimerobot.com/signUp
2. Plan gratuito incluye:
   - 50 monitores
   - Checks cada 5 minutos
   - Alertas por email

### Paso 2: Crear Monitor HTTP(S)

1. Click en **Add New Monitor**
2. Configuración:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Ivy.AI Platform - Production
   URL: https://ivy-ai-platform-production.up.railway.app/
   Monitoring Interval: 5 minutes
   ```
3. Click **Create Monitor**

### Paso 3: Configurar Health Check Endpoint

El proyecto ya incluye un endpoint de health check:

```
GET /api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-25T22:00:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

### Paso 4: Agregar Monitor para Health Check

1. Crear segundo monitor en UptimeRobot:
   ```
   Monitor Type: HTTP(s)
   Friendly Name: Ivy.AI - Health Check
   URL: https://ivy-ai-platform-production.up.railway.app/api/health
   Monitoring Interval: 5 minutes
   ```

### Paso 5: Configurar Alertas

1. En UptimeRobot → Alert Contacts
2. Agregar tu email: `jcrobledolopez@gmail.com`
3. Configurar alertas:
   - ✅ When monitor goes down
   - ✅ When monitor comes back up
   - ⚠️ When monitor is slow (> 3000ms)

### Monitores Recomendados

| Monitor | URL | Propósito |
|---------|-----|-----------|
| **Main Site** | `https://ivy-ai-platform-production.up.railway.app/` | Frontend availability |
| **Health Check** | `https://ivy-ai-platform-production.up.railway.app/api/health` | Backend + DB status |
| **API Endpoint** | `https://ivy-ai-platform-production.up.railway.app/api/trpc/health` | tRPC API status |

---

## 📈 Railway Built-in Monitoring

Railway ya proporciona métricas básicas:

### Métricas Disponibles

1. **CPU Usage:**
   - Normal: < 50%
   - Alerta: > 80%

2. **Memory Usage:**
   - Normal: < 512 MB
   - Alerta: > 800 MB

3. **Network:**
   - Bandwidth usage
   - Request count

4. **Deployments:**
   - Build time
   - Deploy status
   - Logs

### Acceder a Métricas

1. Railway Dashboard → ivy-ai-platform
2. Click en **Metrics** tab
3. Revisar gráficas de CPU, Memory, Network

---

## 🔔 Alertas y Notificaciones

### Configuración de Alertas

**Railway:**
- Alertas automáticas por email en caso de:
  - Deploy fallido
  - Crash del servicio
  - Out of memory

**Sentry:**
- Configurar en: Settings → Alerts
- Alertas recomendadas:
  - Error rate > 5% en 1 hora
  - New issue created
  - Issue regression

**UptimeRobot:**
- Email automático cuando:
  - Monitor goes down
  - Monitor comes back up
  - Response time > 3 segundos

### Canales de Notificación

| Canal | Tipo | Configuración |
|-------|------|---------------|
| **Email** | Todas las alertas | `jcrobledolopez@gmail.com` |
| **Slack** | Opcional | Integrar con Sentry/UptimeRobot |
| **SMS** | Crítico | UptimeRobot Pro plan |

---

## 📊 Dashboard Consolidado

### Opción 1: Sentry Dashboard

Sentry proporciona un dashboard unificado con:
- Error tracking
- Performance metrics
- Release tracking
- User feedback

**URL:** https://sentry.io/organizations/[your-org]/issues/

### Opción 2: Railway Dashboard

Railway proporciona:
- Service health
- Resource usage
- Deployment history
- Logs en tiempo real

**URL:** https://railway.app/project/d1cda8a3-f000-4cdf-a981-0432ad3ed581

### Opción 3: Custom Dashboard (Opcional)

Crear dashboard personalizado con:
- Grafana + Prometheus
- Datadog
- New Relic

---

## 🚨 Incident Response

### Proceso de Respuesta

1. **Detección:**
   - Alerta recibida (UptimeRobot, Sentry, Railway)

2. **Investigación:**
   - Revisar logs en Railway
   - Revisar errores en Sentry
   - Verificar métricas de recursos

3. **Mitigación:**
   - Rollback a checkpoint anterior si es necesario
   - Restart del servicio en Railway
   - Fix y deploy de hotfix

4. **Documentación:**
   - Registrar incidente en Sentry
   - Actualizar runbook si es necesario

### Comandos Útiles

```bash
# Rollback a checkpoint anterior
# (usar webdev_rollback_checkpoint en Manus)

# Verificar logs en Railway
# Railway Dashboard → Deployments → Logs

# Verificar métricas FAGOR
node scripts/check-fagor-metrics.mjs

# Verificar SendGrid stats
node scripts/check-sendgrid-stats.mjs
```

---

## 📝 Checklist de Monitoring

### Configuración Inicial
- [x] FAGOR campaign metrics verificadas
- [ ] Sentry DSN configurado en Railway
- [ ] UptimeRobot monitors creados
- [ ] Email alerts configuradas
- [ ] Health check endpoint verificado

### Monitoreo Diario
- [ ] Revisar Railway metrics (CPU, Memory)
- [ ] Revisar Sentry errors (si hay nuevos)
- [ ] Verificar UptimeRobot status (uptime %)
- [ ] Revisar FAGOR drip scheduler logs

### Monitoreo Semanal
- [ ] Revisar FAGOR campaign metrics
- [ ] Analizar SendGrid delivery rates
- [ ] Revisar performance trends en Sentry
- [ ] Verificar storage usage en Railway

---

## 🔗 Enlaces Útiles

| Servicio | URL | Propósito |
|----------|-----|-----------|
| **Railway Dashboard** | https://railway.app/project/d1cda8a3-f000-4cdf-a981-0432ad3ed581 | Deployment & logs |
| **Sentry** | https://sentry.io | Error tracking |
| **UptimeRobot** | https://uptimerobot.com | Uptime monitoring |
| **SendGrid** | https://app.sendgrid.com | Email analytics |
| **GitHub Repo** | https://github.com/sales440/ivy-ai-platform | Source code |

---

## 📞 Soporte

**Email:** jcrobledolopez@gmail.com  
**GitHub Issues:** https://github.com/sales440/ivy-ai-platform/issues

---

## 🎯 Próximos Pasos

1. **Configurar Sentry DSN** en Railway (5 minutos)
2. **Crear monitores en UptimeRobot** (10 minutos)
3. **Configurar alertas por email** (5 minutos)
4. **Verificar que alertas funcionen** (test manual)
5. **Documentar en runbook** cualquier incidente futuro

**Total tiempo estimado:** 30 minutos

---

**Última actualización:** 25 de noviembre de 2025  
**Versión:** 1.0
