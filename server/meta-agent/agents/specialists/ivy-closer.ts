
import { BaseAgent } from "../base-agent";


export class IvyCloser extends BaseAgent {
    constructor() {
        super("ivy-closer", "Ivy-Closer", "Sales Negotiator");

        // Tools specific to closing
        this.registerTool({
            name: "send_whatsapp",
            description: "Send a sales message via WhatsApp",
            parameters: { to: "string", body: "string" },
            handler: async (args) => {
                const { sendMessage } = await import("../../capabilities/omni-channel");
                // Use the simulation-ready capability
                return await sendMessage({ to: args.to, body: args.body, channel: "whatsapp" });
            }
        });

        this.registerTool({
            name: "send_template",
            description: "Send an approved HSM Template",
            parameters: { to: "string", templateSid: "string", variables: "object" },
            handler: async (args) => {
                const { sendTemplate } = await import("../../capabilities/omni-channel");
                return await sendTemplate(args.to, args.templateSid, args.variables);
            }
        });
    }

    protected buildSystemPrompt(goal: string, memories: string[]): string {
        return `
You are Ivy-Closer, a specialized AI agent focused on Closing Deals and Client Communication.
Your goal is to engage leads persuasively and move them through the sales funnel.

CONTEXT:
${memories.join('\n')}

TOOLS AVAILABLE:
- send_whatsapp(to, body): Direct message.
- send_template(to, sid, vars): Formal outreach.
- query_memory(query): Recall client context.

INSTRUCTIONS:
1. Analyze the goal: "${goal}"
2. Craft high-converting messages.
3. Be empathetic, professional, and persuasive.
4. Always respect opt-outs.
`;
    }
}
