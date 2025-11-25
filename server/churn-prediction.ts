/**
 * Contact Churn Prediction System
 * 
 * Predicts which contacts are at risk of churning (disengaging) based on:
 * - Email engagement patterns (opens, clicks, responses)
 * - Time since last interaction
 * - Declining engagement trends
 * - Campaign participation
 * 
 * Triggers automated reactivation sequences for high-risk contacts
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

interface ContactEngagementData {
  contactId: string;
  email: string;
  name: string;
  companyName: string;
  enrolledCampaigns: string[];
  
  // Engagement metrics (last 30 days)
  emailsReceived: number;
  emailsOpened: number;
  emailsClicked: number;
  emailsReplied: number;
  
  // Temporal patterns
  daysSinceLastOpen: number;
  daysSinceLastClick: number;
  daysSinceLastReply: number;
  
  // Trend indicators
  openRateTrend: 'increasing' | 'stable' | 'declining';
  clickRateTrend: 'increasing' | 'stable' | 'declining';
  
  // Historical performance
  lifetimeOpenRate: number;
  lifetimeClickRate: number;
  lifetimeReplyRate: number;
}

interface ChurnPrediction {
  contactId: string;
  email: string;
  name: string;
  companyName: string;
  churnRiskScore: number; // 0-100
  churnRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryReason: string;
  contributingFactors: string[];
  recommendedActions: string[];
  shouldTriggerReactivation: boolean;
  predictedAt: Date;
}

/**
 * Calculate churn risk score for a contact (0-100)
 */
export function calculateChurnRiskScore(data: ContactEngagementData): number {
  let score = 0;
  
  // Factor 1: Days since last open (max 40 points)
  if (data.daysSinceLastOpen > 60) {
    score += 40;
  } else if (data.daysSinceLastOpen > 45) {
    score += 30;
  } else if (data.daysSinceLastOpen > 30) {
    score += 20;
  } else if (data.daysSinceLastOpen > 15) {
    score += 10;
  }
  
  // Factor 2: Days since last click (max 25 points)
  if (data.daysSinceLastClick > 90) {
    score += 25;
  } else if (data.daysSinceLastClick > 60) {
    score += 20;
  } else if (data.daysSinceLastClick > 45) {
    score += 15;
  } else if (data.daysSinceLastClick > 30) {
    score += 10;
  }
  
  // Factor 3: Declining engagement trends (max 20 points)
  if (data.openRateTrend === 'declining') {
    score += 10;
  }
  if (data.clickRateTrend === 'declining') {
    score += 10;
  }
  
  // Factor 4: Low lifetime engagement (max 15 points)
  if (data.lifetimeOpenRate < 10) {
    score += 10;
  } else if (data.lifetimeOpenRate < 20) {
    score += 5;
  }
  
  if (data.lifetimeClickRate < 5) {
    score += 5;
  }
  
  return Math.min(100, score);
}

/**
 * Determine churn risk level from score
 */
export function getChurnRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

/**
 * Identify primary reason for churn risk
 */
export function identifyPrimaryChurnReason(data: ContactEngagementData, score: number): string {
  if (data.daysSinceLastOpen > 60) {
    return 'No email opens in over 60 days';
  }
  if (data.daysSinceLastClick > 90) {
    return 'No email clicks in over 90 days';
  }
  if (data.openRateTrend === 'declining' && data.clickRateTrend === 'declining') {
    return 'Declining engagement across all metrics';
  }
  if (data.lifetimeOpenRate < 10) {
    return 'Consistently low engagement since enrollment';
  }
  if (data.daysSinceLastOpen > 30) {
    return 'No recent email engagement';
  }
  return 'Multiple engagement risk factors detected';
}

/**
 * Get contributing factors for churn risk
 */
export function getContributingFactors(data: ContactEngagementData): string[] {
  const factors: string[] = [];
  
  if (data.daysSinceLastOpen > 30) {
    factors.push(`${data.daysSinceLastOpen} days since last email open`);
  }
  if (data.daysSinceLastClick > 45) {
    factors.push(`${data.daysSinceLastClick} days since last email click`);
  }
  if (data.daysSinceLastReply > 90) {
    factors.push(`${data.daysSinceLastReply} days since last reply`);
  }
  if (data.openRateTrend === 'declining') {
    factors.push('Declining open rate trend');
  }
  if (data.clickRateTrend === 'declining') {
    factors.push('Declining click rate trend');
  }
  if (data.lifetimeOpenRate < 15) {
    factors.push(`Low lifetime open rate (${data.lifetimeOpenRate.toFixed(1)}%)`);
  }
  
  return factors;
}

/**
 * Get recommended actions for reactivation
 */
export function getRecommendedActions(data: ContactEngagementData, riskLevel: string): string[] {
  const actions: string[] = [];
  
  if (riskLevel === 'critical' || riskLevel === 'high') {
    actions.push('Trigger immediate reactivation sequence');
    actions.push('Send personalized re-engagement email with special offer');
    actions.push('Review contact preferences and update segmentation');
  }
  
  if (data.daysSinceLastOpen > 45) {
    actions.push('Test different subject lines to improve open rates');
    actions.push('Change send time to increase visibility');
  }
  
  if (data.lifetimeOpenRate < 15) {
    actions.push('Verify email deliverability (check spam folder)');
    actions.push('Update email content to be more relevant to contact');
  }
  
  if (data.clickRateTrend === 'declining') {
    actions.push('Improve email content and CTA clarity');
    actions.push('Add more personalized content based on contact profile');
  }
  
  actions.push('Monitor engagement after reactivation for 14 days');
  
  return actions;
}

/**
 * Predict churn risk for a contact
 */
export async function predictContactChurn(data: ContactEngagementData): Promise<ChurnPrediction> {
  const churnRiskScore = calculateChurnRiskScore(data);
  const churnRiskLevel = getChurnRiskLevel(churnRiskScore);
  const primaryReason = identifyPrimaryChurnReason(data, churnRiskScore);
  const contributingFactors = getContributingFactors(data);
  const recommendedActions = getRecommendedActions(data, churnRiskLevel);
  
  // Trigger reactivation for high and critical risk contacts
  const shouldTriggerReactivation = churnRiskLevel === 'high' || churnRiskLevel === 'critical';
  
  return {
    contactId: data.contactId,
    email: data.email,
    name: data.name,
    companyName: data.companyName,
    churnRiskScore,
    churnRiskLevel,
    primaryReason,
    contributingFactors,
    recommendedActions,
    shouldTriggerReactivation,
    predictedAt: new Date(),
  };
}

/**
 * Predict churn for all contacts in a campaign
 */
export async function predictCampaignChurn(campaignName: string): Promise<ChurnPrediction[]> {
  // In production, fetch actual contact data from database
  // For demonstration, using mock data
  const mockContacts: ContactEngagementData[] = [
    {
      contactId: 'contact-1',
      email: 'john.doe@manufacturing.com',
      name: 'John Doe',
      companyName: 'ABC Manufacturing',
      enrolledCampaigns: ['CNC Training 2026'],
      emailsReceived: 15,
      emailsOpened: 2,
      emailsClicked: 0,
      emailsReplied: 0,
      daysSinceLastOpen: 45,
      daysSinceLastClick: 90,
      daysSinceLastReply: 120,
      openRateTrend: 'declining',
      clickRateTrend: 'declining',
      lifetimeOpenRate: 13.3,
      lifetimeClickRate: 0,
      lifetimeReplyRate: 0,
    },
    {
      contactId: 'contact-2',
      email: 'sarah.smith@industrial.com',
      name: 'Sarah Smith',
      companyName: 'XYZ Industrial',
      enrolledCampaigns: ['Warranty Extension'],
      emailsReceived: 12,
      emailsOpened: 8,
      emailsClicked: 3,
      emailsReplied: 1,
      daysSinceLastOpen: 5,
      daysSinceLastClick: 10,
      daysSinceLastReply: 15,
      openRateTrend: 'stable',
      clickRateTrend: 'stable',
      lifetimeOpenRate: 66.7,
      lifetimeClickRate: 25.0,
      lifetimeReplyRate: 8.3,
    },
    {
      contactId: 'contact-3',
      email: 'mike.johnson@factory.com',
      name: 'Mike Johnson',
      companyName: 'Factory Solutions',
      enrolledCampaigns: ['Equipment Repair'],
      emailsReceived: 20,
      emailsOpened: 3,
      emailsClicked: 1,
      emailsReplied: 0,
      daysSinceLastOpen: 65,
      daysSinceLastClick: 75,
      daysSinceLastReply: 999,
      openRateTrend: 'declining',
      clickRateTrend: 'declining',
      lifetimeOpenRate: 15.0,
      lifetimeClickRate: 5.0,
      lifetimeReplyRate: 0,
    },
  ];
  
  const predictions: ChurnPrediction[] = [];
  
  for (const contact of mockContacts) {
    const prediction = await predictContactChurn(contact);
    predictions.push(prediction);
  }
  
  // Sort by churn risk score (highest first)
  return predictions.sort((a, b) => b.churnRiskScore - a.churnRiskScore);
}

/**
 * Trigger automated reactivation sequence for at-risk contact
 */
export async function triggerReactivationSequence(contactId: string, churnPrediction: ChurnPrediction): Promise<void> {
  console.log(`[ChurnPrediction] Triggering reactivation sequence for ${churnPrediction.email}`);
  console.log(`[ChurnPrediction] Risk Level: ${churnPrediction.churnRiskLevel} (${churnPrediction.churnRiskScore}/100)`);
  console.log(`[ChurnPrediction] Primary Reason: ${churnPrediction.primaryReason}`);
  
  // In production, this would:
  // 1. Create a reactivation email sequence in the drip campaign system
  // 2. Personalize content based on churn reasons
  // 3. Schedule emails with optimal timing
  // 4. Track reactivation success metrics
  
  // Example reactivation sequence:
  // Day 0: "We miss you" email with value reminder
  // Day 3: Special offer or exclusive content
  // Day 7: Survey to understand disengagement
  // Day 14: Final re-engagement attempt
  
  console.log(`[ChurnPrediction] Reactivation sequence scheduled for ${churnPrediction.email}`);
}

/**
 * Get churn statistics for dashboard
 */
export async function getChurnStatistics(): Promise<{
  totalContacts: number;
  atRiskContacts: number;
  criticalRiskContacts: number;
  highRiskContacts: number;
  reactivationRate: number;
  avgChurnScore: number;
}> {
  // In production, calculate from actual database
  return {
    totalContacts: 1250,
    atRiskContacts: 187,
    criticalRiskContacts: 42,
    highRiskContacts: 89,
    reactivationRate: 34.5, // % of at-risk contacts successfully reactivated
    avgChurnScore: 28.3,
  };
}
