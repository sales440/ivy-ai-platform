# 🧪 Ivy-Call Testing Guide

## 📋 Resumen de Pruebas

Este documento describe el plan completo de testing para el agente **Ivy-Call** y cómo ejecutar las pruebas.

---

## 🎯 Niveles de Testing

### **Nivel 1: Unit Tests** ✅ (Implementado)
**Objetivo**: Probar funciones individuales sin dependencias externas

**Cobertura**:
- ✅ Inicialización del agente Ivy-Call
- ✅ Capacidades y KPIs
- ✅ Ejecución de tareas (make_call, send_sms, send_whatsapp)
- ✅ Generación de contenido con IA
- ✅ Manejo de errores
- ✅ Comunicación inter-agente
- ✅ Funciones de base de datos
- ✅ Tracking de KPIs

**Total de tests**: 30+ casos de prueba

**Cómo ejecutar**:
```bash
cd /home/ubuntu/ivy-ai-platform
pnpm test server/__tests__/ivy-call.test.ts
```

---

### **Nivel 2: Integration Tests** ⏳ (Requiere credenciales)
**Objetivo**: Probar integración real con Telnyx API

**Prerequisitos**:
1. Cuenta de Telnyx (https://telnyx.com/sign-up)
2. Credenciales configuradas en `.env`:
   ```
   TELNYX_API_KEY=KEYxxxxxxxxxxxxxxxxxxxxx
   TELNYX_CONNECTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   TELNYX_PHONE_NUMBER=+1234567890
   TELNYX_MESSAGING_PROFILE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

**Tests a ejecutar**:

#### Test 1: Verificar conexión con Telnyx
```bash
curl -X GET https://api.telnyx.com/v2/phone_numbers \
  -H "Authorization: Bearer $TELNYX_API_KEY"
```
**Resultado esperado**: Lista de números telefónicos

#### Test 2: Hacer llamada de prueba
```typescript
// Via tRPC endpoint
await trpc.communication.makeCall.mutate({
  phoneNumber: '+1234567890', // Tu número de prueba
  script: 'Esta es una llamada de prueba de Ivy-Call',
  leadId: 1
});
```
**Resultado esperado**: Llamada iniciada, registro en base de datos

#### Test 3: Enviar SMS de prueba
```typescript
await trpc.communication.sendSMS.mutate({
  phoneNumber: '+1234567890',
  message: 'Hola, este es un SMS de prueba de Ivy-Call',
  leadId: 1
});
```
**Resultado esperado**: SMS enviado, registro en base de datos

#### Test 4: Enviar WhatsApp de prueba
```typescript
await trpc.communication.sendWhatsApp.mutate({
  phoneNumber: '+1234567890',
  message: 'Hola, este es un mensaje de WhatsApp de prueba',
  leadId: 1
});
```
**Resultado esperado**: Mensaje enviado, conversación creada

#### Test 5: Verificar webhooks
1. Configurar webhook URL en Telnyx:
   ```
   https://tu-dominio.com/api/webhooks/telnyx
   ```
2. Hacer una llamada de prueba
3. Verificar que el webhook recibe eventos:
   - `call.initiated`
   - `call.answered`
   - `call.hangup`

**Resultado esperado**: Estados actualizados automáticamente en base de datos

---

### **Nivel 3: End-to-End Tests** ⏳ (Producción)
**Objetivo**: Probar flujos completos de workflows

#### Test 1: Workflow de Sales Call
1. Crear lead de prueba
2. Ejecutar workflow `outbound_sales_call`
3. Verificar:
   - Lead calificado por Ivy-Prospect
   - Llamada realizada por Ivy-Call
   - Sentimiento analizado
   - Hand-off a Ivy-Closer (si positivo)
   - SMS de follow-up (si negativo)

#### Test 2: Workflow de SMS Drip Campaign
1. Crear lead de prueba
2. Ejecutar workflow `sms_drip_campaign`
3. Verificar:
   - SMS de bienvenida enviado
   - Espera de 2 días (simular con tiempo acelerado)
   - SMS de valor enviado
   - Espera de 3 días
   - SMS final con CTA
   - Llamada de follow-up si hay engagement

#### Test 3: Dashboard de Comunicaciones
1. Navegar a `/communications`
2. Verificar:
   - KPI cards muestran datos correctos
   - Desglose de costos es preciso
   - Historial de llamadas se muestra
   - Historial de SMS se muestra
   - Auto-refresh funciona (30s)

---

## 📊 Checklist de Testing

### Unit Tests (Sin credenciales)
- [x] Inicialización del agente
- [x] Verificar capacidades
- [x] Verificar KPIs iniciales
- [x] Ejecutar make_call con mock
- [x] Ejecutar send_sms con mock
- [x] Ejecutar send_whatsapp con mock
- [x] Generar script con IA
- [x] Generar SMS con IA
- [x] Generar WhatsApp con IA
- [x] Manejo de errores de red
- [x] Manejo de errores de base de datos
- [x] Manejo de parámetros inválidos
- [x] Tracking de KPIs después de llamada
- [x] Tracking de KPIs después de SMS
- [x] Comunicación inter-agente
- [x] Funciones de base de datos

### Integration Tests (Con credenciales de Telnyx)
- [ ] Verificar conexión con Telnyx API
- [ ] Listar números telefónicos disponibles
- [ ] Hacer llamada real de prueba
- [ ] Enviar SMS real de prueba
- [ ] Enviar WhatsApp real de prueba
- [ ] Verificar webhook call.initiated
- [ ] Verificar webhook call.answered
- [ ] Verificar webhook call.hangup
- [ ] Verificar webhook message.sent
- [ ] Verificar webhook message.delivered
- [ ] Verificar actualización automática de estados
- [ ] Verificar cálculo de costos
- [ ] Verificar transcripción de llamadas (si disponible)
- [ ] Verificar análisis de sentimiento

### End-to-End Tests (Producción)
- [ ] Workflow: Outbound Sales Call completo
- [ ] Workflow: SMS Drip Campaign completo
- [ ] Workflow: WhatsApp Engagement completo
- [ ] Workflow: Abandoned Cart Recovery
- [ ] Workflow: Support Follow-up
- [ ] Dashboard: Visualización de KPIs
- [ ] Dashboard: Historial de llamadas
- [ ] Dashboard: Historial de SMS
- [ ] Dashboard: Historial de WhatsApp
- [ ] Dashboard: Desglose de costos
- [ ] Dashboard: Auto-refresh
- [ ] Integración con The Hive
- [ ] Comunicación con otros agentes
- [ ] Métricas y analytics

---

## 🚀 Comandos de Testing

### Ejecutar todos los tests de Ivy-Call
```bash
pnpm test server/__tests__/ivy-call.test.ts
```

### Ejecutar tests con cobertura
```bash
pnpm test:coverage server/__tests__/ivy-call.test.ts
```

### Ejecutar tests en modo watch (desarrollo)
```bash
pnpm test:watch server/__tests__/ivy-call.test.ts
```

### Ejecutar tests específicos
```bash
pnpm test server/__tests__/ivy-call.test.ts -t "should make a call successfully"
```

---

## 📈 Métricas de Éxito

### Unit Tests
- ✅ **Cobertura mínima**: 80%
- ✅ **Tests pasando**: 30/30
- ✅ **Tiempo de ejecución**: < 5 segundos

### Integration Tests
- ⏳ **Llamadas exitosas**: > 95%
- ⏳ **SMS entregados**: > 98%
- ⏳ **WhatsApp entregados**: > 95%
- ⏳ **Webhooks recibidos**: 100%
- ⏳ **Tiempo de respuesta API**: < 2 segundos

### End-to-End Tests
- ⏳ **Workflows completados**: 100%
- ⏳ **Precisión de datos**: 100%
- ⏳ **UI responsive**: < 1 segundo
- ⏳ **Auto-refresh funcional**: 100%

---

## 🐛 Debugging

### Ver logs de Telnyx
```bash
tail -f /var/log/ivy-ai/telnyx-webhook.log
```

### Ver logs del agente
```bash
tail -f /var/log/ivy-ai/ivy-call.log
```

### Verificar estado de la base de datos
```sql
-- Ver últimas llamadas
SELECT * FROM calls ORDER BY createdAt DESC LIMIT 10;

-- Ver últimos SMS
SELECT * FROM smsMessages ORDER BY createdAt DESC LIMIT 10;

-- Ver costos totales
SELECT 
  SUM(CASE WHEN status = 'completed' THEN cost ELSE 0 END) as total_cost,
  COUNT(*) as total_communications
FROM calls;
```

---

## 📝 Notas Importantes

1. **Costos de Testing**: Cada llamada/SMS de prueba tiene un costo real. Usa números de prueba cuando sea posible.

2. **Rate Limits**: Telnyx tiene límites de tasa (rate limits). No ejecutes tests masivos sin configurar delays.

3. **Webhooks**: Para testing local, usa ngrok o similar para exponer tu servidor local:
   ```bash
   ngrok http 3000
   ```
   Luego configura la URL de ngrok en Telnyx.

4. **Números de Prueba**: Telnyx ofrece números de prueba gratuitos para desarrollo. Úsalos antes de comprar números reales.

5. **Sandbox Mode**: Algunos proveedores ofrecen modo sandbox. Verifica si Telnyx lo soporta para tu caso de uso.

---

## 🎯 Próximos Pasos

1. ✅ **Ejecutar Unit Tests** - Sin credenciales
2. ⏳ **Configurar credenciales de Telnyx** - Obtener API keys
3. ⏳ **Ejecutar Integration Tests** - Con credenciales reales
4. ⏳ **Configurar webhooks** - Para eventos en tiempo real
5. ⏳ **Ejecutar End-to-End Tests** - Flujos completos
6. ⏳ **Monitorear en producción** - Métricas reales

---

**Fecha de creación**: Diciembre 2025  
**Versión**: 1.0.0  
**Autor**: Ivy.AI Development Team
