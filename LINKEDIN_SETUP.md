# LinkedIn API Setup Guide

Esta guía te ayudará a configurar la integración con LinkedIn API para publicar posts automáticamente desde Ivy.AI Platform.

## Paso 1: Crear una LinkedIn App

1. Ve a [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Haz clic en **"Create app"**
3. Completa el formulario:
   - **App name**: Ivy.AI Platform
   - **LinkedIn Page**: Selecciona tu página de empresa (o crea una si no tienes)
   - **Privacy policy URL**: `https://tu-dominio.manus.space/privacy-policy` (reemplaza `tu-dominio` con tu dominio real)
   - **App logo**: Sube el logo de Ivy.AI
   - **Legal agreement**: Acepta los términos

   **Nota importante:** Ivy.AI Platform ya incluye una página de Privacy Policy profesional en `/privacy-policy`. Esta página cumple con GDPR y regulaciones de LinkedIn. Simplemente usa la URL de tu dominio publicado.

4. Haz clic en **"Create app"**

## Paso 2: Configurar Permisos (Products)

1. En la página de tu app, ve a la pestaña **"Products"**
2. Solicita acceso a:
   - ✅ **Share on LinkedIn** (para publicar posts)
   - ✅ **Sign In with LinkedIn** (para autenticación)

3. Espera la aprobación (puede tomar unos minutos o hasta 24 horas)

## Paso 3: Obtener Credenciales

1. Ve a la pestaña **"Auth"** de tu app
2. Copia las siguientes credenciales:
   - **Client ID**: `xxxxxxxxxxxxxxxx`
   - **Client Secret**: `xxxxxxxxxxxxxxxx`

## Paso 4: Configurar Redirect URLs

1. En la sección **"OAuth 2.0 settings"**, agrega las siguientes URLs:
   - Para desarrollo: `http://localhost:3000/api/linkedin/callback`
   - Para producción: `https://tu-dominio.com/api/linkedin/callback`

2. Haz clic en **"Update"**

## Paso 5: Configurar Variables de Entorno

### Opción A: Usando Management UI (Recomendado)

1. Ve a **Settings → Secrets** en el panel de Ivy.AI
2. Agrega las siguientes variables:

```
LINKEDIN_CLIENT_ID=tu_client_id_aqui
LINKEDIN_CLIENT_SECRET=tu_client_secret_aqui
LINKEDIN_REDIRECT_URI=https://tu-dominio.com/api/linkedin/callback
```

### Opción B: Usando archivo .env (Solo desarrollo local)

Crea un archivo `.env` en la raíz del proyecto:

```env
LINKEDIN_CLIENT_ID=tu_client_id_aqui
LINKEDIN_CLIENT_SECRET=tu_client_secret_aqui
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback
```

## Paso 6: Autenticación OAuth

### Método 1: Obtener Access Token Manualmente (Recomendado para producción)

1. Construye la URL de autorización:
```
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=TU_CLIENT_ID&redirect_uri=TU_REDIRECT_URI&scope=w_member_social%20r_liteprofile
```

2. Abre esta URL en tu navegador
3. Autoriza la aplicación
4. Serás redirigido a tu `redirect_uri` con un código de autorización:
```
https://tu-dominio.com/api/linkedin/callback?code=CODIGO_DE_AUTORIZACION
```

5. Intercambia el código por un access token usando cURL:
```bash
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -d grant_type=authorization_code \
  -d code=CODIGO_DE_AUTORIZACION \
  -d client_id=TU_CLIENT_ID \
  -d client_secret=TU_CLIENT_SECRET \
  -d redirect_uri=TU_REDIRECT_URI
```

6. Guarda el `access_token` en las variables de entorno:
```
LINKEDIN_ACCESS_TOKEN=tu_access_token_aqui
```

### Método 2: Usar el flujo OAuth integrado (Próximamente)

El sistema incluye endpoints tRPC para automatizar este proceso:
- `trpc.linkedInOAuth.getAuthUrl` - Obtiene la URL de autorización
- `trpc.linkedInOAuth.exchangeToken` - Intercambia el código por token
- `trpc.linkedInOAuth.validateToken` - Valida el token actual

## Paso 7: Probar la Integración

1. Ve a `/linkedin-content` en Ivy.AI Platform
2. Genera un post usando los botones de tipo de contenido
3. Haz clic en **"Publicar Ahora"** en el post generado
4. El post se publicará automáticamente en LinkedIn
5. Se abrirá una nueva pestaña con el post publicado

## Troubleshooting

### Error: "No access token configured"

**Solución**: Asegúrate de haber configurado `LINKEDIN_ACCESS_TOKEN` en las variables de entorno.

### Error: "The token used in the request has expired"

**Solución**: Los access tokens de LinkedIn expiran después de 60 días. Necesitas renovar el token siguiendo el Paso 6 nuevamente.

### Error: "Insufficient permissions"

**Solución**: Verifica que tu app tenga aprobado el producto "Share on LinkedIn" en la pestaña Products.

### El post se marca como "failed"

**Solución**: Revisa el campo `error` en la tabla `linkedInPosts` de la base de datos para ver el mensaje de error específico.

## Notas Importantes

1. **Límites de API**: LinkedIn tiene límites de tasa (rate limits). No publiques más de 100 posts por día.

2. **Tokens de larga duración**: Los access tokens expiran después de 60 días. Considera implementar un sistema de renovación automática.

3. **Permisos de usuario**: El access token debe ser del usuario que tiene permisos de administrador en la página de LinkedIn donde quieres publicar.

4. **Modo simulación**: Si no configuras `LINKEDIN_ACCESS_TOKEN`, el sistema funcionará en modo simulación (no publicará realmente en LinkedIn, pero guardará los posts en la base de datos).

## Recursos Adicionales

- [LinkedIn API Documentation](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/share-api)
- [LinkedIn OAuth 2.0 Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [LinkedIn Rate Limits](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits)

## Soporte

Si tienes problemas con la configuración, contacta al equipo de Ivy.AI en sales@rpcommercegroupllc.com
