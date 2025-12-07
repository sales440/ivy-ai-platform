# Guía de Configuración de Gmail API para EPM Construcciones

**Cliente:** EPM Construcciones SA de CV  
**Email corporativo:** epmconstrucciones@gmail.com  
**Objetivo:** Activar envío automático de emails personalizados por sector

---

## 📋 Resumen

Esta guía te permitirá configurar Gmail API para que Ivy.AI pueda enviar emails automáticamente desde epmconstrucciones@gmail.com a tus leads, con templates personalizados por sector (educativo, hotelero, residencial).

**Tiempo estimado:** 30-45 minutos  
**Nivel técnico:** Intermedio  
**Costo:** Gratis (hasta 500 emails/día)

---

## 🚀 Paso 1: Crear Proyecto en Google Cloud Console

### 1.1 Acceder a Google Cloud Console
1. Ir a https://console.cloud.google.com
2. Iniciar sesión con la cuenta **epmconstrucciones@gmail.com**
3. Aceptar los términos de servicio si es la primera vez

### 1.2 Crear Nuevo Proyecto
1. Click en el selector de proyectos (arriba a la izquierda)
2. Click en "Nuevo Proyecto"
3. Configurar:
   - **Nombre del proyecto:** `ivy-ai-epm-construcciones`
   - **Organización:** Dejar vacío (sin organización)
   - **Ubicación:** Sin organización
4. Click en "Crear"
5. Esperar 10-15 segundos a que se cree el proyecto
6. Seleccionar el proyecto recién creado en el selector

---

## 🔧 Paso 2: Habilitar Gmail API

### 2.1 Ir a la Biblioteca de APIs
1. En el menú lateral, ir a **"APIs y servicios" → "Biblioteca"**
2. O usar este link directo: https://console.cloud.google.com/apis/library

### 2.2 Buscar y Habilitar Gmail API
1. En el buscador, escribir: **"Gmail API"**
2. Click en el resultado "Gmail API"
3. Click en el botón azul **"Habilitar"**
4. Esperar 5-10 segundos a que se habilite

---

## 🔐 Paso 3: Crear Credenciales OAuth 2.0

### 3.1 Configurar Pantalla de Consentimiento
1. Ir a **"APIs y servicios" → "Pantalla de consentimiento de OAuth"**
2. Seleccionar **"Externo"** (para uso fuera de Google Workspace)
3. Click en **"Crear"**

### 3.2 Completar Información de la Aplicación
**Página 1: Información de la aplicación**
- **Nombre de la aplicación:** `Ivy.AI - EPM Construcciones`
- **Correo electrónico de asistencia:** `epmconstrucciones@gmail.com`
- **Logo de la aplicación:** (Opcional) Subir logo de EPM
- **Dominios autorizados:** Dejar vacío
- **Correo electrónico del desarrollador:** `epmconstrucciones@gmail.com`
- Click en **"Guardar y continuar"**

**Página 2: Permisos (Scopes)**
- Click en **"Agregar o quitar permisos"**
- Buscar y seleccionar:
  - `https://www.googleapis.com/auth/gmail.send` (Enviar emails)
  - `https://www.googleapis.com/auth/gmail.readonly` (Leer emails - opcional)
- Click en **"Actualizar"**
- Click en **"Guardar y continuar"**

**Página 3: Usuarios de prueba**
- Click en **"Agregar usuarios"**
- Agregar: `epmconstrucciones@gmail.com`
- Click en **"Agregar"**
- Click en **"Guardar y continuar"**

**Página 4: Resumen**
- Revisar la configuración
- Click en **"Volver al panel"**

### 3.3 Crear Credenciales OAuth 2.0
1. Ir a **"APIs y servicios" → "Credenciales"**
2. Click en **"Crear credenciales" → "ID de cliente de OAuth 2.0"**
3. Configurar:
   - **Tipo de aplicación:** `Aplicación web`
   - **Nombre:** `Ivy.AI EPM Web Client`
   - **Orígenes de JavaScript autorizados:**
     - `https://3000-i6ns8mujf75l0m6ckyyhq-038613ad.manusvm.computer`
     - `http://localhost:3000` (para desarrollo local)
   - **URIs de redireccionamiento autorizados:**
     - `https://3000-i6ns8mujf75l0m6ckyyhq-038613ad.manusvm.computer/api/oauth/gmail/callback`
     - `http://localhost:3000/api/oauth/gmail/callback`
4. Click en **"Crear"**

### 3.4 Guardar Credenciales
Aparecerá un modal con:
- **ID de cliente:** `1234567890-abc123def456.apps.googleusercontent.com`
- **Secreto del cliente:** `GOCSPX-abc123def456`

**⚠️ IMPORTANTE:** Copia y guarda estos valores en un lugar seguro. Los necesitarás en el Paso 4.

---

## 🔑 Paso 4: Obtener Refresh Token

### 4.1 Generar URL de Autorización
Abre esta URL en tu navegador (reemplaza `YOUR_CLIENT_ID` con tu ID de cliente del Paso 3.4):

```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=https://3000-i6ns8mujf75l0m6ckyyhq-038613ad.manusvm.computer/api/oauth/gmail/callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent
```

**Ejemplo con ID real:**
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=1234567890-abc123def456.apps.googleusercontent.com&redirect_uri=https://3000-i6ns8mujf75l0m6ckyyhq-038613ad.manusvm.computer/api/oauth/gmail/callback&response_type=code&scope=https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent
```

### 4.2 Autorizar la Aplicación
1. Seleccionar la cuenta **epmconstrucciones@gmail.com**
2. Google mostrará advertencia "Esta aplicación no está verificada"
3. Click en **"Avanzado"**
4. Click en **"Ir a Ivy.AI - EPM Construcciones (no seguro)"**
5. Revisar los permisos solicitados
6. Click en **"Permitir"**
7. Serás redirigido a una URL como:
   ```
   https://3000-i6ns8mujf75l0m6ckyyhq-038613ad.manusvm.computer/api/oauth/gmail/callback?code=4/0AbCD1234...
   ```

### 4.3 Extraer el Código de Autorización
Copia el valor del parámetro `code` de la URL (todo después de `code=`):
```
4/0AbCD1234efgh5678ijkl9012mnop3456qrst7890uvwx
```

### 4.4 Intercambiar Código por Refresh Token
Ejecuta este comando en tu terminal (reemplaza los valores):

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -d "code=4/0AbCD1234efgh5678ijkl9012mnop3456qrst7890uvwx" \
  -d "client_id=1234567890-abc123def456.apps.googleusercontent.com" \
  -d "client_secret=GOCSPX-abc123def456" \
  -d "redirect_uri=https://3000-i6ns8mujf75l0m6ckyyhq-038613ad.manusvm.computer/api/oauth/gmail/callback" \
  -d "grant_type=authorization_code"
```

**Respuesta esperada:**
```json
{
  "access_token": "ya29.a0AfH6SMBx...",
  "expires_in": 3599,
  "refresh_token": "1//0gAbCD1234efgh5678ijkl9012mnop3456qrst7890uvwx",
  "scope": "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
  "token_type": "Bearer"
}
```

**⚠️ IMPORTANTE:** Copia y guarda el `refresh_token`. Este valor te permitirá enviar emails indefinidamente sin volver a autorizar.

---

## ⚙️ Paso 5: Configurar Variables de Entorno en Ivy.AI

### 5.1 Agregar Secrets en Manus Dashboard
1. Ir al Dashboard de Manus
2. Click en el proyecto `ivy-ai-platform`
3. Ir a **"Settings" → "Secrets"**
4. Agregar las siguientes variables:

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `GMAIL_CLIENT_ID` | Tu Client ID del Paso 3.4 | `1234567890-abc123def456.apps.googleusercontent.com` |
| `GMAIL_CLIENT_SECRET` | Tu Client Secret del Paso 3.4 | `GOCSPX-abc123def456` |
| `GMAIL_REFRESH_TOKEN` | Tu Refresh Token del Paso 4.4 | `1//0gAbCD1234efgh5678ijkl9012mnop3456qrst7890uvwx` |
| `GMAIL_USER_EMAIL` | Email corporativo de EPM | `epmconstrucciones@gmail.com` |

### 5.2 Reiniciar el Servidor
Después de agregar las variables, reinicia el servidor de desarrollo para que tome los nuevos valores.

---

## ✅ Paso 6: Probar el Envío de Emails

### 6.1 Enviar Email de Prueba
1. Ir a la página de Leads en Ivy.AI
2. Seleccionar un lead de prueba
3. Click en **"Send Email"**
4. Seleccionar template (Educativo, Hotelero o Residencial)
5. Click en **"Send"**

### 6.2 Verificar Envío
1. Revisar la bandeja de **"Enviados"** en epmconstrucciones@gmail.com
2. Verificar que el email se envió correctamente
3. Revisar que las variables dinámicas ({{leadName}}, {{company}}) se reemplazaron correctamente

---

## 🚨 Solución de Problemas

### Error: "invalid_grant"
**Causa:** El código de autorización expiró (válido solo 10 minutos)  
**Solución:** Repetir Paso 4.1 para generar un nuevo código

### Error: "redirect_uri_mismatch"
**Causa:** La URI de redirección no coincide con la configurada en Google Cloud Console  
**Solución:** Verificar que la URI en el Paso 3.3 sea exactamente igual a la usada en el Paso 4.1

### Error: "access_denied"
**Causa:** No autorizaste los permisos en el Paso 4.2  
**Solución:** Repetir Paso 4.1 y asegurarte de hacer click en "Permitir"

### Error: "Token has been expired or revoked"
**Causa:** El refresh token fue revocado manualmente  
**Solución:** Repetir desde Paso 4.1 para generar un nuevo refresh token

### Límite de Envío Excedido
**Gmail API límites:**
- **500 emails/día** para cuentas gratuitas
- **2,000 emails/día** para Google Workspace

**Solución:**
- Monitorear envíos diarios en dashboard EPM
- Priorizar leads de alto valor (scoring >80)
- Considerar upgrade a Google Workspace si necesitas más volumen

---

## 📊 Monitoreo y Métricas

### Métricas Disponibles en Dashboard EPM
- **Emails enviados/día:** Contador en tiempo real
- **Tasa de apertura:** % de emails abiertos (requiere tracking pixels)
- **Tasa de respuesta:** % de leads que respondieron
- **Tasa de conversión:** % de emails que generaron reuniones/contratos

### Logs de Envío
Todos los emails enviados se registran en la tabla `emailCampaigns` con:
- Fecha y hora de envío
- Lead destinatario
- Template utilizado
- Estado (sent, opened, clicked, replied)
- Errores (si los hubo)

---

## 🔒 Seguridad y Mejores Prácticas

### Protección de Credenciales
- ✅ **NUNCA** compartas tu Client Secret o Refresh Token
- ✅ **NUNCA** subas credenciales a GitHub o repositorios públicos
- ✅ Usa variables de entorno en Manus Dashboard
- ✅ Rota credenciales cada 6 meses

### Cumplimiento Legal
- ✅ Incluye link de **"Unsubscribe"** en todos los emails
- ✅ Respeta la Ley Federal de Protección de Datos Personales (México)
- ✅ No envíes emails a personas que no dieron consentimiento
- ✅ Mantén registro de consentimientos en base de datos

### Rate Limiting
- ✅ Máximo 500 emails/día (cuenta gratuita)
- ✅ Máximo 100 emails/hora (recomendado)
- ✅ Espera 3-5 segundos entre cada envío
- ✅ Implementa retry con backoff exponencial en caso de errores

---

## 📚 Recursos Adicionales

### Documentación Oficial
- **Gmail API:** https://developers.google.com/gmail/api
- **OAuth 2.0:** https://developers.google.com/identity/protocols/oauth2
- **Node.js Client:** https://github.com/googleapis/google-api-nodejs-client

### Soporte
- **Google Cloud Support:** https://cloud.google.com/support
- **Ivy.AI Support:** support@ivy-ai.com
- **EPM Technical Contact:** Arq. Leoncio Eloy Robledo L.

---

## ✅ Checklist de Configuración

- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar Gmail API
- [ ] Configurar pantalla de consentimiento OAuth
- [ ] Crear credenciales OAuth 2.0
- [ ] Guardar Client ID y Client Secret
- [ ] Generar URL de autorización
- [ ] Autorizar aplicación con cuenta EPM
- [ ] Extraer código de autorización
- [ ] Intercambiar código por refresh token
- [ ] Guardar refresh token
- [ ] Agregar variables de entorno en Manus Dashboard
- [ ] Reiniciar servidor de desarrollo
- [ ] Enviar email de prueba
- [ ] Verificar envío en bandeja de "Enviados"
- [ ] Configurar monitoreo de métricas

---

**Fecha de creación:** 19 de Noviembre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Lista para implementación

---

*Documento generado por Ivy.AI Platform para EPM Construcciones SA de CV*
