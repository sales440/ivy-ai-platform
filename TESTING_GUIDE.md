# Guía de Pruebas - Ivy.AI Platform

## 1. Poblar Datos Demo

### Pasos:
1. Ir al Dashboard
2. Hacer clic en el botón **"Seed Demo Data"** en la esquina superior derecha
3. Esperar confirmación de éxito

### Datos Creados:
- **5 Leads**: Diferentes industrias, scores de calificación, y estados
- **5 Tickets**: Varios niveles de prioridad y estados
- **5 Artículos de Knowledge Base**: Categorías account, technical, billing
- **6 Agentes**: Prospect, Closer, Solve, Logic, Talent, Insight

---

## 2. Probar Auto-Resolve de Tickets

### Requisitos Previos:
- Haber ejecutado Seed Demo Data (para tener artículos de KB)
- Tener al menos un ticket en estado "open"

### Pasos:
1. Ir a la página **Tickets**
2. Localizar un ticket con estado "open"
3. Hacer clic en el botón **"Auto-Resolve"** (ícono ✨ Sparkles)
4. Esperar mientras Ivy-Solve:
   - Busca artículos relevantes en la knowledge base
   - Genera una resolución usando LLM
   - Actualiza el ticket a "resolved"
5. Revisar el diálogo de resultado que muestra:
   - ✅ Resolución generada
   - 📚 Número de artículos de KB utilizados
   - 🎯 Estado actualizado

### Casos de Prueba:

**Ticket sobre contraseña:**
- Subject: "Can't login to my account"
- Debe encontrar artículo "How to Reset Your Password"

**Ticket sobre API:**
- Subject: "Need help with API integration"
- Debe encontrar artículo "Getting Started with API Integration"

**Ticket sobre facturación:**
- Subject: "Question about my invoice"
- Debe encontrar artículo "Understanding Your Invoice"

---

## 3. Probar Filtrado Multi-Tenant

### Pasos:
1. Seleccionar una empresa en el **Company Selector** (header)
2. Ir a **Leads** → verificar que solo muestra leads de esa empresa
3. Ir a **Tickets** → verificar que solo muestra tickets de esa empresa
4. Crear un nuevo lead → verificar que se asigna automáticamente a la empresa seleccionada
5. Cambiar a otra empresa → verificar que los datos cambian

---

## 4. Probar Sistema de Permisos

### Como Admin:
- Acceso completo a todas las páginas
- Puede ver "Gestión de Empresas", "Asignaciones Usuario-Empresa", etc.

### Como Usuario Regular:
- Solo ve empresas asignadas
- No ve páginas de administración en el sidebar

---

## 5. Probar Reportes Comparativos

### Pasos:
1. Ir a **Reportes Comparativos** (solo admins)
2. Seleccionar rango de fechas
3. Hacer clic en "Aplicar Filtros"
4. Revisar:
   - Gráficos de barras (leads y tickets por empresa)
   - Tabla comparativa de KPIs
   - Rankings de performance
5. Hacer clic en "Exportar CSV" para descargar datos

---

## 6. Probar Configuración de Agentes

### Pasos:
1. Ir a **Configuración de Agentes**
2. Hacer clic en "Configure" para un agente
3. Seleccionar un preset:
   - **Conservative**: temp=0.3, tokens=500
   - **Balanced**: temp=0.7, tokens=1000
   - **Creative**: temp=0.9, tokens=1500
4. Personalizar parámetros si es necesario
5. Guardar configuración

---

## 7. Probar Exportación de Configuraciones

### Pasos:
1. En **Configuración de Agentes**, hacer clic en "Export Configurations"
2. Se descarga un archivo JSON con todas las configuraciones
3. Hacer clic en "Import Configurations"
4. Seleccionar el archivo JSON
5. Revisar preview de configuraciones
6. Confirmar importación

---

## 8. Probar Auditoría de Cambios

### Pasos:
1. Ir a **Auditoría de Cambios** (solo admins)
2. Realizar alguna acción (asignar usuario a empresa, cambiar rol)
3. Volver a Auditoría de Cambios
4. Verificar que el cambio está registrado con:
   - Usuario que realizó la acción
   - Timestamp
   - Tipo de acción
   - Detalles del cambio
5. Usar filtros para buscar acciones específicas
6. Exportar logs a CSV

---

## Troubleshooting

### Auto-Resolve no encuentra artículos:
- Verificar que hay artículos en la knowledge base
- El subject del ticket debe contener palabras clave relevantes
- Probar con tickets de ejemplo del seed

### Datos no se filtran por empresa:
- Verificar que hay una empresa seleccionada en el header
- Refrescar la página
- Verificar que los datos tienen companyId asignado

### Permisos no funcionan:
- Verificar rol del usuario en la base de datos
- Los permisos se aplican solo a endpoints protegidos con `requirePermission`
- Ver IMPLEMENTATION_EXAMPLE.md para más detalles
