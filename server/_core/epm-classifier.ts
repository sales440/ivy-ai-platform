/**
 * EPM Construcciones - Automatic Classification System
 * 
 * Classifies leads and emergencies based on EPM-specific criteria:
 * - Lead priority by sector (educational, hotel, residential)
 * - Emergency classification by type (electrical, plumbing, HVAC, structural)
 * - Automatic scoring and routing
 */

export type LeadSector = "educational" | "hotel" | "residential" | "other";
export type LeadPriority = "high" | "medium" | "low";
export type EmergencyType = "electrical" | "plumbing" | "hvac" | "structural" | "other";
export type EmergencySeverity = "critical" | "urgent" | "normal";

export interface LeadClassification {
  sector: LeadSector;
  priority: LeadPriority;
  score: number; // 0-100
  reasons: string[];
  recommendedTemplate: "educational" | "hotel" | "residential";
  estimatedDealSize: number; // in MXN
  responseTimeTarget: string; // e.g., "2h", "24h"
}

export interface EmergencyClassification {
  type: EmergencyType;
  severity: EmergencySeverity;
  estimatedDuration: string; // e.g., "1-2h", "3-4h"
  requiredSkills: string[];
  recommendedTechnician: string | null;
  responseTimeTarget: string; // e.g., "30min", "2h"
}

/**
 * Classify lead based on company name, industry, and other factors
 */
export function classifyLead(data: {
  company: string;
  title?: string;
  industry?: string;
  location?: string;
  companySize?: string;
}): LeadClassification {
  const reasons: string[] = [];
  let score = 50; // Base score
  let sector: LeadSector = "other";
  let priority: LeadPriority = "medium";
  let estimatedDealSize = 45000; // Base deal size in MXN
  let responseTimeTarget = "24h";

  const companyLower = data.company.toLowerCase();
  const titleLower = (data.title || "").toLowerCase();
  const industryLower = (data.industry || "").toLowerCase();

  // Detect Educational Sector
  const educationalKeywords = [
    "escuela", "colegio", "universidad", "instituto", "preescolar", "primaria",
    "secundaria", "preparatoria", "bachillerato", "centro educativo", "kinder",
    "jardín de niños", "school", "college", "university", "academy"
  ];

  if (educationalKeywords.some(kw => companyLower.includes(kw) || industryLower.includes(kw))) {
    sector = "educational";
    score += 15;
    reasons.push("Sector educativo detectado");
    estimatedDealSize = 45000;
    responseTimeTarget = "2h"; // Schools need fast response during business hours
    
    // Higher priority for large schools
    if (companyLower.includes("universidad") || companyLower.includes("university")) {
      score += 10;
      estimatedDealSize = 80000;
      reasons.push("Universidad (alto valor)");
      priority = "high";
    } else if (companyLower.includes("preparatoria") || companyLower.includes("bachillerato")) {
      score += 5;
      estimatedDealSize = 60000;
      reasons.push("Preparatoria (valor medio-alto)");
      priority = "high";
    }
  }

  // Detect Hotel Sector
  const hotelKeywords = [
    "hotel", "resort", "motel", "posada", "hostal", "hospedaje",
    "casa de huéspedes", "inn", "lodge", "boutique hotel"
  ];

  if (hotelKeywords.some(kw => companyLower.includes(kw) || industryLower.includes(kw))) {
    sector = "hotel";
    score += 20;
    reasons.push("Sector hotelero detectado");
    estimatedDealSize = 80000; // Hotels pay more
    responseTimeTarget = "1h"; // Hotels need 24/7 fast response
    priority = "high";
    
    if (companyLower.includes("resort") || companyLower.includes("boutique")) {
      score += 15;
      estimatedDealSize = 120000;
      reasons.push("Resort/Boutique (muy alto valor)");
      priority = "high";
    }
  }

  // Detect Residential Sector
  const residentialKeywords = [
    "condominio", "fraccionamiento", "residencial", "departamentos",
    "condominios", "torres", "edificio", "condo", "apartment", "residential"
  ];

  if (residentialKeywords.some(kw => companyLower.includes(kw) || industryLower.includes(kw))) {
    sector = "residential";
    score += 10;
    reasons.push("Sector residencial detectado");
    estimatedDealSize = 50000;
    responseTimeTarget = "3h";
    priority = "medium";
    
    if (companyLower.includes("torres") || companyLower.includes("tower")) {
      score += 10;
      estimatedDealSize = 90000;
      reasons.push("Torre residencial (alto valor)");
      priority = "high";
    }
  }

  // Detect decision-maker titles
  const decisionMakerTitles = [
    "director", "gerente", "administrador", "coordinador", "jefe",
    "manager", "administrator", "supervisor", "responsable"
  ];

  if (decisionMakerTitles.some(title => titleLower.includes(title))) {
    score += 15;
    reasons.push("Contacto es tomador de decisiones");
  }

  // Location bonus (Oaxaca is local, easier to serve)
  if (data.location?.toLowerCase().includes("oaxaca")) {
    score += 10;
    reasons.push("Ubicación en Oaxaca (local)");
  }

  // Company size bonus
  if (data.companySize) {
    const sizeLower = data.companySize.toLowerCase();
    if (sizeLower.includes("1000+") || sizeLower.includes("large")) {
      score += 15;
      estimatedDealSize *= 1.5;
      reasons.push("Empresa grande (alto potencial)");
      priority = "high";
    } else if (sizeLower.includes("201-1000") || sizeLower.includes("medium")) {
      score += 10;
      estimatedDealSize *= 1.2;
      reasons.push("Empresa mediana (buen potencial)");
    }
  }

  // Determine final priority based on score
  if (score >= 80) {
    priority = "high";
  } else if (score >= 60) {
    priority = "medium";
  } else {
    priority = "low";
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return {
    sector,
    priority,
    score,
    reasons,
    recommendedTemplate: sector === "other" ? "residential" : sector,
    estimatedDealSize: Math.round(estimatedDealSize),
    responseTimeTarget,
  };
}

/**
 * Classify emergency ticket based on description and title
 */
export function classifyEmergency(data: {
  title: string;
  description: string;
  category?: string;
}): EmergencyClassification {
  const titleLower = data.title.toLowerCase();
  const descLower = data.description.toLowerCase();
  const combined = `${titleLower} ${descLower}`;

  let type: EmergencyType = "other";
  let severity: EmergencySeverity = "normal";
  let estimatedDuration = "2-3h";
  const requiredSkills: string[] = [];
  let responseTimeTarget = "2h";

  // Detect Electrical emergencies
  const electricalKeywords = [
    "luz", "electricidad", "eléctrico", "apagón", "corto circuito",
    "tablero", "interruptor", "cable", "contacto", "foco", "lámpara",
    "electrical", "power", "electricity", "circuit", "breaker", "wiring"
  ];

  if (electricalKeywords.some(kw => combined.includes(kw))) {
    type = "electrical";
    requiredSkills.push("Electricista certificado");
    estimatedDuration = "1-2h";
    
    // Check severity
    if (combined.includes("apagón") || combined.includes("total") || combined.includes("corto circuito")) {
      severity = "critical";
      responseTimeTarget = "30min";
    } else if (combined.includes("urgente") || combined.includes("emergency")) {
      severity = "urgent";
      responseTimeTarget = "1h";
    }
  }

  // Detect Plumbing emergencies
  const plumbingKeywords = [
    "agua", "fuga", "tubería", "drenaje", "baño", "sanitario", "tinaco",
    "cisterna", "llave", "inodoro", "regadera", "lavabo", "plomería",
    "plumbing", "leak", "pipe", "drain", "toilet", "faucet", "water"
  ];

  if (plumbingKeywords.some(kw => combined.includes(kw))) {
    type = "plumbing";
    requiredSkills.push("Plomero");
    estimatedDuration = "2-3h";
    
    if (combined.includes("fuga") || combined.includes("inundación") || combined.includes("leak") || combined.includes("flood")) {
      severity = "critical";
      responseTimeTarget = "30min";
    } else if (combined.includes("urgente") || combined.includes("emergency")) {
      severity = "urgent";
      responseTimeTarget = "1h";
    }
  }

  // Detect HVAC emergencies
  const hvacKeywords = [
    "aire acondicionado", "clima", "calefacción", "ventilación", "hvac",
    "climatización", "ac", "heating", "cooling", "ventilation", "air conditioning"
  ];

  if (hvacKeywords.some(kw => combined.includes(kw))) {
    type = "hvac";
    requiredSkills.push("Técnico HVAC");
    estimatedDuration = "2-4h";
    
    // HVAC is rarely critical unless in extreme weather
    if (combined.includes("calor extremo") || combined.includes("frío extremo") || combined.includes("hotel")) {
      severity = "urgent";
      responseTimeTarget = "2h";
    }
  }

  // Detect Structural emergencies
  const structuralKeywords = [
    "grieta", "fisura", "estructura", "techo", "pared", "columna",
    "viga", "derrumbe", "hundimiento", "structural", "crack", "collapse",
    "ceiling", "wall", "foundation"
  ];

  if (structuralKeywords.some(kw => combined.includes(kw))) {
    type = "structural";
    requiredSkills.push("Ingeniero estructural", "Albañil especializado");
    estimatedDuration = "4-8h";
    
    if (combined.includes("derrumbe") || combined.includes("colapso") || combined.includes("peligro") || combined.includes("collapse")) {
      severity = "critical";
      responseTimeTarget = "30min";
    } else {
      severity = "urgent";
      responseTimeTarget = "2h";
    }
  }

  // Check for urgency keywords
  const urgencyKeywords = ["urgente", "emergencia", "crítico", "inmediato", "emergency", "urgent", "critical", "immediate"];
  if (urgencyKeywords.some(kw => combined.includes(kw)) && severity === "normal") {
    severity = "urgent";
    responseTimeTarget = "1h";
  }

  return {
    type,
    severity,
    estimatedDuration,
    requiredSkills,
    recommendedTechnician: null, // TODO: Implement technician assignment logic
    responseTimeTarget,
  };
}

/**
 * Get recommended email template based on lead classification
 */
export function getRecommendedTemplate(classification: LeadClassification): string {
  return classification.recommendedTemplate;
}

/**
 * Get recommended technician based on emergency classification
 * (Placeholder - would integrate with technician availability system)
 */
export function getRecommendedTechnician(classification: EmergencyClassification): string | null {
  // TODO: Implement logic to match emergency type with available technicians
  // For now, return null (manual assignment required)
  return null;
}
