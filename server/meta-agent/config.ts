/**
 * Meta-Agent Configuration
 * 
 * Central configuration for the autonomous Meta-Agent system
 */

import type { MetaAgentConfig } from "./types";

export const META_AGENT_CONFIG: MetaAgentConfig = {
  // Core settings
  enabled: true,
  autoFix: true,
  autoTrain: true,
  autoHeal: true,
  chatEnabled: true,

  // Performance settings
  maxConcurrentTasks: 3,
  auditInterval: 30, // Run audit every 30 minutes
  trainingInterval: 24, // Train agents every 24 hours

  // LLM settings
  llmModel: "gpt-4",
  llmTemperature: 0.3, // Lower temperature for more consistent fixes
};

export const TASK_PRIORITIES = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export const FIX_STRATEGIES = {
  // TypeScript error fix strategies
  ADD_TYPE_ANNOTATION: "add_type_annotation",
  ADD_OPTIONAL_CHAINING: "add_optional_chaining",
  ADD_PROPERTY_TO_TYPE: "add_property_to_type",
  RENAME_PROPERTY: "rename_property",
  INSTALL_DEPENDENCY: "install_dependency",
  UPDATE_IMPORT: "update_import",
  ADD_NULL_CHECK: "add_null_check",
  CONVERT_TYPE: "convert_type",
} as const;

export const TRAINING_CATEGORIES = {
  SUBJECT_LINES: "subject_lines",
  TIMING: "timing",
  TARGETING: "targeting",
  CONTENT: "content",
  FOLLOW_UP: "follow_up",
} as const;

export const HEALTH_CHECK_INTERVALS = {
  DATABASE: 60000, // 1 minute
  SERVER: 30000, // 30 seconds
  AGENTS: 120000, // 2 minutes
  CAMPAIGNS: 300000, // 5 minutes
} as const;

export const MAX_FIX_ATTEMPTS = 3;
export const MAX_ROLLBACK_HISTORY = 10;
export const CHAT_HISTORY_LIMIT = 100;
export const AUDIT_HISTORY_LIMIT = 50;

// Commands that Meta-Agent understands
export const META_AGENT_COMMANDS = {
  // System commands
  STATUS: ["status", "estado", "health"],
  FIX: ["fix", "arreglar", "repair"],
  AUDIT: ["audit", "auditar", "check"],
  TRAIN: ["train", "entrenar", "teach"],
  HELP: ["help", "ayuda", "commands"],

  // Specific tasks
  FIX_TYPESCRIPT: ["fix typescript", "fix ts", "arreglar typescript"],
  FIX_ERRORS: ["fix errors", "arreglar errores"],
  TRAIN_AGENTS: ["train agents", "entrenar agentes"],
  AUTO_TRAIN: ["auto train", "auto entrenar"],
  REFACTOR: ["refactor", "refactorizar", "clean code"],
  MIGRATE: ["migrate", "migrar", "update schema"],
  HEAL: ["heal", "sanar", "fix system"],

  // Information
  SHOW_TASKS: ["tasks", "tareas", "show tasks"],
  SHOW_METRICS: ["metrics", "metricas", "performance"],
  SHOW_AGENTS: ["agents", "agentes", "show agents"],
  SHOW_ERRORS: ["errors", "errores", "show errors"],
} as const;

// LLM Prompts for different tasks
export const LLM_PROMPTS = {
  FIX_TYPESCRIPT_ERROR: `You are a TypeScript expert. Fix the following TypeScript error.

File: {{file}}
Line: {{line}}
Error Code: {{code}}
Error Message: {{message}}

Code Context:
\`\`\`typescript
{{context}}
\`\`\`

Provide the fix as a JSON object with this structure:
{
  "strategy": "add_type_annotation" | "add_optional_chaining" | "add_property_to_type" | "rename_property" | "other",
  "fix": "// Complete fixed code here",
  "explanation": "Brief explanation of why this fix works"
}

Only return valid JSON, no additional text.`,

  GENERATE_TRAINING_RECOMMENDATION: `You are an AI agent training expert. Analyze the following agent performance data and generate specific training recommendations.

Agent: {{agentName}}
Campaign: {{campaignName}}

Performance Metrics:
- Emails Sent: {{emailsSent}}
- Open Rate: {{openRate}}%
- Click Rate: {{clickRate}}%
- Conversion Rate: {{conversionRate}}%
- Response Time: {{responseTime}}ms

Successful Patterns:
{{successfulPatterns}}

Market Intelligence & Industry Trends:
{{marketIntelligence}}

Generate 3-5 specific, actionable recommendations to improve this agent's performance. Return as JSON:
{
  "recommendations": [
    {
      "category": "subject_lines" | "timing" | "targeting" | "content" | "follow_up",
      "recommendation": "Specific recommendation text",
      "expectedImpact": "high" | "medium" | "low",
      "actionSteps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}

Only return valid JSON, no additional text.`,

  CHAT_RESPONSE: `You are the Meta-Agent, an autonomous AI system that maintains the Ivy.AI platform. You can fix code, train agents, and keep the system running 24/7.

Conversation History:
{{conversationHistory}}

User Message: {{userMessage}}

Current System Status:
- TypeScript Errors: {{tsErrors}}
- Platform Health: {{platformHealth}}
- Active Agents: {{activeAgents}}
- Running Tasks: {{runningTasks}}

Respond naturally and helpfully. If the user asks you to perform a task, acknowledge it and explain what you'll do. If you need more information, ask clarifying questions.

Keep responses concise (2-3 sentences max) unless explaining a complex topic.`,

  REFACTORING_SUGGESTION: `You are a code quality expert. Analyze the following code and suggest refactoring improvements.

File: {{file}}
Code:
\`\`\`typescript
{{code}}
\`\`\`

Identify issues like:
- Unused imports/variables
- Dead code
- Complex functions (>50 lines)
- Duplicate code
- Anti-patterns

Return as JSON:
{
  "opportunities": [
    {
      "type": "unused_import" | "unused_variable" | "dead_code" | "complex_function" | "duplicate_code",
      "line": 10,
      "description": "Brief description",
      "suggestion": "How to fix it",
      "impact": "high" | "medium" | "low"
    }
  ]
}

Only return valid JSON, no additional text.`,
};
