/**
 * Ivy-Call - Communication Agent
 * Handles multi-channel communication (Voice, SMS, WhatsApp) via Telnyx
 * Integrated with The Hive orchestrator for campaign automation
 */

import { IvyAgent, AgentType, Department, AgentStatus, TaskInput, TaskResult } from './core';
import { invokeLLM } from '../_core/llm';
import * as db from '../db';

export interface CallTaskInput extends TaskInput {
  type: 'make_call' | 'send_sms' | 'send_whatsapp';
  leadId?: number;
  phoneNumber: string;
  message?: string;
  script?: string;
  campaignId?: string;
}

export interface CallTaskResult extends TaskResult {
  data?: {
    callId?: number;
    smsId?: number;
    whatsappId?: number;
    duration?: number;
    transcript?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    outcome?: string;
    cost?: number;
  };
}

/**
 * Ivy-Call Agent - Multi-channel communication specialist
 * Capabilities:
 * - Automated phone calls with AI conversation
 * - SMS/MMS messaging
 * - WhatsApp Business messaging
 * - Real-time transcription and sentiment analysis
 * - Campaign follow-up automation
 */
export class IvyCall extends IvyAgent {
  constructor() {
    super(
      "Ivy-Call",
      AgentType.CALL,
      Department.SALES,
      [
        "voice_calls",
        "sms_messaging",
        "whatsapp_messaging",
        "ai_conversation",
        "speech_to_text",
        "text_to_speech",
        "sentiment_analysis",
        "campaign_automation"
      ],
      {
        total_calls: 0,
        successful_calls: 0,
        total_sms: 0,
        delivered_sms: 0,
        total_whatsapp: 0,
        positive_interactions: 0,
        leads_contacted: 0,
        conversion_rate: 0
      }
    );
  }

  /**
   * Process task - main entry point for all communication tasks
   */
  protected async _processTask(task: CallTaskInput): Promise<CallTaskResult> {
    switch (task.type) {
      case 'make_call':
        return await this.makeCall(task);
      case 'send_sms':
        return await this.sendSMS(task);
      case 'send_whatsapp':
        return await this.sendWhatsApp(task);
      default:
        return {
          status: "failed",
          error: `Unknown task type: ${task.type}`
        };
    }
  }

  /**
   * Make an automated phone call
   */
  private async makeCall(task: CallTaskInput): Promise<CallTaskResult> {
    try {
      // Get lead context if leadId is provided
      let leadContext: any = null;
      if (task.leadId) {
        leadContext = await db.getLeadById(task.leadId);
      }

      // Generate personalized script using LLM if not provided
      let script = task.script;
      if (!script && leadContext) {
        script = await this.generateCallScript(leadContext);
      }

      // TODO: Integrate with Telnyx Voice API
      // For now, we'll simulate the call
      const simulatedCall = {
        callId: Math.floor(Math.random() * 10000),
        duration: Math.floor(Math.random() * 300) + 60, // 60-360 seconds
        status: 'completed',
        sentiment: 'positive' as const,
        outcome: 'interested',
        cost: 0.05
      };

      // Save call record to database
      const callRecord = await db.createCall({
        companyId: 1, // TODO: Get from context
        leadId: task.leadId,
        direction: 'outbound',
        from: task.phoneNumber,
        to: task.phoneNumber,
        status: 'completed',
        duration: simulatedCall.duration,
        cost: simulatedCall.cost.toString(),
        sentiment: simulatedCall.sentiment,
        outcome: simulatedCall.outcome,
        notes: `Automated call via Ivy-Call. Script: ${script?.substring(0, 100)}...`,
        metadata: { campaignId: task.campaignId }
      });

      return {
        status: "completed",
        data: {
          callId: callRecord.id,
          duration: simulatedCall.duration,
          sentiment: simulatedCall.sentiment,
          outcome: simulatedCall.outcome,
          cost: simulatedCall.cost
        },
        nextActions: [
          simulatedCall.outcome === 'interested' ? 'schedule_demo' : 'schedule_followup'
        ]
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Send SMS message
   */
  private async sendSMS(task: CallTaskInput): Promise<CallTaskResult> {
    try {
      // Get lead context if leadId is provided
      let leadContext: any = null;
      if (task.leadId) {
        leadContext = await db.getLeadById(task.leadId);
      }

      // Generate personalized message using LLM if not provided
      let message = task.message;
      if (!message && leadContext) {
        message = await this.generateSMSMessage(leadContext);
      }

      // TODO: Integrate with Telnyx SMS API
      // For now, we'll simulate the SMS
      const simulatedSMS = {
        smsId: Math.floor(Math.random() * 10000),
        status: 'delivered',
        cost: 0.0025
      };

      // Save SMS record to database
      const smsRecord = await db.createSMS({
        companyId: 1, // TODO: Get from context
        leadId: task.leadId,
        direction: 'outbound',
        from: '+14155551234', // TODO: Get from config
        to: task.phoneNumber,
        body: message || '',
        status: 'delivered',
        cost: simulatedSMS.cost.toString()
      });

      return {
        status: "completed",
        data: {
          smsId: smsRecord.id,
          cost: simulatedSMS.cost
        },
        nextActions: ['track_response']
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Send WhatsApp message
   */
  private async sendWhatsApp(task: CallTaskInput): Promise<CallTaskResult> {
    try {
      // Get lead context if leadId is provided
      let leadContext: any = null;
      if (task.leadId) {
        leadContext = await db.getLeadById(task.leadId);
      }

      // Generate personalized message using LLM if not provided
      let message = task.message;
      if (!message && leadContext) {
        message = await this.generateWhatsAppMessage(leadContext);
      }

      // TODO: Integrate with Telnyx WhatsApp API
      // For now, we'll simulate the WhatsApp message
      const simulatedWhatsApp = {
        whatsappId: Math.floor(Math.random() * 10000),
        status: 'delivered',
        cost: 0.04
      };

      // Save WhatsApp conversation and message to database
      const conversation = await db.createWhatsAppConversation({
        companyId: 1, // TODO: Get from context
        leadId: task.leadId,
        conversationId: `conv_${Date.now()}`,
        phoneNumber: task.phoneNumber,
        status: 'active'
      });

      const whatsappMessage = await db.createWhatsAppMessage({
        conversationId: conversation.id,
        messageSid: `msg_${Date.now()}`,
        direction: 'outbound',
        messageType: 'text',
        body: message,
        status: 'delivered',
        conversationType: 'marketing',
        cost: simulatedWhatsApp.cost.toString()
      });

      return {
        status: "completed",
        data: {
          whatsappId: whatsappMessage.id,
          cost: simulatedWhatsApp.cost
        },
        nextActions: ['track_response']
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Generate personalized call script using LLM
   */
  private async generateCallScript(leadContext: any): Promise<string> {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `Eres Ivy-Call, un agente de ventas profesional de Ivy.AI. 
          Genera un script de llamada telefónica personalizado y natural para hacer seguimiento a un lead.
          El script debe ser breve (máximo 2 minutos), profesional y orientado a agendar una demo.`
        },
        {
          role: 'user',
          content: `Lead: ${leadContext.name || 'Prospecto'}
          Empresa: ${leadContext.company || 'No especificada'}
          Interés: ${leadContext.interest || 'Servicios de IA'}
          Estado: ${leadContext.status || 'nuevo'}
          
          Genera un script de llamada personalizado.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    return response.choices[0].message.content || 'Script no disponible';
  }

  /**
   * Generate personalized SMS message using LLM
   */
  private async generateSMSMessage(leadContext: any): Promise<string> {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `Eres Ivy-Call, un agente de ventas de Ivy.AI. 
          Genera un mensaje SMS breve (máximo 160 caracteres) y profesional para hacer seguimiento a un lead.`
        },
        {
          role: 'user',
          content: `Lead: ${leadContext.name || 'Prospecto'}
          Empresa: ${leadContext.company || 'No especificada'}
          
          Genera un SMS de seguimiento.`
        }
      ],
      temperature: 0.7,
      max_tokens: 50
    });

    return response.choices[0].message.content || 'Hola, soy Ivy de Ivy.AI. ¿Podemos agendar una demo?';
  }

  /**
   * Generate personalized WhatsApp message using LLM
   */
  private async generateWhatsAppMessage(leadContext: any): Promise<string> {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `Eres Ivy-Call, un agente de ventas de Ivy.AI. 
          Genera un mensaje de WhatsApp profesional y amigable para hacer seguimiento a un lead.
          Máximo 300 caracteres.`
        },
        {
          role: 'user',
          content: `Lead: ${leadContext.name || 'Prospecto'}
          Empresa: ${leadContext.company || 'No especificada'}
          Interés: ${leadContext.interest || 'Servicios de IA'}
          
          Genera un mensaje de WhatsApp de seguimiento.`
        }
      ],
      temperature: 0.7,
      max_tokens: 100
    });

    return response.choices[0].message.content || 'Hola, soy Ivy de Ivy.AI. ¿Te gustaría conocer cómo podemos ayudar a tu empresa?';
  }

  /**
   * Update KPIs based on task result
   */
  protected async _updateKPIs(result: CallTaskResult): Promise<void> {
    if (!this.id) return;

    if (result.status === "completed" && result.data) {
      // Update call KPIs
      if (result.data.callId) {
        this.kpis.total_calls = (this.kpis.total_calls || 0) + 1;
        if (result.data.outcome === 'interested') {
          this.kpis.successful_calls = (this.kpis.successful_calls || 0) + 1;
        }
        if (result.data.sentiment === 'positive') {
          this.kpis.positive_interactions = (this.kpis.positive_interactions || 0) + 1;
        }
      }

      // Update SMS KPIs
      if (result.data.smsId) {
        this.kpis.total_sms = (this.kpis.total_sms || 0) + 1;
        this.kpis.delivered_sms = (this.kpis.delivered_sms || 0) + 1;
      }

      // Update WhatsApp KPIs
      if (result.data.whatsappId) {
        this.kpis.total_whatsapp = (this.kpis.total_whatsapp || 0) + 1;
      }

      // Update leads contacted
      this.kpis.leads_contacted = (this.kpis.leads_contacted || 0) + 1;

      // Calculate conversion rate
      if (this.kpis.total_calls > 0) {
        this.kpis.conversion_rate = (this.kpis.successful_calls / this.kpis.total_calls) * 100;
      }

      // Save updated KPIs to database
      await db.updateAgentKPIs(this.id, this.kpis);
    }
  }

  /**
   * Send message to another agent
   */
  async sendMessageToAgent(toAgentType: string, message: string, context: any): Promise<void> {
    if (!this.id) {
      throw new Error("Agent not initialized");
    }

    // TODO: Implement agent communication logging if needed
    // await db.createAgentCommunication({ ... });
  }
}
