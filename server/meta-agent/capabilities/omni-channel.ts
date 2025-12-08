/**
 * Nexus Omni-Channel Capability
 * 
 * Enables Meta-Agent to communicate via WhatsApp and SMS using Twilio.
 * Includes "Simulation Mode" for operation without API keys.
 */

import twilio from 'twilio';

// Environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

// Initialize Twilio client if keys are present
const client = (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN)
    ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

export interface OmniChannelMessage {
    to: string;
    body: string;
    channel: 'sms' | 'whatsapp';
}

/**
 * Send a message via specified channel
 */
export async function sendMessage(message: OmniChannelMessage): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
    console.log(`[Nexus Omni-Channel] Preparing to send ${message.channel} to ${message.to}...`);

    // SIMULATION MODE
    if (!client || !TWILIO_PHONE_NUMBER) {
        console.log("==================================================");
        console.log(`[SIMULATION] 📱 Sending ${message.channel.toUpperCase()}`);
        console.log(`To: ${message.to}`);
        console.log(`Body: "${message.body}"`);
        console.log("==================================================");

        return {
            success: true,
            messageId: `sim_${Date.now()}`,
            simulated: true
        };
    }

    // REAL MODE
    try {
        let from = TWILIO_PHONE_NUMBER;
        let to = message.to;

        if (message.channel === 'whatsapp') {
            from = `whatsapp:${TWILIO_WHATSAPP_NUMBER || TWILIO_PHONE_NUMBER}`;
            to = `whatsapp:${message.to}`;
        }

        const result = await client.messages.create({
            body: message.body,
            from: from,
            to: to
        });

        console.log(`[Nexus Omni-Channel] ✅ Message sent! SID: ${result.sid}`);
        return { success: true, messageId: result.sid, simulated: false };

    } catch (error: any) {
        console.error(`[Nexus Omni-Channel] ❌ Failed to send message:`, error);
        return { success: false };
    }
}

/**
 * Send WhatsApp message (Convenience wrapper)
 */
export async function sendWhatsApp(to: string, body: string) {
    return sendMessage({ to, body, channel: 'whatsapp' });
}

/**
 * Send SMS message (Convenience wrapper)
 */
export async function sendSMS(to: string, body: string) {
    return sendMessage({ to, body, channel: 'sms' });
}
