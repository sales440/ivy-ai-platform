import { describe, it, expect } from 'vitest';

describe('Google Gemini API Key Validation', () => {
  it('should have GOOGLE_AI_API_KEY configured', () => {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey!.length).toBeGreaterThan(10);
    expect(apiKey!.startsWith('AIza')).toBe(true);
  });

  it('should successfully call Gemini API', async () => {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with only: OK' }] }],
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.candidates).toBeDefined();
    expect(data.candidates.length).toBeGreaterThan(0);
    expect(data.candidates[0].content.parts[0].text).toBeDefined();
  }, 30000);
});
