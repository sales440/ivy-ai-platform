
import { getDb } from "../db";
import { multiChannelCampaigns, campaignSteps } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";

/**
 * Autonomous Campaign Manager
 * Generates structured campaigns from high-level intents
 */

interface GeneratedStep {
    stepNumber: number;
    delayDays: number;
    channelType: "email" | "linkedin";
    actionType: "send_email" | "generate_linkedin_post";
    actionConfig: {
        emailSequenceId?: number;
        linkedInPostType?: string; // thought_leadership, case_study, etc.
        customMessage?: string;
    };
}

interface GeneratedCampaign {
    name: string;
    description: string;
    targetAudience: "awareness" | "consideration" | "decision";
    steps: GeneratedStep[];
}

/**
 * Generate a campaign from a high-level intent/description
 */
export async function generateCampaignFromIntent(
    intent: string,
    companyId: number,
    userId: number
): Promise<{ success: boolean; campaignId?: number; message?: string }> {
    try {
        const prompt = `
      You are an expert Marketing Strategist AI. 
      Your goal is to design a multi-channel campaign (Email + LinkedIn) based on the user's intent.
      
      User Intent: "${intent}"
      
      Output JSON format:
      {
        "name": "Campaign Name",
        "description": "Short description",
        "targetAudience": "awareness" | "consideration" | "decision",
        "steps": [
          {
            "stepNumber": 1,
            "delayDays": 0,
            "channelType": "linkedin",
            "actionType": "generate_linkedin_post",
            "actionConfig": {
              "linkedInPostType": "thought_leadership"
            }
          },
          {
            "stepNumber": 2,
            "delayDays": 2,
            "channelType": "email",
             "actionType": "send_email",
            "actionConfig": {
              "customMessage": "Follow up on LinkedIn post"
            }
          }
        ]
      }
      
      Rules:
      - Create at least 3 steps.
      - Mix LinkedIn and Email.
      - First step usually has delayDays: 0.
      - Return ONLY raw JSON.
    `;

        const response = await invokeLLM({
            messages: [
                { role: "system", content: "You are a JSON-generating marketing expert." },
                { role: "user", content: prompt }
            ]
        });

        const content = response.choices[0]?.message?.content || "";
        // Clean markdown if present
        const cleanJson = content.replace(/```json/g, "").replace(/```/g, "").trim();

        let campaignData: GeneratedCampaign;
        try {
            campaignData = JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse LLM JSON:", content);
            return { success: false, message: "AI failed to structure the campaign." };
        }

        const db = await getDb();
        if (!db) return { success: false, message: "Database unavailable" };

        // Insert Campaign
        const [campaignResult] = await db.insert(multiChannelCampaigns).values({
            companyId,
            name: campaignData.name,
            description: campaignData.description,
            targetAudience: campaignData.targetAudience,
            status: "draft", // Created as draft for review
            createdBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const campaignId = campaignResult.insertId;

        // Insert Steps
        for (const step of campaignData.steps) {
            await db.insert(campaignSteps).values({
                campaignId,
                stepNumber: step.stepNumber,
                delayDays: step.delayDays,
                channelType: step.channelType,
                actionType: step.actionType,
                actionConfig: JSON.stringify(step.actionConfig),
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        return { success: true, campaignId, message: "Campaign generated successfully" };

    } catch (error) {
        console.error("Autonomous Campaign Generation Error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
    }
}
