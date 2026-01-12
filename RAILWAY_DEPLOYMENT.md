# 🚂 Guía de Deployment en Railway para Ivy.AI

## Repositorio GitHub
- **URL**: https://github.com/sales440/ivy-ai-platform
- **Branch**: main

---

## Paso 1: Conectar Railway con GitHub

1. Ve a [Railway.app](https://railway.app) e inicia sesión
2. Haz clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Busca y selecciona: `sales440/ivy-ai-platform`
5. Railway detectará automáticamente el `railway.json` y configurará el proyecto

---

## Paso 2: Configurar Variables de Entorno

En Railway, ve a tu proyecto → **Variables** y agrega las siguientes:

### Variables Requeridas (CRÍTICAS)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión MySQL/TiDB | `mysql://user:pass@host:port/db?ssl={"rejectUnauthorized":true}` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | `tu-secreto-seguro-de-32-caracteres` |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto del servidor (Railway lo asigna) | `3000` |

### Variables de OAuth (Manus)

| Variable | Descripción |
|----------|-------------|
| `VITE_APP_ID` | ID de aplicación OAuth de Manus |
| `OAUTH_SERVER_URL` | URL del servidor OAuth de Manus |
| `VITE_OAUTH_PORTAL_URL` | URL del portal de login de Manus |
| `OWNER_OPEN_ID` | OpenID del propietario |
| `OWNER_NAME` | Nombre del propietario |

### Variables de APIs Internas

| Variable | Descripción |
|----------|-------------|
| `BUILT_IN_FORGE_API_URL` | URL de APIs internas de Manus |
| `BUILT_IN_FORGE_API_KEY` | API Key para backend |
| `VITE_FRONTEND_FORGE_API_URL` | URL de APIs para frontend |
| `VITE_FRONTEND_FORGE_API_KEY` | API Key para frontend |

### Variables de Almacenamiento S3

| Variable | Descripción |
|----------|-------------|
| `S3_BUCKET` | Nombre del bucket S3 |
| `S3_REGION` | Región del bucket |
| `S3_ACCESS_KEY_ID` | Access Key de AWS |
| `S3_SECRET_ACCESS_KEY` | Secret Key de AWS |

### Variables Opcionales

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_APP_TITLE` | Título de la aplicación | `Ivy.AI - Plataforma de Agentes IA` |
| `VITE_APP_LOGO` | URL del logo | (logo por defecto) |
| `SENDGRID_API_KEY` | API Key de SendGrid para emails | (opcional) |

---

## Paso 3: Configurar Base de Datos

### Opción A: Usar Railway MySQL
1. En tu proyecto Railway, haz clic en **"+ New"**
2. Selecciona **"Database" → "MySQL"**
3. Railway creará automáticamente la variable `DATABASE_URL`

### Opción B: Usar Base de Datos Externa
1. Copia tu `DATABASE_URL` de tu proveedor (PlanetScale, TiDB, etc.)
2. Agrégala como variable de entorno en Railway
3. Asegúrate de incluir `?ssl={"rejectUnauthorized":true}` al final

---

## Paso 4: Configurar Dominio Personalizado (app.ivybyai.com)

### En Railway:
1. Ve a tu proyecto → **Settings** → **Domains**
2. Haz clic en **"+ Custom Domain"**
3. Ingresa: `app.ivybyai.com`
4. Railway te mostrará un registro CNAME

### En tu Proveedor DNS:
Agrega el siguiente registro:

```
Type: CNAME
Name: app
Value: [valor-proporcionado-por-railway].up.railway.app
TTL: 3600
```

### Verificación:
- Railway verificará automáticamente el DNS
- El certificado SSL se generará automáticamente (Let's Encrypt)
- Puede tomar 5-30 minutos para propagarse

---

## Paso 5: Ejecutar Migraciones de Base de Datos

Después del primer deployment, ejecuta las migraciones:

### Opción A: Desde Railway CLI
```bash
railway run pnpm db:push
```

### Opción B: Desde el Dashboard de Railway
1. Ve a tu servicio → **Settings** → **Deploy**
2. En "Start Command", temporalmente cambia a:
   ```
   pnpm db:push && pnpm start
   ```
3. Después del primer deploy exitoso, vuelve a:
   ```
   pnpm start
   ```

---

## Paso 6: Verificar Deployment

1. **Health Check**: Visita `https://app.ivybyai.com/api/health`
2. **Home Page**: Visita `https://app.ivybyai.com`
3. **ROPA Dashboard**: Visita `https://app.ivybyai.com/ropa`

---

## Comandos Útiles de Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Vincular proyecto
railway link

# Ver logs
railway logs

# Ejecutar comandos en producción
railway run <comando>

# Abrir dashboard
railway open
```

---

## Troubleshooting

### Error: "Build failed"
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs de build en Railway

### Error: "Database connection failed"
- Verifica que `DATABASE_URL` esté correctamente formateada
- Asegúrate de que SSL esté habilitado si usas TiDB/PlanetScale

### Error: "OAuth callback failed"
- Verifica que `VITE_APP_ID` y `OAUTH_SERVER_URL` sean correctos
- Asegúrate de que el dominio esté registrado en Manus OAuth

### Error: "S3 upload failed"
- Verifica las credenciales de S3
- Asegúrate de que el bucket tenga los permisos correctos

---

## Contacto de Soporte

- **Email**: sales@ivybyai.com
- **Documentación**: https://docs.ivybyai.com (próximamente)

---

*Última actualización: Enero 2026*
