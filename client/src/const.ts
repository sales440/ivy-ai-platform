export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "https://placehold.co/128x128/8B5CF6/FFFFFF?text=Ivy";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

// Ivy.AI specific constants
export const AGENT_TYPES = {
  PROSPECT: 'prospect',
  CLOSER: 'closer',
  SOLVE: 'solve',
  LOGIC: 'logic',
  TALENT: 'talent',
  INSIGHT: 'insight'
} as const;

export const AGENT_NAMES = {
  prospect: 'Ivy-Prospect',
  closer: 'Ivy-Closer',
  solve: 'Ivy-Solve',
  logic: 'Ivy-Logic',
  talent: 'Ivy-Talent',
  insight: 'Ivy-Insight'
} as const;

export const AGENT_DESCRIPTIONS = {
  prospect: 'Sales Lead Generation & Qualification',
  closer: 'Sales Negotiation & Deal Closing',
  solve: 'Customer Support & Troubleshooting',
  logic: 'Operations & Supply Chain Management',
  talent: 'HR & Recruitment',
  insight: 'Strategy & Business Intelligence'
} as const;

export const COMMAND_HELP = `
Available Commands:
  /agents list                 - List all agents
  /agent <type> status         - Get agent status
  /agent <type> execute <task> - Execute agent task
  /workflows available         - List available workflows
  /workflow execute <name>     - Execute workflow
  /kpis [department]           - View KPIs
  /analytics system            - System analytics
  /system status               - System health status
  /help                        - Show this help
`;
