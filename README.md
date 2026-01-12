# Ivy.AI Platform

Plataforma de agentes de IA autónomos con ROPA (Robotic Operational Process Automation) como meta-agente central.

## Características

- **ROPA Dashboard v2**: Panel de control moderno con interfaz drag & drop
- **Chat con ROPA**: Comunicación por texto y voz con el meta-agente
- **Market Intelligence**: 8 herramientas de análisis de mercado con LLM
- **Gestión de Campañas**: Creación y seguimiento de campañas de ventas
- **Calendario Kanban**: Planificación visual de campañas

## Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express + tRPC 11
- **Base de Datos**: MySQL/TiDB con Drizzle ORM
- **LLM**: Integración con API de Manus
- **Almacenamiento**: AWS S3

## Requisitos

- Node.js 22+
- pnpm 10+
- MySQL/TiDB database

## Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
pnpm db:push

# Iniciar en desarrollo
pnpm dev
```

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia servidor de desarrollo |
| `pnpm build` | Compila para producción |
| `pnpm start` | Inicia servidor de producción |
| `pnpm test` | Ejecuta tests con Vitest |
| `pnpm check` | Verifica tipos TypeScript |
| `pnpm db:push` | Aplica migraciones de base de datos |

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión MySQL |
| `JWT_SECRET` | Secreto para tokens JWT |
| `VITE_APP_ID` | ID de aplicación Manus OAuth |
| `BUILT_IN_FORGE_API_KEY` | API key para servicios Manus |

## Despliegue en Railway

1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Railway detectará automáticamente `railway.json`
4. El healthcheck está en `/api/health`

## Estructura del Proyecto

```
ivy-ai-platform/
├── client/           # Frontend React
│   ├── src/
│   │   ├── pages/    # Páginas de la aplicación
│   │   ├── components/ # Componentes reutilizables
│   │   └── lib/      # Utilidades y configuración
├── server/           # Backend Express + tRPC
│   ├── _core/        # Configuración core
│   ├── ropa-*.ts     # Módulos de ROPA
│   └── routers.ts    # Rutas tRPC
├── drizzle/          # Esquemas de base de datos
└── shared/           # Código compartido
```

## ROPA - Meta-Agente

ROPA es el meta-agente autónomo que gestiona la plataforma 24/7:

- **129+ herramientas** organizadas en categorías
- **Ciclos autónomos**: Health check (2min), Maintenance (30min), Market Intelligence (6h)
- **Auto-healing**: Detección y corrección automática de problemas
- **Market Intelligence**: Análisis de tendencias con LLM

## Licencia

MIT
