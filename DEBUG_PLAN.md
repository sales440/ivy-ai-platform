# 🔧 Ivy.AI - Plan de Depuración Exhaustiva

**Fecha:** 18 de Noviembre, 2025  
**Modo:** Experto Programador  
**Objetivo:** 0 errores de TypeScript  
**Estado Actual:** 120 errores

---

## 📊 Análisis de Errores por Categoría

### **Categoría 1: Funciones Faltantes en db.ts** (4 errores - CRÍTICO)
- `deleteLead` no existe (2 ocurrencias)
- `updateTicket` no existe (1 ocurrencia)
- `eq` no exportado (1 ocurrencia)

**Impacto:** Bloqueante - funcionalidad core no funciona  
**Prioridad:** P0  
**Tiempo estimado:** 30 minutos

---

### **Categoría 2: Columnas Faltantes en Schema** (3 errores - CRÍTICO)
- `linkedinUrl` no existe en tabla `leads` (2 ocurrencias)
- `actionUrl` no existe en tabla `notifications` (1 ocurrencia)

**Impacto:** Bloqueante - datos no se pueden guardar  
**Prioridad:** P0  
**Tiempo estimado:** 15 minutos

---

### **Categoría 3: Problemas con emailLogs** (2 errores - CRÍTICO)
- `leadId` y `campaignId` no reconocidos en insert
- Tipos nullable vs non-nullable

**Impacto:** Emails no se pueden loggear  
**Prioridad:** P0  
**Tiempo estimado:** 20 minutos

---

### **Categoría 4: Errores en prospect-router.ts** (25+ errores - ALTO)
- Propiedades que no existen en objetos API response
- Tipos incorrectos (string vs string[])
- Propiedades `data`, `success` faltantes

**Impacto:** Búsqueda de prospectos no funciona  
**Prioridad:** P1  
**Tiempo estimado:** 45 minutos

---

### **Categoría 5: Errores en Frontend (client/src)** (40+ errores - MEDIO)
- Parámetros implícitos `any`
- Tipos string vs number
- Propiedades que no existen en tipos
- Errores en páginas: Tickets, UserCompanies, Workflows, etc.

**Impacto:** UI puede tener bugs  
**Prioridad:** P1  
**Tiempo estimado:** 60 minutos

---

### **Categoría 6: Errores Menores** (45+ errores - BAJO)
- `insertId` no existe en MySqlRawQueryResult
- Propiedades duplicadas
- Imports faltantes
- Tipos incompatibles menores

**Impacto:** Warnings, no bloqueantes  
**Prioridad:** P2  
**Tiempo estimado:** 30 minutos

---

## 🎯 Plan de Ejecución (Orden de Prioridad)

### **FASE 1: Reparar Backend Crítico** (65 minutos)

#### **Paso 1.1: Agregar funciones faltantes a db.ts**
```typescript
// Agregar al final de db.ts

export async function deleteLead(leadId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(leads).where(eq(leads.id, leadId));
}

export async function updateTicket(
  ticketId: number,
  updates: Partial<InsertTicket>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(tickets)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(tickets.id, ticketId));
}

// Exportar eq desde drizzle-orm
export { eq, desc, and, or, sql } from "drizzle-orm";
```

#### **Paso 1.2: Agregar columnas faltantes al schema**
```typescript
// En drizzle/schema.ts - tabla leads
export const leads = mysqlTable("leads", {
  // ... columnas existentes ...
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  // ... resto de columnas ...
});

// En drizzle/schema.ts - tabla notifications
export const notifications = mysqlTable("notifications", {
  // ... columnas existentes ...
  actionUrl: varchar("actionUrl", { length: 500 }),
  // ... resto de columnas ...
});
```

#### **Paso 1.3: Arreglar emailLogs inserts**
```typescript
// Opción A: Hacer leadId y campaignId explícitamente opcionales
leadId: int("leadId").$defaultFn(() => null),
campaignId: int("campaignId").$defaultFn(() => null),

// Opción B: Usar type assertion en inserts (ya implementado)
leadId: input.leadId as number | null,
campaignId: null,
```

#### **Paso 1.4: Arreglar prospect-router.ts**
- Tipar correctamente las respuestas de API externa
- Agregar interfaces para LinkedIn API response
- Manejar propiedades opcionales correctamente

---

### **FASE 2: Reparar Frontend** (60 minutos)

#### **Paso 2.1: Arreglar client/src/pages/Tickets.tsx**
- Tipo string vs number en línea 167
- Agregar tipos correctos a parámetros

#### **Paso 2.2: Arreglar client/src/pages/UserCompanies.tsx**
- Property 'companies' no existe
- Parámetros implícitos any
- Property 'assignedAt' no existe

#### **Paso 2.3: Arreglar client/src/pages/Workflows.tsx**
- Property 'workflowName' vs 'workflow'
- Properties 'stepsCompleted', 'duration' no existen
- companyId no existe en input type

#### **Paso 2.4: Arreglar otros archivos frontend**
- Analytics.tsx
- Leads.tsx
- Profile.tsx

---

### **FASE 3: Limpieza Final** (30 minutos)

#### **Paso 3.1: Arreglar insertId errors**
```typescript
// Cambiar de:
const result = await db.insert(table).values(data);
const id = result.insertId;

// A:
const result = await db.insert(table).values(data);
const id = result[0].insertId;
```

#### **Paso 3.2: Eliminar propiedades duplicadas**
- `companyId` especificado dos veces en routers.ts línea 491

#### **Paso 3.3: Arreglar imports faltantes**
- `callDataApi` no definido
- Otros imports faltantes

---

## 📝 Checklist de Validación

Después de cada fase, ejecutar:
```bash
pnpm tsc --noEmit
```

**Objetivo:** Reducir errores progresivamente
- Después de Fase 1: ~55 errores (reducción de 65)
- Después de Fase 2: ~15 errores (reducción de 40)
- Después de Fase 3: **0 errores** ✅

---

## 🚀 Ejecución

**Tiempo total estimado:** 155 minutos (~2.5 horas)

**Comenzar ahora...**
