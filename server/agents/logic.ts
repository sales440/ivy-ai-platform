/**
 * Ivy-Logic: Operations & Supply Chain Agent
 * Specializes in demand forecasting, inventory optimization, and supply chain planning
 */

import { IvyAgent, AgentType, Department, TaskInput, TaskResult } from './core';
import * as db from '../db';
import { v4 as uuidv4 } from 'uuid';
import { invokeLLM } from '../_core/llm';

export class IvyLogic extends IvyAgent {
  constructor() {
    const capabilities = [
      "demand_forecasting",
      "inventory_optimization",
      "supply_chain_planning",
      "purchase_order_management",
      "scenario_simulation"
    ];

    const initialKPIs = {
      inventory_optimized: 0,
      cost_savings: 0,
      forecast_accuracy: 0,
      orders_processed: 0
    };

    super("Ivy-Logic", AgentType.LOGIC, Department.OPERATIONS, capabilities, initialKPIs);
  }

  protected async _processTask(task: TaskInput): Promise<TaskResult> {
    const { type } = task;

    switch (type) {
      case "forecast_demand":
        return await this._forecastDemand(task.product_data, task.historical_data);
      case "optimize_inventory":
        return await this._optimizeInventory(task.inventory_data);
      case "analyze_supply_chain":
        return await this._analyzeSupplyChain(task.supply_chain_data);
      case "generate_purchase_order":
        return await this._generatePurchaseOrder(task.requirements);
      default:
        throw new Error(`Unsupported task type: ${type}`);
    }
  }

  /**
   * Forecast demand for products
   */
  private async _forecastDemand(productData: any, historicalData: any): Promise<TaskResult> {
    try {
      const prompt = `You are a supply chain analyst. Forecast demand based on historical data:

Product: ${productData.name || "Product"}
Category: ${productData.category || "General"}

Historical Sales Data:
${JSON.stringify(historicalData, null, 2)}

Current Factors:
- Season: ${productData.season || "Current"}
- Market Trend: ${productData.trend || "Stable"}
- Promotions Planned: ${productData.promotions ? "Yes" : "No"}

Provide:
- forecast_next_month (estimated units)
- forecast_next_quarter (estimated units)
- confidence_level (0.0 to 1.0)
- risk_factors (potential risks to forecast)
- recommended_stock_level (units to maintain)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an expert supply chain analyst specializing in demand forecasting." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "demand_forecast",
            strict: true,
            schema: {
              type: "object",
              properties: {
                forecast_next_month: { type: "number" },
                forecast_next_quarter: { type: "number" },
                confidence_level: { type: "number" },
                risk_factors: { type: "string" },
                recommended_stock_level: { type: "number" }
              },
              required: ["forecast_next_month", "forecast_next_quarter", "confidence_level", "risk_factors", "recommended_stock_level"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const forecast = JSON.parse(contentStr || "{}");

      // Update KPIs
      this.kpis.forecast_accuracy += forecast.confidence_level * 0.1;

      return {
        status: "completed",
        data: {
          product: productData.name,
          forecast: forecast,
          generated_at: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Optimize inventory levels
   */
  private async _optimizeInventory(inventoryData: any): Promise<TaskResult> {
    try {
      const prompt = `Analyze inventory and provide optimization recommendations:

Current Inventory:
${JSON.stringify(inventoryData.items || [], null, 2)}

Warehouse Capacity: ${inventoryData.warehouse_capacity || "Not specified"}
Average Daily Sales: ${inventoryData.avg_daily_sales || "Not specified"}
Lead Time: ${inventoryData.lead_time_days || "7"} days

Provide:
- overstock_items (items with excess inventory)
- understock_items (items at risk of stockout)
- optimal_reorder_points (recommended reorder levels)
- estimated_cost_savings (potential savings in dollars)
- action_plan (prioritized actions to take)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are an inventory optimization expert focused on reducing costs while maintaining service levels." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "inventory_optimization",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overstock_items: { type: "string" },
                understock_items: { type: "string" },
                optimal_reorder_points: { type: "string" },
                estimated_cost_savings: { type: "number" },
                action_plan: { type: "string" }
              },
              required: ["overstock_items", "understock_items", "optimal_reorder_points", "estimated_cost_savings", "action_plan"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const optimization = JSON.parse(contentStr || "{}");

      // Update KPIs
      this.kpis.inventory_optimized += 1;
      this.kpis.cost_savings += optimization.estimated_cost_savings;

      return {
        status: "completed",
        data: {
          optimization: optimization,
          potential_savings: optimization.estimated_cost_savings,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Analyze supply chain performance
   */
  private async _analyzeSupplyChain(supplyChainData: any): Promise<TaskResult> {
    try {
      const prompt = `Analyze supply chain performance and identify bottlenecks:

Supply Chain Metrics:
- On-Time Delivery Rate: ${supplyChainData.on_time_rate || "N/A"}%
- Average Lead Time: ${supplyChainData.avg_lead_time || "N/A"} days
- Supplier Count: ${supplyChainData.supplier_count || "N/A"}
- Quality Issues: ${supplyChainData.quality_issues || 0}
- Transportation Costs: $${supplyChainData.transport_costs || "N/A"}

Recent Issues:
${supplyChainData.recent_issues || "None reported"}

Provide:
- overall_health_score (0-100)
- bottlenecks (list of identified bottlenecks)
- improvement_opportunities (specific recommendations)
- risk_assessment (potential supply chain risks)
- priority_actions (top 3 actions to take)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a supply chain consultant with expertise in identifying and resolving operational bottlenecks." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "supply_chain_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overall_health_score: { type: "number" },
                bottlenecks: { type: "string" },
                improvement_opportunities: { type: "string" },
                risk_assessment: { type: "string" },
                priority_actions: { type: "string" }
              },
              required: ["overall_health_score", "bottlenecks", "improvement_opportunities", "risk_assessment", "priority_actions"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const analysis = JSON.parse(contentStr || "{}");

      return {
        status: "completed",
        data: {
          health_score: analysis.overall_health_score,
          analysis: analysis,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }

  /**
   * Generate purchase order recommendations
   */
  private async _generatePurchaseOrder(requirements: any): Promise<TaskResult> {
    try {
      const prompt = `Generate a purchase order recommendation:

Requirements:
- Items Needed: ${JSON.stringify(requirements.items || [])}
- Budget: $${requirements.budget || "Not specified"}
- Urgency: ${requirements.urgency || "Normal"}
- Preferred Suppliers: ${requirements.preferred_suppliers || "Any"}

Provide:
- recommended_supplier (best supplier choice)
- order_quantity (optimal quantity to order)
- estimated_cost (total estimated cost)
- delivery_timeline (expected delivery time)
- justification (reason for recommendations)`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a procurement specialist focused on cost optimization and supplier management." },
          { role: "user", content: prompt }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "purchase_order",
            strict: true,
            schema: {
              type: "object",
              properties: {
                recommended_supplier: { type: "string" },
                order_quantity: { type: "number" },
                estimated_cost: { type: "number" },
                delivery_timeline: { type: "string" },
                justification: { type: "string" }
              },
              required: ["recommended_supplier", "order_quantity", "estimated_cost", "delivery_timeline", "justification"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices[0].message.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      const po = JSON.parse(contentStr || "{}");

      // Update KPIs
      this.kpis.orders_processed += 1;

      return {
        status: "completed",
        data: {
          po_id: uuidv4(),
          recommendation: po,
          created_at: new Date().toISOString()
        }
      };
    } catch (error: any) {
      return {
        status: "failed",
        error: error.message
      };
    }
  }
}
