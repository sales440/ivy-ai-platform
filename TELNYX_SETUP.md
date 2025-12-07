# Telnyx Setup Guide for Ivy-Call

Esta guía te ayudará a configurar Telnyx para habilitar las llamadas automáticas en Ivy.AI Platform.

---

## Requisitos Previos

- Cuenta de Telnyx (crear en [telnyx.com](https://telnyx.com))
- Acceso al Management Dashboard de Ivy.AI
- Tarjeta de crédito para comprar número de teléfono (~$1-5/mes)

---

## Paso 1: Crear Cuenta en Telnyx

1. Ve a [https://telnyx.com/sign-up](https://telnyx.com/sign-up)
2. Completa el registro con tu email y contraseña
3. Verifica tu email
4. Completa la información de facturación

---

## Paso 2: Obtener API Key

1. Inicia sesión en [Telnyx Portal](https://portal.telnyx.com)
2. Ve a **API Keys** en el menú lateral izquierdo
3. Haz clic en **Create API Key**
4. Dale un nombre descriptivo (ej: "Ivy.AI Production")
5. **Copia la API Key** y guárdala en un lugar seguro
   - ⚠️ **Importante**: Solo se muestra una vez, no podrás verla de nuevo

---

## Paso 3: Comprar Número de Teléfono

### Opción A: Número de EE.UU. (Recomendado para empezar)

1. En Telnyx Portal, ve a **Numbers** → **Buy Numbers**
2. Selecciona **Country**: United States
3. Filtra por:
   - **Type**: Local o Toll-Free
   - **Features**: Voice (asegúrate que esté marcado)
4. Busca por área code o ciudad
5. Selecciona un número disponible
6. Haz clic en **Buy** (~$1-2/mes para local, ~$5/mes para toll-free)

### Opción B: Número Internacional

1. Selecciona tu país en el filtro
2. Verifica que el número soporte **Voice**
3. Algunos países requieren documentación adicional (KYC)
4. Precios varían por país

---

## Paso 4: Configurar Outbound Voice Profile

1. Ve a **Voice** → **Outbound Voice Profiles**
2. Haz clic en **Create New Profile**
3. Configura:
   - **Name**: "Ivy.AI Outbound Calls"
   - **Billing Group**: Selecciona tu grupo de facturación
   - **Traffic Type**: Conversational
4. Haz clic en **Save**
5. **Copia el Connection ID** (lo necesitarás más adelante)

---

## Paso 5: Asociar Número al Outbound Profile

1. Ve a **Numbers** → **My Numbers**
2. Haz clic en tu número recién comprado
3. En **Voice Settings**:
   - **Connection**: Selecciona tu Outbound Voice Profile
   - **Tech Prefix**: Deja en blanco
4. Haz clic en **Save**

---

## Paso 6: Configurar Webhook en Telnyx

1. Ve a **Webhooks** en el menú lateral
2. Haz clic en **Add Webhook**
3. Configura:
   - **Webhook URL**: `https://TU-DOMINIO.manus.space/api/webhooks/telnyx`
     - Reemplaza `TU-DOMINIO` con tu dominio real de Ivy.AI
   - **Failover URL**: (opcional) deja en blanco
   - **Webhook API Version**: V2
4. Selecciona los siguientes eventos:
   - ✅ `call.initiated`
   - ✅ `call.answered`
   - ✅ `call.hangup`
   - ✅ `call.recording.saved`
5. Haz clic en **Save**

---

## Paso 7: Actualizar Secrets en Ivy.AI

1. Abre el **Management Dashboard** de Ivy.AI
2. Ve a **Settings** → **Secrets**
3. Busca `TELNYX_API_KEY`:
   - Haz clic en **Edit**
   - Pega tu API Key de Telnyx
   - Haz clic en **Save**
4. Busca `TELNYX_PHONE_NUMBER`:
   - Haz clic en **Edit**
   - Ingresa tu número en formato E.164: `+1234567890`
     - **Importante**: Debe incluir el `+` y el código de país
   - Haz clic en **Save**

---

## Paso 8: Verificar Configuración

### Test 1: Verificar API Key

```bash
curl -X GET "https://api.telnyx.com/v2/phone_numbers" \
  -H "Authorization: Bearer TU_API_KEY"
```

Deberías ver tu número de teléfono en la respuesta.

### Test 2: Probar Llamada desde Ivy.AI

1. Ve a **Leads** en Ivy.AI
2. Selecciona un lead con email
3. Haz clic en **📞 Call**
4. Selecciona un script template
5. Haz clic en **Start Call**
6. Verifica en **Call History** que la llamada aparece con status `initiated`

---

## Troubleshooting

### Error: "Invalid API Key"

**Causa**: API Key incorrecta o expirada

**Solución**:
1. Verifica que copiaste la API Key completa (sin espacios)
2. Genera una nueva API Key en Telnyx Portal
3. Actualiza `TELNYX_API_KEY` en Ivy.AI

### Error: "Phone number not found"

**Causa**: Número de teléfono no configurado o formato incorrecto

**Solución**:
1. Verifica que el número esté en formato E.164: `+1234567890`
2. Confirma que el número está activo en Telnyx Portal
3. Asegúrate que el número está asociado a tu Outbound Voice Profile

### Error: "Webhook not receiving events"

**Causa**: URL del webhook incorrecta o firewall bloqueando

**Solución**:
1. Verifica que la URL del webhook sea correcta: `https://TU-DOMINIO.manus.space/api/webhooks/telnyx`
2. Prueba el webhook manualmente con curl:
   ```bash
   curl -X POST "https://TU-DOMINIO.manus.space/api/webhooks/telnyx" \
     -H "Content-Type: application/json" \
     -d '{"data":{"event_type":"call.initiated"}}'
   ```
3. Revisa los logs del servidor en Ivy.AI

### Llamadas no se completan

**Causa**: Saldo insuficiente o número bloqueado

**Solución**:
1. Verifica tu saldo en Telnyx Portal
2. Agrega crédito si es necesario
3. Revisa que el número de destino no esté en lista negra
4. Confirma que el número de origen está verificado

---

## Costos Estimados

| Concepto | Costo Aproximado |
|----------|------------------|
| Número local (EE.UU.) | $1-2/mes |
| Número toll-free (EE.UU.) | $5/mes |
| Llamadas salientes (EE.UU.) | $0.01-0.02/min |
| Llamadas internacionales | $0.05-0.50/min (varía por país) |
| Grabación de llamadas | $0.005/min |
| Transcripción (si usas Telnyx) | $0.05/min |

**Nota**: Ivy.AI usa su propio LLM para transcripción y análisis, no necesitas pagar transcripción de Telnyx.

---

## Mejores Prácticas

1. **Números dedicados**: Usa un número diferente para cada campaña o departamento
2. **Monitoreo**: Revisa **Call History** diariamente para detectar problemas
3. **Presupuesto**: Configura alertas de gasto en Telnyx Portal
4. **Compliance**: Asegúrate de cumplir con regulaciones locales (TCPA en EE.UU., GDPR en Europa)
5. **Testing**: Prueba con tu propio número antes de llamar a leads reales

---

## Recursos Adicionales

- [Telnyx API Documentation](https://developers.telnyx.com/docs/v2/voice)
- [Telnyx Voice Quickstart](https://developers.telnyx.com/docs/v2/voice/quickstarts)
- [Telnyx Webhook Events](https://developers.telnyx.com/docs/v2/voice/webhook-events)
- [Soporte Telnyx](https://support.telnyx.com)

---

## Soporte

Si tienes problemas con la configuración:

1. Revisa los logs en el servidor de Ivy.AI
2. Verifica el status del webhook en Telnyx Portal
3. Contacta al soporte de Telnyx si el problema es con su plataforma
4. Reporta bugs de Ivy.AI en [help.manus.im](https://help.manus.im)
