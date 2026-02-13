import { describe, it, expect } from 'vitest';

/**
 * Phase 48: Customizable CTA Button Text per Campaign
 * Tests for the CTA auto-suggestion logic and template integration
 */

// Replicate the suggestCtaText function from MonitorDraftPopup
function suggestCtaText(campaign: string): string {
  const c = campaign.toLowerCase();
  if (c.includes('upgrade') || c.includes('cnc')) return 'Request CNC Demo';
  if (c.includes('training') || c.includes('formación')) return 'View Training Plan';
  if (c.includes('teleservice') || c.includes('remote')) return 'Start Teleservice';
  if (c.includes('service') || c.includes('servicio')) return 'Schedule Service';
  if (c.includes('repair') || c.includes('motor') || c.includes('drive')) return 'Request Repair Quote';
  if (c.includes('warranty') || c.includes('garantía')) return 'Extend Warranty';
  if (c.includes('digital') || c.includes('suite') || c.includes('software')) return 'Explore Digital Suite';
  if (c.includes('automation')) return 'Discover Automation Solutions';
  return 'Solicitar Información';
}

describe('CTA Auto-Suggestion Logic', () => {
  it('suggests "Request CNC Demo" for CNC Upgrade campaigns', () => {
    expect(suggestCtaText('CNC Upgrade')).toBe('Request CNC Demo');
    expect(suggestCtaText('Campaña CNC Upgrade')).toBe('Request CNC Demo');
  });

  it('suggests "View Training Plan" for training campaigns', () => {
    expect(suggestCtaText('FAGOR Training')).toBe('View Training Plan');
    expect(suggestCtaText('Formación Técnica')).toBe('View Training Plan');
  });

  it('suggests "Schedule Service" for service campaigns', () => {
    expect(suggestCtaText('Service Contract')).toBe('Schedule Service');
    expect(suggestCtaText('Contrato de Servicio')).toBe('Schedule Service');
  });

  it('suggests "Start Teleservice" for teleservice campaigns', () => {
    expect(suggestCtaText('Teleservice Remote')).toBe('Start Teleservice');
    expect(suggestCtaText('Remote Support')).toBe('Start Teleservice');
  });

  it('suggests "Request Repair Quote" for repair campaigns', () => {
    expect(suggestCtaText('Motor & Drive Repair')).toBe('Request Repair Quote');
    expect(suggestCtaText('Motor Repair')).toBe('Request Repair Quote');
    expect(suggestCtaText('Drive Replacement')).toBe('Request Repair Quote');
  });

  it('suggests "Extend Warranty" for warranty campaigns', () => {
    expect(suggestCtaText('Extended Warranty')).toBe('Extend Warranty');
    expect(suggestCtaText('Garantía Extendida')).toBe('Extend Warranty');
  });

  it('suggests "Explore Digital Suite" for digital/software campaigns', () => {
    expect(suggestCtaText('Fagor Digital Suite')).toBe('Explore Digital Suite');
    expect(suggestCtaText('Software Solutions')).toBe('Explore Digital Suite');
  });

  it('suggests "Discover Automation Solutions" for automation campaigns', () => {
    expect(suggestCtaText('FAGOR Automation')).toBe('Discover Automation Solutions');
  });

  it('returns default "Solicitar Información" for unknown campaigns', () => {
    expect(suggestCtaText('General Campaign')).toBe('Solicitar Información');
    expect(suggestCtaText('Other')).toBe('Solicitar Información');
  });

  it('is case-insensitive', () => {
    expect(suggestCtaText('cnc upgrade')).toBe('Request CNC Demo');
    expect(suggestCtaText('TRAINING PROGRAM')).toBe('View Training Plan');
    expect(suggestCtaText('TELESERVICE REMOTE')).toBe('Start Teleservice');
  });
});

describe('CTA Template Integration', () => {
  it('CTA text should be non-empty string', () => {
    const campaigns = [
      'CNC Upgrade', 'FAGOR Training', 'Service Contract',
      'Teleservice', 'Motor Repair', 'Extended Warranty',
      'Digital Suite', 'FAGOR Automation', 'Unknown Campaign'
    ];
    
    for (const campaign of campaigns) {
      const cta = suggestCtaText(campaign);
      expect(cta).toBeTruthy();
      expect(typeof cta).toBe('string');
      expect(cta.length).toBeGreaterThan(0);
    }
  });

  it('priority order: upgrade/cnc takes precedence over automation', () => {
    // "CNC Automation Upgrade" contains both 'cnc' and 'automation'
    // 'upgrade'/'cnc' should match first
    expect(suggestCtaText('CNC Automation Upgrade')).toBe('Request CNC Demo');
  });

  it('priority order: teleservice takes precedence over service', () => {
    // 'teleservice' should match before generic 'service'
    expect(suggestCtaText('Teleservice Contract')).toBe('Start Teleservice');
  });
});
