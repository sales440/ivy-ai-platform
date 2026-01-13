import { invokeLLM } from "./_core/llm";
import { executeBrowserAction } from "./browserAutomation";

export interface VisionAnalysisResult {
  summary: string;
  detectedElements: string[];
  metrics: Record<string, any>;
  recommendations: string[];
  anomalies: string[];
}

/**
 * Analyze a screenshot using LLM vision capabilities
 */
export async function analyzeScreenshot(
  screenshotPath: string,
  context?: string
): Promise<VisionAnalysisResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are ROPA's vision system. Analyze dashboard screenshots and extract:
1. Key metrics and their values
2. Visual anomalies or issues
3. Actionable recommendations
4. Important UI elements

Return a JSON object with: summary, detectedElements (array), metrics (object), recommendations (array), anomalies (array)`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: context
                ? `Analyze this dashboard screenshot. Context: ${context}`
                : "Analyze this dashboard screenshot and provide insights.",
            },
            {
              type: "image_url",
              image_url: {
                url: `file://${screenshotPath}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "vision_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Brief summary of what's visible" },
              detectedElements: {
                type: "array",
                items: { type: "string" },
                description: "List of detected UI elements",
              },
              metrics: {
                type: "object",
                additionalProperties: true,
                description: "Extracted metrics as key-value pairs",
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
                description: "Actionable recommendations",
              },
              anomalies: {
                type: "array",
                items: { type: "string" },
                description: "Detected issues or anomalies",
              },
            },
            required: ["summary", "detectedElements", "metrics", "recommendations", "anomalies"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from vision model");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("[ROPA Vision] Analysis failed:", error);
    throw error;
  }
}

/**
 * Capture and analyze current dashboard state
 */
export async function analyzeDashboard(url: string, context?: string): Promise<VisionAnalysisResult> {
  // Navigate to URL
  await executeBrowserAction({ type: "navigate", url });

  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Capture screenshot
  const screenshotResult = await executeBrowserAction({ type: "screenshot" });
  if (!screenshotResult.success || !screenshotResult.data?.path) {
    throw new Error("Failed to capture screenshot");
  }

  // Analyze
  return analyzeScreenshot(screenshotResult.data.path, context);
}

/**
 * Compare two screenshots and identify changes
 */
export async function compareScreenshots(
  beforePath: string,
  afterPath: string
): Promise<{ changes: string[]; improvements: string[]; regressions: string[] }> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Compare two dashboard screenshots (before and after) and identify:
1. Changes that occurred
2. Improvements (positive changes)
3. Regressions (negative changes)

Return JSON with: changes (array), improvements (array), regressions (array)`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "BEFORE:" },
            {
              type: "image_url",
              image_url: { url: `file://${beforePath}`, detail: "high" },
            },
            { type: "text", text: "AFTER:" },
            {
              type: "image_url",
              image_url: { url: `file://${afterPath}`, detail: "high" },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "screenshot_comparison",
          strict: true,
          schema: {
            type: "object",
            properties: {
              changes: { type: "array", items: { type: "string" } },
              improvements: { type: "array", items: { type: "string" } },
              regressions: { type: "array", items: { type: "string" } },
            },
            required: ["changes", "improvements", "regressions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No response from vision model");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("[ROPA Vision] Comparison failed:", error);
    throw error;
  }
}

/**
 * Monitor dashboard for specific conditions
 */
export async function monitorForCondition(
  url: string,
  condition: string,
  checkIntervalMs: number = 5000,
  maxChecks: number = 12
): Promise<{ met: boolean; analysis?: VisionAnalysisResult }> {
  for (let i = 0; i < maxChecks; i++) {
    const analysis = await analyzeDashboard(url, `Check if this condition is met: ${condition}`);

    // Ask LLM if condition is met
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are checking if a condition is met based on dashboard analysis. Answer only 'yes' or 'no'.",
        },
        {
          role: "user",
          content: `Condition: ${condition}\n\nDashboard analysis: ${JSON.stringify(analysis)}\n\nIs the condition met?` as string,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const answer = typeof content === 'string' ? content.toLowerCase().trim() : '';
    if (answer?.includes("yes")) {
      return { met: true, analysis };
    }

    if (i < maxChecks - 1) {
      await new Promise((resolve) => setTimeout(resolve, checkIntervalMs));
    }
  }

  return { met: false };
}
