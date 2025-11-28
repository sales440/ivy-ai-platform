# OAuth Bypass - Configuración Temporal

## ⚠️ IMPORTANTE: Solo para Testing

Este bypass de OAuth es **temporal** y debe ser removido antes de producción final.

---

## 🔧 Cómo Activar el Bypass

### En Railway:

1. **Ir a Railway Dashboard:**
   - https://railway.app/project/d1cda8a3-f000-4cdf-a981-0432ad3ed581

2. **Seleccionar el servicio:**
   - Click en `ivy-ai-platform-production`

3. **Agregar variable de entorno:**
   - Click en la pestaña **"Variables"**
   - Click en **"+ New Variable"**
   - **Name:** `VITE_BYPASS_AUTH`
   - **Value:** `true`
   - Click en **"Add"**

4. **Railway redeploy automático:**
   - Railway detectará el cambio y hará redeploy
   - Espera 3-5 minutos

5. **Verificar:**
   - Abre https://ivy-ai-platform-production.up.railway.app/
   - Deberías poder acceder sin login
   - Usuario mock: "Test User" (admin)

---

## 🔄 Cómo Desactivar el Bypass (Restaurar OAuth)

Cuando quieras volver a usar OAuth normal:

1. **En Railway Dashboard:**
   - Ir a Variables
   - Buscar `VITE_BYPASS_AUTH`
   - Cambiar valor a `false` o eliminar la variable

2. **Configurar OAuth redirect URI:**
   - Ir a Manus OAuth Dashboard
   - Agregar: `https://ivy-ai-platform-production.up.railway.app/api/oauth/callback`

3. **Redeploy:**
   - Railway hará redeploy automático
   - OAuth funcionará normalmente

---

## 📋 Usuario Mock (cuando bypass está activo)

```json
{
  "id": 999,
  "openId": "mock-user",
  "name": "Test User",
  "email": "test@example.com",
  "role": "admin",
  "loginMethod": "mock"
}
```

---

## ⚠️ Limitaciones del Bypass

- **No hay autenticación real** - cualquiera puede acceder
- **Usuario siempre es admin** - no se puede probar roles diferentes
- **No persiste entre sesiones** - el usuario mock se recrea cada vez
- **Backend sigue esperando OAuth** - algunas funciones pueden fallar

---

## 🔒 Seguridad

**NUNCA dejes el bypass activo en producción final.** Es solo para testing durante desarrollo.

Antes de lanzar a usuarios reales:
1. Desactiva el bypass (`VITE_BYPASS_AUTH=false`)
2. Configura OAuth redirect URI correctamente
3. Verifica que el login funciona
