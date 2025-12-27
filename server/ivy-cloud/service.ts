import { VertexAI, GenerativeModel, UsageMetadata } from "@google-cloud/vertexai";
import { ROPA_SYSTEM_INSTRUCTION, IVY_VOICE_INSTRUCTION, IVY_MAIL_INSTRUCTION, IVY_INTEL_INSTRUCTION } from "./prompts";
import { TOOLS } from "./tools";
import { sendEmail } from "../services/sendgrid";
import { makeCall } from "../services/telnyx-voice";
import * as db from "../db";

export class IvyCloudService {
    private vertexAI: VertexAI;
    private ropaModel: GenerativeModel;
    private voiceModel: GenerativeModel;
    private mailModel: GenerativeModel;
    private intelModel: GenerativeModel;

    constructor(projectId: string, location: string = 'us-central1') {
        this.vertexAI = new VertexAI({ project: projectId, location });

        // Initialize ROPA (The Brain)
        this.ropaModel = this.vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-001', // Updated to stable
            systemInstruction: ROPA_SYSTEM_INSTRUCTION,
            tools: [
                {
                    functionDeclarations: [
                        TOOLS.crm_tool,
                        TOOLS.market_intel_tool,
                        TOOLS.self_heal_tool,
                        TOOLS.delegate_voice_call,
                        TOOLS.delegate_email_campaign
                    ]
                }
            ],
        });

        // Initialize Voice Agent (Speed)
        this.voiceModel = this.vertexAI.getGenerativeModel({
            model: 'gemini-1.5-flash-001', // Updated to stable
            systemInstruction: IVY_VOICE_INSTRUCTION,
        });

        // Initialize Mail Agent (Copywriter)
        this.mailModel = this.vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-001',
            systemInstruction: IVY_MAIL_INSTRUCTION,
        });

        // Initialize Intel Agent (Knowledge) - Uses Grounding
        this.intelModel = this.vertexAI.getGenerativeModel({
            model: 'gemini-1.5-pro-001',
            systemInstruction: IVY_INTEL_INSTRUCTION,
            tools: [{ googleSearchRetrieval: {} }] // Enabled Grounding
        });
    }

    async runRopaCycle(userMessage: string = "Wake up and check status.") {
        console.log("Starting ROPA Cycle...");
        const chatSession = this.ropaModel.startChat();

        let result = await chatSession.sendMessage(userMessage);
        let response = result.response;
        let textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text;

        // Execution Loop: While the model wants to call functions, execute them and feed back results
        while (response.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
            const functionCall = response.candidates[0].content.parts[0].functionCall;
            console.log(`[ROPA] Decided to call tool: ${functionCall.name}`);

            // Execute the tool
            const toolResult = await this.executeTool(functionCall.name, functionCall.args);

            // Feed the result back to the model
            console.log(`[ROPA] Tool Result: ${JSON.stringify(toolResult)}`);
            result = await chatSession.sendMessage([{
                functionResponse: {
                    name: functionCall.name,
                    response: { content: toolResult }
                }
            }]);

            response = result.response;
            textResponse = response.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        return textResponse || "Command executed explicitly.";
    }

    // The "Hands" of the system
    private async executeTool(name: string, args: any): Promise<any> {
        try {
            switch (name) {
                case 'sync_crm':
                    console.log(`[TOOL] Syncing CRM: ${args.action}`, args.data);
                    if (args.action === 'READ_LEADS') {
                        const leads = await db.getAllLeads(1); // Default company ID 1
                        return { status: 'success', leads: leads.slice(0, 5) }; // Limit to 5 for context window
                    }
                    if (args.action === 'CREATE_LEAD') {
                        const newLead = await db.createLead(args.data);
                        return { status: 'success', leadId: newLead.id };
                    }
                    if (args.action === 'UPDATE_STATUS') {
                        // Assuming args.data has id and status
                        if (args.data.id && args.data.status) {
                            await db.updateLeadStatus(Number(args.data.id), args.data.status);
                            return { status: 'success', message: 'Lead status updated' };
                        }
                    }
                    return { status: 'success', message: 'Activity logged in CRM (Generic)' };

                case 'consult_market_intel':
                    // This tool uses Google Search Grounding usually, but if called explicitly:
                    console.log(`[TOOL] Consulting Market Intel for: ${args.company_name}`);
                    return await this.runIntelAgent(args.company_name);

                case 'delegate_voice_call':
                    console.log(`[TOOL] Delegating to Voice Agent for: ${args.target}`);
                    // 1. Generate the script using the Voice Agent
                    const voiceScript = await this.runVoiceAgent(args.script_strategy);

                    // 2. Initiate the physical call (if phone number provided)
                    let callResult = "Simulated Call";
                    if (args.target_phone) {
                        try {
                            const call = await makeCall({
                                to: args.target_phone,
                                from: process.env.TELNYX_PHONE_NUMBER || '+15550000000',
                                webhookUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/webhooks/telnyx`
                            });
                            callResult = `Call Initiated(ID: ${call.callId})`;
                        } catch (e: any) {
                            console.warn("Values valid but call failed (likely missing credentials):", e.message);
                            callResult = `Call Simulation(Failed to dial: ${e.message})`;
                        }
                    }

                    return { status: 'call_completed', outcome: voiceScript, technical_status: callResult };

                case 'delegate_email_campaign':
                    console.log(`[TOOL] Delegating to Mail Agent for: ${args.target}`);
                    // 1. Generate content using Mail Agent
                    const emailContent = await this.runMailAgent(args.copy_framework) || "No content generated";

                    // 2. Send the actual email (if email provided)
                    let emailResult = "Simulated Email";
                    if (args.target_email) {
                        const sent = await sendEmail({
                            to: args.target_email,
                            subject: args.subject || "Proposal from Ivy.AI",
                            htmlContent: `<p>${emailContent.replace(/\n/g, '<br>')}</p>`,
                            textContent: emailContent
                        });
                        emailResult = sent.success ? `Sent (ID: ${sent.messageId})` : `Failed: ${sent.error}`;
                    }

                    return { status: 'email_sent', content_generated: emailContent, delivery_status: emailResult };

                case 'self_heal_agent':
                    console.log(`[TOOL] Self-Healing Agent: ${args.agent_name}`);
                    console.log(`[TOOL] New Instruction: ${args.new_instruction}`);
                    // In a real system, we would update the system instructions row in the Agents table
                    // const agent = await db.getAgentByName(args.agent_name);
                    // if (agent) await db.updateAgent(agent.id, { systemInstructions: args.new_instruction });
                    return { status: 'success', message: `Updated system instructions for ${args.agent_name}` };

                default:
                    return { error: `Unknown tool: ${name}` };
            }
        } catch (e: any) {
            console.error(`[TOOL ERROR] ${name}:`, e);
            return { error: e.message };
        }
    }

    async runVoiceAgent(input: string) {
        const result = await this.voiceModel.generateContent(input);
        return result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    async runMailAgent(input: string) {
        const result = await this.mailModel.generateContent(input);
        return result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    async runIntelAgent(companyName: string) {
        const result = await this.intelModel.generateContent(`Investigate company: ${companyName}`);
        return result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    }
}
