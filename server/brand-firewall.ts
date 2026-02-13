/**
 * Brand Firewall Service
 * 
 * Eliminates cross-contamination of visual assets between companies.
 * Implements Zero Trust isolation: each company has its own brand profile
 * and unique HTML template. No shared assets between brands.
 * 
 * Protocol:
 * 1. Zero Trust Isolation - Clean visual memory before generating any draft
 * 2. Dynamic HTML Template Generation - Based on company profile from Google Drive
 * 3. Pre-Render Coherence Check - Verify logo matches campaign company name
 * 4. Auto-discard and regenerate on coherence failure
 */

import { getDb } from "./db";
import { ivyClients } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// BRAND PROFILE TYPES
// ============================================================================

export interface BrandProfile {
  companyName: string;
  companyId?: string;
  sector: 'industrial' | 'consumer' | 'tech' | 'healthcare' | 'education' | 'finance' | 'services' | 'other';
  
  // Visual Identity
  logoUrl: string | null;
  primaryColor: string;       // Main brand color (hex)
  secondaryColor: string;     // Secondary color (hex)
  accentColor: string;        // Accent/CTA color (hex)
  backgroundColor: string;    // Email background
  headerBackground: string;   // Header gradient or solid
  textColor: string;          // Body text color
  
  // Typography
  fontFamily: string;
  headerFontSize: string;
  bodyFontSize: string;
  
  // Design Style
  borderRadius: string;       // '0px' for rigid, '12px' for rounded
  headerStyle: 'gradient' | 'solid' | 'minimal';
  layoutStyle: 'rigid' | 'rounded' | 'modern' | 'classic';
  toneVisual: string;         // Description of visual tone
  
  // Contact Info
  address: string;
  phone: string;
  email: string;
  website: string;
  socialLinks: { platform: string; url: string }[];
  
  // Legal
  legalNotice: string;
  unsubscribeText: string;
  
  // CTA
  ctaText: string;
  ctaStyle: string;           // CSS for CTA button
  
  // Footer
  footerBackground: string;
  footerTextColor: string;
  
  // Divider
  dividerStyle: string;       // CSS gradient or solid
}

// ============================================================================
// BRAND PROFILE REGISTRY (Zero Trust - Isolated per company)
// ============================================================================

// In-memory cache of brand profiles - completely isolated per company
const brandProfileCache: Map<string, BrandProfile> = new Map();

// Active brand context - ensures no cross-contamination
let activeBrandContext: string | null = null;

/**
 * ZERO TRUST: Clear all brand context before switching companies
 */
export function clearBrandContext(): void {
  activeBrandContext = null;
  console.log('[BrandFirewall] 🔒 Brand context cleared - Zero Trust reset');
}

/**
 * ZERO TRUST: Set active brand context - only this company's assets are accessible
 */
export function setActiveBrand(companyName: string): void {
  clearBrandContext();
  activeBrandContext = companyName.toUpperCase().trim();
  console.log(`[BrandFirewall] 🔓 Active brand set to: ${activeBrandContext}`);
}

/**
 * ZERO TRUST: Verify that the requested company matches the active context
 */
function verifyBrandAccess(companyName: string): boolean {
  const normalized = companyName.toUpperCase().trim();
  if (!activeBrandContext) {
    console.warn(`[BrandFirewall] ⚠️ No active brand context. Setting to: ${normalized}`);
    activeBrandContext = normalized;
    return true;
  }
  if (activeBrandContext !== normalized) {
    console.error(`[BrandFirewall] 🚫 BRAND VIOLATION: Attempted to access ${normalized} while ${activeBrandContext} is active`);
    return false;
  }
  return true;
}

// ============================================================================
// PREDEFINED BRAND PROFILES
// ============================================================================

const FAGOR_PROFILE: BrandProfile = {
  companyName: 'FAGOR Automation',
  sector: 'industrial',
  logoUrl: 'https://files.manuscdn.com/user_upload_by_module/session_file/310419663031167889/lFvNmUJyWPByzMSL.jpg',
  primaryColor: '#E31937',
  secondaryColor: '#1a1a2e',
  accentColor: '#E31937',
  backgroundColor: '#f4f4f4',
  headerBackground: 'linear-gradient(135deg, #E31937 0%, #B71530 100%)',
  textColor: '#333333',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  headerFontSize: '14px',
  bodyFontSize: '15px',
  borderRadius: '0px',
  headerStyle: 'gradient',
  layoutStyle: 'rigid',
  toneVisual: 'Tecnológico, ingeniería, eficiencia, profesional industrial',
  address: '4020 Winnetka Ave, Rolling Meadows, IL 60008, United States',
  phone: '+1 (847) 981-1500',
  email: 'sales@fagorautomation.us',
  website: 'https://www.fagorautomation.us',
  socialLinks: [
    { platform: 'LinkedIn', url: 'https://www.linkedin.com/company/fagor-automation/' },
    { platform: 'Twitter', url: 'https://twitter.com/FAGORAutomation' },
    { platform: 'YouTube', url: 'https://www.youtube.com/c/FAGORAutomation' },
  ],
  legalNotice: `© ${new Date().getFullYear()} FAGOR Automation USA. All rights reserved.`,
  unsubscribeText: 'If you no longer wish to receive these emails, <a href="#" style="color: #999999;">unsubscribe here</a>.',
  ctaText: 'Solicitar Información',
  ctaStyle: 'display: inline-block; background: #E31937; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-weight: 600; font-size: 15px; letter-spacing: 0.5px;',
  footerBackground: '#1a1a2e',
  footerTextColor: '#cccccc',
  dividerStyle: 'height: 3px; background: linear-gradient(90deg, #E31937, #ff6b6b, #E31937);',
};

const PETLIFE360_PROFILE: BrandProfile = {
  companyName: 'PETLIFE 360',
  sector: 'consumer',
  logoUrl: null, // Will be loaded from Google Drive
  primaryColor: '#FF6B35',
  secondaryColor: '#2EC4B6',
  accentColor: '#FF6B35',
  backgroundColor: '#FFF8F0',
  headerBackground: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 50%, #FFB347 100%)',
  textColor: '#4A4A4A',
  fontFamily: "'Nunito', 'Poppins', 'Segoe UI', sans-serif",
  headerFontSize: '16px',
  bodyFontSize: '16px',
  borderRadius: '16px',
  headerStyle: 'gradient',
  layoutStyle: 'rounded',
  toneVisual: 'Emocional, cálido, bienestar animal, amigable, cercano',
  address: '',
  phone: '',
  email: 'info@petlife360.com',
  website: 'https://www.petlife360.com',
  socialLinks: [
    { platform: 'Instagram', url: '#' },
    { platform: 'Facebook', url: '#' },
    { platform: 'TikTok', url: '#' },
  ],
  legalNotice: `© ${new Date().getFullYear()} PETLIFE 360. Todos los derechos reservados.`,
  unsubscribeText: 'Si no deseas recibir más emails, <a href="#" style="color: #FF6B35;">cancela tu suscripción aquí</a>.',
  ctaText: 'Descubrir Más',
  ctaStyle: 'display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 30px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);',
  footerBackground: '#2EC4B6',
  footerTextColor: '#ffffff',
  dividerStyle: 'height: 4px; background: linear-gradient(90deg, #FF6B35, #2EC4B6, #FF6B35); border-radius: 2px;',
};

// Default profile for unknown companies - neutral/professional
function createDefaultProfile(companyName: string): BrandProfile {
  return {
    companyName,
    sector: 'other',
    logoUrl: null,
    primaryColor: '#2563EB',
    secondaryColor: '#1E40AF',
    accentColor: '#3B82F6',
    backgroundColor: '#F8FAFC',
    headerBackground: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
    textColor: '#334155',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    headerFontSize: '14px',
    bodyFontSize: '15px',
    borderRadius: '8px',
    headerStyle: 'gradient',
    layoutStyle: 'modern',
    toneVisual: 'Profesional, moderno, confiable',
    address: '',
    phone: '',
    email: '',
    website: '',
    socialLinks: [],
    legalNotice: `© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.`,
    unsubscribeText: `Si no deseas recibir más emails de ${companyName}, <a href="#" style="color: #3B82F6;">cancela tu suscripción</a>.`,
    ctaText: 'Más Información',
    ctaStyle: `display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px;`,
    footerBackground: '#1E293B',
    footerTextColor: '#CBD5E1',
    dividerStyle: 'height: 3px; background: linear-gradient(90deg, #2563EB, #3B82F6, #2563EB);',
  };
}

// ============================================================================
// BRAND PROFILE RESOLUTION
// ============================================================================

/**
 * Get the brand profile for a company. Resolves from:
 * 1. Cache (fastest)
 * 2. Predefined profiles (FAGOR, PETLIFE360)
 * 3. Database (ivy_clients)
 * 4. Default profile (fallback)
 */
export async function getBrandProfile(companyName: string): Promise<BrandProfile> {
  const normalized = companyName.toUpperCase().trim();
  
  // 1. Check cache
  if (brandProfileCache.has(normalized)) {
    return brandProfileCache.get(normalized)!;
  }
  
  // 2. Check predefined profiles
  if (normalized.includes('FAGOR')) {
    brandProfileCache.set(normalized, FAGOR_PROFILE);
    return FAGOR_PROFILE;
  }
  if (normalized.includes('PETLIFE')) {
    brandProfileCache.set(normalized, PETLIFE360_PROFILE);
    return PETLIFE360_PROFILE;
  }
  
  // 3. Try to load from database
  try {
    const db = await getDb();
    if (db) {
      const [client] = await db.select().from(ivyClients).where(
        eq(ivyClients.companyName, companyName)
      ).limit(1);
      
      if (client) {
        const profile = buildProfileFromClient(client);
        brandProfileCache.set(normalized, profile);
        return profile;
      }
    }
  } catch (error) {
    // Fallback: try raw SQL
    try {
      const db = await getDb();
      if (db) {
        const [rows] = await (db as any).execute(
          `SELECT * FROM ivy_clients WHERE UPPER(company_name) LIKE ? LIMIT 1`,
          [`%${normalized}%`]
        );
        if (rows && rows.length > 0) {
          const client = rows[0];
          const profile = buildProfileFromClient(client);
          brandProfileCache.set(normalized, profile);
          return profile;
        }
      }
    } catch (e) {
      console.warn(`[BrandFirewall] Could not load brand from DB for ${companyName}`);
    }
  }
  
  // 4. Default profile
  const defaultProfile = createDefaultProfile(companyName);
  brandProfileCache.set(normalized, defaultProfile);
  return defaultProfile;
}

/**
 * Build a brand profile from a database client record
 */
function buildProfileFromClient(client: any): BrandProfile {
  const name = client.company_name || client.companyName || 'Unknown';
  const industry = (client.industry || '').toLowerCase();
  
  // Determine sector from industry
  let sector: BrandProfile['sector'] = 'other';
  if (industry.includes('industrial') || industry.includes('manufactur') || industry.includes('automat')) {
    sector = 'industrial';
  } else if (industry.includes('pet') || industry.includes('consumer') || industry.includes('retail')) {
    sector = 'consumer';
  } else if (industry.includes('tech') || industry.includes('software') || industry.includes('digital')) {
    sector = 'tech';
  } else if (industry.includes('health') || industry.includes('medical') || industry.includes('pharma')) {
    sector = 'healthcare';
  } else if (industry.includes('financ') || industry.includes('bank') || industry.includes('insur')) {
    sector = 'finance';
  }
  
  // Generate color palette based on sector
  const palette = getSectorPalette(sector);
  
  return {
    companyName: name,
    companyId: client.client_id || client.clientId,
    sector,
    logoUrl: client.logo_url || client.logoUrl || null,
    ...palette,
    fontFamily: getSectorFont(sector),
    headerFontSize: sector === 'consumer' ? '16px' : '14px',
    bodyFontSize: sector === 'consumer' ? '16px' : '15px',
    borderRadius: sector === 'industrial' ? '0px' : sector === 'consumer' ? '16px' : '8px',
    headerStyle: 'gradient',
    layoutStyle: sector === 'industrial' ? 'rigid' : sector === 'consumer' ? 'rounded' : 'modern',
    toneVisual: getSectorTone(sector),
    address: client.address || '',
    phone: client.contact_phone || client.contactPhone || '',
    email: client.contact_email || client.contactEmail || '',
    website: client.website || '',
    socialLinks: [],
    legalNotice: `© ${new Date().getFullYear()} ${name}. Todos los derechos reservados.`,
    unsubscribeText: `Si no deseas recibir más emails de ${name}, <a href="#" style="color: ${palette.accentColor};">cancela tu suscripción</a>.`,
    ctaText: sector === 'industrial' ? 'Solicitar Información' : 'Descubrir Más',
    ctaStyle: `display: inline-block; background: ${palette.headerBackground}; color: #ffffff !important; text-decoration: none; padding: ${sector === 'consumer' ? '16px 36px' : '14px 32px'}; border-radius: ${sector === 'industrial' ? '4px' : sector === 'consumer' ? '30px' : '8px'}; font-weight: 600; font-size: 15px;`,
    footerBackground: palette.secondaryColor,
    footerTextColor: '#ffffff',
    dividerStyle: `height: 3px; background: linear-gradient(90deg, ${palette.primaryColor}, ${palette.accentColor}, ${palette.primaryColor}); border-radius: 2px;`,
  };
}

function getSectorPalette(sector: BrandProfile['sector']) {
  switch (sector) {
    case 'industrial':
      return {
        primaryColor: '#DC2626',
        secondaryColor: '#1a1a2e',
        accentColor: '#DC2626',
        backgroundColor: '#f4f4f4',
        headerBackground: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        textColor: '#333333',
      };
    case 'consumer':
      return {
        primaryColor: '#F97316',
        secondaryColor: '#059669',
        accentColor: '#F97316',
        backgroundColor: '#FFFBF5',
        headerBackground: 'linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FBBF24 100%)',
        textColor: '#4A4A4A',
      };
    case 'tech':
      return {
        primaryColor: '#6366F1',
        secondaryColor: '#312E81',
        accentColor: '#818CF8',
        backgroundColor: '#F5F3FF',
        headerBackground: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        textColor: '#1E1B4B',
      };
    case 'healthcare':
      return {
        primaryColor: '#0EA5E9',
        secondaryColor: '#0C4A6E',
        accentColor: '#38BDF8',
        backgroundColor: '#F0F9FF',
        headerBackground: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
        textColor: '#0C4A6E',
      };
    case 'finance':
      return {
        primaryColor: '#0D9488',
        secondaryColor: '#134E4A',
        accentColor: '#14B8A6',
        backgroundColor: '#F0FDFA',
        headerBackground: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
        textColor: '#134E4A',
      };
    default:
      return {
        primaryColor: '#2563EB',
        secondaryColor: '#1E40AF',
        accentColor: '#3B82F6',
        backgroundColor: '#F8FAFC',
        headerBackground: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
        textColor: '#334155',
      };
  }
}

function getSectorFont(sector: BrandProfile['sector']): string {
  switch (sector) {
    case 'industrial': return "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    case 'consumer': return "'Nunito', 'Poppins', 'Segoe UI', sans-serif";
    case 'tech': return "'Inter', 'SF Pro Display', 'Segoe UI', sans-serif";
    case 'healthcare': return "'Open Sans', 'Segoe UI', sans-serif";
    case 'finance': return "'Roboto', 'Segoe UI', sans-serif";
    default: return "'Inter', 'Segoe UI', sans-serif";
  }
}

function getSectorTone(sector: BrandProfile['sector']): string {
  switch (sector) {
    case 'industrial': return 'Tecnológico, ingeniería, eficiencia, profesional';
    case 'consumer': return 'Emocional, cálido, cercano, amigable';
    case 'tech': return 'Innovador, moderno, digital, vanguardista';
    case 'healthcare': return 'Confiable, cuidado, profesional, empático';
    case 'finance': return 'Sólido, confiable, seguro, profesional';
    default: return 'Profesional, moderno, confiable';
  }
}

// ============================================================================
// DYNAMIC HTML TEMPLATE GENERATOR
// ============================================================================

/**
 * Generate a brand-specific HTML email template.
 * ZERO TRUST: Only uses assets from the specified company's brand profile.
 */
export async function generateBrandedEmailHtml(params: {
  companyName: string;
  subject: string;
  body: string;
  recipientName?: string;
  ctaUrl?: string;
  ctaText?: string;
}): Promise<{ html: string; brandProfile: BrandProfile; coherenceCheck: boolean }> {
  // STEP 1: Zero Trust - Set active brand context
  setActiveBrand(params.companyName);
  
  // STEP 2: Load brand profile (isolated)
  const brand = await getBrandProfile(params.companyName);
  
  // STEP 3: Verify brand access
  if (!verifyBrandAccess(params.companyName)) {
    throw new Error(`[BrandFirewall] BRAND VIOLATION: Cannot generate email for ${params.companyName}`);
  }
  
  // STEP 4: Generate HTML based on brand profile
  let html: string;
  
  switch (brand.layoutStyle) {
    case 'rigid':
      html = generateIndustrialTemplate(brand, params);
      break;
    case 'rounded':
      html = generateConsumerTemplate(brand, params);
      break;
    case 'modern':
      html = generateModernTemplate(brand, params);
      break;
    default:
      html = generateClassicTemplate(brand, params);
      break;
  }
  
  // STEP 5: Pre-render coherence check
  const coherenceCheck = runCoherenceCheck(html, brand);
  
  if (!coherenceCheck) {
    console.error(`[BrandFirewall] ❌ COHERENCE CHECK FAILED for ${params.companyName} - Regenerating...`);
    // Clear and regenerate
    clearBrandContext();
    setActiveBrand(params.companyName);
    html = generateClassicTemplate(brand, params); // Fallback to safe template
  }
  
  // STEP 6: Clear context after generation
  clearBrandContext();
  
  return { html, brandProfile: brand, coherenceCheck };
}

// ============================================================================
// TEMPLATE: INDUSTRIAL (FAGOR-style - rigid, professional, B2B)
// ============================================================================

function generateIndustrialTemplate(brand: BrandProfile, params: { subject: string; body: string; recipientName?: string; ctaUrl?: string; ctaText?: string }): string {
  const logoHtml = brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="${brand.companyName}" style="max-height: 45px;" />`
    : `<span style="color: #ffffff; font-weight: 700; font-size: 22px; letter-spacing: 1px;">${brand.companyName}</span>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${brand.backgroundColor}; font-family: ${brand.fontFamily}; }
    .email-wrapper { max-width: 650px; margin: 0 auto; background-color: #ffffff; }
    .header { background: ${brand.headerBackground}; padding: 30px 40px; text-align: center; }
    .header-subtitle { color: rgba(255,255,255,0.85); font-size: ${brand.headerFontSize}; letter-spacing: 2px; text-transform: uppercase; margin-top: 10px; }
    .content { padding: 40px; color: ${brand.textColor}; line-height: 1.7; font-size: ${brand.bodyFontSize}; }
    .content h2 { color: ${brand.primaryColor}; font-size: 22px; margin-bottom: 15px; }
    .content p { margin-bottom: 16px; }
    .divider { ${brand.dividerStyle} margin: 0; }
    .footer { background-color: ${brand.footerBackground}; padding: 30px 40px; color: ${brand.footerTextColor}; font-size: 12px; }
    .footer-brand { color: ${brand.primaryColor}; font-weight: 700; font-size: 16px; margin-bottom: 10px; }
    .footer-address { color: rgba(255,255,255,0.6); line-height: 1.6; }
    .footer-links { margin-top: 15px; }
    .footer-links a { color: ${brand.primaryColor}; text-decoration: none; margin-right: 15px; font-size: 12px; }
    .social-links { margin-top: 15px; }
    .social-links a { display: inline-block; margin-right: 10px; color: ${brand.footerTextColor}; text-decoration: none; font-size: 12px; }
    .unsubscribe { margin-top: 20px; color: rgba(255,255,255,0.4); font-size: 11px; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header: ${brand.companyName} ONLY -->
    <div class="header">
      ${logoHtml}
      <div class="header-subtitle">${brand.toneVisual.split(',')[0]}</div>
    </div>
    
    <!-- Brand Divider -->
    <div class="divider"></div>

    <!-- Main Content -->
    <div class="content">
      ${params.body.replace(/\n/g, '<br>')}
    </div>

    <!-- CTA -->
    <div style="text-align: center; padding: 0 40px 40px;">
      <a href="${params.ctaUrl || '#'}" style="${brand.ctaStyle}">
        ${params.ctaText || brand.ctaText}
      </a>
    </div>

    <div class="content" style="padding-top: 0;">
      <div style="${brand.dividerStyle} margin: 30px 0;"></div>
      <p style="font-size: 13px; color: #666;">
        Este mensaje fue enviado por <strong>${brand.companyName}</strong> a través de nuestra plataforma de comunicación empresarial.
      </p>
    </div>

    <!-- Footer: ${brand.companyName} ONLY -->
    <div class="footer">
      <div class="footer-brand">${brand.companyName.toUpperCase()}</div>
      <div class="footer-address">
        ${brand.address ? brand.address.replace(/,/g, '<br>') + '<br>' : ''}
        ${brand.phone ? 'Tel: ' + brand.phone + '<br>' : ''}
        ${brand.website ? `<a href="${brand.website}" style="color: ${brand.primaryColor};">${brand.website.replace('https://', '')}</a>` : ''}
      </div>
      ${brand.socialLinks.length > 0 ? `
      <div class="social-links">
        ${brand.socialLinks.map(s => `<a href="${s.url}">${s.platform}</a>`).join(' ')}
      </div>` : ''}
      <div class="unsubscribe">
        ${brand.unsubscribeText}<br>
        ${brand.legalNotice}
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// TEMPLATE: CONSUMER (PETLIFE-style - warm, rounded, emotional)
// ============================================================================

function generateConsumerTemplate(brand: BrandProfile, params: { subject: string; body: string; recipientName?: string; ctaUrl?: string; ctaText?: string }): string {
  const logoHtml = brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="${brand.companyName}" style="max-height: 60px; border-radius: 12px;" />`
    : `<span style="color: #ffffff; font-weight: 800; font-size: 28px; letter-spacing: -0.5px;">${brand.companyName}</span>`;

  const greeting = params.recipientName 
    ? `¡Hola ${params.recipientName}! 👋` 
    : '¡Hola! 👋';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; background-color: ${brand.backgroundColor}; font-family: ${brand.fontFamily}; }
    .email-wrapper { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: ${brand.borderRadius}; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.08); }
    .header { background: ${brand.headerBackground}; padding: 40px; text-align: center; position: relative; }
    .header::after { content: ''; position: absolute; bottom: -20px; left: 0; right: 0; height: 40px; background: #ffffff; border-radius: 50% 50% 0 0; }
    .greeting { padding: 30px 40px 0; font-size: 24px; font-weight: 800; color: ${brand.primaryColor}; }
    .content { padding: 10px 40px 30px; color: ${brand.textColor}; line-height: 1.8; font-size: ${brand.bodyFontSize}; }
    .content p { margin-bottom: 16px; }
    .cta-wrapper { text-align: center; padding: 10px 40px 40px; }
    .divider-wave { height: 4px; background: ${brand.dividerStyle.replace('height: 4px; background: ', '').replace('; border-radius: 2px;', '')}; border-radius: 2px; margin: 0 40px; }
    .footer { background-color: ${brand.footerBackground}; padding: 30px 40px; text-align: center; color: ${brand.footerTextColor}; border-radius: 0 0 ${brand.borderRadius} ${brand.borderRadius}; }
    .footer-brand { font-weight: 800; font-size: 18px; margin-bottom: 10px; }
    .social-icons { margin: 15px 0; }
    .social-icons a { display: inline-block; margin: 0 8px; color: ${brand.footerTextColor}; text-decoration: none; font-size: 13px; opacity: 0.9; }
    .unsubscribe { margin-top: 15px; font-size: 11px; opacity: 0.7; }
  </style>
</head>
<body>
  <div style="padding: 20px 0;">
    <div class="email-wrapper">
      <!-- Header: ${brand.companyName} ONLY -->
      <div class="header">
        ${logoHtml}
      </div>

      <!-- Greeting -->
      <div class="greeting">${greeting}</div>

      <!-- Main Content -->
      <div class="content">
        ${params.body.replace(/\n/g, '<br>')}
      </div>

      <!-- CTA -->
      <div class="cta-wrapper">
        <a href="${params.ctaUrl || '#'}" style="${brand.ctaStyle}">
          ${params.ctaText || brand.ctaText}
        </a>
      </div>

      <!-- Divider -->
      <div class="divider-wave"></div>

      <!-- Footer: ${brand.companyName} ONLY -->
      <div class="footer">
        <div class="footer-brand">${brand.companyName}</div>
        ${brand.email ? `<div style="font-size: 13px; opacity: 0.8;">${brand.email}</div>` : ''}
        ${brand.website ? `<div style="font-size: 13px; margin-top: 5px;"><a href="${brand.website}" style="color: ${brand.footerTextColor}; opacity: 0.8;">${brand.website.replace('https://', '')}</a></div>` : ''}
        ${brand.socialLinks.length > 0 ? `
        <div class="social-icons">
          ${brand.socialLinks.map(s => `<a href="${s.url}">${s.platform}</a>`).join(' · ')}
        </div>` : ''}
        <div class="unsubscribe">
          ${brand.unsubscribeText}<br>
          ${brand.legalNotice}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// TEMPLATE: MODERN (Tech/Default - clean, minimal, contemporary)
// ============================================================================

function generateModernTemplate(brand: BrandProfile, params: { subject: string; body: string; recipientName?: string; ctaUrl?: string; ctaText?: string }): string {
  const logoHtml = brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="${brand.companyName}" style="max-height: 40px;" />`
    : `<span style="color: #ffffff; font-weight: 600; font-size: 20px;">${brand.companyName}</span>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${brand.backgroundColor}; font-family: ${brand.fontFamily}; }
    .email-wrapper { max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: ${brand.borderRadius}; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: ${brand.headerBackground}; padding: 24px 36px; display: flex; align-items: center; }
    .content { padding: 36px; color: ${brand.textColor}; line-height: 1.75; font-size: ${brand.bodyFontSize}; }
    .content h2 { color: ${brand.primaryColor}; font-size: 20px; font-weight: 600; }
    .content p { margin-bottom: 14px; }
    .cta-wrapper { text-align: center; padding: 0 36px 36px; }
    .footer { background-color: ${brand.footerBackground}; padding: 28px 36px; color: ${brand.footerTextColor}; font-size: 12px; line-height: 1.6; }
    .footer a { color: ${brand.accentColor}; text-decoration: none; }
    .unsubscribe { margin-top: 16px; opacity: 0.6; font-size: 11px; }
  </style>
</head>
<body>
  <div style="padding: 24px 0;">
    <div class="email-wrapper">
      <!-- Header: ${brand.companyName} ONLY -->
      <div class="header">
        ${logoHtml}
      </div>

      <!-- Accent Line -->
      <div style="${brand.dividerStyle}"></div>

      <!-- Content -->
      <div class="content">
        ${params.body.replace(/\n/g, '<br>')}
      </div>

      <!-- CTA -->
      <div class="cta-wrapper">
        <a href="${params.ctaUrl || '#'}" style="${brand.ctaStyle}">
          ${params.ctaText || brand.ctaText}
        </a>
      </div>

      <!-- Footer: ${brand.companyName} ONLY -->
      <div class="footer">
        <strong>${brand.companyName}</strong><br>
        ${[brand.address, brand.phone, brand.email].filter(Boolean).join(' · ')}<br>
        ${brand.website ? `<a href="${brand.website}">${brand.website.replace('https://', '')}</a>` : ''}
        <div class="unsubscribe">
          ${brand.unsubscribeText}<br>
          ${brand.legalNotice}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// TEMPLATE: CLASSIC (Fallback - safe, universal)
// ============================================================================

function generateClassicTemplate(brand: BrandProfile, params: { subject: string; body: string; recipientName?: string; ctaUrl?: string; ctaText?: string }): string {
  const logoHtml = brand.logoUrl
    ? `<img src="${brand.logoUrl}" alt="${brand.companyName}" style="max-height: 50px;" />`
    : `<h1 style="margin: 0; color: #ffffff; font-size: 24px;">${brand.companyName}</h1>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: ${brand.fontFamily}; background-color: ${brand.backgroundColor};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 30px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: ${brand.borderRadius}; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <!-- Header: ${brand.companyName} ONLY -->
          <tr>
            <td style="padding: 28px 36px; background: ${brand.headerBackground}; text-align: center;">
              ${logoHtml}
            </td>
          </tr>
          <!-- Divider -->
          <tr><td style="${brand.dividerStyle}"></td></tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px; color: ${brand.textColor}; font-size: ${brand.bodyFontSize}; line-height: 1.75;">
              ${params.body.replace(/\n/g, '<br>')}
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 0 36px 36px;">
              <a href="${params.ctaUrl || '#'}" style="${brand.ctaStyle}">
                ${params.ctaText || brand.ctaText}
              </a>
            </td>
          </tr>
          <!-- Footer: ${brand.companyName} ONLY -->
          <tr>
            <td style="padding: 28px 36px; background-color: ${brand.footerBackground}; color: ${brand.footerTextColor}; font-size: 12px; line-height: 1.6;">
              <strong>${brand.companyName}</strong><br>
              ${[brand.address, brand.phone, brand.email].filter(Boolean).join('<br>')}<br>
              <div style="margin-top: 12px; opacity: 0.6; font-size: 11px;">
                ${brand.unsubscribeText}<br>
                ${brand.legalNotice}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// COHERENCE CHECK
// ============================================================================

/**
 * Pre-render coherence check:
 * 1. Verify the company name in the HTML matches the brand profile
 * 2. Verify no other company's logo/name appears in the HTML
 * 3. Verify color scheme matches the brand profile
 */
export function runCoherenceCheck(html: string, brand: BrandProfile): boolean {
  const errors: string[] = [];
  const htmlUpper = html.toUpperCase();
  const brandNameUpper = brand.companyName.toUpperCase();
  
  // Check 1: Brand name must appear in the HTML
  if (!htmlUpper.includes(brandNameUpper) && !htmlUpper.includes(brandNameUpper.replace(/\s+/g, ''))) {
    errors.push(`Company name "${brand.companyName}" not found in HTML`);
  }
  
  // Check 2: No other known brand names should appear (cross-contamination check)
  const knownBrands = ['FAGOR', 'PETLIFE', 'EPM', 'TECHSTART'];
  for (const otherBrand of knownBrands) {
    if (otherBrand === brandNameUpper || brandNameUpper.includes(otherBrand)) continue;
    
    // Check for other brand logos or names in header/footer sections
    const headerMatch = html.match(/<div class="header">([\s\S]*?)<\/div>/i);
    const footerMatch = html.match(/<div class="footer">([\s\S]*?)<\/div>/i);
    
    const headerContent = headerMatch ? headerMatch[1].toUpperCase() : '';
    const footerContent = footerMatch ? footerMatch[1].toUpperCase() : '';
    
    if (headerContent.includes(otherBrand)) {
      errors.push(`CROSS-CONTAMINATION: ${otherBrand} found in header of ${brand.companyName} email`);
    }
    if (footerContent.includes(otherBrand)) {
      errors.push(`CROSS-CONTAMINATION: ${otherBrand} found in footer of ${brand.companyName} email`);
    }
  }
  
  // Check 3: Brand's primary color should be present
  if (brand.primaryColor && !html.includes(brand.primaryColor)) {
    errors.push(`Brand color ${brand.primaryColor} not found in HTML`);
  }
  
  // Check 4: If brand has a logo URL, verify it's the correct one
  if (brand.logoUrl) {
    const logoRegex = /<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"/gi;
    let match;
    while ((match = logoRegex.exec(html)) !== null) {
      const imgSrc = match[1];
      const imgAlt = match[2].toUpperCase();
      
      // If there's a logo image, its alt text should match the brand
      if (imgSrc !== brand.logoUrl && imgAlt !== brandNameUpper) {
        // This might be a different company's logo
        for (const otherBrand of knownBrands) {
          if (otherBrand !== brandNameUpper && imgAlt.includes(otherBrand)) {
            errors.push(`LOGO CONTAMINATION: Image with alt "${match[2]}" found in ${brand.companyName} email`);
          }
        }
      }
    }
  }
  
  if (errors.length > 0) {
    console.error(`[BrandFirewall] ❌ Coherence check failed for ${brand.companyName}:`);
    errors.forEach(e => console.error(`  - ${e}`));
    return false;
  }
  
  console.log(`[BrandFirewall] ✅ Coherence check passed for ${brand.companyName}`);
  return true;
}

// ============================================================================
// SMS & CALL SCRIPT TEMPLATES (also brand-isolated)
// ============================================================================

/**
 * Generate brand-specific SMS template
 */
export async function generateBrandedSmsTemplate(params: {
  companyName: string;
  body: string;
  recipientName?: string;
}): Promise<string> {
  setActiveBrand(params.companyName);
  const brand = await getBrandProfile(params.companyName);
  
  const greeting = params.recipientName ? `Hola ${params.recipientName}` : 'Hola';
  const sms = `${greeting}, ${params.body.substring(0, 140)} - ${brand.companyName}${brand.website ? ' ' + brand.website.replace('https://', '') : ''}`;
  
  clearBrandContext();
  return sms;
}

/**
 * Generate brand-specific call script
 */
export async function generateBrandedCallScript(params: {
  companyName: string;
  body: string;
  recipientName?: string;
  campaignName?: string;
}): Promise<string> {
  setActiveBrand(params.companyName);
  const brand = await getBrandProfile(params.companyName);
  
  const script = `
═══════════════════════════════════════════════════
  GUIÓN DE LLAMADA - ${brand.companyName.toUpperCase()}
  Campaña: ${params.campaignName || 'General'}
═══════════════════════════════════════════════════

SALUDO:
"Buenos días/tardes, ${params.recipientName ? `¿hablo con ${params.recipientName}?` : '¿con quién tengo el gusto?'} 
Mi nombre es [AGENTE], le llamo de ${brand.companyName}."

PROPÓSITO:
${params.body}

CIERRE:
"¿Le gustaría agendar una reunión para profundizar en esto?
Puede contactarnos en ${brand.phone || brand.email || brand.website || 'nuestros canales habituales'}.
Muchas gracias por su tiempo."

═══════════════════════════════════════════════════
  ${brand.companyName} | ${brand.phone || ''} | ${brand.website || ''}
═══════════════════════════════════════════════════
`.trim();
  
  clearBrandContext();
  return script;
}

// ============================================================================
// UPDATE BRAND PROFILE (from Google Drive analysis)
// ============================================================================

/**
 * Update a brand profile with data from Google Drive analysis
 */
export function updateBrandProfile(companyName: string, updates: Partial<BrandProfile>): void {
  const normalized = companyName.toUpperCase().trim();
  const existing = brandProfileCache.get(normalized);
  
  if (existing) {
    const updated = { ...existing, ...updates };
    brandProfileCache.set(normalized, updated);
    console.log(`[BrandFirewall] Updated brand profile for ${companyName}`);
  } else {
    const base = createDefaultProfile(companyName);
    const updated = { ...base, ...updates };
    brandProfileCache.set(normalized, updated);
    console.log(`[BrandFirewall] Created new brand profile for ${companyName}`);
  }
}

/**
 * Invalidate cached brand profile (force reload from DB/Drive)
 */
export function invalidateBrandCache(companyName?: string): void {
  if (companyName) {
    brandProfileCache.delete(companyName.toUpperCase().trim());
    console.log(`[BrandFirewall] Invalidated cache for ${companyName}`);
  } else {
    brandProfileCache.clear();
    console.log(`[BrandFirewall] All brand caches invalidated`);
  }
}
