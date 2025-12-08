/**
 * Predictive Analytics Capability
 * 
 * Uses historical data to forecast future performance trends.
 * Implements linear regression for conversion forecasting.
 */

import { getDb } from "../../db";
import { sql } from "drizzle-orm";

export interface PredictionResult {
    agentId: string;
    metric: string;
    currentValue: number;
    predictedValue: number; // Predicted value for next period (e.g., next 30 days)
    trend: "up" | "down" | "stable";
    confidence: number; // 0-100
    recommendation?: string;
}

/**
 * Predict future performance for all agents
 */
export async function predictAllAgentsPerformance(): Promise<PredictionResult[]> {
    console.log("[Predictive Vision] Forecasting performance for all agents...");

    const db = await getDb();
    if (!db) return [];

    try {
        const agentsResult = await db.execute("SELECT id, name FROM agents WHERE status = 'active'");
        const agents = agentsResult.rows as any[];

        const predictions: PredictionResult[] = [];

        for (const agent of agents) {
            const prediction = await forecastAgentConversions(agent.id);
            if (prediction) {
                predictions.push(prediction);
            }
        }

        return predictions;
    } catch (error) {
        console.error("[Predictive Vision] Failed to predict performance:", error);
        return [];
    }
}

/**
 * Forecast conversions for a specific agent using Linear Regression
 */
async function forecastAgentConversions(agentId: string): Promise<PredictionResult | null> {
    const db = await getDb();
    if (!db) return null;

    try {
        // Get daily conversions for the last 60 days
        const result = await db.execute(
            `SELECT 
         DATE(respondedAt) as date,
         COUNT(*) as conversions
       FROM fagorCampaignEnrollments
       WHERE agentId = ? 
       AND respondedAt >= DATE_SUB(NOW(), INTERVAL 60 DAY)
       GROUP BY DATE(respondedAt)
       ORDER BY date ASC`,
            [agentId]
        );

        const rows = result.rows as any[];
        if (rows.length < 10) {
            // Not enough data for reliable prediction
            return null;
        }

        // Prepare data for regression
        // x = day index (0 to 59), y = conversions
        const dataPoints = rows.map((row, index) => ({
            x: index,
            y: Number(row.conversions)
        }));

        const { slope, intercept, rSquared } = calculateLinearRegression(dataPoints);

        // Predict next 30 days (indices 60 to 89)
        const currentAvg = dataPoints.reduce((sum, p) => sum + p.y, 0) / dataPoints.length;

        // Forecast total conversions for next 30 days
        let predictedTotal = 0;
        for (let i = 60; i < 90; i++) {
            const predictedDaily = slope * i + intercept;
            predictedTotal += Math.max(0, predictedDaily); // Cannot have negative conversions
        }

        // Current 30-day run rate (approximate)
        const currentRunRate = currentAvg * 30;

        const trend = slope > 0.05 ? "up" : slope < -0.05 ? "down" : "stable";

        let recommendation;
        if (trend === "down" && rSquared > 0.3) {
            recommendation = "Alert: Conversion trend is declining. Consider revising email templates or targeting criteria.";
        } else if (trend === "up") {
            recommendation = "Positive trend detected. Recommend scaling up campaign volume.";
        }

        return {
            agentId,
            metric: "30-day Conversions",
            currentValue: Math.round(currentRunRate),
            predictedValue: Math.round(predictedTotal),
            trend,
            confidence: Math.round(rSquared * 100), // R-squared as proxy for confidence
            recommendation
        };

    } catch (error) {
        console.error(`[Predictive Vision] Error forecasting for agent ${agentId}:`, error);
        return null;
    }
}

/**
 * Simple Linear Regression Implementation
 * y = mx + b
 */
function calculateLinearRegression(data: { x: number, y: number }[]) {
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const point of data) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const meanY = sumY / n;
    let ssTot = 0;
    let ssRes = 0;

    for (const point of data) {
        const predictedY = slope * point.x + intercept;
        ssTot += Math.pow(point.y - meanY, 2);
        ssRes += Math.pow(point.y - predictedY, 2);
    }

    const rSquared = 1 - (ssRes / ssTot);

    return { slope, intercept, rSquared };
}
