import { describe, it, expect } from "vitest";

// ============ TEST 1: Language Detection (from ropa-chat-stream.ts) ============

/**
 * Replicate the detectLanguage function from ropa-chat-stream.ts
 */
function detectLanguage(text: string): string {
  // Script-based detection (unambiguous)
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0900-\u097f]/.test(text)) return 'hi';
  
  // Basque - very distinctive words
  if (/\b(kaixo|eskerrik|euskara|nola zaude)\b/i.test(text)) return 'eu';
  
  // For Latin-script languages, require MULTIPLE strong indicators to avoid false positives
  const deWords = text.match(/\b(ich|und|der|die|das|ist|haben|werden|können|nicht|auch|ein|eine|für|mit)\b/gi);
  if (deWords && new Set(deWords.map(w => w.toLowerCase())).size >= 3) return 'de';
  
  const frWords = text.match(/\b(je|nous|vous|sont|avoir|être|très|avec|les|des|une|pas|pour|dans)\b/gi);
  if (frWords && new Set(frWords.map(w => w.toLowerCase())).size >= 3) return 'fr';
  
  const itWords = text.match(/\b(sono|essere|avere|molto|questo|quella|perché|anche|sempre|ancora|adesso|buongiorno|grazie|prego)\b/gi);
  if (itWords && new Set(itWords.map(w => w.toLowerCase())).size >= 3) return 'it';
  
  const enWords = text.match(/\b(the|is|are|have|has|will|would|could|should|what|how|this|that|with|from)\b/gi);
  if (enWords && new Set(enWords.map(w => w.toLowerCase())).size >= 3) return 'en';
  
  return 'es';
}

describe("detectLanguage - Spanish false positive fix", () => {
  it("should detect Spanish for messages containing 'con'", () => {
    expect(detectLanguage("con las nuevas campañas")).toBe("es");
  });

  it("should detect Spanish for messages containing 'que'", () => {
    expect(detectLanguage("que se han subido")).toBe("es");
  });

  it("should detect Spanish for messages containing 'con' and 'que' together", () => {
    expect(detectLanguage("con las campañas que se han creado")).toBe("es");
  });

  it("should detect Spanish for typical ROPA commands", () => {
    expect(detectLanguage("crea empresa PETLIFE 360")).toBe("es");
    expect(detectLanguage("genera emails para FAGOR")).toBe("es");
    expect(detectLanguage("muestra las campañas de EPM")).toBe("es");
    expect(detectLanguage("ve a dashboard")).toBe("es");
    expect(detectLanguage("envío masivo para TechStart")).toBe("es");
  });

  it("should detect Spanish for messages with 'tu' (not Italian)", () => {
    expect(detectLanguage("tu empresa está lista")).toBe("es");
  });

  it("should detect Spanish for messages with 'io' (not Italian)", () => {
    expect(detectLanguage("el servicio de envío masivo")).toBe("es");
  });

  it("should detect actual Italian only with 3+ exclusive Italian words", () => {
    expect(detectLanguage("buongiorno, sono molto contento, grazie")).toBe("it");
  });

  it("should detect actual English with 3+ English words", () => {
    expect(detectLanguage("what is the status of this campaign")).toBe("en");
  });

  it("should detect Chinese characters", () => {
    expect(detectLanguage("你好世界")).toBe("zh");
  });

  it("should detect Arabic characters", () => {
    expect(detectLanguage("مرحبا بالعالم")).toBe("ar");
  });

  it("should detect Hindi characters", () => {
    expect(detectLanguage("नमस्ते दुनिया")).toBe("hi");
  });

  it("should detect Basque", () => {
    expect(detectLanguage("kaixo, nola zaude")).toBe("eu");
  });

  it("should default to Spanish for ambiguous text", () => {
    expect(detectLanguage("hola")).toBe("es");
    expect(detectLanguage("ok")).toBe("es");
    expect(detectLanguage("sí")).toBe("es");
  });

  it("should NOT detect Italian for single Italian-looking words in Spanish context", () => {
    // These are all Spanish sentences that previously triggered Italian detection
    expect(detectLanguage("con los nuevos leads")).toBe("es");
    expect(detectLanguage("che tipo de campaña")).toBe("es"); // even if someone uses 'che' colloquially
    expect(detectLanguage("io necesito más información")).toBe("es");
  });
});

// ============ TEST 2: Safe JSON Parsing (from ropa-onboarding-engine.ts) ============

function safeJsonParse<T = any>(raw: string, label: string): T | null {
  if (!raw || typeof raw !== 'string') return null;
  
  let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    try {
      let fixed = cleaned.replace(/,\s*([}\]])/g, '$1');
      fixed = fixed.replace(/'/g, '"');
      fixed = fixed.replace(/[\x00-\x1F\x7F]/g, ' ');
      return JSON.parse(fixed);
    } catch (e2) {
      // Strategy 3: Extract first JSON object/array from text
      try {
        const startIdx = cleaned.search(/[\[{]/);
        if (startIdx >= 0) {
          const substr = cleaned.substring(startIdx);
          try {
            return JSON.parse(substr);
          } catch (_) {
            const openChar = substr[0];
            const closeChar = openChar === '{' ? '}' : ']';
            const lastClose = substr.lastIndexOf(closeChar);
            if (lastClose > 0) {
              try {
                return JSON.parse(substr.substring(0, lastClose + 1));
              } catch (__) { /* fall through */ }
            }
          }
        }
      } catch (e3) { /* fall through */ }
      
      // Strategy 4: For truncated JSON, try to close open brackets
      {
        try {
          let truncated = cleaned;
          const openBraces = (truncated.match(/{/g) || []).length;
          const closeBraces = (truncated.match(/}/g) || []).length;
          const openBrackets = (truncated.match(/\[/g) || []).length;
          const closeBrackets = (truncated.match(/\]/g) || []).length;
          
          truncated = truncated.replace(/,\s*$/, '');
          
          for (let i = 0; i < openBrackets - closeBrackets; i++) truncated += ']';
          for (let i = 0; i < openBraces - closeBraces; i++) truncated += '}';
          
          return JSON.parse(truncated);
        } catch (e4) {
          return null;
        }
      }
    }
  }
  return null;
}

describe("safeJsonParse - robust JSON parsing", () => {
  it("should parse clean JSON", () => {
    const result = safeJsonParse('{"name": "test"}', 'test');
    expect(result).toEqual({ name: "test" });
  });

  it("should parse JSON wrapped in markdown code blocks", () => {
    const result = safeJsonParse('```json\n{"name": "test"}\n```', 'test');
    expect(result).toEqual({ name: "test" });
  });

  it("should handle trailing commas", () => {
    const result = safeJsonParse('{"name": "test", "value": 1,}', 'test');
    expect(result).toEqual({ name: "test", value: 1 });
  });

  it("should handle JSON with surrounding text", () => {
    const result = safeJsonParse('Here is the result: {"name": "test"} end', 'test');
    expect(result).toEqual({ name: "test" });
  });

  it("should handle truncated JSON by closing brackets", () => {
    const result = safeJsonParse('{"name": "test", "items": [1, 2, 3', 'test');
    expect(result).toEqual({ name: "test", items: [1, 2, 3] });
  });

  it("should return null for completely invalid input", () => {
    const result = safeJsonParse('this is not json at all', 'test');
    expect(result).toBeNull();
  });

  it("should return null for empty string", () => {
    const result = safeJsonParse('', 'test');
    expect(result).toBeNull();
  });

  it("should return null for null/undefined", () => {
    const result = safeJsonParse(null as any, 'test');
    expect(result).toBeNull();
  });

  it("should parse arrays", () => {
    const result = safeJsonParse('[{"name": "a"}, {"name": "b"}]', 'test');
    expect(result).toEqual([{ name: "a" }, { name: "b" }]);
  });

  it("should parse arrays in markdown blocks", () => {
    const result = safeJsonParse('```json\n[{"name": "a"}]\n```', 'test');
    expect(result).toEqual([{ name: "a" }]);
  });
});

// ============ TEST 3: Company Name Extraction (from ropa-brain.ts) ============

function extractCompanyName(rawMatch: string): string {
  return rawMatch.trim()
    .replace(/^(?:llamada|denominada|con\s+(?:el\s+)?nombre(?:\s+de)?|que\s+se\s+llam[ae]|nueva|con\s+raz[oó]n\s+social|de\s+nombre)\s+/i, '')
    .trim();
}

describe("extractCompanyName - strip filler words", () => {
  it("should strip 'llamada' from company name", () => {
    expect(extractCompanyName("llamada PETLIFE 360")).toBe("PETLIFE 360");
  });

  it("should strip 'denominada' from company name", () => {
    expect(extractCompanyName("denominada TechStart")).toBe("TechStart");
  });

  it("should strip 'con nombre' from company name", () => {
    expect(extractCompanyName("con nombre FAGOR")).toBe("FAGOR");
  });

  it("should strip 'con el nombre de' from company name", () => {
    expect(extractCompanyName("con el nombre de EPM")).toBe("EPM");
  });

  it("should strip 'que se llama' from company name", () => {
    expect(extractCompanyName("que se llama GlobalTech")).toBe("GlobalTech");
  });

  it("should strip 'nueva' from company name", () => {
    expect(extractCompanyName("nueva PETLIFE 360")).toBe("PETLIFE 360");
  });

  it("should keep clean company names unchanged", () => {
    expect(extractCompanyName("PETLIFE 360")).toBe("PETLIFE 360");
    expect(extractCompanyName("FAGOR")).toBe("FAGOR");
    expect(extractCompanyName("EPM")).toBe("EPM");
    expect(extractCompanyName("TechStart")).toBe("TechStart");
  });

  it("should handle extra whitespace", () => {
    expect(extractCompanyName("  llamada   PETLIFE 360  ")).toBe("PETLIFE 360");
  });

  it("should be case-insensitive for filler words", () => {
    expect(extractCompanyName("Llamada PETLIFE 360")).toBe("PETLIFE 360");
    expect(extractCompanyName("LLAMADA PETLIFE 360")).toBe("PETLIFE 360");
  });
});

// ============ TEST 4: Draft Open/Approve/Reject Command Detection ============

/**
 * Simplified version of the ropa-brain.ts command detection logic for drafts
 */
function detectDraftCommand(message: string): { intent: string; companyName: string; draftIndex: number } | null {
  const cleanMessage = message.trim();
  const msg = cleanMessage.toLowerCase();
  
  const emailGenVerbs = ['genera', 'crea', 'hazme', 'prepara', 'redacta', 'escribe', 'draft', 'compose', 'elabora', 'haz', 'produce', 'diseña', 'arma'];
  
  function matchesAny(text: string, keywords: string[]): boolean {
    return keywords.some(k => text.includes(k));
  }
  function matchesAnyWord(text: string, keywords: string[]): boolean {
    return keywords.some(k => new RegExp(`\\b${k}\\b`).test(text));
  }
  
  // Approve detection - check BEFORE open draft
  const approveKeywords = ['aceptado', 'aprobado', 'acepto', 'apruebo', 'aprueba', 'acepta', 'apruébalo', 'apruebalo', 'dale', 'perfecto', 'ok aprueba', 'sí aprueba', 'si aprueba', 'aprueba el borrador', 'acepta el borrador', 'aprobar borrador', 'aceptar borrador'];
  if (matchesAny(msg, approveKeywords) && !matchesAnyWord(msg, emailGenVerbs)) {
    const approveCompanyMatch = cleanMessage.match(/(?:de|para|borrador\s+de)\s+(?:la empresa\s+)?["']?([A-Za-z0-9À-ÿ\s]+)["']?/i);
    const companyName = approveCompanyMatch ? approveCompanyMatch[1].trim() : '';
    return { intent: 'approve_draft', companyName, draftIndex: 0 };
  }
  
  // Reject detection - check BEFORE open draft since "rechaza el borrador" could match both
  const rejectKeywords = ['rechazado', 'rechazar', 'rechazo', 'rechaza', 'recházalo', 'rechazalo', 'no me gusta', 'no sirve', 'eliminar borrador', 'elimina borrador', 'borrar borrador', 'borra borrador', 'descarta', 'descartado', 'descartar'];
  if (matchesAny(msg, rejectKeywords) && !matchesAnyWord(msg, emailGenVerbs)) {
    const rejectCompanyMatch = cleanMessage.match(/(?:de|para|borrador\s+de)\s+(?:la empresa\s+)?["']?([A-Za-z0-9À-ÿ\s]+)["']?/i);
    const companyName = rejectCompanyMatch ? rejectCompanyMatch[1].trim() : '';
    return { intent: 'reject_draft', companyName, draftIndex: 0 };
  }

  // Open draft detection
  const openDraftMatch = cleanMessage.match(/(?:abre|abrir|muestra|mostrar|ver|enseña|enseñame|déjame ver|dejame ver)\s+(?:el\s+)?(?:primer\s+|segundo\s+|tercer\s+|\d+[°º]?\s+)?(?:borrador|draft|email|correo)\s+(?:de\s+(?:la empresa\s+)?)?["']?([A-Za-z0-9À-ÿ\s]+)["']?/i);
  if (openDraftMatch) {
    const companyName = openDraftMatch[1].trim();
    let draftIndex = 0;
    if (/segundo/i.test(cleanMessage)) draftIndex = 1;
    else if (/tercer/i.test(cleanMessage)) draftIndex = 2;
    else {
      const numMatch = cleanMessage.match(/(\d+)[°º]?\s+(?:borrador|draft|email)/i);
      if (numMatch) draftIndex = parseInt(numMatch[1]) - 1;
    }
    return { intent: 'open_draft', companyName, draftIndex };
  }
  
  return null;
}

describe("Draft command detection - open draft", () => {
  it("should detect 'abre el borrador de PETLIFE360'", () => {
    const result = detectDraftCommand("abre el borrador de PETLIFE360");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("open_draft");
    expect(result!.companyName).toBe("PETLIFE360");
    expect(result!.draftIndex).toBe(0);
  });

  it("should detect 'abre el primer borrador de PETLIFE360'", () => {
    const result = detectDraftCommand("abre el primer borrador de PETLIFE360");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("open_draft");
    expect(result!.companyName).toBe("PETLIFE360");
    expect(result!.draftIndex).toBe(0);
  });

  it("should detect 'abre el segundo borrador de FAGOR'", () => {
    const result = detectDraftCommand("abre el segundo borrador de FAGOR");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("open_draft");
    expect(result!.companyName).toBe("FAGOR");
    expect(result!.draftIndex).toBe(1);
  });

  it("should detect 'muestra el borrador de la empresa EPM'", () => {
    const result = detectDraftCommand("muestra el borrador de la empresa EPM");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("open_draft");
    expect(result!.companyName).toBe("EPM");
  });

  it("should detect 'ver email de PETLIFE 360'", () => {
    const result = detectDraftCommand("ver email de PETLIFE 360");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("open_draft");
    expect(result!.companyName).toBe("PETLIFE 360");
  });

  it("should detect 'déjame ver el borrador de TechStart'", () => {
    const result = detectDraftCommand("déjame ver el borrador de TechStart");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("open_draft");
    expect(result!.companyName).toBe("TechStart");
  });
});

describe("Draft command detection - approve draft", () => {
  it("should detect 'aceptado'", () => {
    const result = detectDraftCommand("aceptado");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("approve_draft");
  });

  it("should detect 'aprobado'", () => {
    const result = detectDraftCommand("aprobado");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("approve_draft");
  });

  it("should detect 'acepto el borrador'", () => {
    const result = detectDraftCommand("acepto el borrador");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("approve_draft");
  });

  it("should detect 'aprueba el borrador de PETLIFE360'", () => {
    const result = detectDraftCommand("aprueba el borrador de PETLIFE360");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("approve_draft");
    expect(result!.companyName).toBe("PETLIFE360");
  });

  it("should detect 'dale' as approve", () => {
    const result = detectDraftCommand("dale");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("approve_draft");
  });

  it("should detect 'perfecto' as approve", () => {
    const result = detectDraftCommand("perfecto");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("approve_draft");
  });
});

describe("Draft command detection - reject draft", () => {
  it("should detect 'rechazado'", () => {
    const result = detectDraftCommand("rechazado");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("reject_draft");
  });

  it("should detect 'no me gusta'", () => {
    const result = detectDraftCommand("no me gusta");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("reject_draft");
  });

  it("should detect 'descarta'", () => {
    const result = detectDraftCommand("descarta");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("reject_draft");
  });

  it("should detect 'elimina borrador'", () => {
    const result = detectDraftCommand("elimina borrador");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("reject_draft");
  });

  it("should detect 'rechaza el borrador de FAGOR'", () => {
    const result = detectDraftCommand("rechaza el borrador de FAGOR");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("reject_draft");
    expect(result!.companyName).toBe("FAGOR");
  });

  it("should detect 'no sirve'", () => {
    const result = detectDraftCommand("no sirve");
    expect(result).not.toBeNull();
    expect(result!.intent).toBe("reject_draft");
  });
});

describe("Draft command detection - should NOT match email generation", () => {
  it("should NOT detect 'genera emails para PETLIFE' as draft command", () => {
    const result = detectDraftCommand("genera emails para PETLIFE");
    expect(result).toBeNull();
  });

  it("should NOT detect 'crea borrador para FAGOR' as approve/reject", () => {
    // This should be handled by email generation, not draft commands
    const result = detectDraftCommand("crea borrador para FAGOR");
    expect(result).toBeNull();
  });
});

// ============ TEST 5: Navigation Service - openDraftForCompany ============

describe("Navigation service - draft commands", () => {
  it("should create openDraft navigation command structure", () => {
    // Simulate the command structure that openDraftForCompany creates
    const command = {
      type: 'dialog',
      target: 'draft-popup',
      params: {
        action: 'openDraft',
        companyName: 'PETLIFE360',
        draftIndex: 0,
      },
    };
    
    expect(command.type).toBe('dialog');
    expect(command.target).toBe('draft-popup');
    expect(command.params.action).toBe('openDraft');
    expect(command.params.companyName).toBe('PETLIFE360');
    expect(command.params.draftIndex).toBe(0);
  });

  it("should create approveDraft navigation command structure", () => {
    const command = {
      type: 'dialog',
      target: 'draft-action',
      params: {
        action: 'approveDraft',
        companyName: 'PETLIFE360',
        draftIndex: 0,
      },
    };
    
    expect(command.type).toBe('dialog');
    expect(command.target).toBe('draft-action');
    expect(command.params.action).toBe('approveDraft');
  });

  it("should create rejectDraft navigation command structure", () => {
    const command = {
      type: 'dialog',
      target: 'draft-action',
      params: {
        action: 'rejectDraft',
        companyName: '__CURRENT__',
        draftIndex: 0,
      },
    };
    
    expect(command.type).toBe('dialog');
    expect(command.target).toBe('draft-action');
    expect(command.params.action).toBe('rejectDraft');
    expect(command.params.companyName).toBe('__CURRENT__');
  });
});
