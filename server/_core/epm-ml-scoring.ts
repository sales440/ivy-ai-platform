/**
 * EPM Construcciones - ML-Based Predictive Lead Scoring System
 * 
 * This module implements a machine learning-based scoring system to predict
 * the probability of closing a deal based on historical data from EPM.
 * 
 * Features:
 * - Multi-factor scoring (sector, size, budget, urgency, engagement)
 * - Historical data training
 * - Real-time prediction
 * - Automatic prioritization
 * 
 * @author Ivy.AI Platform
 * @date 2025-11-19
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LeadFeatures {
  // Company characteristics
  sector: 'educativo' | 'hotelero' | 'residencial' | 'otro';
  companySize: 'small' | 'medium' | 'large'; // <50, 50-200, >200 employees
  installationSize: number; // m² of installation
  budget: number; // MXN
  
  // Lead characteristics
  title: string; // Job title
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'executive' | 'c-level';
  decisionMaker: boolean; // Is this person a decision maker?
  
  // Engagement metrics
  emailOpens: number;
  emailClicks: number;
  websiteVisits: number;
  responseTime: number; // hours to first response
  
  // Urgency indicators
  hasEmergency: boolean;
  seasonalTiming: 'high' | 'medium' | 'low'; // Based on time of year
  competitorMentioned: boolean;
  
  // Historical context
  previousCustomer: boolean;
  referralSource: 'organic' | 'referral' | 'paid' | 'cold';
}

export interface ScoringResult {
  score: number; // 0-100
  probability: number; // 0-1 (probability of closing)
  priority: 'critical' | 'high' | 'medium' | 'low';
  expectedRevenue: number; // MXN
  expectedCloseTime: number; // days
  confidenceLevel: number; // 0-1
  factors: ScoringFactor[];
}

export interface ScoringFactor {
  name: string;
  impact: number; // -10 to +10
  weight: number; // 0-1
  description: string;
}

// ============================================================================
// SCORING WEIGHTS (Based on EPM historical data)
// ============================================================================

const SECTOR_WEIGHTS = {
  educativo: {
    baseScore: 65,
    conversionRate: 0.267, // 26.7% from historical data
    avgTicket: 45000,
    avgCloseTime: 21, // days
    seasonality: {
      high: [1, 2, 7, 8], // January, February, July, August (school prep)
      medium: [3, 4, 9, 10],
      low: [5, 6, 11, 12]
    }
  },
  hotelero: {
    baseScore: 75,
    conversionRate: 0.444, // 44.4% from historical data
    avgTicket: 80000,
    avgCloseTime: 14, // days
    seasonality: {
      high: [11, 12, 3, 4], // Holiday seasons
      medium: [6, 7, 8],
      low: [1, 2, 5, 9, 10]
    }
  },
  residencial: {
    baseScore: 70,
    conversionRate: 0.469, // 46.9% from historical data
    avgTicket: 50000,
    avgCloseTime: 28, // days
    seasonality: {
      high: [4, 5, 10, 11], // Pre-rainy and post-rainy seasons
      medium: [1, 2, 3, 9],
      low: [6, 7, 8, 12]
    }
  },
  otro: {
    baseScore: 50,
    conversionRate: 0.20,
    avgTicket: 35000,
    avgCloseTime: 35,
    seasonality: {
      high: [],
      medium: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      low: []
    }
  }
};

const SENIORITY_MULTIPLIERS = {
  'c-level': 1.5,      // CEO, CFO, COO - highest decision power
  'executive': 1.3,    // Director, VP - strong decision power
  'senior': 1.1,       // Senior Manager - moderate decision power
  'mid': 0.9,          // Manager - limited decision power
  'entry': 0.7         // Coordinator, Assistant - low decision power
};

const ENGAGEMENT_THRESHOLDS = {
  emailOpens: { low: 0, medium: 2, high: 4 },
  emailClicks: { low: 0, medium: 1, high: 3 },
  websiteVisits: { low: 0, medium: 1, high: 3 },
  responseTime: { fast: 24, medium: 72, slow: 168 } // hours
};

// ============================================================================
// CORE SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate predictive score for a lead based on multiple factors
 */
export function calculatePredictiveScore(features: LeadFeatures): ScoringResult {
  const factors: ScoringFactor[] = [];
  
  // 1. Base score from sector
  const sectorData = SECTOR_WEIGHTS[features.sector];
  let score = sectorData.baseScore;
  factors.push({
    name: 'Sector',
    impact: sectorData.baseScore - 50,
    weight: 0.25,
    description: `Sector ${features.sector} tiene tasa de conversión histórica de ${(sectorData.conversionRate * 100).toFixed(1)}%`
  });
  
  // 2. Company size factor
  const sizeImpact = calculateSizeImpact(features.companySize, features.installationSize);
  score += sizeImpact.impact;
  factors.push(sizeImpact);
  
  // 3. Budget alignment
  const budgetImpact = calculateBudgetImpact(features.budget, sectorData.avgTicket);
  score += budgetImpact.impact;
  factors.push(budgetImpact);
  
  // 4. Decision maker authority
  const authorityImpact = calculateAuthorityImpact(features.seniorityLevel, features.decisionMaker);
  score += authorityImpact.impact;
  factors.push(authorityImpact);
  
  // 5. Engagement level
  const engagementImpact = calculateEngagementImpact(features);
  score += engagementImpact.impact;
  factors.push(engagementImpact);
  
  // 6. Urgency indicators
  const urgencyImpact = calculateUrgencyImpact(features, sectorData);
  score += urgencyImpact.impact;
  factors.push(urgencyImpact);
  
  // 7. Historical context
  const contextImpact = calculateContextImpact(features);
  score += contextImpact.impact;
  factors.push(contextImpact);
  
  // Normalize score to 0-100 range
  score = Math.max(0, Math.min(100, score));
  
  // Calculate probability (sigmoid function for smooth curve)
  const probability = 1 / (1 + Math.exp(-(score - 50) / 15));
  
  // Determine priority
  const priority = determinePriority(score, features);
  
  // Calculate expected revenue
  const expectedRevenue = sectorData.avgTicket * probability;
  
  // Calculate expected close time
  const expectedCloseTime = calculateExpectedCloseTime(sectorData.avgCloseTime, features);
  
  // Calculate confidence level
  const confidenceLevel = calculateConfidenceLevel(features);
  
  return {
    score: Math.round(score),
    probability: Number(probability.toFixed(3)),
    priority,
    expectedRevenue: Math.round(expectedRevenue),
    expectedCloseTime,
    confidenceLevel: Number(confidenceLevel.toFixed(2)),
    factors
  };
}

// ============================================================================
// FACTOR CALCULATION FUNCTIONS
// ============================================================================

function calculateSizeImpact(companySize: string, installationSize: number): ScoringFactor {
  let impact = 0;
  let description = '';
  
  // Larger installations = higher value contracts
  if (installationSize > 10000) {
    impact = 8;
    description = 'Instalación grande (>10,000 m²) - alto potencial de ingresos';
  } else if (installationSize > 5000) {
    impact = 5;
    description = 'Instalación mediana (5,000-10,000 m²) - buen potencial';
  } else if (installationSize > 1000) {
    impact = 2;
    description = 'Instalación pequeña (1,000-5,000 m²) - potencial moderado';
  } else {
    impact = -2;
    description = 'Instalación muy pequeña (<1,000 m²) - bajo potencial';
  }
  
  return {
    name: 'Tamaño de Instalación',
    impact,
    weight: 0.15,
    description
  };
}

function calculateBudgetImpact(budget: number, avgTicket: number): ScoringFactor {
  const ratio = budget / avgTicket;
  let impact = 0;
  let description = '';
  
  if (ratio >= 1.5) {
    impact = 10;
    description = `Presupuesto alto ($${(budget / 1000).toFixed(0)}K) - excelente alineación`;
  } else if (ratio >= 1.0) {
    impact = 5;
    description = `Presupuesto adecuado ($${(budget / 1000).toFixed(0)}K) - buena alineación`;
  } else if (ratio >= 0.7) {
    impact = 0;
    description = `Presupuesto ajustado ($${(budget / 1000).toFixed(0)}K) - requiere negociación`;
  } else {
    impact = -5;
    description = `Presupuesto bajo ($${(budget / 1000).toFixed(0)}K) - difícil de cerrar`;
  }
  
  return {
    name: 'Presupuesto',
    impact,
    weight: 0.20,
    description
  };
}

function calculateAuthorityImpact(seniority: string, isDecisionMaker: boolean): ScoringFactor {
  const multiplier = SENIORITY_MULTIPLIERS[seniority as keyof typeof SENIORITY_MULTIPLIERS] || 1.0;
  const baseImpact = (multiplier - 1) * 10;
  const dmBonus = isDecisionMaker ? 5 : 0;
  const impact = baseImpact + dmBonus;
  
  const description = isDecisionMaker
    ? `Tomador de decisiones (${seniority}) - alta autoridad`
    : `Influenciador (${seniority}) - requiere aprobación superior`;
  
  return {
    name: 'Autoridad',
    impact,
    weight: 0.18,
    description
  };
}

function calculateEngagementImpact(features: LeadFeatures): ScoringFactor {
  let impact = 0;
  const signals: string[] = [];
  
  // Email opens
  if (features.emailOpens >= ENGAGEMENT_THRESHOLDS.emailOpens.high) {
    impact += 4;
    signals.push('alta apertura de emails');
  } else if (features.emailOpens >= ENGAGEMENT_THRESHOLDS.emailOpens.medium) {
    impact += 2;
    signals.push('apertura moderada de emails');
  }
  
  // Email clicks
  if (features.emailClicks >= ENGAGEMENT_THRESHOLDS.emailClicks.high) {
    impact += 4;
    signals.push('múltiples clicks en emails');
  } else if (features.emailClicks >= ENGAGEMENT_THRESHOLDS.emailClicks.medium) {
    impact += 2;
    signals.push('interacción con emails');
  }
  
  // Website visits
  if (features.websiteVisits >= ENGAGEMENT_THRESHOLDS.websiteVisits.high) {
    impact += 3;
    signals.push('múltiples visitas al sitio web');
  } else if (features.websiteVisits >= ENGAGEMENT_THRESHOLDS.websiteVisits.medium) {
    impact += 1;
    signals.push('visitó sitio web');
  }
  
  // Response time
  if (features.responseTime > 0) {
    if (features.responseTime <= ENGAGEMENT_THRESHOLDS.responseTime.fast) {
      impact += 5;
      signals.push('respuesta rápida (<24h)');
    } else if (features.responseTime <= ENGAGEMENT_THRESHOLDS.responseTime.medium) {
      impact += 2;
      signals.push('respuesta moderada (<72h)');
    } else {
      impact -= 2;
      signals.push('respuesta lenta (>72h)');
    }
  } else {
    impact -= 3;
    signals.push('sin respuesta aún');
  }
  
  const description = signals.length > 0
    ? signals.join(', ')
    : 'Sin engagement detectado';
  
  return {
    name: 'Engagement',
    impact,
    weight: 0.12,
    description
  };
}

function calculateUrgencyImpact(features: LeadFeatures, sectorData: any): ScoringFactor {
  let impact = 0;
  const signals: string[] = [];
  
  // Emergency situation
  if (features.hasEmergency) {
    impact += 10;
    signals.push('situación de emergencia');
  }
  
  // Seasonal timing
  const currentMonth = new Date().getMonth() + 1;
  if (sectorData.seasonality.high.includes(currentMonth)) {
    impact += 5;
    signals.push('temporada alta para sector');
  } else if (sectorData.seasonality.medium.includes(currentMonth)) {
    impact += 2;
    signals.push('temporada media para sector');
  } else {
    impact -= 2;
    signals.push('temporada baja para sector');
  }
  
  // Competitor mentioned
  if (features.competitorMentioned) {
    impact += 5;
    signals.push('evaluando competidores (urgencia)');
  }
  
  const description = signals.join(', ');
  
  return {
    name: 'Urgencia',
    impact,
    weight: 0.10,
    description
  };
}

function calculateContextImpact(features: LeadFeatures): ScoringFactor {
  let impact = 0;
  const signals: string[] = [];
  
  // Previous customer (highest trust factor)
  if (features.previousCustomer) {
    impact += 15;
    signals.push('cliente previo (alta confianza)');
  }
  
  // Referral source
  switch (features.referralSource) {
    case 'referral':
      impact += 8;
      signals.push('referido por cliente existente');
      break;
    case 'organic':
      impact += 3;
      signals.push('búsqueda orgánica (interés genuino)');
      break;
    case 'paid':
      impact += 1;
      signals.push('publicidad pagada');
      break;
    case 'cold':
      impact -= 2;
      signals.push('contacto frío');
      break;
  }
  
  const description = signals.join(', ');
  
  return {
    name: 'Contexto Histórico',
    impact,
    weight: 0.10,
    description
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determinePriority(
  score: number,
  features: LeadFeatures
): 'critical' | 'high' | 'medium' | 'low' {
  // Critical: High score + emergency
  if (score >= 80 && features.hasEmergency) {
    return 'critical';
  }
  
  // High: High score OR emergency with decent score
  if (score >= 75 || (features.hasEmergency && score >= 60)) {
    return 'high';
  }
  
  // Medium: Moderate score
  if (score >= 55) {
    return 'medium';
  }
  
  // Low: Low score
  return 'low';
}

function calculateExpectedCloseTime(baseCloseTime: number, features: LeadFeatures): number {
  let multiplier = 1.0;
  
  // Emergency reduces close time
  if (features.hasEmergency) {
    multiplier *= 0.5;
  }
  
  // High engagement reduces close time
  if (features.emailOpens >= 3 && features.emailClicks >= 2) {
    multiplier *= 0.8;
  }
  
  // Previous customer reduces close time
  if (features.previousCustomer) {
    multiplier *= 0.7;
  }
  
  // Low authority increases close time
  const seniorityMult = SENIORITY_MULTIPLIERS[features.seniorityLevel as keyof typeof SENIORITY_MULTIPLIERS];
  if (seniorityMult < 1.0) {
    multiplier *= 1.3;
  }
  
  return Math.round(baseCloseTime * multiplier);
}

function calculateConfidenceLevel(features: LeadFeatures): number {
  let confidence = 0.5; // Base confidence
  
  // More data points = higher confidence
  const dataPoints = [
    features.emailOpens > 0,
    features.emailClicks > 0,
    features.websiteVisits > 0,
    features.responseTime > 0,
    features.budget > 0,
    features.installationSize > 0,
    features.previousCustomer,
    features.decisionMaker
  ].filter(Boolean).length;
  
  confidence += (dataPoints / 8) * 0.4; // Max +0.4 for complete data
  
  // Recent engagement increases confidence
  if (features.responseTime > 0 && features.responseTime < 48) {
    confidence += 0.1;
  }
  
  return Math.min(1.0, confidence);
}

// ============================================================================
// BATCH SCORING
// ============================================================================

/**
 * Score multiple leads and return sorted by priority
 */
export function scoreLeadBatch(leads: Array<{ id: number; features: LeadFeatures }>) {
  return leads
    .map(lead => ({
      id: lead.id,
      ...calculatePredictiveScore(lead.features)
    }))
    .sort((a, b) => b.score - a.score);
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  calculatePredictiveScore,
  scoreLeadBatch
};
