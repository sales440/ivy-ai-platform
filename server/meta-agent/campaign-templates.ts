/**
 * Campaign Templates
 * 
 * Industry-specific campaign templates for automated campaign generation
 */

export interface CampaignTemplate {
    industry: string;
    emails: EmailTemplate[];
    leadSources: string[];
    targetAudience: string;
    goals: string[];
}

export interface EmailTemplate {
    number: number;
    dayOffset: number;
    subject: string;
    body: string;
    cta: string;
}

export const campaignTemplates: Record<string, CampaignTemplate> = {
    // Ivy.AI - SaaS Platform
    'saas': {
        industry: 'SaaS',
        targetAudience: 'CTOs, VPs of Engineering, Product Managers at mid-size companies',
        goals: ['Product demos', 'Free trial signups', 'Enterprise contracts'],
        leadSources: [
            'LinkedIn (CTOs, VPs Engineering)',
            'Product Hunt',
            'Tech communities (Reddit, HackerNews)',
            'SaaS directories',
        ],
        emails: [
            {
                number: 1,
                dayOffset: 0,
                subject: 'Transform Your Business with AI Agents - Ivy.AI',
                body: `Hi {{name}},

I noticed {{company}} is in the {{industry}} space, and I wanted to reach out about something that could revolutionize how you handle customer interactions and internal workflows.

Ivy.AI is an autonomous AI agent platform that helps companies like yours automate repetitive tasks, qualify leads 24/7, and provide instant customer support - all without hiring additional staff.

**What makes Ivy.AI different:**
- 🤖 130+ specialized AI agents that work together
- 📊 300% average ROI in the first 90 days
- ⚡ Deploy in hours, not months
- 🔒 Enterprise-grade security and compliance

**Real results from companies like yours:**
- TechCorp: Reduced support costs by 65% in 3 months
- DataFlow: Qualified 500+ leads automatically, 40% conversion rate
- CloudSync: Saved 200 hours/month on routine tasks

Would you be open to a 15-minute demo to see how Ivy.AI could work for {{company}}?

Best regards,
Ivy.AI Team`,
                cta: 'Book a free demo',
            },
            {
                number: 2,
                dayOffset: 3,
                subject: 'Re: Transform Your Business with AI Agents - Quick Question',
                body: `Hi {{name}},

I wanted to follow up on my previous email about Ivy.AI.

I understand you're busy, so I'll keep this brief: What if you could automate 70% of your repetitive tasks without writing a single line of code?

That's exactly what our clients are experiencing with Ivy.AI.

**See it in action:** I'd love to show you a 10-minute live demo tailored to {{company}}'s needs. No sales pitch - just a practical walkthrough of how AI agents can solve your specific challenges.

**Available times this week:**
- Tuesday 2pm-4pm
- Wednesday 10am-12pm
- Thursday 3pm-5pm

Just reply with a time that works for you, and I'll send a calendar invite.

P.S. We're offering early adopters 20% off their first year. This offer expires Friday.

Best,
Ivy.AI Team`,
                cta: 'Reply with your preferred time',
            },
            {
                number: 3,
                dayOffset: 7,
                subject: 'Case Study: How DataFlow Achieved 40% Lead Conversion with Ivy.AI',
                body: `Hi {{name}},

I wanted to share a quick case study that might resonate with {{company}}'s goals.

**Client:** DataFlow (B2B SaaS, 50 employees)
**Challenge:** Overwhelmed sales team, leads falling through cracks
**Solution:** Ivy.AI's IVY-PROSPECT and IVY-QUALIFY agents

**Results in 90 days:**
- ✅ 500+ leads automatically qualified
- ✅ 40% conversion rate (vs. 18% before)
- ✅ Sales team focused on closing, not qualifying
- ✅ $450K in new revenue attributed to Ivy.AI

**Their CEO's quote:**
"Ivy.AI gave us a sales team that never sleeps. Our conversion rate doubled, and our sales reps are happier because they're only talking to qualified prospects."

**Want similar results?**

I can show you exactly how we'd implement this for {{company}} in a 15-minute call. No obligation - just a practical roadmap.

Interested?

Best,
Ivy.AI Team

P.S. Early adopter discount (20% off) expires in 48 hours.`,
                cta: 'Yes, show me how',
            },
        ],
    },

    // FAGOR AUTOMATION - Industrial/Manufacturing
    'manufacturing': {
        industry: 'Industrial/Manufacturing',
        targetAudience: 'Plant Managers, Operations Directors, Maintenance Managers',
        goals: ['Equipment audits', 'Maintenance contracts', 'Predictive maintenance solutions'],
        leadSources: [
            'Industry directories',
            'Trade shows',
            'Manufacturing forums',
            'LinkedIn (Plant Managers, Operations)',
        ],
        emails: [
            {
                number: 1,
                dayOffset: 0,
                subject: 'Reduce Equipment Downtime by 70% - FAGOR AUTOMATION',
                body: `Hi {{name}},

Unplanned equipment failures cost manufacturers an average of $260,000 per hour. Is {{company}} prepared for the next breakdown?

FAGOR AUTOMATION specializes in predictive maintenance solutions that prevent failures before they happen.

**Our approach:**
- 🔧 AI-powered equipment monitoring
- 📊 Predictive analytics that forecast failures 30 days in advance
- ⚡ 24/7 remote diagnostics
- 💰 Average 70% reduction in unplanned downtime

**Real results:**
- ManufactureCo: Saved $2M annually in prevented downtime
- IndustrialTech: Reduced maintenance costs by 45%
- PlantOps: Zero unplanned failures in 18 months

**Free Equipment Audit:**
We're offering a complimentary equipment health audit for {{company}}. Our engineers will assess your critical systems and provide a detailed report with actionable recommendations.

**No cost. No obligation. Just valuable insights.**

Interested in scheduling your audit?

Best regards,
FAGOR AUTOMATION Team`,
                cta: 'Schedule free audit',
            },
            {
                number: 2,
                dayOffset: 3,
                subject: 'Re: Equipment Audit for {{company}} - Follow-up',
                body: `Hi {{name}},

Following up on my previous email about our free equipment audit.

I wanted to share a quick stat that might interest you:

**Companies using predictive maintenance see:**
- 70% reduction in equipment breakdowns
- 25% reduction in maintenance costs
- 35% reduction in downtime

The question is: How much is unplanned downtime costing {{company}} right now?

Our free audit will give you exact numbers and a roadmap to reduce those costs.

**The audit includes:**
✓ Complete equipment health assessment
✓ Failure risk analysis
✓ Customized maintenance recommendations
✓ ROI projection for predictive maintenance

**Takes only 2 hours on-site. Zero disruption to your operations.**

Can we schedule this for next week?

Best,
FAGOR AUTOMATION Team`,
                cta: 'Yes, schedule my audit',
            },
            {
                number: 3,
                dayOffset: 7,
                subject: 'Case Study: $2M Saved with Predictive Maintenance',
                body: `Hi {{name}},

I wanted to share how one of our clients transformed their maintenance operations.

**Client:** ManufactureCo (Automotive parts, 200 employees)
**Challenge:** Frequent equipment failures, high maintenance costs
**Solution:** FAGOR predictive maintenance system

**Results in 12 months:**
- ✅ $2M saved in prevented downtime
- ✅ 85% reduction in emergency repairs
- ✅ 30% increase in equipment lifespan
- ✅ Maintenance budget reduced by 40%

**Their Operations Director's quote:**
"FAGOR's system paid for itself in 4 months. We haven't had an unplanned failure in over a year. It's like having a crystal ball for our equipment."

**Ready to see similar results at {{company}}?**

Our free audit will show you exactly how much you could save.

Interested in learning more?

Best,
FAGOR AUTOMATION Team

P.S. We're currently booking audits 2 weeks out. Reserve your spot now.`,
                cta: 'Book my free audit',
            },
        ],
    },

    // PET LIFE 360 - Pet Services
    'pet-services': {
        industry: 'Pet Services',
        targetAudience: 'Pet owners, Pet parents, Animal lovers',
        goals: ['App downloads', 'Service bookings', 'Subscription signups'],
        leadSources: [
            'Pet forums and communities',
            'Social media (Instagram, Facebook pet groups)',
            'Vet partnerships',
            'Pet store collaborations',
        ],
        emails: [
            {
                number: 1,
                dayOffset: 0,
                subject: 'Everything Your Pet Needs, One App - PET LIFE 360',
                body: `Hi {{name}},

Being a pet parent is amazing... but also overwhelming. Vet appointments, grooming, food delivery, training classes - it's a lot to manage!

What if there was one app that handled everything?

**Introducing PET LIFE 360:**
🐾 Vet appointments & reminders
🐾 Grooming & daycare booking
🐾 Food & accessory delivery
🐾 Training classes & tips
🐾 Pet health tracking
🐾 Emergency vet locator

**All in one beautiful, easy-to-use app.**

**Why pet parents love us:**
- "Finally, everything in one place!" - Sarah M.
- "Saved me so much time and stress" - Mike T.
- "My dog has never been healthier" - Jessica L.

**Special Launch Offer:**
Download PET LIFE 360 this week and get:
✓ 20% off your first service booking
✓ Free premium features for 30 days
✓ $10 credit for food delivery

**Join 10,000+ happy pet parents!**

Ready to simplify your pet care?

Best,
PET LIFE 360 Team`,
                cta: 'Download the app',
            },
            {
                number: 2,
                dayOffset: 3,
                subject: 'Re: Your Pet Deserves the Best - Quick Question',
                body: `Hi {{name}},

Quick question: When was your pet's last vet checkup?

If you're like most pet parents, you probably can't remember off the top of your head. That's exactly why we built PET LIFE 360.

**Never miss important pet care again:**
- Automatic vet appointment reminders
- Vaccination tracking
- Grooming schedule
- Food delivery on autopilot

**Plus, exclusive perks:**
- 24/7 vet chat for emergencies
- Personalized health tips for your pet
- Community of 10,000+ pet parents

**Limited-time offer:**
Download this week and get 20% off your first booking + 30 days premium free.

**Takes 2 minutes to set up. Your pet will thank you!**

Ready to give it a try?

Best,
PET LIFE 360 Team`,
                cta: 'Download now',
            },
            {
                number: 3,
                dayOffset: 7,
                subject: 'Success Story: How PET LIFE 360 Saved Max\'s Life',
                body: `Hi {{name}},

I wanted to share a story that shows why PET LIFE 360 matters.

**Meet Sarah and Max:**
Sarah adopted Max (a golden retriever) last year. Like most new pet parents, she was overwhelmed with vet appointments, grooming, training, and more.

She downloaded PET LIFE 360 to help organize everything.

**What happened next:**
Three months in, PET LIFE 360's health tracker noticed Max's weight was dropping. The app sent Sarah an alert to check with her vet.

Turns out, Max had an early-stage thyroid condition. Because they caught it early (thanks to the app's tracking), treatment was simple and Max is now thriving.

**Sarah's words:**
"PET LIFE 360 literally saved Max's life. I never would have noticed the weight change on my own. This app is a must-have for every pet parent."

**Your pet deserves this level of care.**

Download PET LIFE 360 today and get:
✓ 20% off first booking
✓ 30 days premium free
✓ Peace of mind

Ready to join 10,000+ happy pet parents?

Best,
PET LIFE 360 Team

P.S. Launch offer ends Friday. Don't miss out!`,
                cta: 'Download the app now',
            },
        ],
    },
};

/**
 * Get campaign template for a specific industry
 */
export function getCampaignTemplate(industry: string): CampaignTemplate | null {
    const normalizedIndustry = industry.toLowerCase();

    if (normalizedIndustry.includes('saas') || normalizedIndustry.includes('software') || normalizedIndustry.includes('tech')) {
        return campaignTemplates['saas'];
    }

    if (normalizedIndustry.includes('manufacturing') || normalizedIndustry.includes('industrial') || normalizedIndustry.includes('automation')) {
        return campaignTemplates['manufacturing'];
    }

    if (normalizedIndustry.includes('pet') || normalizedIndustry.includes('animal') || normalizedIndustry.includes('veterinary')) {
        return campaignTemplates['pet-services'];
    }

    return null;
}
