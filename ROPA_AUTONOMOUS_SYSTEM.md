# ROPA Autonomous Meta-Agent System

## Overview

ROPA (Robotic Operations & Process Automation) is a fully autonomous meta-agent designed to manage the entire Ivy.AI sales automation platform without human intervention.

## Architecture

### 1. Campaign Management API (`campaign-management-router.ts`)

Complete CRUD operations for:
- **Companies**: Create, update, delete, list companies
- **Campaigns**: Full lifecycle management (create, pause, resume, delete)
- **Leads**: Lead generation and tracking
- **Analytics**: Real-time metrics and performance tracking

**Key Endpoints:**
```typescript
// Companies
campaignManagement.createCompany({ name, industry, contactEmail, ... })
campaignManagement.updateCompany({ id, ...updates })
campaignManagement.deleteCompany({ id })

// Campaigns
campaignManagement.createCampaign({ name, companyId, type, ... })
campaignManagement.updateCampaign({ id, status, ... })
campaignManagement.pauseCampaign({ id })
campaignManagement.resumeCampaign({ id })

// Analytics
campaignManagement.getCampaignMetrics({ campaignId })
campaignManagement.getCompanyMetrics({ companyId })
```

### 2. Agent Orchestration System (`agent-orchestration.ts`)

Manages specialized AI agents for different tasks:

**Agent Types:**
- `email` - Email campaign agents
- `phone` - Phone outreach agents
- `sms` - SMS campaign agents
- `social_media` - Social media agents
- `research` - Market research agents
- `analytics` - Data analysis agents

**Key Features:**
- Agent creation and lifecycle management
- Task assignment and tracking
- Performance monitoring
- Automatic agent scaling

**Key Endpoints:**
```typescript
// Agent Management
agentOrchestration.getAllAgents()
agentOrchestration.createAgent({ name, type, capabilities })
agentOrchestration.updateAgentStatus({ agentId, status })
agentOrchestration.assignCampaignToAgent({ agentId, campaignId })

// Task Management
agentOrchestration.createTask({ agentId, campaignId, type, priority, input })
agentOrchestration.getAgentTasks({ agentId })
agentOrchestration.updateTaskStatus({ taskId, status, output })

// Orchestration
agentOrchestration.assignOptimalAgent({ campaignId, taskType })
agentOrchestration.getSystemMetrics()
```

### 3. Autonomous Decision Engine (`autonomous-engine.ts`)

Enables ROPA to make intelligent decisions without human intervention.

**Decision Types:**
1. **create_campaign** - Auto-create campaigns for new companies
2. **pause_campaign** - Pause underperforming campaigns
3. **assign_agent** - Auto-assign agents to campaigns
4. **scale_resources** - Scale agent resources based on workload
5. **optimize_strategy** - Adjust campaign strategies based on performance

**Autonomous Rules:**
- **Rule 1**: Create initial outreach campaign for companies without campaigns
- **Rule 2**: Pause campaigns with < 5% conversion rate
- **Rule 3**: Auto-assign idle agents to active campaigns
- **Rule 4**: Scale up agents when ratio < 0.5 agents per campaign

**Key Methods:**
```typescript
autonomousEngine.analyze(context) // Analyze and generate decisions
autonomousEngine.executeDecisions(decisions, trpcClient) // Execute decisions
autonomousEngine.learn(decisionId, outcome) // Learn from outcomes
```

**ROPA Endpoints:**
```typescript
ropa.analyzeAndDecide({ context: { companies, campaigns, agents, metrics } })
ropa.executeAutonomousDecisions({ decisions })
ropa.getDecisionHistory({ limit: 50 })
```

### 4. ROPA System Prompt Enhancement

ROPA's system prompt includes:
- **Context Awareness**: Receives app state (companies, campaigns, agents) with every message
- **Email Generation**: Generates emails with `[EMAIL_DRAFT]` tags for Monitor preview
- **Autonomous Execution**: Executes actions immediately without asking permission
- **Multi-agent Coordination**: Orchestrates specialized agents for complex tasks

## How ROPA Works

### Autonomous Workflow

1. **Context Gathering**
   - ROPA receives current state via `[CONTEXT: {...}]` in messages
   - Includes companies, campaigns, agents, metrics

2. **Analysis**
   - Autonomous engine analyzes current state
   - Identifies opportunities and problems
   - Generates decisions with confidence scores

3. **Decision Making**
   - Creates campaigns for new companies
   - Pauses underperforming campaigns
   - Assigns agents to campaigns
   - Scales resources based on workload

4. **Execution**
   - Executes decisions via tRPC API
   - Logs all actions
   - Tracks outcomes

5. **Learning**
   - Adjusts confidence based on outcomes
   - Improves decision-making over time

### Example: Auto-Creating a Campaign

```typescript
// User adds new company "FAGOR Automation"
// ROPA automatically:

1. Detects new company without campaigns
2. Generates decision:
   {
     type: "create_campaign",
     reasoning: "Company 'FAGOR Automation' has no active campaigns",
     action: {
       name: "Initial Outreach - FAGOR Automation",
       companyId: 123,
       type: "multi_channel",
       status: "active"
     },
     confidence: 0.85
   }

3. Executes decision via API:
   await campaignManagement.createCampaign(action)

4. Assigns optimal agent:
   await agentOrchestration.assignOptimalAgent({
     campaignId: newCampaignId,
     taskType: "email_outreach"
   })

5. Generates email content:
   [EMAIL_DRAFT]company=FAGOR Automation|subject=...|body=...[/EMAIL_DRAFT]
```

## Integration with Frontend

### RopaDashboardV2.tsx

**Context Injection:**
```typescript
const contextData = {
  companies: localCompanies.map(c => ({ id, name, industry })),
  campaigns: localCampaigns.map(c => ({ id, name, company, status, type })),
  pendingEmails: emailDrafts.filter(d => d.status === 'pending').length,
};
const enrichedMessage = `[CONTEXT: ${JSON.stringify(contextData)}] ${message}`;
```

**Email Draft Parsing:**
```typescript
// ROPA response includes [EMAIL_DRAFT]...[/EMAIL_DRAFT]
// Frontend automatically parses and saves to Monitor
const emailMatch = data.response.match(/\[EMAIL_DRAFT\]([^\[]+)\[\/EMAIL_DRAFT\]/g);
// Saves to localStorage for preview and approval
```

### Monitor Section

- **Email Preview**: Shows emails with company letterhead
- **Approve/Reject**: Buttons to approve or reject generated content
- **Status Tracking**: Pending, Approved, Rejected counts

## API Reference

### Campaign Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `createCompany` | Mutation | Create new company |
| `updateCompany` | Mutation | Update company details |
| `deleteCompany` | Mutation | Delete company |
| `createCampaign` | Mutation | Create new campaign |
| `updateCampaign` | Mutation | Update campaign |
| `pauseCampaign` | Mutation | Pause campaign |
| `resumeCampaign` | Mutation | Resume campaign |
| `getCampaignMetrics` | Query | Get campaign analytics |

### Agent Orchestration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `getAllAgents` | Query | List all agents |
| `createAgent` | Mutation | Create new agent |
| `updateAgentStatus` | Mutation | Update agent status |
| `assignCampaignToAgent` | Mutation | Assign campaign to agent |
| `createTask` | Mutation | Create task for agent |
| `getAgentTasks` | Query | Get agent's tasks |
| `assignOptimalAgent` | Mutation | Auto-assign best agent |
| `getSystemMetrics` | Query | Get system metrics |

### Autonomous Engine

| Endpoint | Method | Description |
|----------|--------|-------------|
| `analyzeAndDecide` | Mutation | Analyze context and generate decisions |
| `executeAutonomousDecisions` | Mutation | Execute autonomous decisions |
| `getDecisionHistory` | Query | Get decision history |

## Future Enhancements

1. **Browser Automation**: Add Puppeteer/Playwright for UI control
2. **Advanced Learning**: Implement reinforcement learning
3. **Multi-tenant Support**: Separate contexts per user
4. **Real-time Monitoring**: WebSocket-based live updates
5. **A/B Testing**: Automatic campaign optimization
6. **Predictive Analytics**: ML-based performance prediction

## Security Considerations

- All endpoints require authentication (`protectedProcedure`)
- Owner-only actions for critical operations
- Audit logging for all autonomous decisions
- Confidence thresholds for high-risk actions

## Deployment

The system is deployed to Railway with:
- Automatic scaling based on load
- Database persistence for all data
- Real-time monitoring and alerts
- Rollback capabilities

## Support

For issues or questions, contact the Ivy.AI team.
