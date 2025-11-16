/**
 * Seed Data Router - Para poblar base de datos con datos demo
 */
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export const seedRouter = router({
  /**
   * Execute seed data - Poblar base de datos con datos de demostración
   */
  executeSeed: publicProcedure
    .input(z.object({
      includeLeads: z.boolean().default(true),
      includeTickets: z.boolean().default(true),
      includeKnowledgeBase: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const results = {
        leads: 0,
        tickets: 0,
        knowledgeArticles: 0,
        agents: 0,
      };

      try {
        // 1. Crear agentes si no existen
        const existingAgents = await db.getAllAgents();
        if (existingAgents.length === 0) {
          const agentTypes = [
            { name: "Ivy-Prospect", type: "prospect" as const, department: "sales" as const },
            { name: "Ivy-Closer", type: "closer" as const, department: "sales" as const },
            { name: "Ivy-Solve", type: "solve" as const, department: "customer_service" as const },
            { name: "Ivy-Logic", type: "logic" as const, department: "operations" as const },
            { name: "Ivy-Talent", type: "talent" as const, department: "hr" as const },
            { name: "Ivy-Insight", type: "insight" as const, department: "strategy" as const },
          ];

          for (const agent of agentTypes) {
            await db.createAgent({
              agentId: uuidv4(),
              name: agent.name,
              type: agent.type,
              department: agent.department,
              status: "idle",
              capabilities: [],
              kpis: {},
            });
            results.agents++;
          }
        }

        // 2. Crear leads de demostración
        if (input.includeLeads) {
          const sampleLeads = [
            {
              name: "Sarah Johnson",
              email: "sarah.johnson@techcorp.com",
              company: "TechCorp Industries",
              title: "VP of Operations",
              industry: "Technology",
              location: "San Francisco, CA",
              companySize: "500-1000",
              qualificationScore: 85,
              qualificationLevel: "A" as const,
              status: "qualified" as const,
              source: "linkedin",
            },
            {
              name: "Michael Chen",
              email: "m.chen@innovate.io",
              company: "Innovate Solutions",
              title: "CTO",
              industry: "Software",
              location: "Austin, TX",
              companySize: "100-500",
              qualificationScore: 92,
              qualificationLevel: "A" as const,
              status: "contacted" as const,
              source: "web",
            },
            {
              name: "Emily Rodriguez",
              email: "emily.r@globalretail.com",
              company: "Global Retail Group",
              title: "Director of IT",
              industry: "Retail",
              location: "New York, NY",
              companySize: "1000+",
              qualificationScore: 78,
              qualificationLevel: "B" as const,
              status: "new" as const,
              source: "manual",
            },
            {
              name: "David Kim",
              email: "david.kim@healthplus.com",
              company: "HealthPlus Systems",
              title: "Head of Digital Transformation",
              industry: "Healthcare",
              location: "Boston, MA",
              companySize: "500-1000",
              qualificationScore: 88,
              qualificationLevel: "A" as const,
              status: "qualified" as const,
              source: "linkedin",
            },
            {
              name: "Lisa Anderson",
              email: "l.anderson@finserv.com",
              company: "FinServ Capital",
              title: "VP of Technology",
              industry: "Finance",
              location: "Chicago, IL",
              companySize: "1000+",
              qualificationScore: 95,
              qualificationLevel: "A" as const,
              status: "converted" as const,
              source: "web",
            },
          ];

          for (const lead of sampleLeads) {
            await db.createLead({
              leadId: uuidv4(),
              ...lead,
              metadata: {
                source_campaign: "Q4 2024 Outreach",
                last_interaction: new Date().toISOString(),
              },
            });
            results.leads++;
          }
        }

        // 3. Crear tickets de demostración
        if (input.includeTickets) {
          const sampleTickets = [
            {
              ticketId: uuidv4(),
              customerEmail: "john.doe@example.com",
              subject: "Unable to login to dashboard",
              issue: "I've been trying to log in for the past hour but keep getting an 'Invalid credentials' error even though I'm sure my password is correct.",
              category: "login" as const,
              priority: "high" as const,
              status: "open" as const,
            },
            {
              ticketId: uuidv4(),
              customerEmail: "jane.smith@company.com",
              subject: "Billing discrepancy on invoice #12345",
              issue: "The invoice shows a charge of $500 but our contract states $450 per month. Can you please review?",
              category: "billing" as const,
              priority: "medium" as const,
              status: "in_progress" as const,
            },
            {
              ticketId: uuidv4(),
              customerEmail: "bob.wilson@startup.io",
              subject: "Feature request: Export to CSV",
              issue: "It would be great if we could export our data to CSV format for analysis in Excel.",
              category: "feature_request" as const,
              priority: "low" as const,
              status: "open" as const,
            },
            {
              ticketId: uuidv4(),
              customerEmail: "alice.brown@enterprise.com",
              subject: "API integration not working",
              issue: "Our webhook endpoint is not receiving any events. We've checked our logs and the endpoint is accessible.",
              category: "technical" as const,
              priority: "critical" as const,
              status: "escalated" as const,
            },
            {
              ticketId: uuidv4(),
              customerEmail: "charlie.davis@business.com",
              subject: "How to add team members?",
              issue: "I'm trying to add new team members to our account but can't find the option in settings.",
              category: "account" as const,
              priority: "low" as const,
              status: "resolved" as const,
              resolution: "Guided user to Settings > Team > Invite Members. User successfully added 3 team members.",
              resolutionTime: 15,
            },
          ];

          for (const ticket of sampleTickets) {
            await db.createTicket(ticket);
            results.tickets++;
          }
        }

        // 4. Crear artículos de knowledge base
        if (input.includeKnowledgeBase) {
          const sampleArticles = [
            {
              articleId: uuidv4(),
              title: "How to Reset Your Password",
              content: "To reset your password: 1. Go to the login page, 2. Click 'Forgot Password', 3. Enter your email address, 4. Check your inbox for a reset link, 5. Follow the link and create a new password. Your new password must be at least 8 characters long and include uppercase, lowercase, and numbers.",
              category: "account",
              tags: ["password", "account", "security"],
            },
            {
              articleId: uuidv4(),
              title: "Getting Started with API Integration",
              content: "Our API uses REST architecture with JSON responses. To get started: 1. Generate an API key from Settings > API, 2. Include the key in the Authorization header as 'Bearer YOUR_API_KEY', 3. Make requests to https://api.ivy-ai.com/v1/. Rate limits: 1000 requests per hour for standard plans.",
              category: "technical",
              tags: ["api", "integration", "developer"],
            },
            {
              articleId: uuidv4(),
              title: "Understanding Your Invoice",
              content: "Your monthly invoice includes: Base subscription fee, Per-user charges, API usage fees (if applicable), and any add-on services. Invoices are generated on the 1st of each month and payment is due within 14 days. You can download invoices from Settings > Billing > Invoices.",
              category: "billing",
              tags: ["billing", "invoice", "payment"],
            },
            {
              articleId: uuidv4(),
              title: "Adding and Managing Team Members",
              content: "To add team members: 1. Go to Settings > Team, 2. Click 'Invite Members', 3. Enter email addresses (one per line), 4. Select role (Admin, Member, or Viewer), 5. Click Send Invitations. Team members will receive an email with instructions to join.",
              category: "account",
              tags: ["team", "users", "collaboration"],
            },
            {
              articleId: uuidv4(),
              title: "Troubleshooting Connection Issues",
              content: "If you're experiencing connection issues: 1. Check your internet connection, 2. Clear browser cache and cookies, 3. Try a different browser, 4. Disable browser extensions, 5. Check if your firewall is blocking our domain. If issues persist, contact support with your browser console logs.",
              category: "technical",
              tags: ["troubleshooting", "connection", "technical"],
            },
          ];

          for (const article of sampleArticles) {
            await db.createKnowledgeArticle(article);
            results.knowledgeArticles++;
          }
        }

        return {
          success: true,
          message: `Successfully seeded database with ${results.leads} leads, ${results.tickets} tickets, ${results.knowledgeArticles} knowledge articles, and ${results.agents} agents.`,
          results,
        };
      } catch (error: any) {
        return {
          success: false,
          message: `Failed to seed database: ${error.message}`,
          results,
        };
      }
    }),
});
