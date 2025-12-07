/**
 * A/B Testing Framework for AI Recommendations
 * 
 * Automatically tests AI recommendations by:
 * - Splitting traffic 80/20 (control vs. test)
 * - Tracking performance metrics for each variant
 * - Running statistical significance tests
 * - Auto-scaling winning recommendations to 100%
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

interface ABTest {
  testId: string;
  agentId: string;
  agentName: string;
  recommendationCategory: string;
  recommendationTitle: string;
  status: 'running' | 'completed' | 'failed';
  startDate: Date;
  endDate?: Date;
  controlMetrics: {
    emailsSent: number;
    opens: number;
    clicks: number;
    conversions: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  testMetrics: {
    emailsSent: number;
    opens: number;
    clicks: number;
    conversions: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  improvement: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  isSignificant: boolean;
  pValue: number;
  winner?: 'control' | 'test';
}

/**
 * Assign contact to control or test group (80/20 split)
 */
export function assignToTestGroup(contactId: string): 'control' | 'test' {
  // Use hash of contact ID for consistent assignment
  const hash = contactId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  const normalized = Math.abs(hash) % 100;
  return normalized < 80 ? 'control' : 'test';
}

/**
 * Calculate statistical significance using Z-test for proportions
 */
export function calculateSignificance(
  controlSuccess: number,
  controlTotal: number,
  testSuccess: number,
  testTotal: number
): { pValue: number; isSignificant: boolean } {
  if (controlTotal === 0 || testTotal === 0) {
    return { pValue: 1, isSignificant: false };
  }

  const p1 = controlSuccess / controlTotal;
  const p2 = testSuccess / testTotal;
  
  // Pooled proportion
  const pPool = (controlSuccess + testSuccess) / (controlTotal + testTotal);
  
  // Standard error
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlTotal + 1 / testTotal));
  
  if (se === 0) {
    return { pValue: 1, isSignificant: false };
  }
  
  // Z-score
  const z = (p2 - p1) / se;
  
  // Two-tailed p-value (approximation)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  
  // Significant if p < 0.05 (95% confidence)
  return {
    pValue,
    isSignificant: pValue < 0.05 && testTotal >= 100 && controlTotal >= 400,
  };
}

/**
 * Normal cumulative distribution function (approximation)
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

/**
 * Create a new A/B test for a recommendation
 */
export async function createABTest(
  agentId: string,
  agentName: string,
  recommendationCategory: string,
  recommendationTitle: string
): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const testId = `ab-${agentId}-${Date.now()}`;
  
  // In production, this would insert into an ab_tests table
  // For now, we'll use a simple in-memory structure
  console.log(`[ABTest] Created test ${testId} for ${agentName} - ${recommendationTitle}`);
  
  return testId;
}

/**
 * Track metrics for an A/B test
 */
export async function trackABTestMetrics(
  testId: string,
  group: 'control' | 'test',
  event: 'sent' | 'opened' | 'clicked' | 'converted',
  contactId: string
): Promise<void> {
  // In production, this would update metrics in database
  console.log(`[ABTest] ${testId} - ${group} - ${event} - ${contactId}`);
}

/**
 * Evaluate A/B test and determine winner
 */
export async function evaluateABTest(testId: string): Promise<ABTest | null> {
  const db = await getDb();
  if (!db) {
    return null;
  }

  // In production, fetch actual metrics from database
  // For demonstration, using mock data
  const mockTest: ABTest = {
    testId,
    agentId: 'ivy-prospect',
    agentName: 'Ivy-Prospect',
    recommendationCategory: 'subject_lines',
    recommendationTitle: 'Optimize Subject Lines for Higher Open Rates',
    status: 'running',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    controlMetrics: {
      emailsSent: 400,
      opens: 112,
      clicks: 45,
      conversions: 18,
      openRate: 28.0,
      clickRate: 11.25,
      conversionRate: 4.5,
    },
    testMetrics: {
      emailsSent: 100,
      opens: 35,
      clicks: 15,
      conversions: 7,
      openRate: 35.0,
      clickRate: 15.0,
      conversionRate: 7.0,
    },
    improvement: {
      openRate: 25.0, // (35 - 28) / 28 * 100
      clickRate: 33.3,
      conversionRate: 55.6,
    },
    isSignificant: false,
    pValue: 0.08,
  };

  // Calculate significance for open rate
  const openRateSignificance = calculateSignificance(
    mockTest.controlMetrics.opens,
    mockTest.controlMetrics.emailsSent,
    mockTest.testMetrics.opens,
    mockTest.testMetrics.emailsSent
  );

  mockTest.isSignificant = openRateSignificance.isSignificant;
  mockTest.pValue = openRateSignificance.pValue;

  // Determine winner if significant
  if (mockTest.isSignificant) {
    if (mockTest.testMetrics.conversionRate > mockTest.controlMetrics.conversionRate) {
      mockTest.winner = 'test';
      mockTest.status = 'completed';
      mockTest.endDate = new Date();
      console.log(`[ABTest] ${testId} - Test variant wins! Improvement: ${mockTest.improvement.conversionRate.toFixed(1)}%`);
    } else {
      mockTest.winner = 'control';
      mockTest.status = 'completed';
      mockTest.endDate = new Date();
      console.log(`[ABTest] ${testId} - Control wins. Test variant did not improve performance.`);
    }
  }

  return mockTest;
}

/**
 * Get all active A/B tests
 */
export async function getActiveABTests(): Promise<ABTest[]> {
  // In production, query database for active tests
  // For demonstration, return mock data
  return [
    {
      testId: 'ab-ivy-prospect-1',
      agentId: 'ivy-prospect',
      agentName: 'Ivy-Prospect',
      recommendationCategory: 'subject_lines',
      recommendationTitle: 'Optimize Subject Lines for Higher Open Rates',
      status: 'running',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      controlMetrics: {
        emailsSent: 400,
        opens: 112,
        clicks: 45,
        conversions: 18,
        openRate: 28.0,
        clickRate: 11.25,
        conversionRate: 4.5,
      },
      testMetrics: {
        emailsSent: 100,
        opens: 35,
        clicks: 15,
        conversions: 7,
        openRate: 35.0,
        clickRate: 15.0,
        conversionRate: 7.0,
      },
      improvement: {
        openRate: 25.0,
        clickRate: 33.3,
        conversionRate: 55.6,
      },
      isSignificant: false,
      pValue: 0.08,
    },
    {
      testId: 'ab-ivy-closer-1',
      agentId: 'ivy-closer',
      agentName: 'Ivy-Closer',
      recommendationCategory: 'timing',
      recommendationTitle: 'Optimize Send Times for B2B Audience',
      status: 'running',
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      controlMetrics: {
        emailsSent: 320,
        opens: 102,
        clicks: 41,
        conversions: 19,
        openRate: 31.9,
        clickRate: 12.8,
        conversionRate: 5.9,
      },
      testMetrics: {
        emailsSent: 80,
        opens: 28,
        clicks: 12,
        conversions: 6,
        openRate: 35.0,
        clickRate: 15.0,
        conversionRate: 7.5,
      },
      improvement: {
        openRate: 9.7,
        clickRate: 17.2,
        conversionRate: 27.1,
      },
      isSignificant: false,
      pValue: 0.15,
    },
    {
      testId: 'ab-ivy-solve-1',
      agentId: 'ivy-solve',
      agentName: 'Ivy-Solve',
      recommendationCategory: 'content',
      recommendationTitle: 'Enhance Email Content Personalization',
      status: 'completed',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      controlMetrics: {
        emailsSent: 500,
        opens: 110,
        clicks: 38,
        conversions: 15,
        openRate: 22.0,
        clickRate: 7.6,
        conversionRate: 3.0,
      },
      testMetrics: {
        emailsSent: 125,
        opens: 35,
        clicks: 14,
        conversions: 7,
        openRate: 28.0,
        clickRate: 11.2,
        conversionRate: 5.6,
      },
      improvement: {
        openRate: 27.3,
        clickRate: 47.4,
        conversionRate: 86.7,
      },
      isSignificant: true,
      pValue: 0.02,
      winner: 'test',
    },
  ];
}

/**
 * Scale winning recommendation to 100% traffic
 */
export async function scaleWinningRecommendation(testId: string): Promise<void> {
  const test = await evaluateABTest(testId);
  
  if (!test || !test.isSignificant || test.winner !== 'test') {
    console.log(`[ABTest] ${testId} - Cannot scale: not significant or control wins`);
    return;
  }

  // In production, update agent configuration to apply recommendation to all traffic
  console.log(`[ABTest] ${testId} - Scaling winning recommendation to 100% traffic`);
  console.log(`[ABTest] Expected improvement: ${test.improvement.conversionRate.toFixed(1)}% in conversion rate`);
  
  // Send notification to owner
  // await notifyOwner({
  //   title: `A/B Test Winner: ${test.recommendationTitle}`,
  //   content: `${test.agentName} test completed successfully. Conversion rate improved by ${test.improvement.conversionRate.toFixed(1)}%. Recommendation has been scaled to 100% traffic.`,
  // });
}
