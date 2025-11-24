/**
 * FAGOR Automation Campaign Configurations
 * 
 * This file defines the 6 campaigns managed by Ivy.AI agents for FAGOR Automation
 */

export interface FagorCampaign {
  id: string;
  name: string;
  agentType: "prospect" | "closer" | "solve" | "logic" | "talent" | "insight";
  agentName: string;
  description: string;
  targetAudience: string;
  keyMessages: string[];
  callToAction: string;
  emailSubjects: {
    email1: string;
    email2: string;
    email3: string;
  };
}

/**
 * FAGOR Brand Voice Guidelines
 */
export const FAGOR_BRAND_VOICE = {
  tone: "Professional, technical, and solution-oriented",
  style: "Clear, direct, and value-focused",
  language: "Industry-specific terminology with practical examples",
  personality: "Expert advisor and trusted partner in manufacturing automation",
  values: [
    "Technical excellence",
    "Customer success",
    "Innovation in automation",
    "Long-term partnerships",
    "Reliability and quality"
  ]
};

/**
 * FAGOR Company Information
 */
export const FAGOR_COMPANY_INFO = {
  name: "FAGOR Automation Corp.",
  address: "4020 Winnetka Avenue, Rolling Meadows, IL 60008 USA",
  phone: "(847) 981-1500",
  email: "service@fagor-automation.com",
  website: "www.fagor-automation.com",
  tagline: "Open to your world",
  expertise: [
    "CNC Systems",
    "Servo Drives",
    "Motors",
    "Linear Encoders",
    "Industrial Automation Solutions"
  ]
};

/**
 * The 6 FAGOR Campaigns
 */
export const FAGOR_CAMPAIGNS: Record<string, FagorCampaign> = {
  // Campaign 1: CNC Training (Ivy-Prospect)
  training: {
    id: "FAGOR_CNC_Training_2026",
    name: "CNC Training 2026",
    agentType: "prospect",
    agentName: "Ivy-Prospect",
    description: "Comprehensive CNC system training to maximize equipment utilization and operator efficiency",
    targetAudience: "Manufacturing managers, production supervisors, CNC operators at companies with FAGOR equipment",
    keyMessages: [
      "Most operators use only 30-40% of CNC capabilities due to lack of training",
      "Proper training reduces downtime, increases productivity, and maximizes ROI",
      "Hands-on training with real FAGOR equipment and expert instructors",
      "Limited availability - early booking recommended for 2026 sessions"
    ],
    callToAction: "Schedule your 2026 training session today",
    emailSubjects: {
      email1: "The Hidden Cost of Untrained CNC Operators",
      email2: "How to Turn CNC Features Into Competitive Advantages",
      email3: "Your 2026 Training Opportunity: Secure Your Spot"
    }
  },

  // Campaign 2: Warranty Extension (Ivy-Closer)
  warranty: {
    id: "FAGOR_Warranty_Extension_2026",
    name: "Warranty Extension",
    agentType: "closer",
    agentName: "Ivy-Closer",
    description: "Extended warranty contracts for FAGOR equipment to protect investments and ensure continuous operation",
    targetAudience: "Companies with FAGOR equipment currently under standard 2-year warranty",
    keyMessages: [
      "Extend protection beyond the standard 2-year warranty",
      "Avoid unexpected repair costs and production downtime",
      "Priority service and faster response times for warranty holders",
      "Lock in current pricing before warranty expires"
    ],
    callToAction: "Extend your warranty before it expires",
    emailSubjects: {
      email1: "Your FAGOR Warranty Expires Soon - Here's What Happens Next",
      email2: "The True Cost of Unplanned Equipment Downtime",
      email3: "Last Chance: Extend Your Warranty at Current Rates"
    }
  },

  // Campaign 3: Equipment Repair (Ivy-Solve)
  repair: {
    id: "FAGOR_Equipment_Repair_2026",
    name: "Equipment Repair Services",
    agentType: "solve",
    agentName: "Ivy-Solve",
    description: "Professional repair services for FAGOR CNCs, drives, motors, and encoders",
    targetAudience: "Companies experiencing equipment issues or failures with FAGOR automation components",
    keyMessages: [
      "Factory-certified technicians with deep FAGOR expertise",
      "Genuine FAGOR parts and components",
      "Fast turnaround to minimize production downtime",
      "Diagnostic services to prevent future failures"
    ],
    callToAction: "Get your equipment repaired by FAGOR experts",
    emailSubjects: {
      email1: "Is Your FAGOR Equipment Running at Peak Performance?",
      email2: "Why Factory-Certified Repair Matters for CNC Systems",
      email3: "Schedule Your Equipment Diagnostic Today"
    }
  },

  // Campaign 4: EOL Parts (Ivy-Logic)
  eol_parts: {
    id: "FAGOR_EOL_Parts_2026",
    name: "End-of-Life Parts Availability",
    agentType: "logic",
    agentName: "Ivy-Logic",
    description: "Last-chance availability for FAGOR parts being discontinued from the catalog",
    targetAudience: "Companies using older FAGOR equipment that still rely on soon-to-be-discontinued parts",
    keyMessages: [
      "Critical parts being discontinued - limited stock available",
      "Secure spare parts now before they're gone forever",
      "Avoid future production stoppages due to unavailable parts",
      "Special pricing for bulk orders"
    ],
    callToAction: "Order your critical spare parts before they're discontinued",
    emailSubjects: {
      email1: "URGENT: Critical FAGOR Parts Being Discontinued",
      email2: "Last Chance to Stock Up on Essential Spare Parts",
      email3: "Final Notice: These Parts Won't Be Available After 2026"
    }
  },

  // Campaign 5: Modernization (Ivy-Talent)
  modernization: {
    id: "FAGOR_Modernization_2026",
    name: "Equipment Modernization & Upgrades",
    agentType: "talent",
    agentName: "Ivy-Talent",
    description: "Upgrade older FAGOR CNC systems to modern technology without replacing entire machines",
    targetAudience: "Companies with aging FAGOR equipment looking to improve performance without capital expenditure",
    keyMessages: [
      "Extend equipment life by 10+ years with modern CNC technology",
      "Improve performance, accuracy, and capabilities",
      "Fraction of the cost of new equipment",
      "Maintain compatibility with existing tooling and processes"
    ],
    callToAction: "Explore modernization options for your equipment",
    emailSubjects: {
      email1: "Is Your CNC Technology Holding You Back?",
      email2: "Modernize vs. Replace: The Smart Choice for 2026",
      email3: "Get a Free Modernization Assessment for Your Equipment"
    }
  },

  // Campaign 6: Preventive Maintenance (Ivy-Insight)
  preventive_maintenance: {
    id: "FAGOR_Preventive_Maintenance_2026",
    name: "Preventive Maintenance Contracts",
    agentType: "insight",
    agentName: "Ivy-Insight",
    description: "Scheduled maintenance programs to prevent failures and maximize equipment uptime",
    targetAudience: "Production managers seeking to reduce unplanned downtime and extend equipment life",
    keyMessages: [
      "Prevent 80% of equipment failures with regular maintenance",
      "Scheduled service during planned downtime - no surprises",
      "Data-driven insights to optimize equipment performance",
      "Lower total cost of ownership through proactive care"
    ],
    callToAction: "Start a preventive maintenance program today",
    emailSubjects: {
      email1: "The Hidden ROI of Preventive Maintenance",
      email2: "Reactive vs. Proactive: Which Costs Your Business More?",
      email3: "Lock In 2026 Maintenance Pricing - Limited Slots Available"
    }
  }
};

/**
 * Get campaign by agent type
 */
export function getCampaignByAgent(agentType: string): FagorCampaign | undefined {
  return Object.values(FAGOR_CAMPAIGNS).find(c => c.agentType === agentType);
}

/**
 * Get all campaigns
 */
export function getAllCampaigns(): FagorCampaign[] {
  return Object.values(FAGOR_CAMPAIGNS);
}
