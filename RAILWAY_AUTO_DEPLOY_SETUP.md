# Configuración de Auto-Deployment: GitHub → Railway

Esta guía te ayudará a configurar el deployment automático desde GitHub a Railway para que cada push active un nuevo deployment.

---

## 📋 Información de tu Proyecto

**GitHub Repository:** https://github.com/sales440/ivy-ai-platform  
**Railway Project:** https://railway.com/project/d1cda8a3-f000-4cdf-a981-0432ad3ed581

---

## 🔄 Paso 1: Conectar GitHub con Railway

### 1.1 Verificar Conexión de GitHub

1. Ve a tu proyecto en Railway: https://railway.com/project/d1cda8a3-f000-4cdf-a981-0432ad3ed581
2. Click en tu servicio (el que tiene el código de Ivy.AI)
3. Ve a la pestaña **"Settings"**
4. En la sección **"Source"**, verifica:
   - ✅ Debe mostrar: `sales440/ivy-ai-platform`
   - ✅ Branch: `main`

### 1.2 Si NO está conectado a GitHub

Si ves "No source connected" o un source diferente:

1. En **Settings → Source**, click en **"Connect Repo"**
2. Autoriza Railway para acceder a tu GitHub (si no lo has hecho)
3. Selecciona el repositorio: `sales440/ivy-ai-platform`
4. Selecciona el branch: `main`
5. Click en **"Connect"**

### 1.3 Configurar Auto-Deploy

1. En **Settings → Deploy**, verifica que esté habilitado:
   - ✅ **"Watch Paths"**: `/*` (deploy en cualquier cambio)
   - ✅ **"Auto Deploy"**: ON (activado)

2. Si no está activado:
   - Toggle **"Enable Auto Deploy"** a ON
   - Esto hará que Railway redeploy automáticamente en cada push a `main`

---

## 🐳 Paso 2: Verificar Configuración de Build

Railway debe usar el `Dockerfile` para el build. Verifica:

### 2.1 Build Settings

1. En **Settings → Build**, verifica:
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `Dockerfile` (o déjalo vacío si está en la raíz)
   - **Build Command**: (vacío - el Dockerfile maneja todo)

### 2.2 Deploy Settings

1. En **Settings → Deploy**, verifica:
   - **Start Command**: (vacío - el Dockerfile tiene CMD)
   - **Restart Policy**: Always
   - **Health Check**: (opcional)
     - Path: `/`
     - Timeout: 300 seconds

---

## 🔐 Paso 3: Configurar Variables de Entorno

Railway necesita las siguientes variables de entorno. Ve a **Settings → Variables**:

### 3.1 Variables Requeridas

Copia y pega estas variables en Railway (reemplaza los valores de ejemplo):

```bash
# Database (Auto-generada por Railway MySQL)
DATABASE_URL=mysql://user:password@host:port/database

# JWT y Auth
JWT_SECRET=tu_jwt_secret_aqui
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=tu_app_id_aqui

# Owner
OWNER_OPEN_ID=tu_owner_open_id
OWNER_NAME=Tu Nombre

# Manus APIs
BUILT_IN_FORGE_API_URL=https://forge-api.manus.im
BUILT_IN_FORGE_API_KEY=tu_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://forge-api.manus.im
VITE_FRONTEND_FORGE_API_KEY=tu_frontend_key

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=tu_website_id

# Branding
VITE_APP_TITLE=Ivy.AI - Plataforma de Agentes IA
VITE_APP_LOGO=/ivy-ai-logo-branded.png

# Email (SendGrid) - REQUERIDO
SENDGRID_API_KEY=tu_sendgrid_api_key_aqui

# LinkedIn (Opcional)
ZAPIER_LINKEDIN_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/25223690/uza7lea/
```

### 3.2 Cómo Agregar Variables

**Opción A: Una por una**
1. Click en **"+ New Variable"**
2. Ingresa el nombre (ej: `SENDGRID_API_KEY`)
3. Ingresa el valor
4. Click en **"Add"**
5. Repite para cada variable

**Opción B: Raw Editor (más rápido)**
1. Click en **"RAW Editor"** (arriba a la derecha)
2. Pega todas las variables en formato `KEY=value`
3. Click en **"Update Variables"**

### 3.3 Verificar DATABASE_URL

Railway debería haber generado `DATABASE_URL` automáticamente cuando agregaste MySQL:

1. Ve a la pestaña de tu servicio MySQL
2. Copia el valor de `DATABASE_URL`
3. Pégalo en las variables de tu servicio de aplicación

**Formato correcto:**
```
mysql://root:password@mysql.railway.internal:3306/railway
```

---

## 🚀 Paso 4: Trigger Manual Deployment

Ahora que todo está configurado, vamos a hacer un deployment manual para verificar:

### 4.1 Trigger Deployment

1. Ve a la pestaña **"Deployments"**
2. Click en **"Deploy"** (arriba a la derecha)
3. Selecciona **"Deploy Latest Commit"**
4. Railway comenzará el build

### 4.2 Monitorear el Build

1. Click en el deployment activo (el que está en progreso)
2. Ve a **"Build Logs"** para ver el progreso
3. El build tomará ~5-10 minutos

**Fases esperadas:**
```
✅ Cloning repository from GitHub
✅ Building Docker image
✅ Installing dependencies (pnpm install)
✅ Building client (pnpm build:client)
✅ Building server (pnpm build:server)
✅ Starting application
```

### 4.3 Verificar Logs

Una vez que el build complete:

1. Ve a **"View Logs"** (en el deployment)
2. Deberías ver:
   ```
   [OAuth] Initialized with baseURL: https://api.manus.im
   Server running on http://localhost:3000/
   ```

3. Si ves errores, revisa la sección de Troubleshooting

---

## 🗄️ Paso 5: Ejecutar Migraciones de Base de Datos

Después del primer deployment exitoso, necesitas ejecutar las migraciones para crear las nuevas tablas.

### 5.1 Opción A: Desde Railway CLI (Recomendado)

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link al proyecto
railway link d1cda8a3-f000-4cdf-a981-0432ad3ed581

# Ejecutar migraciones
railway run pnpm db:push
```

**Nota:** El comando `pnpm db:push` ejecutará las migraciones interactivas. Selecciona:
- `+ create column` para todas las nuevas columnas
- Presiona Enter para confirmar cada una

### 5.2 Opción B: Desde el Script de Inicio (Automático)

El proyecto ya incluye `start-production.sh` que ejecuta migraciones automáticamente:

1. Verifica que el `Dockerfile` use este script (ya debería estar configurado):
   ```dockerfile
   CMD ["sh", "start-production.sh"]
   ```

2. El script ejecuta:
   ```bash
   pnpm db:push  # Migraciones
   pnpm start    # Inicio del servidor
   ```

3. Las migraciones se ejecutarán en cada deployment

### 5.3 Verificar Tablas Creadas

Después de ejecutar las migraciones, verifica que las tablas existan:

1. Ve a tu servicio MySQL en Railway
2. Click en **"Data"** (o usa un cliente MySQL)
3. Verifica que existan estas tablas:
   - ✅ `multiChannelCampaigns`
   - ✅ `campaignSteps`
   - ✅ `campaignExecutions`

---

## ✅ Paso 6: Verificar Auto-Deployment

Ahora vamos a probar que el auto-deployment funcione:

### 6.1 Hacer un Cambio Pequeño

En tu terminal local:

```bash
cd /home/ubuntu/ivy-ai-platform

# Crear un archivo de prueba
echo "# Test Auto-Deploy" > TEST.md

# Commit y push
git add TEST.md
git commit -m "test: Verify auto-deployment from GitHub"
git push origin main
```

### 6.2 Verificar en Railway

1. Ve a **Deployments** en Railway
2. Deberías ver un nuevo deployment iniciándose automáticamente
3. El deployment debería mostrar:
   - **Trigger**: GitHub Push
   - **Commit**: "test: Verify auto-deployment from GitHub"

### 6.3 Confirmar Auto-Deploy Funciona

Si ves el nuevo deployment, ¡el auto-deploy está funcionando! 🎉

Ahora cada vez que hagas `git push origin main`, Railway automáticamente:
1. Detectará el push
2. Clonará el código nuevo
3. Ejecutará el build
4. Desplegará la nueva versión

---

## 🌐 Paso 7: Configurar Dominio (Opcional)

### 7.1 Dominio de Railway

Railway te da un dominio automático:

1. Ve a **Settings → Domains**
2. Click en **"Generate Domain"**
3. Railway te dará algo como: `ivy-ai-platform-production.up.railway.app`

### 7.2 Dominio Personalizado

Si tienes un dominio propio (ej: `app.ivybai.com`):

1. En **Settings → Domains**, click en **"Custom Domain"**
2. Ingresa tu dominio: `app.ivybai.com`
3. Railway te dará registros DNS:
   ```
   Type: CNAME
   Name: app
   Value: tu-proyecto.railway.app
   ```
4. Agrega estos registros en tu proveedor de DNS (GoDaddy, Cloudflare, etc.)
5. Espera propagación (5-30 minutos)
6. Railway verificará y activará SSL automáticamente

---

## 🔍 Paso 8: Poblar Datos de Demostración

Una vez que la aplicación esté funcionando:

1. Accede a tu aplicación: `https://tu-dominio.railway.app`
2. Inicia sesión
3. Ve al Dashboard
4. Click en el botón **"Seed Demo Data"**
5. Espera confirmación: "✅ Demo data seeded successfully"

Esto creará:
- ✅ 55 leads de ejemplo
- ✅ 8 tickets de soporte
- ✅ 6 agentes IA configurados
- ✅ 12 templates de email
- ✅ Datos de empresas demo

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"

**Causa:** `DATABASE_URL` no está configurada o es incorrecta.

**Solución:**
1. Ve al servicio MySQL en Railway
2. Copia `DATABASE_URL`
3. Pégala en las variables de tu aplicación
4. Redeploy

### Error: "Build failed"

**Causa:** Dependencias faltantes o error en el código.

**Solución:**
1. Ve a **Build Logs**
2. Busca el error específico
3. Verifica que `package.json` tenga todas las dependencias
4. Verifica que el código compile localmente: `pnpm build`

### Error: "Application crashed"

**Causa:** Variables de entorno faltantes o error en runtime.

**Solución:**
1. Ve a **View Logs**
2. Busca el error
3. Verifica que todas las variables requeridas estén configuradas
4. Común: `JWT_SECRET`, `SENDGRID_API_KEY`, `DATABASE_URL`

### Auto-Deploy no funciona

**Causa:** Railway no está conectado a GitHub o auto-deploy está desactivado.

**Solución:**
1. Ve a **Settings → Source**
2. Verifica que muestre: `sales440/ivy-ai-platform`
3. Ve a **Settings → Deploy**
4. Activa **"Enable Auto Deploy"**

### Migraciones fallan

**Causa:** Prompts interactivos no se pueden responder en Railway.

**Solución:**
1. Usa Railway CLI localmente: `railway run pnpm db:push`
2. O crea las tablas manualmente usando SQL
3. O espera a que `start-production.sh` las ejecute automáticamente

---

## 📊 Monitoreo Continuo

### Logs en Tiempo Real

```bash
# Desde Railway CLI
railway logs

# O desde el Dashboard
# Click en tu servicio → "View Logs"
```

### Métricas

Railway muestra automáticamente:
- ✅ CPU usage
- ✅ Memory usage
- ✅ Network traffic
- ✅ Deployment history

Accede desde: **Metrics** tab en tu servicio

---

## 🎉 ¡Listo!

Tu aplicación Ivy.AI ahora está configurada con auto-deployment desde GitHub a Railway.

**Flujo de trabajo:**
1. Haces cambios en tu código local
2. `git add .`
3. `git commit -m "descripción"`
4. `git push origin main`
5. Railway automáticamente detecta el push
6. Railway ejecuta el build
7. Railway despliega la nueva versión
8. Tu aplicación se actualiza automáticamente

**URLs importantes:**
- 🌐 Aplicación: https://tu-dominio.railway.app
- 📊 Railway Dashboard: https://railway.com/project/d1cda8a3-f000-4cdf-a981-0432ad3ed581
- 💻 GitHub Repo: https://github.com/sales440/ivy-ai-platform

---

**Última actualización:** 2025-01-19  
**Versión:** 1.0
