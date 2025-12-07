# Configuración de Zapier para Publicación Automática en LinkedIn

Esta guía te ayudará a configurar un Zap que permita a Ivy.AI publicar automáticamente posts en LinkedIn sin necesidad de crear una LinkedIn App.

---

## Requisitos Previos

- ✅ Cuenta de Zapier (plan gratuito funciona, pero tiene límite de 100 tareas/mes)
- ✅ Cuenta de LinkedIn (personal o empresa)
- ✅ Ivy.AI Platform desplegado con URL pública

---

## Paso 1: Crear un Nuevo Zap

1. Ve a [Zapier.com](https://zapier.com/) e inicia sesión
2. Haz clic en **"Create Zap"** (botón naranja en la esquina superior derecha)
3. Dale un nombre descriptivo: `Ivy.AI → LinkedIn Auto-Post`

---

## Paso 2: Configurar el Trigger (Webhooks by Zapier)

### 2.1 Seleccionar App y Evento

1. En el campo **"Choose App"**, busca y selecciona: **Webhooks by Zapier**
2. En **"Event"**, selecciona: **Catch Hook**
3. Haz clic en **"Continue"**

### 2.2 Obtener la Webhook URL

1. Zapier te mostrará una **Webhook URL** única, algo como:
   ```
   https://hooks.zapier.com/hooks/catch/12345678/abcdefg/
   ```
2. **¡IMPORTANTE!** Copia esta URL completa - la necesitarás en el Paso 4
3. Haz clic en **"Continue"**

### 2.3 Probar el Trigger

1. Zapier te pedirá que envíes un test request
2. **Abre una nueva pestaña** y ejecuta este comando en tu terminal (reemplaza `YOUR_WEBHOOK_URL`):

   ```bash
   curl -X POST https://hooks.zapier.com/hooks/catch/12345678/abcdefg/ \
     -H "Content-Type: application/json" \
     -d '{
       "content": "🚀 Test post from Ivy.AI Platform\n\nThis is a test to verify Zapier integration is working correctly.",
       "postId": 1,
       "postType": "test",
       "author": "Juan Carlos Robledo"
     }'
   ```

3. Regresa a Zapier y haz clic en **"Test trigger"**
4. Deberías ver los datos del test request aparecer
5. Haz clic en **"Continue"**

---

## Paso 3: Configurar la Action (LinkedIn)

### 3.1 Seleccionar App y Evento

1. En el campo **"Choose App"**, busca y selecciona: **LinkedIn**
2. En **"Event"**, selecciona: **Create Share Update** (o **Share an Update**)
3. Haz clic en **"Continue"**

### 3.2 Conectar tu Cuenta de LinkedIn

1. Haz clic en **"Sign in to LinkedIn"**
2. Autoriza a Zapier para acceder a tu cuenta de LinkedIn
3. Selecciona el perfil donde quieres publicar (personal o página de empresa)
4. Haz clic en **"Continue"**

### 3.3 Configurar el Post

Mapea los campos del webhook a LinkedIn:

1. **Visibility**: Selecciona **"Public"** (o **"Connections"** si prefieres)
2. **Comment**: Haz clic en el campo → En el menú desplegable, busca la sección **"1. Catch Hook in Webhooks by Zapier"** → Selecciona **"Content"**
   - **⚠️ IMPORTANTE**: El campo se llama "Comment" en LinkedIn, NO "Text" o "Message"
   - Esto insertará el contenido del post generado por Ivy.AI
3. **Link URL** (opcional): Deja en blanco o agrega tu sitio web (ej: https://ivybai.com)
4. Haz clic en **"Continue"**

**Verificación**: Deberías ver algo como `{{125617544__content}}` en el campo Comment, lo que indica que está correctamente mapeado.

### 3.4 Probar la Action

1. Haz clic en **"Test action"**
2. Zapier publicará un post de prueba en tu LinkedIn
3. **Ve a tu perfil de LinkedIn** para verificar que el post se publicó correctamente
4. Si todo funciona, haz clic en **"Continue"**

---

## Paso 4: Activar el Zap

1. Revisa que todo esté configurado correctamente
2. Haz clic en **"Publish"** (botón en la esquina superior derecha)
3. Tu Zap está ahora **activo** y listo para recibir posts de Ivy.AI

---

## Paso 5: Configurar la Webhook URL en Ivy.AI

Ahora necesitas agregar la Webhook URL de Zapier a tu plataforma Ivy.AI:

### 5.1 Ir a Settings → Secrets

1. Abre tu plataforma Ivy.AI
2. Haz clic en el ícono de **Management UI** (panel derecho)
3. Ve a **Settings → Secrets**

### 5.2 Agregar el Secret

1. Haz clic en **"Add Secret"** o el botón equivalente
2. Completa los campos:
   - **Key**: `ZAPIER_LINKEDIN_WEBHOOK_URL`
   - **Value**: Pega la Webhook URL de Zapier (del Paso 2.2)
   - Ejemplo: `https://hooks.zapier.com/hooks/catch/12345678/abcdefg/`
3. Haz clic en **"Save"**

### 5.3 Reiniciar el Servidor (si es necesario)

Algunos sistemas requieren reiniciar para cargar nuevas variables de entorno. Si tu plataforma tiene un botón de "Restart", úsalo.

---

## Paso 6: Probar la Integración

### 6.1 Generar un Post de Prueba

1. Ve a **`/linkedin-content`** en tu plataforma Ivy.AI
2. Haz clic en cualquier botón de generación rápida (ej: **"💡 Thought Leadership"**)
3. Espera a que el post se genere (aparecerá en la lista con estado "Pending")

### 6.2 Publicar el Post

1. Busca el post recién generado en la lista
2. Haz clic en el botón **"Publicar Ahora"** (azul, con ícono de flecha)
3. Deberías ver una notificación de éxito
4. **Ve a tu perfil de LinkedIn** para verificar que el post se publicó

### 6.3 Verificar en Zapier

1. Ve a tu Zap en Zapier.com
2. Haz clic en la pestaña **"Zap History"**
3. Deberías ver el registro del post publicado con estado "Success"

---

## Troubleshooting (Solución de Problemas)

### Error: "ZAPIER_LINKEDIN_WEBHOOK_URL not configured"

**Causa**: No agregaste la Webhook URL en Settings → Secrets

**Solución**: Sigue el Paso 5 para agregar el secret

---

### Error: "Zapier webhook failed: 404 Not Found"

**Causa**: La Webhook URL es incorrecta o el Zap no está activado

**Solución**:
1. Verifica que copiaste la URL completa (incluyendo el `/` final)
2. Ve a Zapier.com y asegúrate de que el Zap esté **"On"** (activo)

---

### El post no aparece en LinkedIn

**Causa**: La acción de LinkedIn no está configurada correctamente

**Solución**:
1. Ve a tu Zap en Zapier.com
2. Edita la acción de LinkedIn
3. Verifica que el campo **"Comment"** esté mapeado a **"Content"**
4. Asegúrate de haber seleccionado el perfil correcto de LinkedIn

---

### Error: "LinkedIn API rate limit exceeded"

**Causa**: LinkedIn tiene límites de publicación (máximo ~20 posts por día)

**Solución**:
1. Espera 24 horas antes de publicar más posts
2. Considera espaciar las publicaciones (1-2 posts por día)

---

## Límites y Consideraciones

### Límites de Zapier (Plan Gratuito)

- ✅ **100 tareas/mes**: Cada post publicado cuenta como 1 tarea
- ✅ **15 minutos de delay**: Los Zaps gratuitos pueden tener hasta 15 min de retraso
- ✅ **Single-step Zaps**: Solo puedes tener 1 trigger + 1 action

**Recomendación**: Si publicas más de 100 posts/mes, considera actualizar a Zapier Starter ($19.99/mes, 750 tareas).

### Límites de LinkedIn

- ⚠️ **Máximo ~20 posts por día**: LinkedIn puede bloquear temporalmente si publicas demasiado
- ⚠️ **Contenido duplicado**: Evita publicar el mismo contenido múltiples veces
- ⚠️ **Spam detection**: Posts con demasiados enlaces pueden ser marcados como spam

---

## Mejoras Opcionales

### Agregar Filtros en Zapier

Puedes agregar un paso de **"Filter"** en Zapier para:
- Solo publicar posts de cierto tipo (`postType === "thought_leadership"`)
- Evitar publicar posts con ciertas palabras clave
- Publicar solo en horarios específicos

### Agregar Notificaciones

Puedes agregar un paso adicional para:
- Enviar un email cuando se publique un post
- Notificar en Slack cuando haya un error
- Guardar un registro en Google Sheets

### Programar Publicaciones

Zapier tiene un trigger **"Schedule by Zapier"** que puedes usar para:
- Publicar posts automáticamente cada día a las 9am
- Espaciar publicaciones cada 2-3 días
- Publicar solo en días laborables

---

## Soporte

Si tienes problemas con la configuración:

1. **Zapier Help Center**: https://help.zapier.com/
2. **LinkedIn API Docs**: https://learn.microsoft.com/en-us/linkedin/
3. **Ivy.AI Support**: sales@rpcommercegroupllc.com

---

## Resumen de URLs Importantes

- **Zapier Dashboard**: https://zapier.com/app/dashboard
- **Crear Nuevo Zap**: https://zapier.com/app/editor
- **Zap History**: https://zapier.com/app/history
- **LinkedIn Profile**: https://www.linkedin.com/in/juan-carlos-robledo-5946a2392/

---

**¡Listo!** Tu sistema de publicación automática en LinkedIn está configurado. Ivy.AI ahora puede generar y publicar posts sin intervención manual. 🚀
