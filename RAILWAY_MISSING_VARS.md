# Variables Faltantes en Railway

Estas variables deben ser añadidas en Railway → ivy-ai-platform → Variables:

## Variables VITE (Frontend - Requeridas para el build)

```
VITE_APP_ID=HoXBpYBQ3qbVm6g7qLEzMx
VITE_OAUTH_PORTAL_URL=https://manus.im
VITE_APP_TITLE=Ivy.AI - Plataforma de Agentes IA
VITE_FRONTEND_FORGE_API_KEY=d5CZsEG25grTraVynKmWLr
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.ai
VITE_APP_LOGO=https://files.manuscdn.com/user_upload_by_module/web_dev_logo/310419663031167889/hWESYNRBaCAlKmcC.png
VITE_ANALYTICS_ENDPOINT=https://manus-analytics.com
VITE_ANALYTICS_WEBSITE_ID=ee25caff-fcd7-4d82-b8a1-ea5ec983f0aa
```

## Cómo añadirlas en Railway:

1. Ve a Railway → ivy-ai-platform → Variables
2. Click en "+ New Variable"
3. Copia y pega cada variable (nombre y valor)
4. Guarda

**IMPORTANTE:** Después de añadir estas variables, Railway hará un redeploy automático y el frontend debería funcionar correctamente.
