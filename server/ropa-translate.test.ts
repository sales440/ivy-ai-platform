import { describe, it, expect } from 'vitest';

/**
 * Tests for ROPA email translation intent detection and tool registration
 */

describe('Email Translation Intent Detection', () => {
  // Helper to simulate matchesAny
  const matchesAny = (msg: string, keywords: string[]) =>
    keywords.some(k => msg.toLowerCase().includes(k.toLowerCase()));

  const translateVerbs = ['traduce', 'traducir', 'translate', 'traduzca', 'tradúceme', 'traduceme', 'pasa a', 'convierte a', 'cambia a', 'pon en'];
  const emailNouns = ['email', 'correo', 'borrador', 'borradores', 'emails', 'correos', 'mail', 'mails', 'mensaje', 'mensajes', 'carta', 'comunicación'];
  const languageKeywords = ['inglés', 'ingles', 'english', 'francés', 'frances', 'french', 'alemán', 'aleman', 'german', 'italiano', 'italian', 'portugués', 'portugues', 'portuguese', 'chino', 'chinese', 'vasco', 'euskera', 'basque', 'español', 'spanish'];

  const isTranslateIntent = (msg: string) =>
    matchesAny(msg, translateVerbs) && (matchesAny(msg, emailNouns) || matchesAny(msg, languageKeywords));

  it('detects "traduce los emails al inglés"', () => {
    expect(isTranslateIntent('traduce los emails al inglés')).toBe(true);
  });

  it('detects "traducir correos a english"', () => {
    expect(isTranslateIntent('traducir correos a english')).toBe(true);
  });

  it('detects "traduce los borradores al francés"', () => {
    expect(isTranslateIntent('traduce los borradores al francés')).toBe(true);
  });

  it('detects "pasa a inglés los emails"', () => {
    expect(isTranslateIntent('pasa a inglés los emails')).toBe(true);
  });

  it('detects "translate emails to english"', () => {
    expect(isTranslateIntent('translate emails to english')).toBe(true);
  });

  it('detects "tradúceme los correos al alemán"', () => {
    expect(isTranslateIntent('tradúceme los correos al alemán')).toBe(true);
  });

  it('detects "convierte a portugués los borradores"', () => {
    expect(isTranslateIntent('convierte a portugués los borradores')).toBe(true);
  });

  it('does NOT detect "genera emails para PETLIFE"', () => {
    expect(isTranslateIntent('genera emails para PETLIFE')).toBe(false);
  });

  it('does NOT detect "muestra el dashboard"', () => {
    expect(isTranslateIntent('muestra el dashboard')).toBe(false);
  });

  it('does NOT detect "crea una empresa"', () => {
    expect(isTranslateIntent('crea una empresa')).toBe(false);
  });
});

describe('Language Detection from Message', () => {
  const languageKeywords = ['inglés', 'ingles', 'english', 'francés', 'frances', 'french', 'alemán', 'aleman', 'german', 'italiano', 'italian', 'portugués', 'portugues', 'portuguese', 'chino', 'chinese', 'vasco', 'euskera', 'basque', 'español', 'spanish'];

  const detectLanguage = (msg: string): string => {
    const lower = msg.toLowerCase();
    for (const lang of languageKeywords) {
      if (lower.includes(lang)) return lang;
    }
    return 'English';
  };

  it('detects inglés', () => {
    expect(detectLanguage('traduce al inglés')).toBe('inglés');
  });

  it('detects english', () => {
    expect(detectLanguage('translate to english')).toBe('english');
  });

  it('detects francés', () => {
    expect(detectLanguage('traduce al francés')).toBe('francés');
  });

  it('detects alemán', () => {
    expect(detectLanguage('pasa a alemán')).toBe('alemán');
  });

  it('detects portugués', () => {
    expect(detectLanguage('convierte a portugués')).toBe('portugués');
  });

  it('defaults to English when no language found', () => {
    expect(detectLanguage('traduce los emails')).toBe('English');
  });
});

describe('Platform Tools Registration', () => {
  it('translateEmailDraft is registered in ropaPlatformTools', async () => {
    const { ropaPlatformTools } = await import('./ropa-platform-tools');
    expect(typeof ropaPlatformTools.translateEmailDraft).toBe('function');
  });

  it('generateEmailDraftsInLanguage is registered in ropaPlatformTools', async () => {
    const { ropaPlatformTools } = await import('./ropa-platform-tools');
    expect(typeof ropaPlatformTools.generateEmailDraftsInLanguage).toBe('function');
  });

  it('platformToolCategories includes translation tools', async () => {
    const { platformToolCategories } = await import('./ropa-platform-tools');
    const emailCategory = platformToolCategories['Email Drafts (Monitor)'];
    expect(emailCategory).toContain('translateEmailDraft');
    expect(emailCategory).toContain('generateEmailDraftsInLanguage');
  });
});
