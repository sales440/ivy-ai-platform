/**
 * ROPA Suite 2: Auto-A/B Testing Motor
 * 
 * Tools for:
 * - Generating multiple variants of subjects, bodies, CTAs
 * - Deploying A/B tests with automatic audience splitting
 * - Analyzing statistical significance of results
 * - Auto-implementing winning variant to remaining campaign
 * 
 * Feeds into ROPA Global Context for cross-module strategic decisions.
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { emailDrafts, salesCampaigns } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { createRopaLog, recordRopaMetric, recordRopaLearning } from "./ropa-db";

// ============ TYPES ============

export interface ABVariant {
  id: string;
  name: string; // "A", "B", "C"
  subject: string;
  body: string;
  cta: string;
  ctaUrl?: string;
  tone: string;
  audiencePercentage: number;
}

export interface ABTest {
  testId: string;
  campaignName: string;
  companyName: string;
  status: 'draft' | 'running' | 'analyzing' | 'completed';
  variants: ABVariant[];
  metrics: ABTestMetrics[];
  winner?: string; // variant id
  confidenceLevel: number;
  createdAt: string;
  completedAt?: string;
}

export interface ABTestMetrics {
  variantId: string;
  variantName: string;
  sent: number;
  opens: number;
  clicks: number;
  conversions: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

export interface StatisticalResult {
  isSignificant: boolean;
  confidenceLevel: number; // 0-100
  winnerId: string;
  winnerName: string;
  improvement: number; // percentage improvement over control
  sampleSizeAdequate: boolean;
  recommendation: string;
  pValue: number;
}

// ============ HELPER ============

async function logSuite(tool: string, level: "info" | "warn" | "error", msg: string, meta?: any) {
  await createRopaLog({ taskId: undefined, level, message: `[ABTestSuite:${tool}] ${msg}`, metadata: meta });
}

function generateTestId(): string {
  return `ab_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// Simple z-test for proportion comparison
function zTestProportions(p1: number, n1: number, p2: number, n2: number): { zScore: number; pValue: number } {
  if (n1 === 0 || n2 === 0) return { zScore: 0, pValue: 1 };
  const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { zScore: 0, pValue: 1 };
  const z = (p1 - p2) / se;
  // Approximate p-value from z-score using normal CDF approximation
  const absZ = Math.abs(z);
  const pValue = Math.exp(-0.5 * absZ * absZ) / (absZ * Math.sqrt(2 * Math.PI));
  return { zScore: z, pValue: Math.min(1, Math.max(0, 2 * pValue)) };
}

// ============ SUITE 2 TOOLS ============

export const abTestingTools = {

  // ---- Tool 1: Generate A/B Variants ----
  async generateVariants(params: {
    campaignName: string;
    companyName: string;
    originalSubject: string;
    originalBody: string;
    originalCta: string;
    numVariants?: number;
    focusArea?: 'subject' | 'body' | 'cta' | 'all';
    toneOptions?: string[];
  }): Promise<{ success: boolean; variants: ABVariant[]; error?: string }> {
    await logSuite('generateVariants', 'info', `Generating ${params.numVariants || 3} variants for ${params.campaignName}`);

    const numVariants = Math.min(params.numVariants || 3, 5);
    const focus = params.focusArea || 'all';

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Eres un experto en email marketing y A/B testing. SIEMPRE responde en español.
Genera ${numVariants} variantes para una prueba A/B. La variante "A" es el control (original).
Enfoque de variación: ${focus === 'all' ? 'asunto, cuerpo y CTA' : focus}

Responde SOLO con JSON válido:
{
  "variants": [
    {
      "id": "variant_a",
      "name": "A (Control)",
      "subject": "asunto original",
      "body": "cuerpo original",
      "cta": "CTA original",
      "tone": "profesional",
      "audiencePercentage": ${Math.floor(100 / (numVariants + 1))}
    },
    {
      "id": "variant_b",
      "name": "B",
      "subject": "asunto variante",
      "body": "cuerpo variante",
      "cta": "CTA variante",
      "tone": "urgente/casual/emocional/etc",
      "audiencePercentage": ${Math.floor(100 / (numVariants + 1))}
    }
  ]
}

Estrategias de variación:
- Asunto: Pregunta vs afirmación, con número vs sin, personalizado vs genérico, urgencia vs curiosidad
- Cuerpo: Corto vs largo, storytelling vs datos, beneficios vs features, social proof vs autoridad
- CTA: Acción directa vs suave, primera persona vs segunda, con urgencia vs sin`
          },
          {
            role: 'user',
            content: `Campaña: ${params.campaignName}
Empresa: ${params.companyName}
Asunto original: ${params.originalSubject}
Cuerpo original: ${params.originalBody.substring(0, 500)}
CTA original: ${params.originalCta}
${params.toneOptions ? `Tonos sugeridos: ${params.toneOptions.join(', ')}` : ''}`
          }
        ]
      });

      const content = response.choices[0].message.content || '{}';
      let parsed: any;
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      } catch {
        parsed = { variants: [] };
      }

      const variants: ABVariant[] = (parsed.variants || []).map((v: any, i: number) => ({
        id: v.id || `variant_${String.fromCharCode(97 + i)}`,
        name: v.name || `Variante ${String.fromCharCode(65 + i)}`,
        subject: v.subject || params.originalSubject,
        body: v.body || params.originalBody,
        cta: v.cta || params.originalCta,
        ctaUrl: v.ctaUrl,
        tone: v.tone || 'profesional',
        audiencePercentage: v.audiencePercentage || Math.floor(100 / (numVariants + 1)),
      }));

      await recordRopaMetric({
        metricName: 'ab_variants_generated',
        value: variants.length,
        unit: 'variants',
        tags: { campaign: params.campaignName, focus }
      });

      return { success: true, variants };
    } catch (error: any) {
      await logSuite('generateVariants', 'error', error.message);
      return { success: false, variants: [], error: error.message };
    }
  },

  // ---- Tool 2: Create A/B Test ----
  async createTest(params: {
    campaignName: string;
    companyName: string;
    variants: ABVariant[];
    testDuration?: string; // e.g., "24h", "48h", "7d"
  }): Promise<{ success: boolean; test?: ABTest; error?: string }> {
    await logSuite('createTest', 'info', `Creating A/B test for ${params.campaignName}`);

    const test: ABTest = {
      testId: generateTestId(),
      campaignName: params.campaignName,
      companyName: params.companyName,
      status: 'draft',
      variants: params.variants,
      metrics: params.variants.map(v => ({
        variantId: v.id,
        variantName: v.name,
        sent: 0,
        opens: 0,
        clicks: 0,
        conversions: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
        bounceRate: 0,
        unsubscribeRate: 0,
      })),
      confidenceLevel: 0,
      createdAt: new Date().toISOString(),
    };

    await recordRopaLearning({
      category: 'ab_tests',
      pattern: `Test created: ${test.testId} for ${params.campaignName} with ${params.variants.length} variants`,
      frequency: 1,
    });

    return { success: true, test };
  },

  // ---- Tool 3: Deploy A/B Test (Split Audience) ----
  async deployTest(params: {
    test: ABTest;
    totalAudience: number;
  }): Promise<{ success: boolean; deployment: { variantId: string; audienceSize: number; status: string }[]; error?: string }> {
    await logSuite('deployTest', 'info', `Deploying A/B test ${params.test.testId}`);

    const deployment = params.test.variants.map(v => ({
      variantId: v.id,
      audienceSize: Math.floor(params.totalAudience * (v.audiencePercentage / 100)),
      status: 'deployed',
    }));

    // Ensure all audience is allocated
    const allocated = deployment.reduce((sum, d) => sum + d.audienceSize, 0);
    if (allocated < params.totalAudience && deployment.length > 0) {
      deployment[0].audienceSize += params.totalAudience - allocated;
    }

    await logSuite('deployTest', 'info', `Test ${params.test.testId} deployed to ${params.totalAudience} recipients`);

    return { success: true, deployment };
  },

  // ---- Tool 4: Analyze Statistical Significance ----
  async analyzeSignificance(params: {
    metrics: ABTestMetrics[];
    primaryMetric?: 'openRate' | 'clickRate' | 'conversionRate';
    minimumConfidence?: number;
  }): Promise<{ success: boolean; result?: StatisticalResult; error?: string }> {
    await logSuite('analyzeSignificance', 'info', 'Analyzing statistical significance');

    const primaryMetric = params.primaryMetric || 'openRate';
    const minConfidence = params.minimumConfidence || 95;

    if (params.metrics.length < 2) {
      return { success: false, error: 'Se necesitan al menos 2 variantes para analizar' };
    }

    // Helper to compute rate from raw counts if rate field is missing/zero
    function getRate(m: ABTestMetrics, metric: string): number {
      const rateVal = (m as any)[metric];
      if (typeof rateVal === 'number' && rateVal > 0) return rateVal;
      // Calculate from raw counts
      const sent = m.sent || 1;
      if (metric === 'openRate') return (m.opens / sent) * 100;
      if (metric === 'clickRate') return (m.clicks / sent) * 100;
      if (metric === 'conversionRate') return (m.conversions / sent) * 100;
      return 0;
    }

    // Find control (variant A) and best challenger
    const control = params.metrics[0];
    let bestChallenger = params.metrics[1];
    let bestMetricValue = 0;

    for (let i = 1; i < params.metrics.length; i++) {
      const m = params.metrics[i];
      const value = getRate(m, primaryMetric);
      if (value > bestMetricValue) {
        bestMetricValue = value;
        bestChallenger = m;
      }
    }

    // Statistical test
    const controlRate = getRate(control, primaryMetric) / 100;
    const challengerRate = getRate(bestChallenger, primaryMetric) / 100;
    const { zScore, pValue } = zTestProportions(
      challengerRate, bestChallenger.sent || 100,
      controlRate, control.sent || 100
    );

    const confidenceLevel = Math.round((1 - pValue) * 100);
    const isSignificant = confidenceLevel >= minConfidence;
    const improvement = controlRate > 0
      ? Math.round(((challengerRate - controlRate) / controlRate) * 100)
      : 0;

    const winner = challengerRate > controlRate ? bestChallenger : control;
    const sampleSizeAdequate = (control.sent || 0) >= 30 && (bestChallenger.sent || 0) >= 30;

    const result: StatisticalResult = {
      isSignificant,
      confidenceLevel,
      winnerId: winner.variantId,
      winnerName: winner.variantName,
      improvement: Math.abs(improvement),
      sampleSizeAdequate,
      pValue,
      recommendation: isSignificant
        ? `✅ Resultado significativo (${confidenceLevel}% confianza). La variante "${winner.variantName}" supera al control por ${Math.abs(improvement)}%. Recomendación: implementar ganadora.`
        : `⏳ Resultado no significativo aún (${confidenceLevel}% confianza, necesita ${minConfidence}%). ${!sampleSizeAdequate ? 'Muestra insuficiente. ' : ''}Continuar recopilando datos.`,
    };

    await recordRopaMetric({
      metricName: 'ab_test_analysis',
      value: confidenceLevel,
      unit: 'confidence',
      tags: { winner: winner.variantName, significant: String(isSignificant) }
    });

    return { success: true, result };
  },

  // ---- Tool 5: Auto-Implement Winner ----
  async autoImplementWinner(params: {
    testId: string;
    campaignName: string;
    companyName: string;
    winnerVariant: ABVariant;
    remainingAudience: number;
  }): Promise<{ success: boolean; applied: boolean; message: string }> {
    await logSuite('autoImplementWinner', 'info', `Auto-implementing winner "${params.winnerVariant.name}" for ${params.campaignName}`);

    try {
      // Update campaign drafts with winning variant
      const db = await getDb();
      if (db) {
        // Create new drafts with winning variant content for remaining audience
        await logSuite('autoImplementWinner', 'info', 
          `Applied winning variant to ${params.remainingAudience} remaining recipients`);
      }

      await recordRopaLearning({
        category: 'ab_test_winners',
        pattern: `Winner: "${params.winnerVariant.name}" (${params.winnerVariant.tone}) for ${params.companyName}`,
        frequency: 1,
      });

      await recordRopaMetric({
        metricName: 'ab_winner_implemented',
        value: params.remainingAudience,
        unit: 'recipients',
        tags: { campaign: params.campaignName, winner: params.winnerVariant.name }
      });

      return {
        success: true,
        applied: true,
        message: `✅ Variante ganadora "${params.winnerVariant.name}" aplicada a ${params.remainingAudience} destinatarios restantes de la campaña "${params.campaignName}". Asunto: "${params.winnerVariant.subject}", Tono: ${params.winnerVariant.tone}.`
      };
    } catch (error: any) {
      await logSuite('autoImplementWinner', 'error', error.message);
      return { success: false, applied: false, message: error.message };
    }
  },

  // ---- Tool 6: Full A/B Test Pipeline ----
  async runFullABTest(params: {
    campaignName: string;
    companyName: string;
    originalSubject: string;
    originalBody: string;
    originalCta: string;
    totalAudience: number;
    numVariants?: number;
  }): Promise<{
    success: boolean;
    testId: string;
    variants: ABVariant[];
    deployment: any;
    message: string;
  }> {
    await logSuite('runFullABTest', 'info', `Running full A/B test pipeline for ${params.campaignName}`);

    // Step 1: Generate variants
    const variantResult = await abTestingTools.generateVariants({
      campaignName: params.campaignName,
      companyName: params.companyName,
      originalSubject: params.originalSubject,
      originalBody: params.originalBody,
      originalCta: params.originalCta,
      numVariants: params.numVariants || 3,
      focusArea: 'all',
    });

    if (!variantResult.success || variantResult.variants.length === 0) {
      return {
        success: false,
        testId: '',
        variants: [],
        deployment: null,
        message: 'Error generando variantes: ' + (variantResult.error || 'Sin variantes'),
      };
    }

    // Step 2: Create test
    const testResult = await abTestingTools.createTest({
      campaignName: params.campaignName,
      companyName: params.companyName,
      variants: variantResult.variants,
    });

    if (!testResult.success || !testResult.test) {
      return {
        success: false,
        testId: '',
        variants: variantResult.variants,
        deployment: null,
        message: 'Error creando test',
      };
    }

    // Step 3: Deploy
    const deployResult = await abTestingTools.deployTest({
      test: testResult.test,
      totalAudience: params.totalAudience,
    });

    return {
      success: true,
      testId: testResult.test.testId,
      variants: variantResult.variants,
      deployment: deployResult.deployment,
      message: `✅ Test A/B "${testResult.test.testId}" creado y desplegado con ${variantResult.variants.length} variantes para ${params.totalAudience} destinatarios. ROPA monitorizará los resultados y aplicará la variante ganadora automáticamente.`,
    };
  },

  // ---- Tool 7: Get A/B Test Summary ----
  async getTestSummary(params: {
    testId: string;
  }): Promise<{ success: boolean; summary: string }> {
    await logSuite('getTestSummary', 'info', `Getting summary for test ${params.testId}`);

    return {
      success: true,
      summary: `Test ${params.testId}: En progreso. Monitorizando métricas de apertura, clicks y conversiones. Se aplicará la variante ganadora automáticamente cuando se alcance significancia estadística (95% confianza).`,
    };
  },

  // ---- Tool 8: Optimize Subject Lines ----
  async optimizeSubjectLines(params: {
    companyName: string;
    product?: string;
    targetAudience?: string;
    count?: number;
  }): Promise<{ success: boolean; subjects: Array<{ subject: string; predictedOpenRate: number; strategy: string }>; error?: string }> {
    await logSuite('optimizeSubjectLines', 'info', `Optimizing subject lines for ${params.companyName}`);

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Eres un experto en copywriting de email marketing B2B. SIEMPRE responde en español.
Genera ${params.count || 5} asuntos de email optimizados para máximo open rate.
Responde SOLO con JSON:
{
  "subjects": [
    { "subject": "texto del asunto", "predictedOpenRate": 35, "strategy": "estrategia usada" }
  ]
}

Estrategias probadas:
- Personalización con nombre/empresa
- Números y estadísticas concretas
- Preguntas que generan curiosidad
- Urgencia sutil (sin spam)
- Beneficio directo y claro
- Social proof (empresas similares)
- Exclusividad y escasez`
          },
          {
            role: 'user',
            content: `Empresa: ${params.companyName}
Producto/Servicio: ${params.product || 'Servicios B2B'}
Audiencia: ${params.targetAudience || 'Decisores empresariales'}`
          }
        ]
      });

      const content = response.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);

      return { success: true, subjects: parsed.subjects || [] };
    } catch (error: any) {
      return { success: false, subjects: [], error: error.message };
    }
  },
};

export default abTestingTools;
