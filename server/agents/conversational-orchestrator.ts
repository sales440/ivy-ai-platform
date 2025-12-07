import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { companies, fagorContacts, fagorCampaignEnrollments } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Simplified Ivy-Orchestrator: Conversational AI Agent
 * 
 * This is a simplified version that works with existing FAGOR tables
 * until the full multi-tenant schema is implemented.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ConversationContext {
  userId: number;
  companyId?: number;
  conversationHistory: ChatMessage[];
}

/**
 * Main function to process natural language commands
 */
export async function processConversationalCommand(
  userMessage: string,
  context: ConversationContext
): Promise<{ response: string; action?: any; updatedContext: ConversationContext }> {
  
  // Add user message to conversation history
  context.conversationHistory.push({
    role: "user",
    content: userMessage,
  });

  // Build system prompt
  const systemPrompt = `You are Ivy-Orchestrator, an AI assistant for the Ivy.AI platform.

You can help with:
1. Creating new companies
2. Managing FAGOR training campaign contacts
3. Monitoring campaign metrics
4. Platform health and status

Current context:
- User ID: ${context.userId}
- Company ID: ${context.companyId || "Not set"}

Be conversational and helpful. Ask clarifying questions when needed.`;

  // Call LLM
  const llmResponse = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      ...context.conversationHistory,
    ],
  });

  const response = llmResponse.choices[0]?.message?.content || "I'm sorry, I couldn't process that request.";

  // Add assistant response to history
  context.conversationHistory.push({
    role: "assistant",
    content: response,
  });

  return {
    response,
    updatedContext: context,
  };
}
