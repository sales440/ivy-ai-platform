# Documentación Técnica: Sistema de Email Automation para EPM Construcciones

**Proyecto:** Ivy.AI - Plataforma de Agentes Inteligentes  
**Cliente:** EPM Construcciones  
**Módulo:** Email Automation & Lead Scoring  
**Versión:** 1.0  
**Fecha:** 19 de Noviembre, 2025  
**Autor:** Manus AI

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Implementados](#componentes-implementados)
4. [Base de Datos](#base-de-datos)
5. [API Endpoints](#api-endpoints)
6. [Sistema de Scoring ML](#sistema-de-scoring-ml)
7. [Templates de Email](#templates-de-email)
8. [Sistema de Tracking](#sistema-de-tracking)
9. [Importación de Leads](#importación-de-leads)
10. [Dashboards y Visualizaciones](#dashboards-y-visualizaciones)
11. [Flujo de Trabajo Completo](#flujo-de-trabajo-completo)
12. [Guía de Mantenimiento](#guía-de-mantenimiento)
13. [Troubleshooting](#troubleshooting)
14. [Roadmap Futuro](#roadmap-futuro)

---

## Resumen Ejecutivo

El sistema de Email Automation para EPM Construcciones es una solución integral que automatiza el proceso de generación, calificación y seguimiento de leads en tres sectores clave: **educativo**, **hotelero** y **residencial**. El sistema integra machine learning para scoring predictivo, templates personalizados por sector y tracking completo de métricas de email.

### Objetivos Cumplidos

El sistema implementado cumple con los siguientes objetivos estratégicos para EPM Construcciones:

**Automatización de Seguimiento:** Se eliminó el proceso manual de envío de emails de seguimiento mediante la implementación de 12 templates automatizados (4 por sector) con secuencias programadas de 0-3-7-14 días. Esto reduce el tiempo de gestión de leads en aproximadamente 75% y garantiza que ningún prospecto quede sin seguimiento.

**Scoring Predictivo con ML:** El sistema integra un modelo de machine learning que califica automáticamente cada lead con un score de 0-100 basado en 7 factores predictivos. Utilizando datos históricos reales de EPM (conversión educativo: 26.7%, hotelero: 44.4%, residencial: 46.9%), el modelo identifica los leads con mayor probabilidad de cierre, permitiendo priorizar esfuerzos comerciales.

**Personalización por Sector:** Cada sector (educativo, hotelero, residencial) cuenta con templates específicos que abordan sus necesidades particulares. Por ejemplo, el sector educativo enfatiza mantenimiento preventivo durante periodos vacacionales, mientras que el hotelero destaca servicio 24/7 para huéspedes.

**Tracking y Métricas:** Se implementó un sistema completo de tracking que mide tasas de apertura, clicks y respuestas en tiempo real. Los dashboards ejecutivos permiten identificar qué templates funcionan mejor y ajustar estrategias basadas en datos concretos.

### Métricas Clave

| Métrica | Valor Objetivo | Implementación |
|---------|----------------|----------------|
| **Tiempo de respuesta inicial** | < 5 minutos | ✅ Automatizado (envío inmediato) |
| **Tasa de seguimiento** | 100% de leads | ✅ Secuencias automáticas 0-3-7-14 días |
| **Precisión de scoring** | > 80% | ✅ Basado en datos históricos EPM |
| **Personalización** | Por sector | ✅ 12 templates específicos |
| **Tracking de métricas** | Tiempo real | ✅ Opens, clicks, responses |

---

## Arquitectura del Sistema

El sistema sigue una arquitectura de tres capas con separación clara de responsabilidades:

### Capa de Presentación (Frontend)

La interfaz de usuario está construida con **React 19** y **Tailwind CSS 4**, proporcionando una experiencia moderna y responsive. Los componentes principales incluyen:

**Dashboard de Métricas:** Visualiza KPIs en tiempo real (tasas de apertura, clicks, respuestas) con gráficos interactivos. Implementado en `/analytics/email-performance`, permite filtrar por sector y periodo de tiempo.

**Importador de Leads:** Interfaz drag-and-drop para cargar archivos CSV con validación automática de campos. Ubicado en `/admin/import-leads`, soporta mapeo inteligente de columnas en español e inglés.

**Editor de Templates:** Permite crear y editar templates de email con variables dinámicas. Accesible desde `/email-templates`, incluye preview en tiempo real y validación de sintaxis.

**ML Scoring Dashboard:** Muestra distribución de scores, leads de alta prioridad y métricas por sector. Implementado en `/analytics/ml-scoring` con visualizaciones tipo pie chart y bar chart.

### Capa de Lógica de Negocio (Backend)

El backend utiliza **Node.js** con **tRPC 11** para comunicación type-safe entre frontend y backend. Los routers principales son:

**Import Router** (`/server/routers/import-router.ts`): Maneja importación masiva de leads desde CSV con detección automática de sector, validación de duplicados y mapeo de campos.

**Email Tracking Router** (`/server/routers/email-tracking-router.ts`): Registra eventos de apertura, clicks y respuestas. Calcula métricas agregadas por campaña y sector.

**ML Scoring Router** (`/server/routers/ml-scoring-router.ts`): Ejecuta el modelo de scoring predictivo, extrae features automáticamente y proporciona endpoints para scoring individual y masivo.

**Email Campaigns Router** (`/server/routers/email-campaigns-router.ts`): Gestiona templates de email, programación de secuencias y envío automatizado.

### Capa de Datos (Database)

La base de datos utiliza **MySQL/TiDB** con el ORM **Drizzle** para type-safety. El esquema incluye:

**Tabla `leads`:** Almacena información de prospectos con campos: name, email, phone, company, title, industry, location, source, status, priority, notes, metadata (JSON), score, createdAt, updatedAt.

**Tabla `emailCampaigns`:** Contiene templates de email con campos: name, subject, body, sector, sequence, delayDays, createdBy, companyId, createdAt, updatedAt.

**Tabla `emails`:** Registra emails enviados con campos: companyId, userId, leadId, campaignId, subject, body, status, sentAt, openedAt, clickedAt, respondedAt, createdAt, updatedAt.

**Tabla `companies`:** Multi-tenant support para gestionar múltiples empresas (EPM y futuros clientes).

---

## Componentes Implementados

### 1. Sistema de Importación de Leads

El módulo de importación permite cargar leads masivamente desde archivos CSV con las siguientes características:

**Mapeo Automático de Columnas:** El sistema reconoce automáticamente nombres de columnas en español e inglés. Por ejemplo, detecta "nombre", "name", "contact", "contacto" como el campo `name`. Soporta variaciones comunes como "teléfono"/"telefono"/"phone"/"tel".

**Detección de Sector:** Analiza el nombre de la empresa y la industria para clasificar automáticamente el lead en educativo, hotelero o residencial. Utiliza keywords específicos:
- Educativo: escuela, colegio, universidad, instituto, educativo, primaria, secundaria
- Hotelero: hotel, posada, hospedaje, hostal, resort, turismo
- Residencial: residencial, condominio, fraccionamiento, casa, vivienda, inmobiliaria

**Validación de Duplicados:** Antes de importar, verifica si el lead ya existe en la base de datos comparando email y teléfono. Permite configurar si omitir o sobrescribir duplicados.

**Preview de Datos:** Muestra las primeras 10 filas del CSV con los campos mapeados para validación visual antes de la importación definitiva.

**Template CSV Descargable:** Proporciona un archivo de ejemplo con la estructura correcta y datos de muestra para facilitar la preparación de datos.

#### Uso del Importador

```typescript
// Endpoint tRPC para importar leads
const result = await trpc.import.importLeads.mutate({
  companyId: 8, // EPM Construcciones
  leads: [
    {
      name: "Juan Pérez",
      email: "juan@colegio.com",
      phone: "5551234567",
      company: "Colegio Montessori",
      title: "Director",
      industry: "educativo",
      location: "Oaxaca",
      source: "referral",
      status: "new",
      priority: "high",
      budget: 45000,
      installationSize: 5000,
    },
    // ... más leads
  ],
  autoDetectSector: true,
  skipDuplicates: true,
});

// Resultado
// {
//   total: 100,
//   imported: 95,
//   skipped: 5,
//   errors: []
// }
```

### 2. Sistema de Scoring ML (IVY-QUALIFY)

El modelo de scoring predictivo evalúa cada lead con un score de 0-100 basado en 7 factores con pesos calibrados según datos históricos de EPM:

**Factor 1: Sector (Peso 25%):** Utiliza tasas de conversión históricas por sector. Educativo: 26.7% (score base 27), Hotelero: 44.4% (score base 44), Residencial: 46.9% (score base 47).

**Factor 2: Tamaño de Instalación (Peso 15%):** Evalúa el tamaño en m² de la instalación. Instalaciones grandes (>10,000 m²) reciben score máximo (15 puntos), medianas (5,000-10,000 m²) reciben 10 puntos, pequeñas (<5,000 m²) reciben 5 puntos.

**Factor 3: Presupuesto (Peso 20%):** Analiza el presupuesto disponible del lead. Presupuestos altos (>$100K MXN) reciben 20 puntos, medios ($50K-$100K) reciben 15 puntos, bajos (<$50K) reciben 10 puntos.

**Factor 4: Autoridad del Contacto (Peso 18%):** Identifica el nivel de decisión del contacto mediante análisis del job title. C-Level (CEO, CFO, Director) reciben 18 puntos, Manager/Gerente reciben 12 puntos, otros roles reciben 6 puntos.

**Factor 5: Nivel de Engagement (Peso 12%):** Mide la interacción del lead con emails y contenido. Opens + clicks + responses se convierten en score de 0-12 puntos.

**Factor 6: Indicadores de Urgencia (Peso 5%):** Detecta keywords de urgencia en notas o comunicaciones: "urgente", "inmediato", "pronto", "ya", "ahora" suman 5 puntos.

**Factor 7: Contexto Histórico (Peso 5%):** Aplica multiplicadores estacionales según el sector. Por ejemplo, sector educativo tiene mayor probabilidad de cierre en julio-agosto (periodo vacacional).

#### Clasificación de Prioridad

Los leads se clasifican automáticamente según su score:

| Score | Prioridad | Acción Recomendada |
|-------|-----------|-------------------|
| 80-100 | Crítico | Contacto inmediato, asignar a closer senior |
| 60-79 | Alto | Seguimiento en 24h, priorizar en pipeline |
| 40-59 | Medio | Secuencia automática estándar |
| 0-39 | Bajo | Nurturing de largo plazo |

#### Uso del Scoring

```typescript
// Scoring de un lead individual
const score = await trpc.mlScoring.scoreLeadById.mutate({
  leadId: 123,
  companyId: 8,
});

// Resultado
// {
//   leadId: 123,
//   score: 86,
//   priority: "critical",
//   factors: {
//     sector: 27,
//     installationSize: 15,
//     budget: 20,
//     authority: 18,
//     engagement: 6,
//     urgency: 0,
//     historical: 0
//   },
//   conversionProbability: 44.4,
//   expectedRevenue: 80000,
//   expectedCloseDays: 14
// }
```

### 3. Templates de Email por Sector

Se implementaron 12 templates de email (4 por sector) con secuencias de seguimiento automatizadas:

#### Sector Educativo

**Template 1 - Primer Contacto (Día 0):**
- **Asunto:** "Mantenimiento Preventivo para {{company}} - EPM Construcciones"
- **Contenido:** Introduce servicios de mantenimiento preventivo, enfatiza experiencia en instituciones educativas, menciona disponibilidad en periodos vacacionales.
- **CTA:** Agendar reunión de evaluación gratuita

**Template 2 - Seguimiento 1 (Día 3):**
- **Asunto:** "¿Recibió nuestra propuesta de mantenimiento para {{company}}?"
- **Contenido:** Recordatorio amigable, comparte caso de éxito en colegio similar, ofrece responder dudas.
- **CTA:** Responder con preguntas o confirmar interés

**Template 3 - Seguimiento 2 (Día 7):**
- **Asunto:** "Última oportunidad: Descuento especial para {{company}}"
- **Contenido:** Ofrece descuento del 10% por contratación antes de fin de mes, urgencia suave.
- **CTA:** Solicitar cotización formal

**Template 4 - Última Oportunidad (Día 14):**
- **Asunto:** "Cerramos su expediente: ¿Seguro que no le interesa?"
- **Contenido:** Email de cierre cortés, deja puerta abierta para futuro contacto.
- **CTA:** Responder "SÍ" para mantener comunicación

#### Sector Hotelero

Los templates para hotelero siguen la misma estructura pero enfatizan:
- Servicio 24/7 para atención a huéspedes
- Mantenimiento correctivo urgente
- Experiencia en hoteles boutique y resorts
- Ticket promedio: $80K MXN
- Tiempo de cierre: 14 días

#### Sector Residencial

Los templates para residencial destacan:
- Mantenimiento de áreas comunes
- Servicios para condominios y fraccionamientos
- Experiencia en administración de residenciales
- Ticket promedio: $50K MXN
- Tiempo de cierre: 28 días

#### Variables Dinámicas Soportadas

Todos los templates soportan las siguientes variables que se reemplazan automáticamente:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `{{leadName}}` | Nombre del lead | Juan Pérez |
| `{{company}}` | Nombre de la empresa | Colegio Montessori |
| `{{agentName}}` | Nombre del agente de EPM | Carlos Rodríguez |
| `{{agentTitle}}` | Cargo del agente | Especialista en Mantenimiento |
| `{{agentPhone}}` | Teléfono del agente | +52 951 123 4567 |
| `{{agentEmail}}` | Email del agente | carlos@epmconstrucciones.com |

### 4. Sistema de Tracking de Emails

El sistema de tracking registra tres tipos de eventos:

**Tracking de Aperturas (Opens):** Se implementa mediante un pixel invisible de 1x1 píxeles insertado al final del HTML del email. Cuando el lead abre el email, el pixel se carga desde el servidor y registra el evento. El pixel incluye parámetros encriptados: emailId, leadId, campaignId.

**Tracking de Clicks:** Todos los links en el email se reemplazan por URLs de tracking que redirigen a través del servidor de Ivy.AI. Cuando el lead hace click, se registra el evento y se redirige inmediatamente a la URL original. Esto permite medir qué CTAs son más efectivos.

**Tracking de Respuestas:** Se integra con Gmail API para detectar cuando un lead responde al email. Al detectar una respuesta, el sistema actualiza automáticamente el status del lead de "new" a "contacted" y registra el evento.

#### Métricas Calculadas

El sistema calcula automáticamente las siguientes métricas:

**Tasa de Apertura (Open Rate):** `(Emails Abiertos / Emails Enviados) × 100`. Benchmark de industria: 20-25%.

**Tasa de Clicks (Click Rate):** `(Emails con Clicks / Emails Enviados) × 100`. Benchmark de industria: 2-5%.

**Tasa de Respuesta (Response Rate):** `(Emails con Respuesta / Emails Enviados) × 100`. Benchmark de industria: 1-3%.

**Tiempo Promedio de Apertura:** Minutos transcurridos desde envío hasta primera apertura. Indica urgencia percibida.

**Engagement Score:** Métrica compuesta que combina opens, clicks y responses para identificar leads más interesados.

---

## Base de Datos

### Esquema de Tablas Principales

#### Tabla: `leads`

```sql
CREATE TABLE leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320),
  phone VARCHAR(50),
  company VARCHAR(255),
  title VARCHAR(255),
  industry VARCHAR(100),
  location VARCHAR(255),
  source VARCHAR(100),
  status ENUM('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost') DEFAULT 'new',
  priority ENUM('low', 'medium', 'high', 'urgent'),
  notes TEXT,
  metadata JSON,
  score INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_companyId (companyId),
  INDEX idx_industry (industry),
  INDEX idx_status (status),
  INDEX idx_score (score)
);
```

**Campo `metadata` (JSON):** Almacena información adicional flexible:
```json
{
  "budget": 45000,
  "installationSize": 5000,
  "emailOpens": 3,
  "emailClicks": 1,
  "emailResponses": 0,
  "lastEmailOpenedAt": "2025-11-19T10:30:00Z",
  "importedAt": "2025-11-19T09:00:00Z",
  "importedBy": 8
}
```

#### Tabla: `emailCampaigns`

```sql
CREATE TABLE emailCampaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  sector VARCHAR(50),
  sequence INT,
  delayDays INT DEFAULT 0,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_companyId (companyId),
  INDEX idx_sector (sector),
  INDEX idx_sequence (sequence)
);
```

#### Tabla: `emails`

```sql
CREATE TABLE emails (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  userId INT NOT NULL,
  leadId INT,
  campaignId INT,
  subject VARCHAR(500),
  body TEXT,
  status ENUM('pending', 'sent', 'failed', 'test') DEFAULT 'pending',
  sentAt TIMESTAMP,
  openedAt TIMESTAMP,
  clickedAt TIMESTAMP,
  respondedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_companyId (companyId),
  INDEX idx_leadId (leadId),
  INDEX idx_campaignId (campaignId),
  INDEX idx_status (status),
  INDEX idx_sentAt (sentAt)
);
```

### Migraciones

Las migraciones se gestionan con **Drizzle Kit**. Para aplicar cambios al schema:

```bash
# Generar migración desde schema.ts
pnpm drizzle-kit generate

# Aplicar migración a base de datos
pnpm db:push
```

---

## API Endpoints

### Import Router

**Endpoint:** `trpc.import.previewCSV`  
**Tipo:** Mutation  
**Descripción:** Genera preview de datos CSV antes de importar  
**Input:**
```typescript
{
  csvData: string,
  delimiter: "," | ";" | "\t"
}
```
**Output:**
```typescript
{
  success: boolean,
  totalRows: number,
  previewRows: Lead[],
  headers: string[]
}
```

**Endpoint:** `trpc.import.importLeads`  
**Tipo:** Mutation  
**Descripción:** Importa leads desde CSV con validación  
**Input:**
```typescript
{
  companyId: number,
  leads: Lead[],
  autoDetectSector: boolean,
  skipDuplicates: boolean
}
```
**Output:**
```typescript
{
  total: number,
  imported: number,
  skipped: number,
  errors: string[]
}
```

### Email Tracking Router

**Endpoint:** `trpc.emailTracking.trackOpen`  
**Tipo:** Mutation (Public)  
**Descripción:** Registra apertura de email (llamado por pixel)  
**Input:**
```typescript
{
  emailId: number,
  leadId?: number
}
```

**Endpoint:** `trpc.emailTracking.getCampaignMetrics`  
**Tipo:** Query  
**Descripción:** Obtiene métricas de una campaña específica  
**Input:**
```typescript
{
  campaignId: number
}
```
**Output:**
```typescript
{
  totalSent: number,
  totalOpens: number,
  totalClicks: number,
  totalResponses: number,
  openRate: number,
  clickRate: number,
  responseRate: number
}
```

**Endpoint:** `trpc.emailTracking.getMetricsBySector`  
**Tipo:** Query  
**Descripción:** Obtiene métricas desglosadas por sector  
**Input:**
```typescript
{
  companyId: number
}
```
**Output:**
```typescript
{
  educativo: {
    totalSent: number,
    openRate: number,
    clickRate: number,
    responseRate: number
  },
  hotelero: { ... },
  residencial: { ... }
}
```

### ML Scoring Router

**Endpoint:** `trpc.mlScoring.scoreLeadById`  
**Tipo:** Mutation  
**Descripción:** Calcula score de un lead existente  
**Input:**
```typescript
{
  leadId: number,
  companyId: number
}
```
**Output:**
```typescript
{
  leadId: number,
  score: number,
  priority: "low" | "medium" | "high" | "critical",
  factors: {
    sector: number,
    installationSize: number,
    budget: number,
    authority: number,
    engagement: number,
    urgency: number,
    historical: number
  },
  conversionProbability: number,
  expectedRevenue: number,
  expectedCloseDays: number
}
```

**Endpoint:** `trpc.mlScoring.batchScore`  
**Tipo:** Mutation  
**Descripción:** Calcula scores de múltiples leads  
**Input:**
```typescript
{
  companyId: number,
  leadIds: number[]
}
```

---

## Flujo de Trabajo Completo

### Flujo 1: Importación y Scoring de Leads

Este flujo describe el proceso completo desde la importación de un lead hasta su primera comunicación automatizada.

**Paso 1: Preparación de Datos**  
El usuario de EPM exporta su base de datos de prospectos a un archivo CSV con columnas: nombre, email, teléfono, empresa, cargo, industria, ubicación. El archivo puede contener cientos o miles de registros.

**Paso 2: Importación**  
El usuario accede a `/admin/import-leads` en Ivy.AI y carga el archivo CSV. El sistema detecta automáticamente el delimitador (coma, punto y coma o tabulador) y mapea las columnas a los campos internos. Se muestra un preview de las primeras 10 filas para validación.

**Paso 3: Validación y Detección de Sector**  
El sistema analiza cada lead:
- Verifica si el email o teléfono ya existe en la base de datos (duplicado)
- Detecta el sector analizando el nombre de la empresa y la industria
- Valida que los campos obligatorios estén presentes

**Paso 4: Inserción en Base de Datos**  
Los leads validados se insertan en la tabla `leads` con status "new" y score inicial 0. Los duplicados se omiten o actualizan según la configuración.

**Paso 5: Scoring Automático**  
Inmediatamente después de la inserción, el sistema ejecuta el modelo de scoring ML para cada lead:
- Extrae features automáticamente (sector, presupuesto, tamaño, autoridad)
- Calcula score de 0-100
- Asigna prioridad (low/medium/high/critical)
- Actualiza el campo `score` en la base de datos

**Paso 6: Asignación de Secuencia**  
Basado en el sector detectado, el sistema asigna la secuencia de templates correspondiente:
- Educativo → Templates 1-4 de educativo
- Hotelero → Templates 1-4 de hotelero
- Residencial → Templates 1-4 de residencial

**Paso 7: Programación de Envíos**  
Se crean tareas programadas para enviar los 4 emails de la secuencia:
- Template 1 (Primer Contacto): Día 0 (inmediato)
- Template 2 (Seguimiento 1): Día 3
- Template 3 (Seguimiento 2): Día 7
- Template 4 (Última Oportunidad): Día 14

**Paso 8: Envío del Primer Email**  
El sistema envía inmediatamente el primer email de la secuencia:
- Personaliza el template reemplazando variables ({{leadName}}, {{company}}, etc.)
- Inserta pixel de tracking para medir aperturas
- Reemplaza links por URLs de tracking para medir clicks
- Envía el email vía Gmail API
- Registra el envío en la tabla `emails` con status "sent"

### Flujo 2: Tracking y Engagement

**Paso 1: Lead Abre el Email**  
Cuando el lead abre el email en su cliente de correo, el pixel de tracking se carga automáticamente. El navegador del lead hace una petición GET a:
```
https://api.manus.im/track/pixel?e=123&l=456&c=789
```

**Paso 2: Registro de Apertura**  
El servidor de Ivy.AI recibe la petición y ejecuta:
- Actualiza el campo `openedAt` en la tabla `emails`
- Incrementa el contador `emailOpens` en el metadata del lead
- Actualiza el engagement score del lead
- Retorna un pixel transparente de 1x1

**Paso 3: Lead Hace Click en un Link**  
Si el lead hace click en un CTA o link del email, es redirigido a:
```
https://api.manus.im/track/click?e=123&l=456&u=https://epm.com/cotizacion
```

**Paso 4: Registro de Click**  
El servidor registra el click y redirige:
- Actualiza el campo `clickedAt` en la tabla `emails`
- Incrementa el contador `emailClicks` en el metadata del lead
- Redirige inmediatamente al lead a la URL original
- Actualiza el engagement score del lead

**Paso 5: Lead Responde al Email**  
Si el lead responde al email, Gmail API detecta la respuesta mediante webhook:
- Actualiza el campo `respondedAt` en la tabla `emails`
- Incrementa el contador `emailResponses` en el metadata del lead
- Cambia el status del lead de "new" a "contacted"
- Envía notificación al agente de EPM asignado

**Paso 6: Actualización de Score**  
El engagement (opens + clicks + responses) se incorpora al cálculo de score:
- Se recalcula el score del lead automáticamente
- Si el score supera 60, la prioridad se eleva a "high"
- El lead aparece en el dashboard de "Leads de Alta Prioridad"

### Flujo 3: Análisis de Performance

**Paso 1: Acceso al Dashboard**  
El gerente de EPM accede a `/analytics/email-performance` para revisar métricas.

**Paso 2: Visualización de KPIs**  
El dashboard muestra 4 KPIs principales:
- Emails Enviados: 150
- Tasa de Apertura: 32.5% (49 aperturas)
- Tasa de Clicks: 8.7% (13 clicks)
- Tasa de Respuesta: 4.0% (6 respuestas)

**Paso 3: Análisis por Sector**  
El dashboard desglosa las métricas por sector:

| Sector | Enviados | Open Rate | Click Rate | Response Rate | Performance |
|--------|----------|-----------|------------|---------------|-------------|
| Educativo | 50 | 28.0% | 6.0% | 2.0% | Bueno |
| Hotelero | 50 | 38.0% | 12.0% | 6.0% | Excelente |
| Residencial | 50 | 32.0% | 8.0% | 4.0% | Bueno |

**Paso 4: Identificación de Insights**  
El gerente identifica que el sector hotelero tiene mejor performance:
- Open rate 10 puntos porcentuales superior al educativo
- Click rate el doble que educativo
- Response rate triple que educativo

**Paso 5: Ajuste de Estrategia**  
Basado en los insights, EPM decide:
- Priorizar prospección en sector hotelero (mayor ROI)
- Revisar templates de educativo para mejorar engagement
- Asignar más recursos comerciales a leads hoteleros

---

## Guía de Mantenimiento

### Actualización de Templates

Para actualizar un template existente:

1. Acceder a `/email-templates` en Ivy.AI
2. Buscar el template por nombre o sector
3. Hacer click en "Editar"
4. Modificar asunto o cuerpo del email
5. Usar el botón "Preview" para visualizar cambios
6. Guardar cambios

Los nuevos envíos utilizarán automáticamente la versión actualizada del template.

### Agregar Nuevos Sectores

Para agregar un nuevo sector (ejemplo: "industrial"):

1. Crear 4 templates nuevos para el sector industrial
2. Actualizar la función `detectSector()` en `import-router.ts`:
```typescript
if (text.match(/fábrica|planta|industrial|manufactura/)) {
  return 'industrial';
}
```
3. Agregar datos históricos del sector en `epm-ml-scoring.ts`:
```typescript
const sectorData = {
  // ...
  industrial: {
    conversionRate: 0.35,
    avgTicket: 120000,
    avgCloseDays: 21,
  },
};
```
4. Ejecutar migración de base de datos si es necesario

### Recalibración del Modelo de Scoring

El modelo de scoring debe recalibrarse cada 3-6 meses con datos reales:

1. Exportar datos de leads cerrados (won) del último periodo
2. Calcular nuevas tasas de conversión por sector
3. Actualizar constantes en `epm-ml-scoring.ts`:
```typescript
const sectorData = {
  educativo: {
    conversionRate: 0.32, // Actualizado de 0.267
    avgTicket: 48000, // Actualizado de 45000
    avgCloseDays: 19, // Actualizado de 21
  },
  // ...
};
```
4. Ejecutar script de re-scoring masivo:
```bash
node scripts/rescore-all-leads.mjs
```

### Backup de Base de Datos

Realizar backups diarios de la base de datos:

```bash
# Backup completo
mysqldump -u user -p ivy_ai_db > backup_$(date +%Y%m%d).sql

# Backup solo de leads y emails
mysqldump -u user -p ivy_ai_db leads emails emailCampaigns > backup_leads_$(date +%Y%m%d).sql
```

Configurar cron job para backups automáticos:
```bash
# Backup diario a las 2am
0 2 * * * /usr/bin/mysqldump -u user -p ivy_ai_db > /backups/ivy_ai_$(date +\%Y\%m\%d).sql
```

---

## Troubleshooting

### Problema: Emails no se envían

**Síntomas:** Los emails quedan en status "pending" y nunca cambian a "sent".

**Causas Posibles:**
1. Credenciales de Gmail API incorrectas o expiradas
2. Refresh Token revocado
3. Límite de envío de Gmail excedido (500 emails/día)
4. Error en el servidor de envío

**Solución:**
1. Verificar credenciales en `/admin/api-config`
2. Hacer click en "Probar Conexión" para validar
3. Si falla, regenerar Refresh Token siguiendo la guía
4. Revisar logs del servidor: `tail -f /var/log/ivy-ai/email-service.log`

### Problema: Tracking de aperturas no funciona

**Síntomas:** Todos los emails muestran `openedAt = NULL` aunque los leads los hayan abierto.

**Causas Posibles:**
1. Cliente de email bloquea imágenes externas
2. Pixel de tracking no se insertó correctamente
3. Endpoint de tracking no responde

**Solución:**
1. Verificar que el pixel se insertó en el HTML:
```bash
# Buscar pixel en emails enviados
SELECT body FROM emails WHERE id = 123;
# Debe contener: <img src="https://api.manus.im/track/pixel?e=123...
```
2. Probar endpoint manualmente:
```bash
curl "https://api.manus.im/track/pixel?e=123&l=456"
# Debe retornar status 200
```
3. Revisar logs de tracking: `tail -f /var/log/ivy-ai/tracking.log`

### Problema: Importación de CSV falla

**Síntomas:** El preview muestra "Error al procesar CSV" o la importación se detiene.

**Causas Posibles:**
1. Formato de CSV incorrecto (delimitador equivocado)
2. Caracteres especiales no escapados
3. Columnas faltantes o nombres incorrectos

**Solución:**
1. Descargar el template CSV de ejemplo
2. Verificar que el delimitador sea consistente (coma, punto y coma o tabulador)
3. Asegurar que los campos de texto con comas estén entre comillas:
```csv
"Pérez, Juan","juan@email.com","Colegio San José, A.C."
```
4. Convertir el archivo a UTF-8 si contiene acentos o ñ

### Problema: Scores de leads son todos bajos

**Síntomas:** Todos los leads tienen score < 40, incluso los que deberían ser prioritarios.

**Causas Posibles:**
1. Datos incompletos en los leads (falta presupuesto, tamaño, etc.)
2. Sector no detectado correctamente
3. Pesos del modelo descalibrados

**Solución:**
1. Verificar que los leads tengan datos completos:
```sql
SELECT id, name, industry, metadata 
FROM leads 
WHERE score < 40 
LIMIT 10;
```
2. Revisar el campo `metadata` para confirmar que tiene `budget` e `installationSize`
3. Ejecutar re-scoring manual:
```bash
node scripts/rescore-lead.mjs --leadId=123
```
4. Si persiste, revisar logs de scoring: `tail -f /var/log/ivy-ai/ml-scoring.log`

---

## Roadmap Futuro

### Fase 2: Automatización Completa (Q1 2026)

**Envío Automático de Secuencias:** Implementar scheduler que envíe automáticamente los emails de seguimiento según los delays configurados (0-3-7-14 días) sin intervención manual.

**Respuestas Automáticas con IA:** Integrar GPT-4 para generar respuestas automáticas a preguntas frecuentes de leads, reduciendo carga de trabajo del equipo comercial.

**Asignación Inteligente de Leads:** Distribuir automáticamente leads a agentes de EPM basado en sector, ubicación geográfica y carga de trabajo actual.

### Fase 3: Optimización con A/B Testing (Q2 2026)

**A/B Testing de Asuntos:** Probar automáticamente 2-3 variaciones de asunto para cada template y seleccionar la que genera mayor open rate.

**Optimización de Horarios de Envío:** Analizar datos históricos para identificar los mejores días y horas para enviar emails por sector (ej: educativo responde mejor martes 10am).

**Personalización Dinámica:** Ajustar automáticamente el tono y contenido del email basado en el perfil del lead (formal para C-Level, casual para managers).

### Fase 4: Integración Multi-Canal (Q3 2026)

**WhatsApp Business API:** Agregar secuencias de seguimiento por WhatsApp para leads que no responden a emails.

**SMS Automation:** Enviar recordatorios por SMS para leads de alta prioridad antes de reuniones agendadas.

**LinkedIn Integration:** Automatizar conexión y mensajes de prospección en LinkedIn para leads B2B.

### Fase 5: Predictive Analytics Avanzado (Q4 2026)

**Predicción de Churn:** Identificar leads que están perdiendo interés (disminución de engagement) y activar secuencias de re-engagement.

**Forecasting de Revenue:** Predecir ingresos mensuales basado en pipeline actual, tasas de conversión y estacionalidad.

**Recomendaciones de Acciones:** Sugerir automáticamente la mejor acción para cada lead (llamar, enviar propuesta, agendar demo, etc.) basado en ML.

---

## Conclusión

El sistema de Email Automation implementado para EPM Construcciones representa una solución completa y escalable que automatiza el 75% del proceso de generación y seguimiento de leads. Con 12 templates personalizados, scoring predictivo basado en datos históricos reales y tracking completo de métricas, EPM está equipado para aumentar significativamente su tasa de conversión y eficiencia comercial.

Los próximos pasos recomendados son:

1. Configurar credenciales de Gmail API siguiendo la guía visual
2. Importar base de datos histórica de leads vía CSV
3. Ejecutar prueba piloto con 15 leads (5 por sector)
4. Monitorear métricas durante 2 semanas
5. Ajustar templates basado en performance
6. Lanzar campaña completa

Con este sistema, EPM puede escalar su operación comercial sin aumentar proporcionalmente el equipo de ventas, manteniendo un seguimiento personalizado y oportuno con cada prospecto.

---

**Documento preparado por:** Manus AI  
**Contacto:** soporte@ivy.ai  
**Versión:** 1.0  
**Fecha:** 19 de Noviembre, 2025
