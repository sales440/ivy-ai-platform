# Ivy.AI — Guía de Deployment en Railway

## Repositorio GitHub
```
https://github.com/rpcommercegroup-svg/ivy-ai-platform
```

## URL de Producción Actual
```
https://upbeat-creativity-production-27ac.up.railway.app
```

---

## Pasos para conectar Railway con GitHub

1. Ve a [railway.app](https://railway.app) → tu proyecto `upbeat-creativity-production`
2. **Settings → Source** → conecta con GitHub → selecciona `rpcommercegroup-svg/ivy-ai-platform`
3. Branch: `main`
4. Railway detectará automáticamente el `railway.json` y `nixpacks.toml`

---

## Variables de Entorno REQUERIDAS en Railway

Ve a **Variables** en tu proyecto Railway y agrega todas estas:

### Base de Datos
```
DATABASE_URL=mysql://385B8cqVvDyKYq8.2ff4d9bc4b3d:eX6Xi9iIK7uangAk8k99@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/HoXBpYBQ3qbVm6g7qLEzMx?ssl={"rejectUnauthorized":true}
```

### Autenticación
```
JWT_SECRET=[tu JWT secret actual]
VITE_APP_ID=HoXBpYBQ3qbVm6g7qLEzMx
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
GOOGLE_CLIENT_ID=845210461598-10r61sdcq4v54rbtr6tho8qb58hqdso4.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[tu Google client secret]
```

### n8n (ROPA Meta-Agente)
```
N8N_INSTANCE_URL=https://sales440.app.n8n.cloud
N8N_API_KEY=[tu n8n API key real]
N8N_WEBHOOK_BASE_URL=https://sales440.app.n8n.cloud/webhook
N8N_EMAIL_WEBHOOK_PATH=send-mass-email
N8N_CALL_WEBHOOK_PATH=trigger-calls
N8N_SMS_WEBHOOK_PATH=send-mass-sms
```

### SendGrid (Envío de Emails)
```
SENDGRID_API_KEY=SG.YOUR_SENDGRID_API_KEY_HERE
ROPA_FROM_EMAIL=sales@ivybai.com
ROPA_FROM_NAME=ROPA - Ivy.AI
```

### LLM / Forge API
```
BUILT_IN_FORGE_API_URL=https://forge.manus.ai
BUILT_IN_FORGE_API_KEY=[tu forge API key]
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.ai
VITE_FRONTEND_FORGE_API_KEY=[tu frontend forge API key]
```

### App Config
```
VITE_APP_TITLE=Ivy.AI - Plataforma de Agentes IA
VITE_APP_LOGO=https://files.manuscdn.com/user_upload_by_module/web_dev_logo/310419663031167889/hWESYNRBaCAlKmcC.png
OWNER_OPEN_ID=hGWTqzm7yJdUtjQMDNDt4X
OWNER_NAME=JCRL
```

---

## Arquitectura de Workflows n8n por Empresa

Cada empresa tiene su propio workflow aislado en n8n:

| Empresa | Email Remitente | Webhook n8n | Workflow ID |
|---|---|---|---|
| **PET LIFE 360** | sales@rpcommercegroupllc.com | `/webhook/send-email-pet-life-360` | h90HciL6gPVqtgR0 |
| **FAGOR Automation** | jcrobledo@fagor-automation.com | `/webhook/send-mass-email` | (existente) |

**IMPORTANTE:** Cuando se crea una nueva empresa en Ivy.AI, ROPA auto-provisiona un nuevo workflow en n8n automáticamente. Solo necesitas asegurarte de que la credencial de Outlook esté configurada en n8n para el email remitente de esa empresa.

---

## Healthcheck

Railway usa `/api/health` como endpoint de healthcheck. Responde con:
```json
{"status": "ok", "timestamp": "...", "version": "3.0.0"}
```

---

## Notas Importantes

1. **Outlook en n8n:** La credencial "Microsoft Outlook account" en n8n debe estar conectada a la cuenta correcta. Si el token expira, ve a n8n → Credentials → Microsoft Outlook account → Reconnect.

2. **ROPA Loop Autónomo:** Se activa automáticamente al iniciar el servidor. Analiza campañas cada 30 minutos con LLM y genera alertas automáticas.

3. **Base de Datos:** TiDB Cloud (MySQL compatible). Las tablas se crean automáticamente al iniciar con `pnpm start` (ejecuta `create-ropa-tables.mjs`).
