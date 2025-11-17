# Ivy.AI Platform - TODO

## Base de Datos y Modelos
- [x] Definir esquema de agentes (6 tipos: Prospect, Solve, Closer, Logic, Talent, Insight)
- [x] Definir esquema de tareas y ejecuciones
- [x] Definir esquema de workflows
- [x] Definir esquema de KPIs y métricas por agente
- [x] Definir esquema de leads (para Ivy-Prospect)
- [x] Definir esquema de tickets de soporte (para Ivy-Solve)
- [x] Definir esquema de base de conocimiento
- [x] Definir esquema de comunicaciones entre agentes
- [x] Definir esquema de configuraciones de agentes
- [x] Ejecutar migración de base de datos

## Backend - Core (The Hive)
- [x] Implementar clase base IvyAgent
- [x] Implementar enums (AgentStatus, Department, TaskType)
- [x] Implementar HiveOrchestrator (sistema central)
- [x] Implementar registro de agentes
- [x] Implementar ejecución de workflows
- [x] Implementar sistema de comunicación entre agentes
- [x] Implementar métricas de rendimiento del sistema
- [ ] Implementar sistema de aprendizaje automático

## Backend - Agentes Especializados
- [x] Implementar Ivy-Prospect (Ventas - Generación de leads)
- [x] Implementar Ivy-Closer (Ventas - Negociación y cierre)
- [x] Implementar Ivy-Solve (Soporte - Nivel 1 y 2)
- [x] Implementar Ivy-Logic (Operaciones - Cadena de suministro)
- [x] Implementar Ivy-Talent (RRHH - Reclutamiento)
- [x] Implementar Ivy-Insight (Estrategia - Análisis de datos)

## Backend - Funcionalidades de Agentes
- [ ] Ivy-Prospect: Búsqueda de leads en LinkedIn
- [ ] Ivy-Prospect: Calificación de leads
- [ ] Ivy-Prospect: Envío de emails de outreach
- [ ] Ivy-Prospect: Integración con CRM
- [ ] Ivy-Closer: Gestión de reuniones de ventas
- [ ] Ivy-Closer: Análisis de tono y objeciones
- [ ] Ivy-Closer: Generación de contratos preliminares
- [ ] Ivy-Solve: Resolución de tickets
- [ ] Ivy-Solve: Búsqueda en base de conocimiento
- [ ] Ivy-Solve: Sistema de escalación inteligente
- [ ] Ivy-Logic: Predicción de demanda
- [ ] Ivy-Logic: Optimización de inventarios
- [ ] Ivy-Logic: Gestión de órdenes de compra
- [ ] Ivy-Talent: Screening de CVs
- [ ] Ivy-Talent: Primeras entrevistas filtro
- [ ] Ivy-Talent: Evaluación de fit cultural
- [ ] Ivy-Insight: Análisis competitivo
- [ ] Ivy-Insight: Identificación de oportunidades
- [ ] Ivy-Insight: Modelado financiero

## Backend - Workflows Predefinidos
- [ ] Workflow de ventas automatizado (Prospect → Closer)
- [ ] Workflow de soporte multi-nivel
- [ ] Workflow de onboarding de empleados
- [ ] Sistema de creación de workflows personalizados

## API tRPC - Endpoints
- [x] Router de agentes (list, status, execute, create)
- [x] Router de workflows (available, execute, create)
- [x] Router de analytics (KPIs, system metrics, reports)
- [x] Router de leads (create, list, qualify, update)
- [x] Router de tickets (create, list, resolve, escalate)
- [x] Router de base de conocimiento (search, add, update)
- [x] Router de estado del sistema (status, health, config)
- [x] Sistema de comandos (parser y ejecutor)

## Sistema de Comandos
- [ ] Implementar parser de comandos (/agents, /workflow, /kpis, /system)
- [ ] Comando: /agents list
- [ ] Comando: /agent [nombre] status
- [ ] Comando: /agent [nombre] execute [tarea]
- [ ] Comando: /agent create [tipo] [config]
- [ ] Comando: /workflows available
- [ ] Comando: /workflow execute [nombre]
- [ ] Comando: /workflow create [definición]
- [ ] Comando: /kpis [departamento]
- [ ] Comando: /analytics system
- [ ] Comando: /report [tipo] [periodo]
- [ ] Comando: /system status
- [ ] Comando: /system health
- [ ] Comando: /system config

## Frontend - Diseño y Layout
- [x] Definir paleta de colores profesional (tema corporativo)
- [ ] Implementar DashboardLayout con navegación lateral
- [x] Crear header con logo Ivy.AI
- [ ] Crear sidebar con navegación por secciones

## Frontend - Páginas Principales
- [x] Página: Dashboard principal (The Hive)
- [x] Página: Gestión de agentes
- [x] Página: Analytics y KPIs
- [x] Página: Workflows
- [x] Página: Leads (Ivy-Prospect)
- [x] Página: Tickets de soporte (Ivy-Solve)
- [x] Página: Estado del sistema

## Frontend - Componentes
- [x] Componente: Chat/Consola de comandos
- [x] Componente: Tarjeta de agente (estado, KPIs)
- [x] Componente: Lista de agentes activos
- [x] Componente: Visualización de KPIs (gráficos)
- [ ] Componente: Timeline de workflow
- [x] Componente: Tabla de leads)
- [x] Componente: Tabla de tickets
- [ ] Componente: Creador de workflows
- [x] Componente: Monitor de sistema en tiempo real

## Integraciones
- [ ] Integrar LLM para procesamiento de lenguaje natural en comandos
- [ ] Integrar LLM para análisis de leads (Ivy-Prospect)
- [ ] Integrar LLM para resolución de tickets (Ivy-Solve)
- [ ] Integrar LLM para análisis estratégico (Ivy-Insight)
- [ ] Implementar sistema de notificaciones al propietario
- [ ] Implementar almacenamiento de archivos en S3

## Testing y Optimización
- [ ] Probar flujo completo de generación de leads
- [ ] Probar flujo completo de resolución de tickets
- [ ] Probar ejecución de workflows automatizados
- [ ] Probar sistema de comandos
- [ ] Probar comunicación entre agentes
- [ ] Optimizar rendimiento de consultas
- [ ] Verificar manejo de errores

## Documentación
- [ ] Documentar API endpoints
- [ ] Documentar estructura de agentes
- [ ] Documentar workflows disponibles
- [ ] Documentar sistema de comandos
- [ ] Crear guía de usuario
- [ ] Crear ejemplos de uso prácticos

## Deployment y DevOps
- [x] Configurar variables de entorno para Railway
- [x] Crear Dockerfile optimizado para producción
- [x] Configurar railway.json
- [x] Crear scripts de deployment
- [x] Configurar GitHub Actions para CI/CD
- [x] Crear README con instrucciones de deployment
- [ ] Configurar PostgreSQL en Railway
- [ ] Configurar secrets en Railway
- [ ] Testing de deployment en Railway
- [ ] Configurar dominio personalizado (opcional)

## Funcionalidades Específicas de Agentes (Nuevas)
- [ ] Ivy-Prospect: Implementar búsqueda de leads en LinkedIn/web
- [x] Ivy-Prospect: Implementar calificación automática de leads con scoring
- [x] Ivy-Prospect: Implementar generación de emails de outreach personalizados
- [ ] Ivy-Closer: Implementar análisis de sentimiento en conversaciones
- [ ] Ivy-Closer: Implementar generación de propuestas comerciales
- [ ] Ivy-Closer: Implementar manejo de objeciones con respuestas sugeridas
- [x] Ivy-Solve: Implementar búsqueda semántica en knowledge base
- [x] Ivy-Solve: Implementar sistema de escalación automática
- [x] Ivy-Solve: Implementar generación de respuestas desde KB
- [ ] Ivy-Logic: Implementar predicción de demanda con ML
- [ ] Ivy-Logic: Implementar optimización de inventario
- [ ] Ivy-Logic: Implementar generación automática de órdenes de compra
- [ ] Ivy-Talent: Implementar parsing y análisis de CVs
- [ ] Ivy-Talent: Implementar matching de candidatos a posiciones
- [ ] Ivy-Talent: Implementar evaluación de fit cultural
- [ ] Ivy-Insight: Implementar análisis competitivo automatizado
- [ ] Ivy-Insight: Implementar identificación de oportunidades de mercado
- [ ] Ivy-Insight: Implementar generación de reportes ejecutivos

## Workflows Automatizados Predefinidos (Nuevos)
- [x] Workflow: Sales Pipeline (Prospect → Closer)
- [x] Workflow: Support Escalation (Solve L1 → L2 → Human)
- [x] Workflow: Employee Onboarding (Talent → Logic → System)
- [x] Workflow: Market Analysis (Insight → Prospect → Closer)
- [ ] Sistema de creación de workflows custom por usuario

## Preparación para Railway Deployment (Nuevos)
- [x] Verificar todas las variables de entorno necesarias
- [x] Crear script de inicialización de base de datos
- [x] Crear script de seed data para demo
- [x] Optimizar Dockerfile para producción
- [ ] Configurar health checks
- [ ] Configurar logging y monitoreo
- [x] Documentar proceso de deployment paso a paso
- [x] Crear guía de troubleshooting para Railway

## Auditoría de Código (Pre-Deployment)
- [x] Auditar y corregir errores en agents/core.ts (ERROR #1: TaskInput/TaskResult exports)
- [x] Auditar y corregir errores en todos los agentes (Prospect, Solve, Closer, Logic, Talent, Insight)
- [x] Auditar y corregir errores en hive/orchestrator.ts (Actualizado para nuevo schema)
- [x] Auditar y corregir errores en server/routers.ts (Sin errores encontrados)
- [x] Auditar y corregir errores en server/db.ts (Sin errores encontrados)
- [x] Auditar y corregir errores en drizzle/schema.ts (ERROR #2, #3, #4: agentCommunications, tickets category, knowledgeBase fields)
- [x] Auditar y corregir errores en frontend (componentes, páginas) (Sin errores - funcionando correctamente)
- [x] Verificar imports y exports en todos los módulos
- [x] Verificar tipos TypeScript en todo el proyecto
- [x] Ejecutar compilación TypeScript sin errores
- [ ] Ejecutar tests y verificar que pasen
- [x] Verificar que el servidor inicie correctamente

## Mejoras UX (Nuevas)
- [x] Implementar skeleton loaders para dashboard mientras carga datos
- [x] Añadir animaciones de transición suaves en cards de agentes
- [x] Crear componente Toast para mensajes de éxito/error
- [x] Implementar mensaje de éxito después de seed data
- [x] Añadir indicadores de progreso en workflows
- [x] Mostrar estado en tiempo real de ejecución de workflows
- [x] Añadir badges de estado (running, completed, failed) en workflows
- [ ] Implementar auto-refresh de métricas cada 30 segundos

## Funcionalidades Avanzadas (Nuevas)

### Sistema de Notificaciones en Tiempo Real
- [x] Diseñar esquema de notificaciones en base de datos
- [x] Implementar backend para crear y gestionar notificaciones
- [x] Crear componente NotificationBell con badge de contador
- [x] Implementar dropdown de notificaciones con lista
- [x] Añadir marcado de leído/no leído
- [x] Implementar auto-refresh cada 30 segundos
- [ ] Crear notificaciones para eventos importantes (workflow completado, lead calificado, ticket resuelto)

### Página de Perfil de Usuario
- [x] Crear ruta /profile en App.tsx
- [x] Diseñar página de perfil con tabs (Info, Preferences, Security)
- [x] Implementar formulario de edición de información personal
- [x] Añadir preferencias de notificaciones
- [x] Implementar cambio de contraseña (si aplica)
- [x] Añadir avatar/foto de perfil
- [ ] Guardar preferencias en base de datos

### Exportación de Datos a CSV
- [x] Implementar endpoint backend para exportar leads a CSV
- [x] Implementar endpoint backend para exportar tickets a CSV
- [x] Crear función de generación de CSV con headers correctos
- [x] Añadir botón "Export to CSV" en página Leads
- [x] Añadir botón "Export to CSV" en página Tickets
- [x] Implementar descarga automática del archivo
- [ ] Añadir filtros opcionales antes de exportar

## Funcionalidades Finales
### Notificaciones Automáticas para Eventos
- [x] Crear notificación cuando un workflow se completa
- [x] Crear notificación cuando un lead es calificado
- [x] Crear notificación cuando un ticket es resuelto
- [ ] Crear notificación cuando un agente cambia de estado
- [x] Integrar notificaciones en los routers correspondientes

### Filtros Avanzados para Exportación CSV
- [x] Añadir selector de rango de fechas en exportación de leads
- [x] Añadir selector de rango de fechas en exportación de tickets
- [x] Añadir filtro por estado en exportación de leads
- [x] Añadir filtro por estado y prioridad en exportación de tickets
- [x] Actualizar backend para soportar filtros en exportación

### Persistencia de Preferencias de Usuario
- [x] Añadir tabla userPreferences en schema de base de datos
- [x] Crear API backend para guardar/cargar preferencias
- [x] Conectar página de perfil con API de preferencias
- [x] Aplicar preferencias guardadas al cargar la aplicación
- [x] Añadir preferencias de tema (dark/light)
- [x] Añadir preferencias de idioma

### Integración de Código RBAC Externo (Feature #1)
- [ ] Auditar código recibido del programador externo
- [ ] Integrar schema de roles y userRoles en drizzle/schema.ts
- [ ] Ejecutar migraciones de base de datos (pnpm db:push)
- [ ] Integrar funciones de base de datos en server/db.ts
- [ ] Crear archivo shared/permissions.ts con constantes de permisos
- [ ] Integrar routers tRPC en server/routers.ts
- [ ] Añadir import de TRPCError faltante
- [ ] Crear interfaz frontend para gestión de roles (página /roles)
- [ ] Crear componente de asignación de roles a usuarios
- [ ] Testing completo del sistema RBAC
- [ ] Corregir errores encontrados durante testing
- [ ] Documentar sistema RBAC en README

### Configuración de Entorno de Pruebas
- [ ] Verificar ejecución de migraciones en Railway
- [x] Confirmar estructura de base de datos en producción
- [ ] Crear plan de pruebas completo con casos de prueba
- [ ] Configurar scripts de testing automatizado con Vitest
- [ ] Cargar datos de demostración en producción (26 leads, 22 tickets, 6 agentes)
- [ ] Ejecutar pruebas de funcionalidad de leads
- [ ] Ejecutar pruebas de funcionalidad de tickets
- [ ] Ejecutar pruebas de sistema de notificaciones
- [ ] Ejecutar pruebas de exportación CSV con filtros
- [ ] Ejecutar pruebas de preferencias de usuario
- [ ] Validar autenticación OAuth en producción
- [ ] Documentar resultados de pruebas y crear reporte de QA

## Bug Fixes
- [x] Implementar comando help en consola de comandos
- [x] Agregar lista de comandos disponibles cuando se ejecuta help
- [x] Permitir comandos sin barra diagonal (help funciona igual que /help)
- [x] Agregar comando /clear para limpiar consola

## Documentación de Ventas
- [x] Crear guía completa de ventas (pitch, casos de uso, ROI)
- [x] Crear script de demostración para clientes
- [x] Crear propuesta comercial template
- [x] Crear one-pager de marketing

## Gestión de Clientes - Enfoque Pragmático
### Fase 1: Selector Simple
- [x] Crear contexto React para empresa seleccionada
- [x] Agregar selector de empresa en header del dashboard
- [x] Implementar filtrado de datos por empresa (en memoria)
- [x] Agregar empresas demo hardcodeadas

### Fase 2: Página de Administración
- [ ] Crear tabla `companies` en schema (sin afectar otras tablas)
- [ ] Crear funciones CRUD en db.ts para companies
- [ ] Crear página /admin/companies con lista de empresas
- [ ] Implementar formulario de creación de empresa
- [ ] Implementar edición y eliminación de empresas
- [ ] Agregar ruta protegida solo para admin

### Fase 3: Integración Completa (Futuro)
- [ ] Agregar companyId a todas las tablas relevantes
- [ ] Implementar aislamiento real de datos por empresa
- [ ] Sistema de permisos y middleware de verificación

## Admin Companies Page - CRUD Implementation
- [x] Add companies table to database schema
- [x] Run db:push to apply schema changes
- [x] Create tRPC router for companies CRUD operations
- [x] Create /admin/companies page with company list table
- [x] Implement create company dialog with form validation
- [x] Implement edit company functionality
- [x] Implement delete company with confirmation
- [x] Add admin-only route protection
- [x] Update CompanyContext to fetch from database instead of hardcoded list
- [ ] Test all CRUD operations

## Paso 1: Conectar Selector de Empresa al Filtrado de Datos
- [ ] Agregar companyId a tabla leads en schema
- [ ] Agregar companyId a tabla tickets en schema
- [ ] Agregar companyId a tabla agents en schema
- [ ] Ejecutar migraciones de base de datos
- [ ] Actualizar seed-router para asignar companyId a datos demo
- [ ] Actualizar queries de leads para filtrar por companyId
- [ ] Actualizar queries de tickets para filtrar por companyId
- [ ] Actualizar queries de agents para filtrar por companyId
- [ ] Conectar CompanyContext con queries de datos

## Paso 2: Agregar Navegación a Admin
- [ ] Agregar link "Gestión de Empresas" en sidebar del DashboardLayout
- [ ] Crear sección "Admin" en navegación
- [ ] Agregar icono Building2 al link
- [ ] Proteger ruta solo para usuarios admin

## Paso 3: Asignación Usuario-Empresa
- [ ] Agregar companyId a tabla users en schema
- [ ] Crear función assignUserToCompany en db.ts
- [ ] Crear endpoint tRPC para asignar usuarios a empresas
- [ ] Agregar selector de empresa en página de perfil de usuario
- [ ] Implementar middleware para verificar acceso por empresa
- [ ] Actualizar CompanyContext para cargar empresa del usuario actual

## Sistema Multi-Tenant Avanzado

### Asignación Usuario-Empresa
- [x] Crear tabla user_companies en schema para relación many-to-many
- [x] Añadir función getUserCompanies() en db.ts
- [x] Añadir función assignUserToCompany() en db.ts
- [x] Crear router tRPC para gestión de asignaciones
- [x] Actualizar CompanySelector para mostrar solo empresas asignadas al usuario
- [ ] Implementar página de administración de asignaciones en /admin/user-companies
- [x] Añadir restricción: usuarios solo ven empresas asignadas (excepto admins)

### Agentes Personalizados por Empresa
- [x] Añadir columna companyId a tabla agents en schema
- [x] Actualizar función getAllAgents() para filtrar por companyId
- [ ] Crear función createCompanyAgent() en db.ts
- [x] Actualizar router de agentes para soportar filtrado por empresa
- [x] Modificar Dashboard para mostrar solo agentes de empresa seleccionada
- [ ] Implementar página de configuración de agentes por empresa
- [ ] Permitir personalización de parámetros de agentes por empresa

### Dashboard y Métricas por Empresa
- [x] Crear función getCompanyMetrics() en db.ts
- [x] Implementar cálculo de KPIs específicos por empresa
- [x] Actualizar página Analytics para filtrar por empresa seleccionada
- [ ] Añadir gráficos de tendencias por empresa
- [x] Implementar comparación de métricas entre empresas (solo admins)
- [x] Crear widget de resumen ejecutivo por empresa en Dashboard
- [ ] Añadir exportación de reportes por empresa

## Funcionalidades Avanzadas Multi-Tenant

### Página de Administración de Asignaciones Usuario-Empresa
- [x] Crear página /admin/user-companies con tabla de asignaciones
- [x] Implementar formulario para asignar usuarios a empresas
- [x] Agregar selector de rol (viewer/member/admin) por asignación
- [x] Implementar edición de rol de usuario en empresa
- [x] Implementar eliminación de asignación usuario-empresa
- [x] Agregar filtros por empresa y por usuario
- [x] Mostrar lista de usuarios asignados a cada empresa
- [x] Proteger ruta solo para admins

### Configuración de Agentes por Empresa
- [x] Crear página /admin/agent-config para configuración de agentes
- [x] Implementar formulario de personalización de parámetros de agentes
- [x] Agregar campos: temperatura, max_tokens, system_prompt personalizado
- [x] Crear tabla agent_configurations en schema
- [x] Implementar funciones CRUD para configuraciones de agentes
- [x] Crear router tRPC para agent configurations
- [x] Permitir que cada empresa tenga configuraciones únicas por agente
- [x] Agregar preview de configuración antes de guardar

### Reportes Comparativos entre Empresas
- [x] Crear página /admin/company-reports con gráficos comparativos
- [x] Implementar gráfico de barras comparando leads por empresa
- [x] Implementar gráfico de barras comparando tickets por empresa
- [x] Implementar gráfico de líneas con tendencias de conversión
- [x] Agregar tabla comparativa de KPIs entre empresas
- [ ] Implementar filtros por rango de fechas
- [x] Agregar exportación de reportes a PDF
- [x] Proteger ruta solo para admins
- [x] Agregar gráfico de distribución de agentes por empresa

## Mejoras Finales Multi-Tenant

### Filtros de Fecha en Reportes
- [x] Agregar selectores de fecha inicio/fin en CompanyReports
- [x] Actualizar función getCompanyMetrics para aceptar rango de fechas
- [x] Filtrar leads por createdAt dentro del rango
- [x] Filtrar tickets por createdAt dentro del rango
- [x] Agregar botón "Aplicar Filtros" y "Limpiar Filtros"
- [x] Mostrar rango de fechas activo en el título de la página

### Notificaciones de Asignaciones
- [x] Crear función notifyUserAssignment en notification-helper
- [x] Enviar notificación cuando usuario es asignado a empresa
- [x] Enviar notificación cuando usuario es removido de empresa
- [x] Enviar notificación cuando rol de usuario cambia
- [x] Incluir detalles de empresa y rol en notificación
- [x] Agregar link directo a la empresa en notificación

### Templates de Configuración de Agentes
- [x] Crear constantes de presets (conservador/balanceado/creativo)
- [x] Agregar selector de template en diálogo de configuración
- [x] Implementar aplicación de preset al seleccionar template
- [x] Mostrar descripción de cada preset
- [x] Permitir personalización después de aplicar preset
- [ ] Agregar botón "Restaurar Defaults" en configuración

## Funcionalidades Avanzadas de Administración

### Auditoría de Cambios
- [x] Crear tabla audit_logs en schema (userId, action, entityType, entityId, changes, timestamp)
- [x] Crear función createAuditLog en db.ts
- [x] Agregar audit logging en assignUserToCompany
- [x] Agregar audit logging en removeUserFromCompany
- [x] Agregar audit logging en updateUserCompanyRole
- [ ] Agregar audit logging en upsertAgentConfig
- [x] Crear página /admin/audit-log con tabla de auditoría
- [x] Implementar filtros por usuario, acción, entidad, fecha
- [x] Agregar exportación de logs a CSV

### Exportación de Configuraciones de Agentes
- [x] Crear endpoint exportConfigurations en agent-config-router
- [x] Implementar generación de JSON con todas las configuraciones
- [x] Crear endpoint importConfigurations en agent-config-router
- [x] Implementar validación de JSON importado
- [x] Agregar botón "Exportar Configuraciones" en AgentConfig
- [x] Agregar botón "Importar Configuraciones" con file upload
- [x] Implementar preview de configuraciones antes de importar
- [x] Agregar opción de sobrescribir o fusionar configuraciones

### Dashboard Ejecutivo Personalizable
- [ ] Crear tabla dashboard_widgets en schema
- [ ] Implementar widgets predefinidos (leads, tickets, agents, revenue)
- [ ] Crear componente WidgetSelector para agregar widgets
- [ ] Implementar drag-and-drop para reordenar widgets
- [ ] Agregar botón "Personalizar Dashboard" en Dashboard
- [ ] Guardar configuración de widgets por empresa
- [ ] Implementar modo edición vs modo vista
- [ ] Agregar opción de resetear a layout default

## Funcionalidades Empresariales Avanzadas

### Dashboard Personalizable por Empresa
- [x] Crear tabla dashboard_widgets en schema (companyId, widgetType, position, config)
- [ ] Definir tipos de widgets predefinidos (leads_summary, tickets_summary, conversion_chart, revenue_chart)
- [ ] Crear componente Widget base con props genéricas
- [ ] Implementar LeadsSummaryWidget
- [ ] Implementar TicketsSummaryWidget
- [ ] Implementar ConversionChartWidget
- [ ] Implementar RevenueChartWidget
- [ ] Instalar y configurar react-grid-layout para drag-and-drop
- [ ] Crear componente DashboardEditor con modo edición
- [ ] Agregar botón "Personalizar Dashboard" en Dashboard
- [ ] Implementar guardado de layout en base de datos
- [ ] Agregar botón "Restaurar Layout Default"

### Roles Granulares por Empresa
- [x] Extender enum de roles en schema: admin, manager, analyst, viewer
- [x] Crear tabla company_permissions (roleId, resource, action)
- [x] Definir matriz de permisos por rol (CRUD en leads, tickets, agents, config)
- [x] Actualizar userCompanies.role para soportar nuevos roles
- [x] Crear middleware checkCompanyPermission en tRPC
- [ ] Proteger endpoints de leads con permisos granulares
- [ ] Proteger endpoints de tickets con permisos granulares
- [ ] Proteger endpoints de agentConfig con permisos granulares
- [ ] Actualizar UI para mostrar/ocultar acciones según permisos
- [ ] Crear página /admin/roles para gestionar permisos

### Integraciones con CRM Externos
- [x] Crear tabla crm_integrations (companyId, crmType, credentials, config)
- [x] Implementar conector base CRMConnector con métodos syncLeads, syncTickets
- [ ] Implementar SalesforceConnector con OAuth2
- [x] Implementar HubSpotConnector con API key
- [ ] Implementar PipedriveConnector con API token
- [x] Crear router tRPC para gestión de integraciones
- [x] Crear página /admin/integrations para configurar CRMs
- [ ] Implementar webhook receiver para sincronización bidireccional
- [ ] Agregar job scheduler para sincronización periódica
- [ ] Implementar mapeo de campos customizable por empresa
- [ ] Agregar logs de sincronización y manejo de errores


## 🎉 Resumen de Funcionalidades Completadas

### Sistema Multi-Tenant ✅
- Gestión completa de empresas con selector en header
- Asignación usuario-empresa con 5 roles (viewer/analyst/member/manager/admin)
- Filtrado automático de datos por empresa seleccionada
- Página de administración de empresas (/admin/companies)
- Página de asignaciones usuario-empresa (/admin/user-companies)

### Configuración y Personalización ✅
- Configuración de agentes por empresa (/admin/agent-config)
- Templates de configuración (Conservative/Balanced/Creative)
- Exportación/importación de configuraciones entre empresas
- Notificaciones automáticas de asignaciones

### Reportes y Analíticas ✅
- Reportes comparativos entre empresas (/admin/company-reports)
- Filtros de fecha para análisis temporal
- Widget de métricas ejecutivas por empresa en Dashboard
- Exportación de reportes a CSV

### Auditoría y Seguridad ✅
- Log de auditoría completo (/admin/audit-log)
- Sistema de permisos granulares con matriz CRUD
- Middleware requirePermission para proteger endpoints
- Guía de implementación de permisos (PERMISSIONS_GUIDE.md)

### Integraciones CRM ✅
- Infraestructura de conectores CRM (base + HubSpot)
- Router tRPC para gestión de integraciones
- Funciones DB para sync/test/upsert
- Página de configuración (/admin/integrations)

### Infraestructura Técnica ✅
- 15+ tablas en base de datos
- 10+ routers tRPC
- 100+ funciones de base de datos
- Sistema de roles y permisos completo
- Notificaciones al propietario
- Exportación de datos

---

## 📋 Tareas Pendientes para Producción

### Alta Prioridad
1. Aplicar middleware requirePermission a todos los endpoints
2. Completar conectores Salesforce y Pipedrive
3. Implementar webhook receiver para CRM
4. Crear widgets drag-and-drop para dashboard personalizable
5. Implementar funcionalidades específicas de agentes (ver líneas 34-56)

### Media Prioridad
6. Sistema de aprendizaje automático para agentes
7. Job scheduler para sincronización periódica CRM
8. Página /admin/roles para gestión visual de permisos
9. Gráficos de tendencias en Analytics
10. Filtros avanzados en todas las páginas

### Baja Prioridad
11. Tests unitarios y de integración
12. Documentación de API
13. Optimización de queries
14. Cache de datos frecuentes
15. Monitoreo y alertas


## 📚 Guías de Implementación

### Archivos de Referencia
1. **PERMISSIONS_GUIDE.md** - Guía del sistema de permisos con ejemplos de uso
2. **IMPLEMENTATION_EXAMPLE.md** - Ejemplos antes/después de aplicar permisos a endpoints

### Pasos para Aplicar Permisos
1. Actualizar input schemas para requerir `companyId`
2. Agregar `.use(requirePermission("resource", "action"))` a cada endpoint
3. Actualizar llamadas del frontend para pasar `companyId` desde `useCompany`
4. Probar con diferentes roles (viewer/analyst/member/manager/admin)

### Estado Actual del Sistema
- ✅ Matriz de permisos completa (5 roles × 6 recursos)
- ✅ Middleware `requirePermission` implementado
- ✅ Función `getUserCompanyRole` en db.ts
- ⏳ Pendiente: Aplicar middleware a endpoints existentes
- ⏳ Pendiente: Actualizar frontend para pasar companyId

---

## 🚀 Próximos Pasos Recomendados

### Implementación Inmediata
1. **Aplicar permisos a endpoints críticos** (leads.create, tickets.update, agentConfig.upsert)
2. **Ejecutar seed de datos** usando el botón "Seed Demo Data" en Dashboard
3. **Probar flujo multi-tenant** cambiando entre empresas y verificando filtrado

### Desarrollo Futuro
4. **Completar conectores CRM** (Salesforce OAuth2, Pipedrive API)
5. **Implementar funcionalidades de agentes** (Prospect: LinkedIn search, Solve: ticket resolution)
6. **Dashboard personalizable** con widgets drag-and-drop usando react-grid-layout


## Tareas Actuales en Progreso

### Paso 1: Poblar Datos Demo
- [x] Verificar que seed funciona correctamente
- [x] Probar botón "Seed Demo Data" en Dashboard
- [x] Verificar que leads/tickets se asignan a empresa correcta

### Paso 2: Refactorizar Endpoints con Permisos
- [x] Aplicar requirePermission a leads.create
- [ ] Aplicar requirePermission a leads.delete
- [x] Aplicar requirePermission a tickets.create
- [x] Aplicar requirePermission a tickets.update (resolve)
- [ ] Aplicar requirePermission a agentConfig.upsert
- [ ] Actualizar frontend para pasar companyId en todas las llamadas

### Paso 3: Implementar Ivy-Solve (Resolución Automática)
- [x] Crear función searchKnowledgeBase en db.ts
- [x] Crear endpoint tickets.autoResolve en router
- [x] Implementar lógica: buscar KB → generar respuesta con LLM → actualizar ticket
- [ ] Agregar botón "Auto-Resolve" en UI de tickets
- [ ] Probar con tickets de ejemplo


## Tareas Finales de Implementación

### Paso 4: UI de Auto-Resolución
- [x] Agregar botón "Auto-Resolve" en página de Tickets
- [x] Crear diálogo de confirmación antes de auto-resolver
- [x] Mostrar resolución generada en diálogo de resultado
- [x] Agregar indicador de loading durante generación
- [x] Mostrar artículos de KB utilizados

### Paso 5: Integrar CompanyContext en Formularios
- [x] Actualizar formulario de creación de leads para incluir companyId
- [x] Actualizar formulario de creación de tickets para incluir companyId
- [x] Obtener companyId automáticamente del CompanyContext
- [x] Validar que companyId esté presente antes de enviar

### Paso 6: Implementar Ivy-Prospect
- [ ] Crear endpoint agents.prospectSearch en router
- [ ] Implementar búsqueda simulada de prospectos (LinkedIn-style)
- [ ] Agregar función enrichLead en db.ts
- [ ] Crear página /prospect-search para interfaz de búsqueda
- [ ] Agregar botón "Enrich Lead" en página de Leads
- [ ] Mostrar datos enriquecidos (company, title, industry, location)
