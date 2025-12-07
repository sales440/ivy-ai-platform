/**
 * Meta-Agent Types and Interfaces
 * 
 * Defines all types for the autonomous Meta-Agent system
 */

export type MetaAgentStatus = "idle" | "running" | "training" | "fixing" | "auditing" | "error";

export type TaskType = 
  | "fix_typescript_errors"
  | "refactor_code"
  | "train_agent"
  | "auto_train"
  | "migrate_schema"
  | "manage_dependencies"
  | "audit_platform"
  | "heal_system"
  | "chat_response";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface MetaAgentTask {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  description: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface FixResult {
  success: boolean;
  file: string;
  errorsBefore: number;
  errorsAfter: number;
  fixesApplied: string[];
  rollback?: boolean;
  error?: string;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  campaignId?: string;
  metrics: {
    emailsSent: number;
    emailsOpened: number;
    emailsClicked: number;
    conversions: number;
    conversionRate: number;
    avgResponseTime: number;
    successRate: number;
  };
  period: {
    start: Date;
    end: Date;
  };
}

export interface TrainingRecommendation {
  agentId: string;
  agentName: string;
  category: "subject_lines" | "timing" | "targeting" | "content" | "follow_up";
  recommendation: string;
  expectedImpact: "high" | "medium" | "low";
  priority: TaskPriority;
  actionSteps: string[];
  basedOn: {
    dataPoints: number;
    successfulCampaigns: string[];
    metrics: Record<string, number>;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    command?: string;
    taskId?: string;
    error?: string;
  };
}

export interface ChatContext {
  conversationId: string;
  messages: ChatMessage[];
  currentTask?: MetaAgentTask;
  userIntent?: string;
}

export interface PlatformHealth {
  status: "healthy" | "degraded" | "critical";
  components: {
    database: ComponentHealth;
    server: ComponentHealth;
    agents: ComponentHealth;
    campaigns: ComponentHealth;
  };
  issues: HealthIssue[];
  lastCheck: Date;
}

export interface ComponentHealth {
  status: "healthy" | "degraded" | "critical";
  uptime: number;
  errorRate: number;
  responseTime: number;
  details?: Record<string, any>;
}

export interface HealthIssue {
  severity: "info" | "warning" | "error" | "critical";
  component: string;
  description: string;
  detectedAt: Date;
  autoFixable: boolean;
  fixAttempts?: number;
}

export interface MetaAgentConfig {
  enabled: boolean;
  autoFix: boolean;
  autoTrain: boolean;
  autoHeal: boolean;
  chatEnabled: boolean;
  maxConcurrentTasks: number;
  auditInterval: number; // minutes
  trainingInterval: number; // hours
  llmModel: string;
  llmTemperature: number;
}

export interface AuditResult {
  timestamp: Date;
  typeScriptErrors: number;
  codeQualityScore: number;
  platformHealth: PlatformHealth;
  recommendations: string[];
  criticalIssues: HealthIssue[];
  tasksCreated: string[];
}

export interface DependencyIssue {
  type: "missing" | "outdated" | "conflict";
  package: string;
  currentVersion?: string;
  requiredVersion?: string;
  suggestedVersion?: string;
  severity: "low" | "medium" | "high";
}

export interface SchemaIssue {
  type: "missing_table" | "missing_column" | "type_mismatch" | "missing_index";
  table: string;
  column?: string;
  expected: string;
  actual?: string;
  autoFixable: boolean;
}

export interface RefactoringOpportunity {
  file: string;
  line: number;
  type: "unused_import" | "unused_variable" | "dead_code" | "complex_function" | "duplicate_code";
  description: string;
  suggestion: string;
  impact: "low" | "medium" | "high";
}
