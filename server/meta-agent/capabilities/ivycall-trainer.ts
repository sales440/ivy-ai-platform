/**
 * IvyCall Training Service
 * 
 * Specialized training system for IvyCall agent with:
 * - Fresh call scripts based on market trends
 * - Modern engagement techniques
 * - Updated objection handling
 * - Optimized value propositions
 * - Industry best practices
 */

import { invokeLLM } from '../../_core/llm';
import { searchWeb, scrapeWebPage } from './web-search';
import { detectMarketTrends, MarketInsight } from './market-intelligence';
import { getDb } from '../../db';
import { knowledgeBase } from '../../../drizzle/schema';

export interface CallScript {
  id: string;
  name: string;
  industry: string;
  objective: 'prospecting' | 'qualification' | 'follow-up' | 'closing';
  opening: string;
  valueProposition: string;
  qualificationQuestions: string[];
  objectionHandling: Record<string, string>;
  closingTechniques: string[];
  toneGuidelines: string;
  bestTimeToCall: string;
  avgDuration: string;
  successRate?: number;
  source: string;
  createdAt: Date;
}

export interface EngagementTechnique {
  id: string;
  name: string;
  description: string;
  whenToUse: string;
  example: string;
  effectiveness: number; // 0-100
  source: string;
}

export interface ObjectionResponse {
  objection: string;
  category: 'price' | 'timing' | 'authority' | 'need' | 'competition';
  responses: string[];
  effectiveness: number;
  context: string;
}

export interface IvyCallTrainingData {
  scripts: CallScript[];
  techniques: EngagementTechnique[];
  objections: ObjectionResponse[];
  valueProps: string[];
  marketInsights: MarketInsight[];
  updatedAt: Date;
}

/**
 * Generate fresh call scripts based on market trends
 */
export async function generateCallScripts(
  industry: string,
  objective: CallScript['objective']
): Promise<CallScript[]> {
  console.log(`[IvyCall Trainer] Generating call scripts for ${industry} - ${objective}`);

  // Search for best practices and successful scripts
  const searchQueries = [
    `${industry} cold calling scripts 2025`,
    `best ${objective} call scripts ${industry}`,
    `successful sales call techniques ${industry}`
  ];

  const scripts: CallScript[] = [];

  for (const query of searchQueries) {
    const results = await searchWeb(query, 3);

    for (const result of results) {
      try {
        const content = await scrapeWebPage(result.url);
        if (!content) continue;

        // Use LLM to extract and generate script
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en ventas telefónicas y cold calling. Analiza contenido y genera scripts efectivos, modernos y probados.'
            },
            {
              role: 'user',
              content: `Basándote en este contenido sobre ${industry}:\n\n${content.content.substring(0, 4000)}\n\nGenera un script de llamada para ${objective} que incluya:\n1. Apertura impactante (15-20 segundos)\n2. Propuesta de valor clara\n3. 3-5 preguntas de calificación\n4. Manejo de 5 objeciones comunes\n5. 3 técnicas de cierre\n6. Guías de tono y timing`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'call_script',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  opening: { type: 'string' },
                  valueProposition: { type: 'string' },
                  qualificationQuestions: { type: 'array', items: { type: 'string' } },
                  objectionHandling: {
                    type: 'object',
                    properties: {
                      price: { type: 'string' },
                      timing: { type: 'string' },
                      authority: { type: 'string' },
                      need: { type: 'string' },
                      competition: { type: 'string' }
                    },
                    required: ['price', 'timing', 'authority', 'need', 'competition'],
                    additionalProperties: false
                  },
                  closingTechniques: { type: 'array', items: { type: 'string' } },
                  toneGuidelines: { type: 'string' },
                  bestTimeToCall: { type: 'string' },
                  avgDuration: { type: 'string' }
                },
                required: ['name', 'opening', 'valueProposition', 'qualificationQuestions', 'objectionHandling', 'closingTechniques', 'toneGuidelines', 'bestTimeToCall', 'avgDuration'],
                additionalProperties: false
              }
            }
          }
        });

        const scriptData = JSON.parse(response.choices[0].message.content || '{}');

        scripts.push({
          id: `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: scriptData.name,
          industry,
          objective,
          opening: scriptData.opening,
          valueProposition: scriptData.valueProposition,
          qualificationQuestions: scriptData.qualificationQuestions,
          objectionHandling: scriptData.objectionHandling,
          closingTechniques: scriptData.closingTechniques,
          toneGuidelines: scriptData.toneGuidelines,
          bestTimeToCall: scriptData.bestTimeToCall,
          avgDuration: scriptData.avgDuration,
          source: result.url,
          createdAt: new Date()
        });
      } catch (error) {
        console.error('[IvyCall Trainer] Error generating script:', error);
      }
    }
  }

  return scripts;
}

/**
 * Discover fresh engagement techniques
 */
export async function discoverEngagementTechniques(industry: string): Promise<EngagementTechnique[]> {
  console.log(`[IvyCall Trainer] Discovering engagement techniques for ${industry}`);

  const query = `${industry} cold calling engagement techniques 2025 best practices`;
  const results = await searchWeb(query, 5);

  const techniques: EngagementTechnique[] = [];

  for (const result of results) {
    try {
      const content = await scrapeWebPage(result.url);
      if (!content) continue;

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en técnicas de enganche y persuasión telefónica. Identifica técnicas modernas y efectivas.'
          },
          {
            role: 'user',
            content: `Del siguiente contenido:\n\n${content.content.substring(0, 3000)}\n\nExtrae 3 técnicas de enganche efectivas con ejemplos prácticos.`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'engagement_techniques',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                techniques: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      whenToUse: { type: 'string' },
                      example: { type: 'string' },
                      effectiveness: { type: 'number' }
                    },
                    required: ['name', 'description', 'whenToUse', 'example', 'effectiveness'],
                    additionalProperties: false
                  }
                }
              },
              required: ['techniques'],
              additionalProperties: false
            }
          }
        }
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');

      for (const tech of data.techniques || []) {
        techniques.push({
          id: `tech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: tech.name,
          description: tech.description,
          whenToUse: tech.whenToUse,
          example: tech.example,
          effectiveness: tech.effectiveness,
          source: result.url
        });
      }
    } catch (error) {
      console.error('[IvyCall Trainer] Error discovering techniques:', error);
    }
  }

  return techniques.sort((a, b) => b.effectiveness - a.effectiveness);
}

/**
 * Generate modern objection responses
 */
export async function generateObjectionResponses(industry: string): Promise<ObjectionResponse[]> {
  console.log(`[IvyCall Trainer] Generating objection responses for ${industry}`);

  const query = `${industry} sales objections handling 2025`;
  const results = await searchWeb(query, 3);

  const objections: ObjectionResponse[] = [];

  for (const result of results) {
    try {
      const content = await scrapeWebPage(result.url);
      if (!content) continue;

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en manejo de objeciones de ventas. Genera respuestas efectivas y modernas.'
          },
          {
            role: 'user',
            content: `Basándote en:\n\n${content.content.substring(0, 3000)}\n\nGenera respuestas para las 5 objeciones más comunes en ${industry}.`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'objection_responses',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                objections: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      objection: { type: 'string' },
                      category: { type: 'string', enum: ['price', 'timing', 'authority', 'need', 'competition'] },
                      responses: { type: 'array', items: { type: 'string' } },
                      effectiveness: { type: 'number' },
                      context: { type: 'string' }
                    },
                    required: ['objection', 'category', 'responses', 'effectiveness', 'context'],
                    additionalProperties: false
                  }
                }
              },
              required: ['objections'],
              additionalProperties: false
            }
          }
        }
      });

      const data = JSON.parse(response.choices[0].message.content || '{}');
      objections.push(...(data.objections || []));
    } catch (error) {
      console.error('[IvyCall Trainer] Error generating objection responses:', error);
    }
  }

  return objections;
}

/**
 * Complete IvyCall training cycle
 */
export async function trainIvyCall(config: {
  industry: string;
  objectives: CallScript['objective'][];
}): Promise<IvyCallTrainingData> {
  console.log('[IvyCall Trainer] Starting complete training cycle...');

  // 1. Generate call scripts for each objective
  const scripts: CallScript[] = [];
  for (const objective of config.objectives) {
    const objectiveScripts = await generateCallScripts(config.industry, objective);
    scripts.push(...objectiveScripts);
  }
  console.log(`[IvyCall Trainer] Generated ${scripts.length} call scripts`);

  // 2. Discover engagement techniques
  const techniques = await discoverEngagementTechniques(config.industry);
  console.log(`[IvyCall Trainer] Discovered ${techniques.length} engagement techniques`);

  // 3. Generate objection responses
  const objections = await generateObjectionResponses(config.industry);
  console.log(`[IvyCall Trainer] Generated ${objections.length} objection responses`);

  // 4. Detect market insights for value propositions
  const insights = await detectMarketTrends(config.industry, ['value proposition', 'competitive advantage', 'customer pain points']);
  console.log(`[IvyCall Trainer] Detected ${insights.length} market insights`);

  // 5. Extract value propositions from insights
  const valueProps = insights
    .filter(i => i.relevance >= 70)
    .flatMap(i => i.actionableItems)
    .slice(0, 10);

  // 6. Save to knowledge base
  await saveTrainingToKnowledgeBase({
    scripts,
    techniques,
    objections,
    valueProps,
    industry: config.industry
  });

  return {
    scripts,
    techniques,
    objections,
    valueProps,
    marketInsights: insights,
    updatedAt: new Date()
  };
}

/**
 * Save training data to knowledge base
 */
async function saveTrainingToKnowledgeBase(data: {
  scripts: CallScript[];
  techniques: EngagementTechnique[];
  objections: ObjectionResponse[];
  valueProps: string[];
  industry: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Save scripts
    for (const script of data.scripts) {
      const content = `# ${script.name}\n\n**Industria:** ${script.industry}\n**Objetivo:** ${script.objective}\n\n## Apertura\n${script.opening}\n\n## Propuesta de Valor\n${script.valueProposition}\n\n## Preguntas de Calificación\n${script.qualificationQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n## Manejo de Objeciones\n${Object.entries(script.objectionHandling).map(([key, val]) => `**${key}:** ${val}`).join('\n\n')}\n\n## Técnicas de Cierre\n${script.closingTechniques.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n## Guías de Tono\n${script.toneGuidelines}\n\n**Mejor momento:** ${script.bestTimeToCall}\n**Duración promedio:** ${script.avgDuration}`;

      await db.insert(knowledgeBase).values({
        title: `Script: ${script.name}`,
        content,
        category: 'call-script',
        tags: JSON.stringify(['ivycall', 'script', script.objective, data.industry]),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Save techniques
    const techniquesContent = `# Técnicas de Enganche - ${data.industry}\n\n${data.techniques.map(t => `## ${t.name}\n\n${t.description}\n\n**Cuándo usar:** ${t.whenToUse}\n\n**Ejemplo:** ${t.example}\n\n**Efectividad:** ${t.effectiveness}/100`).join('\n\n---\n\n')}`;

    await db.insert(knowledgeBase).values({
      title: `Técnicas de Enganche - ${data.industry}`,
      content: techniquesContent,
      category: 'engagement-techniques',
      tags: JSON.stringify(['ivycall', 'techniques', data.industry]),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('[IvyCall Trainer] Training data saved to knowledge base');
  } catch (error) {
    console.error('[IvyCall Trainer] Error saving to KB:', error);
  }
}
