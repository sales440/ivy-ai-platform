# Guía Completa: Deployment en Railway vía GitHub

Esta guía te llevará paso a paso desde cero hasta tener Ivy.AI desplegado en producción en Railway.

---

## 📋 Tabla de Contenidos

1. [Pre-requisitos](#pre-requisitos)
2. [Configuración de GitHub](#configuración-de-github)
3. [Configuración de Railway](#configuración-de-railway)
4. [Variables de Entorno](#variables-de-entorno)
5. [Deployment](#deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## 1. Pre-requisitos

### Cuentas Necesarias

- ✅ **GitHub Account** - https://github.com/signup
- ✅ **Railway Account** - https://railway.app (usa tu cuenta de GitHub para login)
- ✅ **SendGrid Account** - Ya tienes (sales@ivybai.com configurado)

### Información que Necesitarás

Antes de empezar, ten a mano:

```bash
# SendGrid
SENDGRID_API_KEY=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

# Zapier (opcional - para LinkedIn)
ZAPIER_LINKEDIN_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/25223690/uza7lea/

# Telnyx (opcional - para llamadas)
TELNYX_API_KEY=tu_api_key_aqui
TELNYX_PHONE_NUMBER=+1234567890
```

---

## 2. Configuración de GitHub

### Paso 1: Crear Repositorio en GitHub

1. Ve a https://github.com/new
2. Configura el repositorio:
   - **Repository name**: `ivy-ai-platform`
   - **Description**: `Plataforma de Agentes IA para Automatización de Marketing y Ventas`
   - **Visibility**: Private (recomendado) o Public
   - **NO** inicialices con README, .gitignore, o license (ya los tienes)

3. Click en **"Create repository"**

### Paso 2: Conectar tu Proyecto Local con GitHub

Abre tu terminal en el directorio del proyecto y ejecuta:

```bash
# Navegar al proyecto
cd /home/ubuntu/ivy-ai-platform

# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Crear commit inicial
git commit -m "Initial commit: Ivy.AI Platform with multi-channel campaigns"

# Agregar remote de GitHub (reemplaza TU_USUARIO con tu username de GitHub)
git remote add origin https://github.com/TU_USUARIO/ivy-ai-platform.git

# Renombrar branch a main (si es necesario)
git branch -M main

# Push al repositorio
git push -u origin main
```

### Paso 3: Verificar el Push

1. Refresca tu repositorio en GitHub
2. Deberías ver todos los archivos del proyecto
3. Verifica que estos archivos estén presentes:
   - ✅ `Dockerfile`
   - ✅ `package.json`
   - ✅ `drizzle.config.ts`
   - ✅ `server/` directory
   - ✅ `client/` directory

---

## 3. Configuración de Railway

### Paso 1: Crear Proyecto en Railway

1. Ve a https://railway.app
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway para acceder a tu GitHub
5. Selecciona el repositorio `ivy-ai-platform`

### Paso 2: Agregar Base de Datos MySQL

Railway creará automáticamente un servicio para tu aplicación. Ahora necesitas agregar MySQL:

1. En tu proyecto de Railway, click en **"+ New"**
2. Selecciona **"Database"**
3. Selecciona **"Add MySQL"**
4. Railway creará una base de datos MySQL automáticamente

### Paso 3: Conectar la Base de Datos

Railway genera automáticamente la variable `DATABASE_URL`. Verifica que esté configurada:

1. Click en tu servicio de aplicación (no la base de datos)
2. Ve a la pestaña **"Variables"**
3. Deberías ver `DATABASE_URL` ya configurada automáticamente
4. Si no está, agrégala manualmente desde la pestaña de MySQL:
   - Click en el servicio MySQL
   - Copia el valor de `DATABASE_URL`
   - Pégalo en las variables de tu aplicación

---

## 4. Variables de Entorno

### Variables Requeridas en Railway

En la pestaña **"Variables"** de tu servicio de aplicación, agrega las siguientes variables:

#### 🔐 Variables de Sistema (Auto-generadas por Manus)

Estas variables las puedes obtener desde tu proyecto actual en Manus:

```bash
# JWT y OAuth
JWT_SECRET=tu_jwt_secret_aqui
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=tu_app_id_aqui

# Owner Info
OWNER_OPEN_ID=tu_owner_open_id_aqui
OWNER_NAME=tu_nombre_aqui

# Built-in APIs
BUILT_IN_FORGE_API_URL=https://forge-api.manus.im
BUILT_IN_FORGE_API_KEY=tu_forge_api_key_aqui
VITE_FRONTEND_FORGE_API_URL=https://forge-api.manus.im
VITE_FRONTEND_FORGE_API_KEY=tu_frontend_forge_key_aqui

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=tu_website_id_aqui
```

#### 📧 Variables de Email (SendGrid)

```bash
SENDGRID_API_KEY=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
```

#### 🎨 Variables de Branding

```bash
VITE_APP_TITLE=Ivy.AI - Plataforma de Agentes IA
VITE_APP_LOGO=/ivy-ai-logo-branded.png
```

#### 🔗 Variables Opcionales

```bash
# LinkedIn via Zapier (opcional)
ZAPIER_LINKEDIN_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/25223690/uza7lea/

# Telnyx para llamadas (opcional)
TELNYX_API_KEY=tu_telnyx_api_key
TELNYX_PHONE_NUMBER=+1234567890

# LinkedIn OAuth (opcional - si usas LinkedIn API directa)
LINKEDIN_CLIENT_ID=tu_client_id
LINKEDIN_CLIENT_SECRET=tu_client_secret
LINKEDIN_REDIRECT_URI=https://tu-dominio.railway.app/api/linkedin/callback
LINKEDIN_ACCESS_TOKEN=tu_access_token
```

### Cómo Obtener las Variables de Manus

Para obtener las variables de sistema de tu proyecto actual en Manus:

1. Ve al Management UI de tu proyecto en Manus
2. Click en **"Settings"** → **"Secrets"**
3. Copia los valores de cada variable
4. Pégalos en Railway

**Alternativa**: Exportar todas las variables de una vez:

```bash
# En tu terminal local (dentro del proyecto)
env | grep -E "JWT_SECRET|OAUTH_SERVER_URL|OWNER_OPEN_ID|BUILT_IN_FORGE" > railway-env.txt
```

Luego copia los valores desde `railway-env.txt` a Railway.

---

## 5. Deployment

### Configuración de Build

Railway detectará automáticamente el `Dockerfile` y lo usará para el build. Verifica la configuración:

1. En tu servicio, ve a **"Settings"**
2. En **"Build"**, verifica que esté configurado:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `Dockerfile`
3. En **"Deploy"**, configura:
   - **Start Command**: (déjalo vacío, el Dockerfile ya tiene CMD)
   - **Health Check Path**: `/` (opcional)

### Trigger del Deployment

Railway desplegará automáticamente cuando hagas push a GitHub. Para forzar un deployment:

1. En tu servicio, ve a **"Deployments"**
2. Click en **"Deploy"** → **"Redeploy"**

### Monitorear el Build

1. Ve a la pestaña **"Deployments"**
2. Click en el deployment activo
3. Ve a **"Build Logs"** para ver el progreso
4. El build tomará ~5-10 minutos la primera vez

**Fases del Build:**
- ✅ Building Docker image
- ✅ Installing dependencies (pnpm install)
- ✅ Building client (pnpm build:client)
- ✅ Building server (pnpm build:server)
- ✅ Starting application

### Verificar el Deployment

Una vez completado el build:

1. Railway te dará una URL pública (ej: `https://ivy-ai-platform-production.up.railway.app`)
2. Click en **"View Logs"** para ver los logs del servidor
3. Deberías ver: `Server running on http://localhost:3000/`

---

## 6. Post-Deployment

### Ejecutar Migraciones de Base de Datos

Después del primer deployment, necesitas ejecutar las migraciones:

**Opción 1: Desde Railway CLI**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link al proyecto
railway link

# Ejecutar migraciones
railway run pnpm db:push
```

**Opción 2: Desde el Dashboard de Railway**

1. Ve a tu servicio en Railway
2. Click en **"Settings"** → **"Deployments"**
3. En **"Deploy Command"**, agrega:
   ```bash
   pnpm db:push && pnpm start
   ```
4. Redeploy

**Opción 3: Usar el Script de Inicio (Recomendado)**

El proyecto ya incluye `start-production.sh` que ejecuta migraciones automáticamente:

```bash
# El Dockerfile ya está configurado para usar este script
CMD ["sh", "start-production.sh"]
```

No necesitas hacer nada adicional, las migraciones se ejecutarán automáticamente en cada deployment.

### Poblar Datos de Demostración

Para poblar la base de datos con datos de demo:

1. Accede a tu aplicación en Railway: `https://tu-app.railway.app`
2. Inicia sesión
3. Ve a **Dashboard**
4. Click en el botón **"Seed Demo Data"**
5. Espera la confirmación: "✅ Demo data seeded successfully"

**Alternativa desde Railway CLI:**

```bash
railway run node scripts/seed-demo.mjs
```

### Configurar Dominio Personalizado (Opcional)

1. En Railway, ve a tu servicio
2. Click en **"Settings"** → **"Domains"**
3. Click en **"Generate Domain"** (Railway te dará un dominio .railway.app)
4. O click en **"Custom Domain"** para usar tu propio dominio:
   - Ingresa tu dominio (ej: `ivy.ai`)
   - Railway te dará los registros DNS a configurar
   - Agrega los registros en tu proveedor de DNS
   - Espera propagación (5-30 minutos)

---

## 7. Troubleshooting

### Error: "Cannot connect to database"

**Causa**: DATABASE_URL no está configurada o es incorrecta.

**Solución**:
1. Ve a Variables en Railway
2. Verifica que `DATABASE_URL` esté presente
3. Copia el valor desde el servicio MySQL
4. Formato correcto: `mysql://user:password@host:port/database`

### Error: "Build failed: npm ERR!"

**Causa**: Dependencias faltantes o versión de Node incorrecta.

**Solución**:
1. Verifica que `package.json` tenga `"engines": { "node": ">=18.0.0" }`
2. Railway usa Node 18 por defecto
3. Revisa Build Logs para ver el error específico

### Error: "Application crashed"

**Causa**: Variables de entorno faltantes o error en el código.

**Solución**:
1. Ve a **"View Logs"** en Railway
2. Busca el error específico
3. Verifica que todas las variables requeridas estén configuradas
4. Común: `JWT_SECRET`, `SENDGRID_API_KEY`, `DATABASE_URL`

### Error: "Emails not sending"

**Causa**: SendGrid API Key inválida o sender no verificado.

**Solución**:
1. Verifica que `SENDGRID_API_KEY` esté configurada
2. Verifica que `sales@ivybai.com` esté verificado en SendGrid
3. Revisa los logs: `railway logs`
4. Busca errores de SendGrid

### Error: "LinkedIn posts not publishing"

**Causa**: Zapier webhook no configurado o LinkedIn no conectado.

**Solución**:
1. Verifica que `ZAPIER_LINKEDIN_WEBHOOK_URL` esté configurada
2. Ve a Zapier.com y verifica que el Zap esté activo
3. Verifica que LinkedIn esté conectado en Zapier
4. Prueba el webhook manualmente desde Zapier

### Error: "Database migration failed"

**Causa**: Migraciones no ejecutadas o conflicto de schema.

**Solución**:
```bash
# Conectar a Railway
railway link

# Ejecutar migraciones manualmente
railway run pnpm db:push

# Ver logs de migraciones
railway logs
```

### Logs en Tiempo Real

Para ver logs en tiempo real:

```bash
# Desde Railway CLI
railway logs

# O desde el Dashboard
# Click en tu servicio → "View Logs"
```

---

## 📊 Checklist de Deployment

Usa este checklist para asegurarte de que todo esté configurado:

### Pre-Deployment
- [ ] Repositorio creado en GitHub
- [ ] Código pusheado a GitHub
- [ ] Cuenta de Railway creada
- [ ] Proyecto creado en Railway
- [ ] Base de datos MySQL agregada

### Variables de Entorno
- [ ] `DATABASE_URL` configurada (auto-generada)
- [ ] `SENDGRID_API_KEY` configurada
- [ ] `JWT_SECRET` configurada
- [ ] `OAUTH_SERVER_URL` configurada
- [ ] `VITE_APP_ID` configurada
- [ ] `OWNER_OPEN_ID` configurada
- [ ] `BUILT_IN_FORGE_API_KEY` configurada
- [ ] `VITE_APP_TITLE` configurada
- [ ] `VITE_APP_LOGO` configurada

### Variables Opcionales
- [ ] `ZAPIER_LINKEDIN_WEBHOOK_URL` (si usas LinkedIn)
- [ ] `TELNYX_API_KEY` (si usas llamadas)
- [ ] `LINKEDIN_ACCESS_TOKEN` (si usas LinkedIn API directa)

### Post-Deployment
- [ ] Build completado exitosamente
- [ ] Aplicación accesible vía URL pública
- [ ] Migraciones de base de datos ejecutadas
- [ ] Datos de demo poblados
- [ ] Login funcional
- [ ] Dashboard carga correctamente
- [ ] Emails se envían correctamente
- [ ] Posts de LinkedIn se generan

### Testing
- [ ] Crear un lead de prueba
- [ ] Enviar un email de prueba
- [ ] Generar un post de LinkedIn
- [ ] Crear una campaña multi-canal
- [ ] Verificar analytics

---

## 🚀 Comandos Útiles

### Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Build para producción
pnpm build

# Ejecutar migraciones
pnpm db:push

# Seed datos de demo
node scripts/seed-demo.mjs
```

### Railway CLI

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Link al proyecto
railway link

# Ver logs
railway logs

# Ejecutar comando en Railway
railway run <comando>

# Abrir dashboard
railway open
```

### Git

```bash
# Ver estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "Descripción del cambio"

# Push a GitHub (trigger deployment)
git push origin main

# Ver historial
git log --oneline
```

---

## 📞 Soporte

Si tienes problemas durante el deployment:

1. **Railway Discord**: https://discord.gg/railway
2. **Railway Docs**: https://docs.railway.app
3. **GitHub Issues**: Crea un issue en tu repositorio
4. **SendGrid Support**: https://support.sendgrid.com

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu aplicación Ivy.AI estará desplegada en Railway y accesible públicamente.

**URL de Producción**: `https://tu-app.railway.app`

**Próximos Pasos Recomendados:**
1. Configurar dominio personalizado (ej: `app.ivybai.com`)
2. Configurar SSL/HTTPS (Railway lo hace automáticamente)
3. Configurar backups de base de datos
4. Configurar monitoring y alertas
5. Documentar tu API para clientes externos

---

**Última actualización**: 2025-01-19
**Versión de la guía**: 1.0
