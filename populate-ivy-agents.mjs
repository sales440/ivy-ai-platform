import { drizzle } from 'drizzle-orm/mysql2';
import { agents } from './drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);

const ivyAgents = [
  {
    name: 'Ivy-Prospect',
    type: 'prospect',
    status: 'active',
    capabilities: JSON.stringify(['cold_outreach', 'lead_generation', 'initial_contact', 'qualification']),
    metadata: JSON.stringify({
      personality: 'Professional, confident, and direct',
      specialization: 'Cold outreach and prospecting',
      tone: 'Assertive yet friendly',
      primaryGoal: 'Generate qualified leads through cold outreach',
      secondaryGoals: ['Build initial rapport', 'Qualify prospects', 'Book discovery calls'],
      avgConversionRate: 14.5,
      avgROI: 485,
      avgOpenRate: 34.2,
    }),
  },
  {
    name: 'Ivy-Closer',
    type: 'closer',
    status: 'active',
    capabilities: JSON.stringify(['deal_closing', 'objection_handling', 'roi_demonstration', 'negotiation']),
    metadata: JSON.stringify({
      personality: 'Persuasive, results-oriented, and strategic',
      specialization: 'Converting qualified leads into customers',
      tone: 'Confident and value-focused',
      primaryGoal: 'Close deals and secure commitments',
      secondaryGoals: ['Handle objections', 'Demonstrate ROI', 'Negotiate terms'],
      avgConversionRate: 22.8,
      avgROI: 680,
      avgOpenRate: 41.5,
    }),
  },
  {
    name: 'Ivy-Solve',
    type: 'solve',
    status: 'active',
    capabilities: JSON.stringify(['technical_support', 'problem_solving', 'solution_architecture', 'product_demos']),
    metadata: JSON.stringify({
      personality: 'Analytical, helpful, and detail-oriented',
      specialization: 'Technical problem-solving and solution design',
      tone: 'Expert and supportive',
      primaryGoal: 'Provide technical solutions and product demonstrations',
      secondaryGoals: ['Answer technical questions', 'Design custom solutions', 'Conduct product demos'],
      avgConversionRate: 18.3,
      avgROI: 520,
      avgOpenRate: 38.7,
    }),
  },
  {
    name: 'Ivy-Nurture',
    type: 'talent',
    status: 'active',
    capabilities: JSON.stringify(['relationship_building', 'long_term_engagement', 'content_sharing', 'education']),
    metadata: JSON.stringify({
      personality: 'Warm, patient, and relationship-focused',
      specialization: 'Long-term relationship building and nurturing',
      tone: 'Friendly and educational',
      primaryGoal: 'Build and maintain long-term relationships',
      secondaryGoals: ['Share valuable content', 'Educate prospects', 'Stay top-of-mind'],
      avgConversionRate: 12.1,
      avgROI: 420,
      avgOpenRate: 45.2,
    }),
  },
  {
    name: 'Ivy-Qualify',
    type: 'logic',
    status: 'active',
    capabilities: JSON.stringify(['lead_scoring', 'qualification', 'needs_assessment', 'fit_analysis']),
    metadata: JSON.stringify({
      personality: 'Methodical, thorough, and data-driven',
      specialization: 'Lead qualification and scoring',
      tone: 'Professional and inquisitive',
      primaryGoal: 'Qualify leads and assess fit',
      secondaryGoals: ['Score lead quality', 'Identify pain points', 'Determine budget and timeline'],
      avgConversionRate: 16.7,
      avgROI: 510,
      avgOpenRate: 36.4,
    }),
  },
  {
    name: 'Ivy-Engage',
    type: 'insight',
    status: 'active',
    capabilities: JSON.stringify(['multi_channel_coordination', 'campaign_orchestration', 'engagement_optimization', 'analytics']),
    metadata: JSON.stringify({
      personality: 'Strategic, coordinated, and data-informed',
      specialization: 'Multi-channel engagement coordination',
      tone: 'Strategic and insightful',
      primaryGoal: 'Coordinate multi-channel engagement strategies',
      secondaryGoals: ['Optimize campaign timing', 'Analyze engagement patterns', 'Coordinate agent handoffs'],
      avgConversionRate: 15.9,
      avgROI: 495,
      avgOpenRate: 39.8,
    }),
  },
];

async function populateAgents() {
  console.log('🚀 Populating Ivy.AI agents...\n');

  for (const agent of ivyAgents) {
    try {
      await db.insert(agents).values(agent);
      console.log(`✅ Created agent: ${agent.name} (${agent.type})`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`⚠️  Agent ${agent.name} already exists, skipping...`);
      } else {
        console.error(`❌ Error creating agent ${agent.name}:`, error.message);
      }
    }
  }

  console.log('\n✨ Agent population complete!');
  process.exit(0);
}

populateAgents().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
