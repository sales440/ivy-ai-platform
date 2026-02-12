import { describe, it, expect } from 'vitest';
import { processWithRopaBrain } from '../ropa-brain';

describe('Phase 45: Bug Fixes', () => {
  describe('ROPA Time-Aware Greeting', () => {
    it('should greet with Buenos días when clientHour is morning (10am)', async () => {
      const result = await processWithRopaBrain('hola', 10, 'miércoles');
      expect(result.intent).toBe('greeting');
      expect(result.response).toContain('Buenos días');
      expect(result.response).not.toContain('Buenas noches');
      expect(result.response).not.toContain('Buenas tardes');
    });

    it('should greet with Buenas tardes when clientHour is afternoon (15)', async () => {
      const result = await processWithRopaBrain('hola ropa', 15, 'jueves');
      expect(result.intent).toBe('greeting');
      expect(result.response).toContain('Buenas tardes');
      expect(result.response).not.toContain('Buenos días');
    });

    it('should greet with Buenas noches when clientHour is evening (21)', async () => {
      const result = await processWithRopaBrain('hey', 21, 'viernes');
      expect(result.intent).toBe('greeting');
      expect(result.response).toContain('Buenas noches');
    });

    it('should include the day name in the greeting', async () => {
      const result = await processWithRopaBrain('hola', 10, 'lunes');
      expect(result.response).toContain('lunes');
    });

    it('should work without clientHour (fallback to server time)', async () => {
      const result = await processWithRopaBrain('hola');
      expect(result.intent).toBe('greeting');
      // Should contain one of the three greetings
      const hasGreeting = result.response.includes('Buenos días') || 
                          result.response.includes('Buenas tardes') || 
                          result.response.includes('Buenas noches');
      expect(hasGreeting).toBe(true);
    });

    it('should work without clientDay (no day info)', async () => {
      const result = await processWithRopaBrain('hola', 10);
      expect(result.intent).toBe('greeting');
      expect(result.response).toContain('Buenos días');
      // Should not contain "Hoy es" since no day was provided
      expect(result.response).not.toContain('Hoy es');
    });

    it('should handle edge case: midnight (hour 0)', async () => {
      const result = await processWithRopaBrain('hola', 0, 'sábado');
      expect(result.response).toContain('Buenos días');
    });

    it('should handle edge case: noon (hour 12)', async () => {
      const result = await processWithRopaBrain('hola', 12, 'domingo');
      expect(result.response).toContain('Buenas tardes');
    });

    it('should handle edge case: 6pm boundary (hour 18)', async () => {
      const result = await processWithRopaBrain('hola', 18, 'martes');
      expect(result.response).toContain('Buenas noches');
    });
  });

  describe('Calendar Navigation', () => {
    it('should navigate to calendar section when asked', async () => {
      const result = await processWithRopaBrain('abre el calendario');
      expect(result.intent).toBe('navigation');
      expect(result.command?.section).toBe('calendar');
    });
  });
});
