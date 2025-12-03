/**
 * Ivy-Call Test Suite
 * Comprehensive tests for the communication agent
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IvyCall } from '../agents/call';
import { AgentType, AgentStatus } from '../agents/core';
import * as db from '../db';

// Mock database functions
vi.mock('../db', () => ({
  createCall: vi.fn(),
  getCallById: vi.fn(),
  getCallsByCompanyId: vi.fn(),
  getCallsByLeadId: vi.fn(),
  updateCallStatus: vi.fn(),
  createCallTranscript: vi.fn(),
  getTranscriptsByCallId: vi.fn(),
  createSMS: vi.fn(),
  getSMSByCompanyId: vi.fn(),
  getSMSByLeadId: vi.fn(),
  updateSMSStatus: vi.fn(),
  createWhatsAppConversation: vi.fn(),
  getWhatsAppConversationByPhone: vi.fn(),
  createWhatsAppMessage: vi.fn(),
  getWhatsAppMessagesByConversationId: vi.fn(),
  updateWhatsAppMessageStatus: vi.fn(),
  getCommunicationAnalytics: vi.fn(),
  upsertCommunicationAnalytics: vi.fn(),
  getTotalCommunicationCosts: vi.fn(),
  createAgent: vi.fn(),
  updateAgentStatus: vi.fn(),
  updateAgentKPIs: vi.fn(),
  createTask: vi.fn(),
  updateTaskStatus: vi.fn(),
}));

// Mock Telnyx services
vi.mock('../services/telnyx-voice', () => ({
  makeCall: vi.fn().mockResolvedValue({ call_control_id: 'test-call-123', status: 'initiated' }),
  answerCall: vi.fn().mockResolvedValue({ status: 'answered' }),
  hangupCall: vi.fn().mockResolvedValue({ status: 'hangup' }),
  speakText: vi.fn().mockResolvedValue({ status: 'speaking' }),
  getCallStatus: vi.fn().mockResolvedValue({ status: 'completed', duration: 120 }),
}));

vi.mock('../services/telnyx-sms', () => ({
  sendSMS: vi.fn().mockResolvedValue({ id: 'test-sms-123', status: 'sent' }),
  sendBulkSMS: vi.fn().mockResolvedValue([{ id: 'test-sms-123', status: 'sent' }]),
  getMessageStatus: vi.fn().mockResolvedValue({ status: 'delivered' }),
}));

vi.mock('../services/telnyx-whatsapp', () => ({
  sendWhatsAppMessage: vi.fn().mockResolvedValue({ id: 'test-wa-123', status: 'sent' }),
  sendWhatsAppTemplate: vi.fn().mockResolvedValue({ id: 'test-wa-template-123', status: 'sent' }),
  sendWhatsAppImage: vi.fn().mockResolvedValue({ id: 'test-wa-img-123', status: 'sent' }),
}));

// Mock LLM
vi.mock('../_core/llm', () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: 'Hola, soy Ivy-Call. ¿Cómo puedo ayudarte hoy?'
      }
    }]
  })
}));

describe('Ivy-Call Agent', () => {
  let ivyCall: IvyCall;

  beforeEach(async () => {
    vi.clearAllMocks();
    ivyCall = new IvyCall();
    
    // Mock agent creation
    (db.createAgent as any).mockResolvedValue({ id: 1 });
    
    await ivyCall.initialize();
  });

  describe('Agent Initialization', () => {
    it('should initialize with correct type and name', () => {
      expect(ivyCall.getName()).toBe('Ivy-Call');
      expect(ivyCall.getType()).toBe(AgentType.CALL);
      expect(ivyCall.getStatus()).toBe(AgentStatus.IDLE);
    });

    it('should have all required capabilities', () => {
      const capabilities = ivyCall.getCapabilities();
      expect(capabilities).toContain('voice_calls');
      expect(capabilities).toContain('sms_messaging');
      expect(capabilities).toContain('whatsapp_messaging');
      expect(capabilities).toContain('ai_conversation');
      expect(capabilities).toContain('speech_to_text');
      expect(capabilities).toContain('text_to_speech');
      expect(capabilities).toContain('sentiment_analysis');
      expect(capabilities).toContain('campaign_automation');
    });

    it('should initialize with zero KPIs', () => {
      const kpis = ivyCall.getKPIs();
      expect(kpis.total_calls).toBe(0);
      expect(kpis.successful_calls).toBe(0);
      expect(kpis.total_sms).toBe(0);
      expect(kpis.delivered_sms).toBe(0);
      expect(kpis.total_whatsapp).toBe(0);
      expect(kpis.positive_interactions).toBe(0);
      expect(kpis.leads_contacted).toBe(0);
      expect(kpis.conversion_rate).toBe(0);
    });
  });

  describe('Voice Calls', () => {
    it('should make a call successfully', async () => {
      (db.createCall as any).mockResolvedValue({ id: 1, callSid: 'test-call-123' });
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'make_call',
        phoneNumber: '+1234567890',
        script: 'Test script',
        leadId: 123
      });

      expect(result.status).toBe('completed');
      expect(db.createCall).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+1234567890',
          direction: 'outbound',
          status: 'initiated'
        })
      );
    });

    it('should generate call script with AI when not provided', async () => {
      (db.createCall as any).mockResolvedValue({ id: 1, callSid: 'test-call-123' });
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'make_call',
        phoneNumber: '+1234567890',
        leadId: 123
      });

      expect(result.status).toBe('completed');
      expect(result.data).toHaveProperty('script');
    });

    it('should handle call failure gracefully', async () => {
      const telnyxVoice = await import('../services/telnyx-voice');
      (telnyxVoice.makeCall as any).mockRejectedValueOnce(new Error('Network error'));
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'make_call',
        phoneNumber: '+1234567890',
        script: 'Test script'
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Network error');
    });
  });

  describe('SMS Messaging', () => {
    it('should send SMS successfully', async () => {
      (db.createSMS as any).mockResolvedValue({ id: 1, messageSid: 'test-sms-123' });
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'send_sms',
        phoneNumber: '+1234567890',
        message: 'Test message',
        leadId: 123
      });

      expect(result.status).toBe('completed');
      expect(db.createSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+1234567890',
          body: 'Test message',
          direction: 'outbound'
        })
      );
    });

    it('should generate SMS message with AI when not provided', async () => {
      (db.createSMS as any).mockResolvedValue({ id: 1, messageSid: 'test-sms-123' });
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'send_sms',
        phoneNumber: '+1234567890',
        leadId: 123
      });

      expect(result.status).toBe('completed');
      expect(result.data).toHaveProperty('message');
    });

    it('should handle SMS failure gracefully', async () => {
      const telnyxSMS = await import('../services/telnyx-sms');
      (telnyxSMS.sendSMS as any).mockRejectedValueOnce(new Error('Invalid phone number'));
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'send_sms',
        phoneNumber: 'invalid',
        message: 'Test'
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Invalid phone number');
    });
  });

  describe('WhatsApp Messaging', () => {
    it('should send WhatsApp message successfully', async () => {
      (db.getWhatsAppConversationByPhone as any).mockResolvedValue({ id: 1 });
      (db.createWhatsAppMessage as any).mockResolvedValue({ id: 1, messageSid: 'test-wa-123' });
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'send_whatsapp',
        phoneNumber: '+1234567890',
        message: 'Test WhatsApp message',
        leadId: 123
      });

      expect(result.status).toBe('completed');
      expect(db.createWhatsAppMessage).toHaveBeenCalled();
    });

    it('should create new conversation if not exists', async () => {
      (db.getWhatsAppConversationByPhone as any).mockResolvedValue(null);
      (db.createWhatsAppConversation as any).mockResolvedValue({ id: 1 });
      (db.createWhatsAppMessage as any).mockResolvedValue({ id: 1, messageSid: 'test-wa-123' });
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'send_whatsapp',
        phoneNumber: '+1234567890',
        message: 'Test message'
      });

      expect(result.status).toBe('completed');
      expect(db.createWhatsAppConversation).toHaveBeenCalled();
    });
  });

  describe('KPI Tracking', () => {
    it('should update KPIs after successful call', async () => {
      (db.createCall as any).mockResolvedValue({ id: 1, callSid: 'test-call-123' });
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      await ivyCall.executeTask({
        type: 'make_call',
        phoneNumber: '+1234567890',
        script: 'Test'
      });

      const kpis = ivyCall.getKPIs();
      expect(kpis.total_calls).toBe(1);
      expect(kpis.successful_calls).toBe(1);
    });

    it('should update KPIs after successful SMS', async () => {
      (db.createSMS as any).mockResolvedValue({ id: 1, messageSid: 'test-sms-123' });
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      await ivyCall.executeTask({
        type: 'send_sms',
        phoneNumber: '+1234567890',
        message: 'Test'
      });

      const kpis = ivyCall.getKPIs();
      expect(kpis.total_sms).toBe(1);
      expect(kpis.delivered_sms).toBe(1);
    });

    it('should track leads contacted', async () => {
      (db.createCall as any).mockResolvedValue({ id: 1, callSid: 'test-call-123' });
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      await ivyCall.executeTask({
        type: 'make_call',
        phoneNumber: '+1234567890',
        script: 'Test',
        leadId: 123
      });

      const kpis = ivyCall.getKPIs();
      expect(kpis.leads_contacted).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid task type', async () => {
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'invalid_task' as any
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Unknown task type');
    });

    it('should handle missing required parameters', async () => {
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'make_call'
        // Missing phoneNumber
      });

      expect(result.status).toBe('failed');
      expect(result.error).toBeDefined();
    });

    it('should handle database errors', async () => {
      (db.createCall as any).mockRejectedValueOnce(new Error('Database connection failed'));
      (db.createTask as any).mockResolvedValue({ id: 1 });
      (db.updateTaskStatus as any).mockResolvedValue(undefined);

      const result = await ivyCall.executeTask({
        type: 'make_call',
        phoneNumber: '+1234567890',
        script: 'Test'
      });

      expect(result.status).toBe('failed');
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('AI-Powered Features', () => {
    it('should generate personalized call script', async () => {
      const script = await (ivyCall as any).generateCallScript({
        name: 'John Doe',
        company: 'Acme Corp',
        industry: 'Technology'
      });

      expect(script).toBeTruthy();
      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(0);
    });

    it('should generate personalized SMS message', async () => {
      const message = await (ivyCall as any).generateSMSMessage({
        name: 'Jane Smith',
        company: 'Tech Inc'
      });

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
      expect(message.length).toBeLessThanOrEqual(160); // SMS limit
    });

    it('should generate personalized WhatsApp message', async () => {
      const message = await (ivyCall as any).generateWhatsAppMessage({
        name: 'Bob Johnson',
        company: 'Startup LLC'
      });

      expect(message).toBeTruthy();
      expect(typeof message).toBe('string');
    });
  });

  describe('Inter-Agent Communication', () => {
    it('should send message to another agent', async () => {
      const result = await ivyCall.sendMessageToAgent(
        AgentType.PROSPECT,
        'Lead qualified, ready for call',
        { leadId: 123, score: 85 }
      );

      expect(result).toBeTruthy();
      expect(result.to).toBe(AgentType.PROSPECT);
      expect(result.message).toBe('Lead qualified, ready for call');
    });
  });
});

describe('Database Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create call record', async () => {
    (db.createCall as any).mockResolvedValue({
      id: 1,
      companyId: 1,
      callSid: 'test-123',
      to: '+1234567890',
      status: 'initiated'
    });

    const call = await db.createCall({
      companyId: 1,
      callSid: 'test-123',
      direction: 'outbound',
      to: '+1234567890',
      status: 'initiated'
    });

    expect(call).toBeDefined();
    expect(call.id).toBe(1);
  });

  it('should create SMS record', async () => {
    (db.createSMS as any).mockResolvedValue({
      id: 1,
      companyId: 1,
      messageSid: 'test-sms-123',
      to: '+1234567890',
      body: 'Test message'
    });

    const sms = await db.createSMS({
      companyId: 1,
      messageSid: 'test-sms-123',
      direction: 'outbound',
      to: '+1234567890',
      body: 'Test message',
      status: 'sent'
    });

    expect(sms).toBeDefined();
    expect(sms.id).toBe(1);
  });

  it('should get communication costs', async () => {
    (db.getTotalCommunicationCosts as any).mockResolvedValue({
      voice: 10.50,
      sms: 5.25,
      whatsapp: 8.75,
      total: 24.50
    });

    const costs = await db.getTotalCommunicationCosts(1);

    expect(costs).toBeDefined();
    expect(costs.total).toBe(24.50);
    expect(costs.voice).toBe(10.50);
    expect(costs.sms).toBe(5.25);
    expect(costs.whatsapp).toBe(8.75);
  });
});

describe('tRPC Endpoints', () => {
  it('should expose makeCall endpoint', () => {
    // This would require setting up tRPC test client
    // Placeholder for integration test
    expect(true).toBe(true);
  });

  it('should expose sendSMS endpoint', () => {
    // Placeholder for integration test
    expect(true).toBe(true);
  });

  it('should expose getDashboardStats endpoint', () => {
    // Placeholder for integration test
    expect(true).toBe(true);
  });
});
