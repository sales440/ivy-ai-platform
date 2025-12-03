/**
 * Market Intelligence Service for Meta-Agent
 * 
 * Provides real-time market monitoring, competitor analysis, trend detection,
 * and automatic learning capabilities to improve agent performance
 */

import { searchWeb, scrapeWebPage, fetchPublicAPI, monitorWebsite } from './web-search';
import { invokeLLM } from '../../_core/llm';
import { getDb } from '../../db';
import { knowledgeBase } from '../../../drizzle/schema';

export interface MarketInsight {
  id: string;
  category: 'competitor' | 'innovation' | 'pricing' | 'trend' | 'best-practice';
  title: string;
  summary: string;
  source: string;
  url?: string;
  relevance: number; // 0-100
  actionableItems: string[];
  timestamp: Date;
}

export interface CompetitorInfo {
  name: string;
  website: string;
  products: string[];
  pricing: string[];
  features: string[];
  strengths: string[];
  weaknesses: string[];
  lastUpdated: Date;
}

export interface AgentTrainingData {
  agentType: 'prospect' | 'closer' | 'solve' | 'logic' | 'talent' | 'insight';
  insights: MarketInsight[];
  recommendations: string[];
  updatedKnowledge: string[];
  trainingDate: Date;
}

/**
 * Monitor competitors and extract key information
 */
export async function monitorCompetitors(competitorUrls: string[]): Promise<CompetitorInfo[]> {
  const competitors: CompetitorInfo[] = [];

  for (const url of competitorUrls) {
    try {
      const pageContent = await scrapeWebPage(url);
      if (!pageContent) continue;

      // Use LLM to analyze competitor page
      const analysis = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: 'Eres un analista de competencia experto. Analiza el contenido de la página web y extrae información clave sobre productos, precios, características, fortalezas y debilidades.'
          },
          {
            role: 'user',
            content: `Analiza esta página de competidor:\n\nTítulo: ${pageContent.title}\n\nContenido: ${pageContent.content.substring(0, 5000)}\n\nExtrae: productos, precios, características clave, fortalezas y debilidades.`
          }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'competitor_analysis',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                products: { type: 'array', items: { type: 'string' } },
                pricing: { type: 'array', items: { type: 'string' } },
                features: { type: 'array', items: { type: 'string' } },
                strengths: { type: 'array', items: { type: 'string' } },
                weaknesses: { type: 'array', items: { type: 'string' } }
              },
              required: ['name', 'products', 'pricing', 'features', 'strengths', 'weaknesses'],
              additionalProperties: false
            }
          }
        }
      });

      const result = JSON.parse(analysis.choices[0].message.content || '{}');

      competitors.push({
        name: result.name || pageContent.title,
        website: url,
        products: result.products || [],
        pricing: result.pricing || [],
        features: result.features || [],
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error(`[Market Intelligence] Error analyzing competitor ${url}:`, error);
    }
  }

  return competitors;
}

/**
 * Detect market trends and innovations
 */
export async function detectMarketTrends(industry: string, keywords: string[]): Promise<MarketInsight[]> {
  const insights: MarketInsight[] = [];

  // Search for industry news and trends
  for (const keyword of keywords) {
    const query = `${industry} ${keyword} 2025 trends innovations`;
    const searchResults = await searchWeb(query, 5);

    for (const result of searchResults) {
      try {
        // Scrape article content
        const pageContent = await scrapeWebPage(result.url);
        if (!pageContent) continue;

        // Analyze with LLM
        const analysis = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'Eres un analista de tendencias de mercado. Identifica innovaciones, tendencias emergentes y mejores prácticas relevantes para mejorar propuestas comerciales.'
            },
            {
              role: 'user',
              content: `Analiza este artículo sobre ${industry}:\n\nTítulo: ${pageContent.title}\n\nContenido: ${pageContent.content.substring(0, 4000)}\n\nIdentifica: innovaciones clave, tendencias, mejores prácticas y acciones recomendadas.`
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'trend_analysis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  category: { type: 'string', enum: ['innovation', 'trend', 'best-practice'] },
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  relevance: { type: 'number' },
                  actionableItems: { type: 'array', items: { type: 'string' } }
                },
                required: ['category', 'title', 'summary', 'relevance', 'actionableItems'],
                additionalProperties: false
              }
            }
          }
        });

        const result = JSON.parse(analysis.choices[0].message.content || '{}');

        insights.push({
          id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: result.category as any,
          title: result.title,
          summary: result.summary,
          source: result.url || pageContent.title,
          url: result.url,
          relevance: result.relevance,
          actionableItems: result.actionableItems,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('[Market Intelligence] Error analyzing trend:', error);
      }
    }
  }

  return insights.sort((a, b) => b.relevance - a.relevance);
}

/**
 * Generate training data for agents based on market insights
 */
export async function generateAgentTraining(
  agentType: 'prospect' | 'closer' | 'solve' | 'logic' | 'talent' | 'insight',
  insights: MarketInsight[]
): Promise<AgentTrainingData> {
  // Filter insights relevant to agent type
  const relevantInsights = insights.filter(insight => insight.relevance >= 70);

  // Generate recommendations using LLM
  const insightsSummary = relevantInsights.map(i => 
    `- ${i.title}: ${i.summary} (Acciones: ${i.actionableItems.join(', ')})`
  ).join('\n');

  const agentContext = {
    prospect: 'generación de leads, prospección, calificación de clientes potenciales',
    closer: 'cierre de ventas, negociación, manejo de objeciones',
    solve: 'soporte al cliente, resolución de problemas, atención técnica',
    logic: 'operaciones, logística, optimización de procesos',
    talent: 'recursos humanos, reclutamiento, gestión de talento',
    insight: 'análisis estratégico, inteligencia de negocios, reportes ejecutivos'
  };

  const response = await invokeLLM({
    messages: [
      {
        role: 'system',
        content: `Eres un experto en capacitación de agentes de IA. Tu tarea es generar recomendaciones específicas para mejorar el desempeño de un agente de ${agentContext[agentType]}.`
      },
      {
        role: 'user',
        content: `Basándote en estos insights de mercado:\n\n${insightsSummary}\n\nGenera:\n1. Recomendaciones específicas para mejorar propuestas\n2. Nuevos conocimientos que el agente debe aprender\n3. Mejores prácticas a implementar`
      }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'agent_training',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            recommendations: { type: 'array', items: { type: 'string' } },
            updatedKnowledge: { type: 'array', items: { type: 'string' } }
          },
          required: ['recommendations', 'updatedKnowledge'],
          additionalProperties: false
        }
      }
    }
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');

  return {
    agentType,
    insights: relevantInsights,
    recommendations: result.recommendations || [],
    updatedKnowledge: result.updatedKnowledge || [],
    trainingDate: new Date()
  };
}

/**
 * Update knowledge base with new market intelligence
 */
export async function updateKnowledgeBase(insights: MarketInsight[]): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  let updatedCount = 0;

  for (const insight of insights) {
    try {
      // Create knowledge base entry
      const article = `# ${insight.title}\n\n${insight.summary}\n\n## Acciones Recomendadas\n${insight.actionableItems.map(item => `- ${item}`).join('\n')}\n\n**Fuente:** ${insight.source}\n**Relevancia:** ${insight.relevance}/100`;

      await db.insert(knowledgeBase).values({
        title: insight.title,
        content: article,
        category: insight.category,
        tags: JSON.stringify([insight.category, 'market-intelligence', 'auto-learned']),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      updatedCount++;
    } catch (error) {
      console.error('[Market Intelligence] Error updating KB:', error);
    }
  }

  return updatedCount;
}

/**
 * Complete market intelligence cycle: monitor → analyze → learn → train
 */
export async function runMarketIntelligenceCycle(config: {
  industry: string;
  keywords: string[];
  competitorUrls: string[];
  agentTypes: Array<'prospect' | 'closer' | 'solve' | 'logic' | 'talent' | 'insight'>;
}): Promise<{
  competitorsAnalyzed: number;
  insightsGenerated: number;
  knowledgeBaseUpdates: number;
  agentsTrained: number;
  trainingData: AgentTrainingData[];
}> {
  console.log('[Market Intelligence] Starting intelligence cycle...');

  // 1. Monitor competitors
  const competitors = await monitorCompetitors(config.competitorUrls);
  console.log(`[Market Intelligence] Analyzed ${competitors.length} competitors`);

  // 2. Detect trends and innovations
  const insights = await detectMarketTrends(config.industry, config.keywords);
  console.log(`[Market Intelligence] Generated ${insights.length} insights`);

  // 3. Update knowledge base
  const kbUpdates = await updateKnowledgeBase(insights);
  console.log(`[Market Intelligence] Updated KB with ${kbUpdates} new entries`);

  // 4. Train all agents
  const trainingData: AgentTrainingData[] = [];
  for (const agentType of config.agentTypes) {
    const training = await generateAgentTraining(agentType, insights);
    trainingData.push(training);
    console.log(`[Market Intelligence] Generated training for ${agentType}: ${training.recommendations.length} recommendations`);
  }

  return {
    competitorsAnalyzed: competitors.length,
    insightsGenerated: insights.length,
    knowledgeBaseUpdates: kbUpdates,
    agentsTrained: trainingData.length,
    trainingData
  };
}
