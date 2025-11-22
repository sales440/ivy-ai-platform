import { drizzle } from "drizzle-orm/mysql2";
import { agents } from "../drizzle/schema";

/**
 * Seed script to create 5 specialized marketing agents for Ivy.AI self-marketing campaign
 * 
 * Agents:
 * 1. Ivy-LinkedIn: LinkedIn outreach and engagement
 * 2. Ivy-Nurture: Email nurturing sequences
 * 3. Ivy-Scheduler: Demo scheduling and calendar management
 * 4. Ivy-Qualifier: Lead qualification and scoring
 * 5. Ivy-Content: Content creation for posts and emails
 */

async function seedMarketingAgents() {
  const db = drizzle(process.env.DATABASE_URL!);

  const marketingAgents = [
    {
      agentId: "ivy-linkedin-001",
      name: "Ivy-LinkedIn",
      type: "prospect" as const,
      department: "marketing" as const,
      status: "idle" as const,
      capabilities: [
        "linkedin_outreach",
        "linkedin_posting",
        "linkedin_engagement",
        "dm_management",
        "connection_requests",
        "comment_replies",
      ],
      kpis: {
        posts_published: 0,
        comments_made: 0,
        dms_sent: 0,
        connections_requested: 0,
        engagement_rate: 0,
      },
      configuration: {
        email: "sales@rpcommercegroupllc.com",
        posting_schedule: ["Monday 9am", "Tuesday 10am", "Thursday 9am", "Friday 2pm", "Saturday 11am"],
        engagement_time: "30min/day",
        target_audience: ["VP of Sales", "Director of Sales", "Head of Revenue"],
        content_pillars: ["education", "case_studies", "thought_leadership", "product"],
      },
    },
    {
      agentId: "ivy-nurture-001",
      name: "Ivy-Nurture",
      type: "prospect" as const,
      department: "marketing" as const,
      status: "idle" as const,
      capabilities: [
        "email_sequencing",
        "email_personalization",
        "drip_campaigns",
        "ab_testing",
        "email_tracking",
        "list_segmentation",
      ],
      kpis: {
        emails_sent: 0,
        open_rate: 0,
        click_rate: 0,
        reply_rate: 0,
        unsubscribe_rate: 0,
      },
      configuration: {
        email: "sales@rpcommercegroupllc.com",
        sequences: [
          {
            name: "awareness",
            trigger: "whitepaper_download",
            emails: 3,
            days_between: [2, 4, 7],
          },
          {
            name: "consideration",
            trigger: "calculator_usage",
            emails: 3,
            days_between: [1, 3, 5],
          },
          {
            name: "decision",
            trigger: "demo_request",
            emails: 3,
            days_between: [0, 1, 3],
          },
          {
            name: "post_demo",
            trigger: "demo_completed",
            emails: 3,
            days_between: [1, 3, 7],
          },
        ],
        personalization_fields: ["first_name", "company", "industry", "sdr_count", "annual_cost"],
      },
    },
    {
      agentId: "ivy-scheduler-001",
      name: "Ivy-Scheduler",
      type: "prospect" as const,
      department: "sales" as const,
      status: "idle" as const,
      capabilities: [
        "calendar_management",
        "demo_scheduling",
        "meeting_reminders",
        "reschedule_handling",
        "timezone_conversion",
        "calendar_integration",
      ],
      kpis: {
        demos_scheduled: 0,
        demos_completed: 0,
        no_shows: 0,
        reschedules: 0,
        average_booking_time: 0,
      },
      configuration: {
        email: "sales@rpcommercegroupllc.com",
        calendar_platform: "calendly",
        demo_duration: 30,
        buffer_time: 15,
        available_slots: {
          monday: ["9am-12pm", "2pm-5pm"],
          tuesday: ["9am-12pm", "2pm-5pm"],
          wednesday: ["9am-12pm", "2pm-5pm"],
          thursday: ["9am-12pm", "2pm-5pm"],
          friday: ["9am-12pm", "2pm-4pm"],
        },
        reminder_schedule: [
          { type: "email", timing: "24h_before" },
          { type: "email", timing: "1h_before" },
        ],
      },
    },
    {
      agentId: "ivy-qualifier-001",
      name: "Ivy-Qualifier",
      type: "prospect" as const,
      department: "sales" as const,
      status: "idle" as const,
      capabilities: [
        "lead_scoring",
        "lead_enrichment",
        "qualification_questions",
        "intent_detection",
        "company_research",
        "decision_maker_identification",
      ],
      kpis: {
        leads_qualified: 0,
        leads_disqualified: 0,
        average_score: 0,
        high_priority_leads: 0,
        qualification_accuracy: 0,
      },
      configuration: {
        email: "sales@rpcommercegroupllc.com",
        scoring_model: {
          company_size: { weight: 20, ranges: { "1-50": 0, "50-200": 50, "200-500": 80, "500+": 100 } },
          job_title: { weight: 25, values: { "VP": 100, "Director": 80, "Manager": 50, "Other": 20 } },
          industry: { weight: 15, values: { "SaaS": 100, "Tech": 80, "Services": 60, "Other": 40 } },
          engagement: { weight: 20, actions: { "demo_request": 100, "calculator": 70, "whitepaper": 40, "visit": 10 } },
          budget_indicators: { weight: 20, signals: { "5+_sdrs": 100, "3-5_sdrs": 70, "1-2_sdrs": 40, "0_sdrs": 10 } },
        },
        qualification_threshold: 70,
        high_priority_threshold: 80,
        enrichment_sources: ["linkedin", "clearbit", "hunter"],
      },
    },
    {
      agentId: "ivy-content-001",
      name: "Ivy-Content",
      type: "insight" as const,
      department: "marketing" as const,
      status: "idle" as const,
      capabilities: [
        "content_generation",
        "copywriting",
        "seo_optimization",
        "ab_test_creation",
        "headline_optimization",
        "cta_optimization",
      ],
      kpis: {
        posts_created: 0,
        emails_written: 0,
        avg_engagement_rate: 0,
        ab_tests_run: 0,
        winning_variants: 0,
      },
      configuration: {
        email: "sales@rpcommercegroupllc.com",
        content_types: ["linkedin_post", "email", "carousel", "video_script", "ad_copy"],
        tone: "professional_conversational",
        brand_voice: {
          attributes: ["data-driven", "transparent", "innovative", "helpful"],
          avoid: ["salesy", "hype", "jargon", "vague_promises"],
        },
        templates: {
          linkedin_post: ["hook_controversial", "case_study", "data_viz", "storytelling", "myth_busting"],
          email: ["welcome", "nurture", "demo_invite", "follow_up", "reactivation"],
        },
        optimization_focus: ["engagement_rate", "click_rate", "conversion_rate"],
      },
    },
  ];

  console.log("🤖 Seeding marketing agents...");

  for (const agent of marketingAgents) {
    try {
      await db.insert(agents).values([agent]);
      console.log(`✅ Created agent: ${agent.name} (${agent.agentId})`);
    } catch (error) {
      console.error(`❌ Failed to create agent ${agent.name}:`, error);
    }
  }

  console.log("✅ Marketing agents seeded successfully!");
  process.exit(0);
}

seedMarketingAgents().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
