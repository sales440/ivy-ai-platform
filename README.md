# Ivy.AI Platform

> Intelligent Agent Orchestration System for Enterprise Automation

Ivy.AI is a next-generation AI platform that orchestrates specialized agents across sales, support, operations, HR, and strategy departments. Built with React 19, tRPC, and powered by advanced LLM integration.

## 🚀 Features

### 6 Specialized AI Agents

- **Ivy-Prospect** (Sales) - Lead generation and qualification
- **Ivy-Closer** (Sales) - Deal negotiation and closing
- **Ivy-Solve** (Support) - Customer support and troubleshooting
- **Ivy-Logic** (Operations) - Supply chain optimization
- **Ivy-Talent** (HR) - Recruitment and talent management
- **Ivy-Insight** (Strategy) - Business intelligence and analytics

### The Hive Orchestrator

Central intelligence system that:
- Coordinates workflows across multiple agents
- Manages inter-agent communication
- Tracks KPIs and performance metrics
- Executes automated workflows

### Key Capabilities

- ✅ Real-time agent monitoring and analytics
- ✅ Command-line interface for agent control
- ✅ Automated workflow execution
- ✅ LLM-powered decision making
- ✅ Knowledge base integration
- ✅ Lead and ticket management

## 🏗️ Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Express 4, tRPC 11
- **Database**: MySQL/PostgreSQL (Drizzle ORM)
- **AI/LLM**: OpenAI integration
- **Auth**: Manus OAuth
- **Deployment**: Railway, Docker

## 📦 Installation

### Prerequisites

- Node.js 22+
- pnpm 10.4.1+
- MySQL or PostgreSQL database

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ivy-ai-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   All environment variables are pre-configured in the Manus platform.
   For Railway deployment, you'll need to set:
   - `DATABASE_URL` - Your Railway PostgreSQL connection string
   - All other variables are automatically injected by the platform

4. **Run database migrations**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## 🚢 Deployment to Railway

### Option 1: Using Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize project**
   ```bash
   railway init
   ```

4. **Add environment variables**
   ```bash
   railway variables set DATABASE_URL=<your-database-url>
   railway variables set JWT_SECRET=<your-jwt-secret>
   # ... add all other environment variables
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Option 2: Using GitHub Integration

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Connect to Railway**
   - Go to [Railway](https://railway.app)
   - Create a new project
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will automatically detect the Dockerfile

3. **Configure environment variables**
   - In Railway dashboard, go to Variables
   - Add all required environment variables from `.env`

4. **Add PostgreSQL database** (recommended for Railway)
   - In Railway dashboard, click "New"
   - Select "Database" → "PostgreSQL"
   - Copy the `DATABASE_URL` to your environment variables

5. **Deploy**
   - Railway will automatically deploy on every push to main branch

### Required Environment Variables for Railway

```
DATABASE_URL
JWT_SECRET
OAUTH_SERVER_URL
VITE_OAUTH_PORTAL_URL
VITE_APP_ID
OWNER_OPEN_ID
OWNER_NAME
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
VITE_FRONTEND_FORGE_API_KEY
VITE_FRONTEND_FORGE_API_URL
VITE_APP_TITLE
VITE_APP_LOGO
```

## 📖 Usage

### Command Console

Access the command console from the Dashboard to interact with agents:

```bash
# List all agents
/agents list

# Get agent status
/agent prospect status

# Execute agent task
/agent prospect execute find_leads

# View KPIs
/kpis sales

# System status
/system status

# Help
/help
```

### API Endpoints (tRPC)

The platform exposes the following tRPC routers:

- `agents.*` - Agent management and execution
- `workflows.*` - Workflow orchestration
- `leads.*` - Lead management (Ivy-Prospect)
- `tickets.*` - Support ticket management (Ivy-Solve)
- `knowledge.*` - Knowledge base operations
- `command.*` - Command execution and history
- `analytics.*` - System analytics and metrics

## 🏛️ Architecture

```
ivy-ai-platform/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # tRPC client
│   │   └── const.ts     # Constants
├── server/              # Express backend
│   ├── agents/          # AI agent implementations
│   │   ├── core.ts      # Base agent class
│   │   ├── prospect.ts  # Ivy-Prospect
│   │   ├── solve.ts     # Ivy-Solve
│   │   └── index.ts     # All agents
│   ├── hive/            # The Hive orchestrator
│   ├── db.ts            # Database helpers
│   ├── routers.ts       # tRPC routers
│   └── _core/           # Core infrastructure
├── drizzle/             # Database schema
└── shared/              # Shared types
```

## 🧪 Testing

```bash
# Run TypeScript type checking
pnpm typecheck

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🔧 Development

### Adding a New Agent

1. Create agent class in `server/agents/your-agent.ts`
2. Extend `IvyAgent` base class
3. Implement `_processTask()` method
4. Register in `server/agents/index.ts`
5. Add to The Hive in `server/hive/orchestrator.ts`

### Creating Custom Workflows

```typescript
const workflow = {
  name: "Custom Workflow",
  description: "Your workflow description",
  steps: [
    {
      name: "step_1",
      agentType: AgentType.PROSPECT,
      task: { type: "find_leads", criteria: {...} }
    },
    // ... more steps
  ]
};

hive.createWorkflow("custom_workflow", workflow);
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📧 Support

For support, email support@ivy-ai.com or open an issue on GitHub.

---

**Built with ❤️ by the Ivy.AI Team**
