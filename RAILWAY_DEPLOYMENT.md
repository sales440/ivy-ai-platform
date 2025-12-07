# Ivy.AI - Railway Deployment Guide

Esta guía proporciona instrucciones paso a paso para desplegar la plataforma Ivy.AI en Railway.

## Prerrequisitos

- Cuenta de Railway (https://railway.app)
- Cuenta de GitHub
- Repositorio de GitHub con el código de Ivy.AI

## Paso 1: Preparar el Repositorio

1. **Push del código a GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Ivy.AI Platform"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/ivy-ai-platform.git
   git push -u origin main
   ```

## Paso 2: Crear Proyecto en Railway

1. Accede a [Railway Dashboard](https://railway.app/dashboard)
2. Click en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway para acceder a tu repositorio
5. Selecciona el repositorio `ivy-ai-platform`

## Paso 3: Configurar Base de Datos

1. En tu proyecto de Railway, click en "+ New"
2. Selecciona "Database" → "MySQL"
3. Railway creará automáticamente una instancia de MySQL
4. Copia la variable `DATABASE_URL` que se genera automáticamente

## Paso 4: Configurar Variables de Entorno

En el panel de tu aplicación en Railway, ve a "Variables" y añade las siguientes:

### Variables Requeridas

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database
# (Esta se genera automáticamente si usas MySQL de Railway)

# Authentication
JWT_SECRET=tu_secreto_jwt_muy_seguro_aqui_cambiar_en_produccion

# Application
NODE_ENV=production
PORT=3000

# Manus OAuth (si aplica)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=tu_app_id

# Owner Info
OWNER_OPEN_ID=tu_open_id
OWNER_NAME=Tu Nombre

# App Config
VITE_APP_TITLE=Ivy.AI Platform
VITE_APP_LOGO=/logo.svg

# LLM Integration (si usas servicios externos)
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=tu_api_key
VITE_FRONTEND_FORGE_API_KEY=tu_frontend_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
```

### Generar JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Paso 5: Configurar Build y Deploy

Railway detectará automáticamente el `Dockerfile` y lo usará para el build.

### Verificar Configuración de Build

En "Settings" → "Build":
- **Builder**: Dockerfile
- **Dockerfile Path**: ./Dockerfile
- **Build Command**: (dejar vacío, usa Dockerfile)

En "Settings" → "Deploy":
- **Start Command**: (dejar vacío, usa CMD del Dockerfile)
- **Health Check Path**: `/` o `/api/health`

## Paso 6: Ejecutar Migraciones

Después del primer deploy:

1. Abre la terminal de Railway (en el panel de tu servicio, click en "Shell")
2. Ejecuta las migraciones:
   ```bash
   pnpm db:push
   ```

3. Inicializa la base de datos:
   ```bash
   node scripts/init-db.mjs
   ```

4. (Opcional) Seed data de demo:
   ```bash
   node scripts/seed-demo.mjs
   ```

## Paso 7: Verificar Deployment

1. Railway te proporcionará una URL pública (ej: `https://ivy-ai-platform-production.up.railway.app`)
2. Accede a la URL y verifica que la aplicación carga correctamente
3. Prueba el login y funcionalidades básicas

## Paso 8: Configurar Dominio Personalizado (Opcional)

1. En Railway, ve a "Settings" → "Domains"
2. Click en "Add Custom Domain"
3. Ingresa tu dominio (ej: `ivy-ai.tuempresa.com`)
4. Configura los registros DNS según las instrucciones de Railway
5. Espera a que el certificado SSL se genere automáticamente

## Troubleshooting

### Error: "Cannot connect to database"

- Verifica que `DATABASE_URL` esté correctamente configurada
- Asegúrate de que el servicio de MySQL esté corriendo en Railway
- Revisa los logs en Railway Dashboard

### Error: "Build failed"

- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Railway
- Asegúrate de que el `Dockerfile` esté en la raíz del proyecto

### Error: "Application crashed"

- Revisa los logs de la aplicación en Railway Dashboard
- Verifica que todas las variables de entorno requeridas estén configuradas
- Asegúrate de que las migraciones se hayan ejecutado correctamente

### Performance Issues

- Considera upgrade del plan de Railway para más recursos
- Verifica las métricas en Railway Dashboard
- Optimiza las queries de base de datos si es necesario

## Monitoreo

Railway proporciona métricas básicas:
- CPU Usage
- Memory Usage
- Network Traffic
- Logs en tiempo real

Accede a estas métricas en el panel "Metrics" de tu servicio.

## CI/CD Automático

Railway automáticamente:
- Detecta cambios en la rama `main` de GitHub
- Ejecuta un nuevo build
- Despliega la nueva versión
- Hace rollback automático si el deploy falla

Para desactivar auto-deploy:
1. Ve a "Settings" → "Service"
2. Desactiva "Auto Deploy"

## Rollback

Para hacer rollback a una versión anterior:
1. Ve a "Deployments"
2. Encuentra el deployment exitoso anterior
3. Click en "⋮" → "Redeploy"

## Costos Estimados

Railway ofrece:
- **Hobby Plan**: $5/mes de crédito gratis
- **Developer Plan**: $20/mes
- **Team Plan**: Desde $20/mes

Estima tu uso basado en:
- Número de requests
- Uso de CPU/RAM
- Tráfico de red
- Tamaño de base de datos

## Soporte

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Ivy.AI Issues**: https://github.com/tu-usuario/ivy-ai-platform/issues

## Checklist de Deployment

- [ ] Código pusheado a GitHub
- [ ] Proyecto creado en Railway
- [ ] MySQL database provisionada
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Migraciones ejecutadas
- [ ] Base de datos inicializada
- [ ] Aplicación accesible vía URL pública
- [ ] Login funcional
- [ ] Agentes respondiendo correctamente
- [ ] Workflows ejecutándose
- [ ] (Opcional) Dominio personalizado configurado
- [ ] (Opcional) Monitoring configurado

---

**¡Felicidades! Tu plataforma Ivy.AI está ahora en producción en Railway.** 🎉
