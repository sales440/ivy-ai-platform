# 🎯 Ivy-Call - Agente de Comunicación Multicanal

## 📋 Resumen Ejecutivo

**Ivy-Call** es el 7º agente especializado del ecosistema Ivy.AI, diseñado para comunicación multicanal (llamadas telefónicas, SMS, WhatsApp) integrado completamente con **The Hive** (orquestador central).

---

## ✅ Componentes Implementados

### 1. **Base de Datos (Schema Completo)**

#### Tablas Creadas:

**`calls`** - Historial de llamadas telefónicas
- `id`, `companyId`, `leadId`, `userId`
- `callSid` (Telnyx Call ID)
- `direction` (inbound/outbound)
- `from`, `to` (números de teléfono)
- `status` (initiated, ringing, answered, completed, failed, busy, no-answer)
- `duration` (segundos)
- `recordingUrl`
- `cost` (decimal)
- `sentiment` (positive, neutral, negative)
- `outcome` (interested, callback, not-interested, voicemail, no-answer, wrong-number)
- `notes`, `metadata`
- `startedAt`, `answeredAt`, `endedAt`, `createdAt`

**`callTranscripts`** - Transcripciones de llamadas con IA
- `id`, `callId`
- `speaker` (agent/customer)
- `text`
- `sentiment`, `sentimentScore`
- `timestamp` (segundos desde inicio de llamada)
- `createdAt`

**`smsMessages`** - Mensajes SMS/MMS
- `id`, `companyId`, `leadId`
- `messageSid` (Telnyx Message ID)
- `direction` (inbound/outbound)
- `from`, `to`
- `body`, `mediaUrl`
- `status` (queued, sending, sent, delivered, failed, undelivered)
- `cost`, `errorCode`, `errorMessage`
- `sentAt`, `deliveredAt`, `createdAt`

**`whatsappConversations`** - Conversaciones de WhatsApp
- `id`, `companyId`, `leadId`
- `conversationId` (Telnyx Conversation ID)
- `phoneNumber`
- `status` (active/closed)
- `lastMessageAt`, `createdAt`, `updatedAt`

**`whatsappMessages`** - Mensajes individuales de WhatsApp
- `id`, `conversationId`
- `messageSid`
- `direction`, `messageType` (text, image, video, document, audio, template)
- `body`, `mediaUrl`
- `status` (queued, sending, sent, delivered, read, failed)
- `conversationType` (marketing, utility, authentication, service)
- `cost`, `errorCode`, `errorMessage`
- `sentAt`, `deliveredAt`, `readAt`, `createdAt`

**`communicationAnalytics`** - Métricas y analytics
- `id`, `companyId`, `date`
- `channel` (voice, sms, whatsapp)
- `totalMessages`, `successfulMessages`, `failedMessages`
- `totalCost`, `averageDuration`
- `positiveInteractions`, `neutralInteractions`, `negativeInteractions`
- `createdAt`, `updatedAt`

---

### 2. **Agente Ivy-Call** (`server/agents/call.ts`)

#### Clase Principal:
```typescript
export class IvyCall extends IvyAgent
```

#### Configuración:
- **Nombre**: "Ivy-Call"
- **Tipo**: `AgentType.CALL`
- **Departamento**: `Department.SALES`

#### Capacidades:
- `voice_calls` - Llamadas telefónicas automatizadas
- `sms_messaging` - Mensajería SMS/MMS
- `whatsapp_messaging` - WhatsApp Business
- `ai_conversation` - Conversaciones con IA
- `speech_to_text` - Transcripción en tiempo real
- `text_to_speech` - Síntesis de voz
- `sentiment_analysis` - Análisis de sentimiento
- `campaign_automation` - Automatización de campañas

#### KPIs Tracked:
- `total_calls` / `successful_calls`
- `total_sms` / `delivered_sms`
- `total_whatsapp`
- `positive_interactions`
- `leads_contacted`
- `conversion_rate`

#### Métodos Principales:
- `makeCall(task)` - Iniciar llamada con script personalizado
- `sendSMS(task)` - Enviar mensaje SMS
- `sendWhatsApp(task)` - Enviar mensaje WhatsApp
- `generateCallScript(leadContext)` - Generar script con GPT-4o-mini
- `generateSMSMessage(leadContext)` - Generar SMS personalizado
- `generateWhatsAppMessage(leadContext)` - Generar mensaje WhatsApp
- `sendMessageToAgent(toAgentType, message, context)` - Comunicación inter-agente

---

### 3. **Servicios de Telnyx**

#### **Voice API** (`server/services/telnyx-voice.ts`)
```typescript
makeCall(params) // Iniciar llamada saliente
answerCall(callControlId) // Contestar llamada entrante
hangupCall(callControlId) // Colgar llamada
speakText(callControlId, text, voice, language) // Text-to-Speech
gatherInput(callControlId, prompt, maxDigits, timeout) // Capturar entrada DTMF/voz
startRecording(callControlId, channels) // Iniciar grabación
stopRecording(callControlId) // Detener grabación
transferCall(callControlId, to) // Transferir llamada
bridgeCalls(callControlId, targetCallControlId) // Unir llamadas
getCallStatus(callControlId) // Obtener estado
```

#### **SMS API** (`server/services/telnyx-sms.ts`)
```typescript
sendSMS(params) // Enviar SMS
sendMMS(params) // Enviar MMS con multimedia
sendBulkSMS(recipients, text, from) // Envío masivo
sendSMSWithTracking(params, webhookUrl) // SMS con tracking
getMessageStatus(messageId) // Obtener estado
```

#### **WhatsApp API** (`server/services/telnyx-whatsapp.ts`)
```typescript
sendWhatsAppMessage(params) // Enviar mensaje
sendWhatsAppTemplate(to, templateName, templateParams, from) // Plantilla
sendWhatsAppImage(to, imageUrl, caption, from) // Imagen
sendWhatsAppVideo(to, videoUrl, caption, from) // Video
sendWhatsAppDocument(to, documentUrl, filename, from) // Documento
sendWhatsAppAudio(to, audioUrl, from) // Audio
sendBulkWhatsApp(recipients, text, from) // Envío masivo
getWhatsAppMessageStatus(messageId) // Estado
```

---

### 4. **Funciones de Base de Datos** (`server/db.ts`)

#### Calls:
- `createCall(data)` - Crear registro de llamada
- `getCallById(id)` - Obtener llamada por ID
- `getCallsByCompanyId(companyId, limit)` - Llamadas por empresa
- `getCallsByLeadId(leadId)` - Llamadas por lead
- `updateCallStatus(id, status, duration, endedAt)` - Actualizar estado

#### Transcripts:
- `createCallTranscript(data)` - Crear transcripción
- `getTranscriptsByCallId(callId)` - Obtener transcripciones

#### SMS:
- `createSMS(data)` - Crear registro de SMS
- `getSMSByCompanyId(companyId, limit)` - SMS por empresa
- `getSMSByLeadId(leadId)` - SMS por lead
- `updateSMSStatus(id, status, deliveredAt, errorCode, errorMessage)` - Actualizar estado

#### WhatsApp:
- `createWhatsAppConversation(data)` - Crear conversación
- `getWhatsAppConversationByPhone(companyId, phoneNumber)` - Obtener conversación
- `createWhatsAppMessage(data)` - Crear mensaje
- `getWhatsAppMessagesByConversationId(conversationId)` - Obtener mensajes
- `updateWhatsAppMessageStatus(id, status, deliveredAt, readAt)` - Actualizar estado

#### Analytics:
- `getCommunicationAnalytics(companyId, startDate, endDate)` - Obtener analytics
- `upsertCommunicationAnalytics(data)` - Crear/actualizar analytics
- `getTotalCommunicationCosts(companyId, startDate, endDate)` - Costos totales

---

### 5. **Routers tRPC** (`server/communication-router.ts`)

#### Endpoints de Voice:
- `makeCall` - Iniciar llamada saliente
- `getCallHistory` - Historial de llamadas
- `getCall` - Obtener llamada por ID
- `getCallTranscripts` - Obtener transcripciones
- `getCallsByLead` - Llamadas de un lead

#### Endpoints de SMS:
- `sendSMS` - Enviar SMS
- `sendBulkSMS` - Envío masivo de SMS
- `getSMSHistory` - Historial de SMS
- `getSMSByLead` - SMS de un lead

#### Endpoints de WhatsApp:
- `sendWhatsApp` - Enviar mensaje
- `sendWhatsAppTemplate` - Enviar plantilla
- `sendWhatsAppImage` - Enviar imagen
- `getWhatsAppConversation` - Obtener conversación
- `getWhatsAppMessages` - Obtener mensajes

#### Endpoints de Analytics:
- `getAnalytics` - Obtener analytics
- `getCosts` - Obtener costos totales
- `getIvyCallKPIs` - KPIs del agente
- `getDashboardStats` - Estadísticas del dashboard

---

### 6. **Integración con The Hive**

#### Registro en Orchestrator (`server/hive/orchestrator.ts`):
```typescript
const call = new IvyCall();
await call.initialize();
this.registerAgent(call);
```

#### Comunicación Inter-Agente:
Ivy-Call puede:
- Recibir tareas del orquestador
- Enviar mensajes a otros agentes (Prospect, Closer, Solve, etc.)
- Reportar métricas al sistema central
- Participar en workflows automatizados

---

## 🔧 Variables de Entorno Requeridas

Agregar a `.env` o configurar en Manus Settings → Secrets:

```env
TELNYX_API_KEY=KEYxxxxxxxxxxxxxxxxxxxxx
TELNYX_CONNECTION_ID=xxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
TELNYX_PHONE_NUMBER=+1234567890
TELNYX_MESSAGING_PROFILE_ID=xxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 💰 Costos Estimados (Telnyx - USA)

### Por Unidad:
- **Llamadas salientes**: $0.002/min
- **Llamadas entrantes**: $0.002/min
- **SMS saliente**: $0.0025
- **SMS entrante**: GRATIS
- **WhatsApp**: ~$0.04/conversación

### Escenario: 100 clientes
- 500 llamadas/mes (3 min promedio): $300/mes
- 1,000 SMS/mes: $250/mes
- 200 conversaciones WhatsApp/mes: $800/mes
- **Total: $1,500/mes**

### ROI Proyectado:
- Ingresos: 100 clientes × $200/mes = $20,000/mes
- **Margen bruto: 92.5%** 🚀

---

## 📊 Ejemplo de Uso

### 1. Hacer una llamada automatizada:
```typescript
const result = await trpc.communication.makeCall.mutate({
  leadId: 123,
  phoneNumber: '+1234567890',
  script: 'Hola, soy Ivy de Ivy.AI. ¿Podemos agendar una demo?',
  campaignId: 'campaign_001'
});
```

### 2. Enviar SMS personalizado:
```typescript
const result = await trpc.communication.sendSMS.mutate({
  leadId: 123,
  phoneNumber: '+1234567890',
  message: 'Hola Juan, gracias por tu interés en Ivy.AI. ¿Cuándo podemos hablar?'
});
```

### 3. Enviar WhatsApp con imagen:
```typescript
const result = await trpc.communication.sendWhatsAppImage.mutate({
  phoneNumber: '+1234567890',
  imageUrl: 'https://example.com/product.jpg',
  caption: 'Mira nuestro nuevo producto!'
});
```

### 4. Obtener estadísticas del dashboard:
```typescript
const stats = await trpc.communication.getDashboardStats.query({
  companyId: 1
});
// Returns: { calls, sms, costs, recentCalls, recentSMS, analytics }
```

---

## 🚀 Próximos Pasos

### Fase 7: Webhooks de Telnyx
- Implementar endpoints para recibir eventos en tiempo real
- Actualizar estados de llamadas/SMS/WhatsApp automáticamente
- Procesar transcripciones en tiempo real

### Fase 8: Workflows Automatizados
- Crear workflows que incluyan Ivy-Call
- Ejemplo: Prospect → Call → Closer
- Automatización de seguimientos

### Fase 9: Dashboard y UI
- Página de gestión de comunicaciones
- Visualización de analytics
- Historial de llamadas/SMS/WhatsApp
- Reproductor de grabaciones

### Fase 10: Testing y Deployment
- Pruebas de integración con Telnyx
- Validación de webhooks
- Checkpoint final

---

## 📝 Notas Importantes

1. **Ivy-Call está completamente integrado con The Hive** - Puede ser coordinado por workflows y comunicarse con otros agentes

2. **Generación de contenido con IA** - Los scripts de llamadas y mensajes se generan automáticamente usando GPT-4o-mini basándose en el contexto del lead

3. **Tracking completo** - Todas las comunicaciones se guardan en la base de datos con métricas detalladas

4. **Análisis de sentimiento** - Las llamadas se analizan para determinar el sentimiento del cliente (positivo, neutral, negativo)

5. **Costos transparentes** - Todos los costos de Telnyx se registran automáticamente para facturación precisa

---

## 🎯 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        The Hive                              │
│                  (Meta-Agente Orquestador)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
   ┌────▼────┐    ┌───▼────┐    ┌───▼────┐    ┌───▼────┐
   │  Ivy-   │    │  Ivy-  │    │  Ivy-  │    │  Ivy-  │
   │Prospect │    │ Closer │    │ Solve  │    │  Call  │
   └─────────┘    └────────┘    └────────┘    └────┬───┘
                                                    │
                              ┌─────────────────────┼─────────────────────┐
                              │                     │                     │
                         ┌────▼────┐           ┌───▼────┐           ┌───▼────┐
                         │ Telnyx  │           │ Telnyx │           │ Telnyx │
                         │  Voice  │           │  SMS   │           │WhatsApp│
                         └─────────┘           └────────┘           └────────┘
```

---

## ✅ Estado Actual

- ✅ Base de datos completa
- ✅ Agente Ivy-Call integrado con The Hive
- ✅ Servicios de Telnyx (Voice, SMS, WhatsApp)
- ✅ Funciones de base de datos
- ✅ Routers tRPC
- ⏳ Webhooks de Telnyx (pendiente)
- ⏳ Workflows automatizados (pendiente)
- ⏳ Dashboard y UI (pendiente)
- ⏳ Testing completo (pendiente)

---

**Fecha de implementación**: Diciembre 2025  
**Versión**: 1.0.0-alpha  
**Estado**: En desarrollo activo
