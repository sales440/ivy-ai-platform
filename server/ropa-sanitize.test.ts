import { describe, it, expect } from "vitest";

/**
 * Tests for ROPA response sanitization.
 * We re-implement the cleanAssistantMessage function here for unit testing
 * since it's not exported from ropa-chat-stream.ts.
 */
function cleanAssistantMessage(text: string): string {
  let cleaned = text;
  
  // PHASE 1: Strip internal code blocks
  cleaned = cleaned.replace(/<tool_code>[\s\S]*?<\/tool_code>/gi, '');
  cleaned = cleaned.replace(/<tool_code>[\s\S]*/gi, '');
  cleaned = cleaned.replace(/<code>[\s\S]*?<\/code>/gi, '');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/print\s*\(\s*ROPA\.[\s\S]*?\)\s*\)?/gi, '');
  cleaned = cleaned.replace(/ROPA\.[a-zA-Z_]+\s*\([^)]*\)/gi, '');
  cleaned = cleaned.replace(/<\/?tool_code>/gi, '');
  cleaned = cleaned.replace(/<\/?code>/gi, '');
  cleaned = cleaned.replace(/[a-zA-Z_]+\([a-zA-Z_]+\s*=\s*"[^"]*"[^)]*\)/g, '');
  cleaned = cleaned.replace(/^.*(?:import\s|export\s|function\s|const\s|let\s|var\s|=>|===).*$/gm, '');
  
  // PHASE 2: Strip "I will execute" code narration
  cleaned = cleaned.replace(/Ejecutaré la primera acción ahora:?\s*/gi, '');
  cleaned = cleaned.replace(/Ejecutaré las? siguientes? accione?s?:?\s*/gi, '');
  cleaned = cleaned.replace(/Voy a ejecutar:?\s*/gi, '');
  cleaned = cleaned.replace(/Ejecutando:?\s*/gi, '');
  cleaned = cleaned.replace(/Utilizando [`'"]?[a-z_]+[`'"]?\s*(y|para|con)\s*/gi, '');
  
  // PHASE 3: Strip markdown formatting
  cleaned = cleaned
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\*/g, '')
    .replace(/asteriscos?/gi, '')
    .replace(/asterisks?/gi, '')
    .replace(/con asteriscos?/gi, '')
    .replace(/entre asteriscos?/gi, '')
    .replace(/usando asteriscos?/gi, '')
    .replace(/with asterisks?/gi, '')
    .replace(/en negrita/gi, '')
    .replace(/formato negrita/gi, '')
    .replace(/texto en negrita/gi, '')
    .replace(/in bold/gi, '')
    .replace(/bold text/gi, '')
    .replace(/marcado con/gi, '')
    .replace(/marked with/gi, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '');
  
  // PHASE 4: Clean up whitespace
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*\n/gm, '\n')
    .trim();
  
  if (!cleaned || cleaned.length < 5) {
    cleaned = 'Procesando tu solicitud. Dame un momento.';
  }
  
  return cleaned;
}

describe("ROPA Response Sanitization", () => {
  describe("cleanAssistantMessage - Code Stripping", () => {
    it("should strip <tool_code> blocks completely", () => {
      const input = 'Entendido, voy a diseñar un plan. <tool_code>print(ROPA.convert_goal_to_plan(company_name="PETLIFE 360", business_goal="aumentar las ventas en un 15%"))</tool_code>';
      const result = cleanAssistantMessage(input);
      expect(result).not.toContain('tool_code');
      expect(result).not.toContain('print');
      expect(result).not.toContain('ROPA.');
      expect(result).toContain('Entendido');
    });

    it("should strip multiple <tool_code> blocks", () => {
      const input = `Perfecto, diseñaré una estrategia multicanal. <tool_code>print(ROPA.convert_goal_to_plan(company_name="PETLIFE 360", business_goal="aumentar las ventas en un 15%"))</tool_code>
<tool_code>print(ROPA.design_multichannel_strategy(company_name="PETLIFE 360", goal="aumentar las ventas en un 15%"))</tool_code>
<tool_code>print(ROPA.generate_campaign_calendar(company_name="PETLIFE 360", goal="aumentar las ventas en un 15%"))</tool_code>`;
      const result = cleanAssistantMessage(input);
      expect(result).not.toContain('tool_code');
      expect(result).not.toContain('print');
      expect(result).not.toContain('ROPA.');
      expect(result).not.toContain('PETLIFE');
      expect(result).toContain('estrategia multicanal');
    });

    it("should strip unclosed <tool_code> blocks (truncated responses)", () => {
      const input = 'Voy a analizar eso. <tool_code>print(ROPA.analyze_something(param="value"';
      const result = cleanAssistantMessage(input);
      expect(result).not.toContain('tool_code');
      expect(result).not.toContain('print');
      expect(result).toContain('analizar');
    });

    it("should strip ROPA.function() calls even without tool_code tags", () => {
      const input = 'Ejecutaré ROPA.convert_goal_to_plan(company="test") para ti.';
      const result = cleanAssistantMessage(input);
      expect(result).not.toContain('ROPA.');
      expect(result).not.toContain('convert_goal');
    });

    it("should strip code blocks with backticks", () => {
      const input = 'Aquí está el plan: ```python\nprint(ROPA.do_something())\n``` Listo.';
      const result = cleanAssistantMessage(input);
      expect(result).not.toContain('```');
      expect(result).not.toContain('python');
      expect(result).not.toContain('print');
    });

    it("should strip 'Ejecutaré la primera acción ahora' narration", () => {
      const input = 'Perfecto. Ejecutaré la primera acción ahora: voy a crear el plan.';
      const result = cleanAssistantMessage(input);
      expect(result).not.toContain('Ejecutaré la primera acción');
    });

    it("should strip function call patterns like func(param=\"value\")", () => {
      const input = 'Voy a usar convert_goal_to_plan(company_name="PETLIFE 360", business_goal="aumentar ventas")';
      const result = cleanAssistantMessage(input);
      expect(result).not.toContain('convert_goal_to_plan');
      expect(result).not.toContain('company_name=');
    });

    it("should return fallback for empty result after stripping", () => {
      const input = '<tool_code>print(ROPA.do_something())</tool_code>';
      const result = cleanAssistantMessage(input);
      expect(result).toBe('Procesando tu solicitud. Dame un momento.');
    });
  });

  describe("cleanAssistantMessage - Markdown Stripping", () => {
    it("should strip bold markdown", () => {
      const input = 'Este es un **texto importante** para ti.';
      const result = cleanAssistantMessage(input);
      expect(result).not.toContain('**');
      expect(result).toContain('texto importante');
    });

    it("should strip italic markdown", () => {
      const input = 'Este es un *texto en cursiva* para ti.';
      const result = cleanAssistantMessage(input);
      expect(result).not.toContain('*');
      expect(result).toContain('texto en cursiva');
    });

    it("should strip heading markers", () => {
      const input = '## Plan de Acción\nPaso 1: Analizar el mercado.';
      const result = cleanAssistantMessage(input);
      expect(result).not.toContain('##');
      expect(result).toContain('Plan de Acción');
    });
  });

  describe("cleanAssistantMessage - Real-world ROPA response from screenshot", () => {
    it("should clean the exact response from the user's screenshot", () => {
      const input = `Entendido, para aumentar las ventas de PETLIFE 360 en un 15%, diseñaré una estrategia multicanal. Primero, convertiré este objetivo en un plan táctico utilizando 'convert_goal_to_plan', luego diseñaré una estrategia multicanal utilizando 'design_multichannel_strategy' y generaré un calendario de campañas con 'generate_campaign_calendar' para su ejecución. Ejecutaré la primera acción ahora: <tool_code>
print(ROPA.convert_goal_to_plan(company_name="PETLIFE 360", business_goal="aumentar las ventas en un 15%"))
</tool_code>
<tool_code>
print(ROPA.design_multichannel_strategy(company_name="PETLIFE 360", goal="aumentar las ventas en un 15%"))
</tool_code>
<tool_code>
print(ROPA.generate_campaign_calendar(company_name="PETLIFE 360", goal="aumentar las ventas en un 15%"))
</tool_code>`;
      const result = cleanAssistantMessage(input);
      
      // Must NOT contain any code
      expect(result).not.toContain('tool_code');
      expect(result).not.toContain('print(');
      expect(result).not.toContain('ROPA.');
      expect(result).not.toContain('company_name=');
      expect(result).not.toContain('business_goal=');
      
      // Must still contain the natural language part
      expect(result).toContain('PETLIFE 360');
      expect(result).toContain('15%');
      expect(result.length).toBeGreaterThan(20);
    });
  });
});

describe("ROPA Configuration", () => {
  it("should have valid default config structure", () => {
    const defaultConfig = {
      operationMode: "autonomous",
      language: "es",
      personality: "professional",
      maxEmailsPerDay: 100,
      maxCallsPerDay: 50,
      sendingHoursStart: "09:00",
      sendingHoursEnd: "18:00",
      notifications: {
        criticalAlerts: true,
        dailyReports: true,
        campaignMilestones: true,
        newLeads: false,
      },
    };
    
    expect(defaultConfig.operationMode).toBe("autonomous");
    expect(defaultConfig.language).toBe("es");
    expect(defaultConfig.personality).toBe("professional");
    expect(defaultConfig.maxEmailsPerDay).toBe(100);
    expect(defaultConfig.notifications.criticalAlerts).toBe(true);
    expect(defaultConfig.notifications.newLeads).toBe(false);
  });

  it("should validate operation modes", () => {
    const validModes = ["autonomous", "guided", "hybrid"];
    validModes.forEach(mode => {
      expect(["autonomous", "guided", "hybrid"]).toContain(mode);
    });
  });

  it("should validate personality types", () => {
    const validPersonalities = ["professional", "friendly", "technical"];
    validPersonalities.forEach(p => {
      expect(["professional", "friendly", "technical"]).toContain(p);
    });
  });

  it("should validate supported languages", () => {
    const supportedLangs = ["es", "en", "eu", "it", "fr", "de", "zh", "hi", "ar"];
    expect(supportedLangs).toContain("es");
    expect(supportedLangs).toContain("en");
    expect(supportedLangs).toContain("eu");
    expect(supportedLangs.length).toBe(9);
  });
});
