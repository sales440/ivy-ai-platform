/**
 * Predictive Analytics Service
 * Machine Learning for campaign success prediction
 */

export interface CampaignFeatures {
  // Campaign characteristics
  channelType: "email" | "phone" | "sms" | "social_media";
  targetAudienceSize: number;
  industryType: string;
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
  seasonality: number; // 1-4 (quarters)
  
  // Historical performance
  previousCampaignSuccessRate?: number;
  companyEngagementHistory?: number;
  
  // Content features
  subjectLineLength?: number;
  hasPersonalization: boolean;
  hasUrgency: boolean;
  hasCallToAction: boolean;
  contentSentimentScore?: number; // -1 to 1
}

export interface PredictionResult {
  successProbability: number; // 0-1
  expectedConversionRate: number; // 0-100
  expectedRevenue: number;
  confidence: number; // 0-1
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
}

export interface TrainingData {
  features: CampaignFeatures;
  outcome: {
    conversions: number;
    impressions: number;
    revenue: number;
  };
}

/**
 * Simple Linear Regression Model
 * In production, you'd use TensorFlow.js or similar
 */
class CampaignPredictionModel {
  private weights: Map<string, number> = new Map();
  private bias: number = 0;
  private trainingHistory: TrainingData[] = [];
  private isTrainedFlag: boolean = false;

  constructor() {
    // Initialize with reasonable defaults based on industry knowledge
    this.weights.set("email", 0.7);
    this.weights.set("phone", 0.5);
    this.weights.set("sms", 0.6);
    this.weights.set("social_media", 0.4);
    this.weights.set("audienceSize", 0.0001);
    this.weights.set("timeOfDay", 0.02);
    this.weights.set("hasPersonalization", 0.15);
    this.weights.set("hasUrgency", 0.1);
    this.weights.set("hasCallToAction", 0.2);
    this.weights.set("previousSuccess", 0.3);
    this.bias = 0.2;
  }

  /**
   * Convert features to numerical vector
   */
  private featuresToVector(features: CampaignFeatures): number[] {
    const vector: number[] = [];
    
    // Channel encoding (one-hot)
    vector.push(features.channelType === "email" ? 1 : 0);
    vector.push(features.channelType === "phone" ? 1 : 0);
    vector.push(features.channelType === "sms" ? 1 : 0);
    vector.push(features.channelType === "social_media" ? 1 : 0);
    
    // Numerical features (normalized)
    vector.push(Math.min(features.targetAudienceSize / 10000, 1));
    vector.push(features.timeOfDay / 24);
    vector.push(features.dayOfWeek / 7);
    vector.push(features.seasonality / 4);
    
    // Boolean features
    vector.push(features.hasPersonalization ? 1 : 0);
    vector.push(features.hasUrgency ? 1 : 0);
    vector.push(features.hasCallToAction ? 1 : 0);
    
    // Historical features
    vector.push(features.previousCampaignSuccessRate || 0.5);
    vector.push(features.companyEngagementHistory || 0.5);
    
    // Content features
    vector.push((features.subjectLineLength || 50) / 100);
    vector.push((features.contentSentimentScore || 0) / 2 + 0.5); // Normalize -1,1 to 0,1
    
    return vector;
  }

  /**
   * Predict success probability
   */
  predict(features: CampaignFeatures): number {
    const vector = this.featuresToVector(features);
    
    let score = this.bias;
    
    // Simple weighted sum
    score += vector[0] * (this.weights.get("email") || 0);
    score += vector[1] * (this.weights.get("phone") || 0);
    score += vector[2] * (this.weights.get("sms") || 0);
    score += vector[3] * (this.weights.get("social_media") || 0);
    score += vector[4] * (this.weights.get("audienceSize") || 0);
    score += vector[5] * (this.weights.get("timeOfDay") || 0);
    score += vector[8] * (this.weights.get("hasPersonalization") || 0);
    score += vector[9] * (this.weights.get("hasUrgency") || 0);
    score += vector[10] * (this.weights.get("hasCallToAction") || 0);
    score += vector[11] * (this.weights.get("previousSuccess") || 0);
    
    // Sigmoid activation to get probability
    return 1 / (1 + Math.exp(-score));
  }

  /**
   * Train model with new data
   */
  train(data: TrainingData[]): void {
    this.trainingHistory.push(...data);
    
    // Simple gradient descent (simplified for demo)
    const learningRate = 0.01;
    const epochs = 100;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const sample of data) {
        const predicted = this.predict(sample.features);
        const actual = sample.outcome.conversions / sample.outcome.impressions;
        const error = actual - predicted;
        
        // Update weights (simplified)
        const vector = this.featuresToVector(sample.features);
        
        if (sample.features.channelType === "email") {
          this.weights.set("email", (this.weights.get("email") || 0) + learningRate * error * vector[0]);
        }
        if (sample.features.hasPersonalization) {
          this.weights.set("hasPersonalization", (this.weights.get("hasPersonalization") || 0) + learningRate * error);
        }
        
        this.bias += learningRate * error;
      }
    }
    
    this.isTrainedFlag = true;
  }

  /**
   * Get model confidence based on training data size
   */
  getConfidence(): number {
    const dataPoints = this.trainingHistory.length;
    
    if (dataPoints === 0) return 0.3; // Low confidence with no training
    if (dataPoints < 10) return 0.5;
    if (dataPoints < 50) return 0.7;
    if (dataPoints < 100) return 0.85;
    return 0.95;
  }

  isTrained(): boolean {
    return this.isTrainedFlag;
  }

  getTrainingDataSize(): number {
    return this.trainingHistory.length;
  }
}

// Singleton model instance
const model = new CampaignPredictionModel();

/**
 * Predict campaign success
 */
export function predictCampaignSuccess(features: CampaignFeatures): PredictionResult {
  const successProbability = model.predict(features);
  const confidence = model.getConfidence();
  
  // Calculate expected metrics
  const baseConversionRate = successProbability * 5; // 0-5% range
  const expectedConversionRate = Math.min(baseConversionRate, 100);
  
  // Estimate revenue (assuming $50 average per conversion)
  const expectedConversions = features.targetAudienceSize * (expectedConversionRate / 100);
  const expectedRevenue = expectedConversions * 50;
  
  // Determine risk level
  let riskLevel: "low" | "medium" | "high";
  if (successProbability > 0.7) riskLevel = "low";
  else if (successProbability > 0.4) riskLevel = "medium";
  else riskLevel = "high";
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (!features.hasPersonalization) {
    recommendations.push("Agregar personalización para aumentar engagement en 15-20%");
  }
  
  if (!features.hasCallToAction) {
    recommendations.push("Incluir un Call-to-Action claro puede mejorar conversiones en 25%");
  }
  
  if (features.timeOfDay < 8 || features.timeOfDay > 18) {
    recommendations.push("Considerar enviar durante horario laboral (9am-6pm) para mejor respuesta");
  }
  
  if (features.targetAudienceSize < 100) {
    recommendations.push("Audiencia pequeña: considerar expandir segmentación");
  }
  
  if (successProbability < 0.5) {
    recommendations.push("Probabilidad de éxito baja: revisar targeting y contenido antes de lanzar");
  }
  
  if (features.channelType === "email" && (features.subjectLineLength || 0) > 60) {
    recommendations.push("Subject line muy largo: reducir a 40-50 caracteres para mejor open rate");
  }
  
  return {
    successProbability,
    expectedConversionRate,
    expectedRevenue: Math.round(expectedRevenue),
    confidence,
    riskLevel,
    recommendations,
  };
}

/**
 * Train model with historical campaign data
 */
export function trainModel(data: TrainingData[]): { success: boolean; dataPoints: number; confidence: number } {
  model.train(data);
  
  return {
    success: true,
    dataPoints: model.getTrainingDataSize(),
    confidence: model.getConfidence(),
  };
}

/**
 * Get model status
 */
export function getModelStatus(): {
  trained: boolean;
  dataPoints: number;
  confidence: number;
} {
  return {
    trained: model.isTrained(),
    dataPoints: model.getTrainingDataSize(),
    confidence: model.getConfidence(),
  };
}

/**
 * Analyze campaign and suggest improvements
 */
export function analyzeCampaign(features: CampaignFeatures): {
  currentPrediction: PredictionResult;
  optimizedPrediction: PredictionResult;
  improvements: Array<{ change: string; impact: number }>;
} {
  const currentPrediction = predictCampaignSuccess(features);
  
  // Try optimizations
  const improvements: Array<{ change: string; impact: number }> = [];
  
  // Test with personalization
  if (!features.hasPersonalization) {
    const withPersonalization = predictCampaignSuccess({ ...features, hasPersonalization: true });
    const impact = (withPersonalization.successProbability - currentPrediction.successProbability) * 100;
    improvements.push({ change: "Agregar personalización", impact });
  }
  
  // Test with CTA
  if (!features.hasCallToAction) {
    const withCTA = predictCampaignSuccess({ ...features, hasCallToAction: true });
    const impact = (withCTA.successProbability - currentPrediction.successProbability) * 100;
    improvements.push({ change: "Agregar Call-to-Action", impact });
  }
  
  // Test optimal time
  const optimalTimeFeatures = { ...features, timeOfDay: 10, dayOfWeek: 2 }; // Tuesday 10am
  const withOptimalTime = predictCampaignSuccess(optimalTimeFeatures);
  const timeImpact = (withOptimalTime.successProbability - currentPrediction.successProbability) * 100;
  if (timeImpact > 1) {
    improvements.push({ change: "Enviar Martes 10am", impact: timeImpact });
  }
  
  // Create fully optimized version
  const optimizedFeatures: CampaignFeatures = {
    ...features,
    hasPersonalization: true,
    hasCallToAction: true,
    hasUrgency: true,
    timeOfDay: 10,
    dayOfWeek: 2,
  };
  
  const optimizedPrediction = predictCampaignSuccess(optimizedFeatures);
  
  return {
    currentPrediction,
    optimizedPrediction,
    improvements: improvements.sort((a, b) => b.impact - a.impact),
  };
}
