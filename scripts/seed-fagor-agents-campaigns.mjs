#!/usr/bin/env node
/**
 * Seed script for FAGOR Automation agents and campaigns
 * Creates 6 AI agents with their specific personas and assigns them to 8 campaigns
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import { companies, agents, multiChannelCampaigns } from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

async function main() {
  console.log("🚀 Starting FAGOR agents and campaigns seed...\n");

  // 1. Get FAGOR company ID
  console.log("📋 Step 1: Finding FAGOR company...");
  const fagorCompanies = await db.select().from(companies).where(eq(companies.slug, "fagor"));
  
  if (fagorCompanies.length === 0) {
    console.error("❌ FAGOR company not found! Please run seed-fagor-ivyai-companies.mjs first.");
    process.exit(1);
  }
  
  const fagorCompanyId = fagorCompanies[0].id;
  console.log(`✅ Found FAGOR company (ID: ${fagorCompanyId})\n`);

  // 2. Check if agents already exist
  console.log("📋 Step 2: Checking existing agents...");
  const existingAgents = await db.select().from(agents).where(eq(agents.companyId, fagorCompanyId));
  
  if (existingAgents.length > 0) {
    console.log(`⚠️  Found ${existingAgents.length} existing agents for FAGOR:`);
    existingAgents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.type})`);
    });
    console.log("\n❓ Skipping agent creation to avoid duplicates.");
    console.log("   If you want to recreate agents, delete them first from the database.\n");
  } else {
    // 3. Create 6 agents for FAGOR
    console.log("📋 Step 3: Creating 6 agents for FAGOR...\n");
    
    const agentsToCreate = [
      {
        companyId: fagorCompanyId,
        agentId: `fagor-ivy-prospect-${Date.now()}`,
        name: "Ivy-Prospect",
        type: "prospect",
        department: "sales",
        status: "active",
        capabilities: [
          "lead_generation",
          "prospect_research",
          "qualification",
          "outreach",
          "education",
          "relationship_building"
        ],
        kpis: {
          leads_qualified_per_month: 0,
          email_open_rate: 0,
          info_requests: 0,
          lead_to_opportunity_conversion: 0
        },
        configuration: {
          persona: {
            role: "Lead Generation Specialist",
            description: "Consultora de desarrollo de negocios enfocada en educación y capacitación",
            traits: ["Entusiasta", "Educadora", "Orientada a relaciones a largo plazo"],
            focus: "Identificar empresas manufactureras con equipos FAGOR subutilizados"
          },
          campaign: "CNC Training 2026",
          responsibilities: [
            "Identificar empresas manufactureras con equipos FAGOR subutilizados",
            "Educar sobre el costo oculto de operadores no capacitados (uso 30-40% de capacidad)",
            "Generar interés en programas de capacitación mediante contenido educativo",
            "Calificar leads basándose en: tamaño de operación, número de operadores, modelos CNC instalados",
            "Nutrir prospectos con casos de éxito y ROI de capacitación",
            "Coordinar con Ivy-Closer para leads calientes que requieren cotización"
          ]
        }
      },
      {
        companyId: fagorCompanyId,
        agentId: `fagor-ivy-closer-${Date.now()}`,
        name: "Ivy-Closer",
        type: "closer",
        department: "sales",
        status: "active",
        capabilities: [
          "sales_negotiation",
          "contract_management",
          "objection_handling",
          "pricing_strategy",
          "deal_closing",
          "roi_analysis"
        ],
        kpis: {
          opportunity_to_contract_rate: 0,
          average_contract_value: 0,
          sales_cycle_days: 0,
          warranty_renewal_rate: 0
        },
        configuration: {
          persona: {
            role: "Sales & Contract Specialist",
            description: "Ejecutiva de ventas consultiva, orientada a resultados y protección de inversiones",
            traits: ["Persuasiva pero no agresiva", "Enfocada en valor a largo plazo", "Consultiva"],
            focus: "Cerrar contratos de extensión de garantía y servicios premium"
          },
          campaign: "Warranty Extension",
          responsibilities: [
            "Identificar clientes cuya garantía estándar (2 años) está próxima a vencer",
            "Presentar análisis de costo-beneficio de extensión vs. reparaciones sin garantía",
            "Crear urgencia mediante ventanas de tiempo limitadas (antes de expiración)",
            "Negociar términos de contrato y pricing",
            "Manejar objeciones sobre costo vs. valor",
            "Cerrar contratos de extensión de garantía"
          ]
        }
      },
      {
        companyId: fagorCompanyId,
        agentId: `fagor-ivy-solve-${Date.now()}`,
        name: "Ivy-Solve",
        type: "solve",
        department: "customer_service",
        status: "active",
        capabilities: [
          "technical_support",
          "troubleshooting",
          "repair_coordination",
          "diagnostics",
          "customer_communication",
          "escalation_management"
        ],
        kpis: {
          average_response_time_minutes: 0,
          first_contact_resolution_rate: 0,
          customer_satisfaction_score: 0,
          downtime_reduction_percentage: 0
        },
        configuration: {
          persona: {
            role: "Technical Support & Service Specialist",
            description: "Ingeniera de servicio técnico, solucionadora de problemas, empática y orientada a minimizar downtime",
            traits: ["Comunicadora clara de temas técnicos complejos", "Empática", "Orientada a soluciones"],
            focus: "Resolver problemas técnicos rápidamente y minimizar downtime del cliente"
          },
          campaign: "Equipment Repair Services",
          responsibilities: [
            "Diagnosticar problemas reportados en CNCs, Drivers, Motores, Encoders",
            "Coordinar servicios de reparación con técnicos certificados",
            "Proveer estimaciones de tiempo y costo de reparación",
            "Educar sobre importancia de reparaciones con partes genuinas FAGOR",
            "Gestionar expectativas de turnaround time",
            "Hacer seguimiento post-reparación para asegurar satisfacción",
            "Escalar casos complejos o recurrentes a Ivy-Logic (mantenimiento preventivo)"
          ]
        }
      },
      {
        companyId: fagorCompanyId,
        agentId: `fagor-ivy-logic-${Date.now()}`,
        name: "Ivy-Logic",
        type: "logic",
        department: "operations",
        status: "active",
        capabilities: [
          "operations_analysis",
          "supply_chain_management",
          "preventive_maintenance",
          "inventory_optimization",
          "data_analytics",
          "roi_modeling"
        ],
        kpis: {
          eol_parts_orders_value: 0,
          preventive_maintenance_contracts: 0,
          unplanned_failures_reduction: 0,
          contract_retention_rate: 0
        },
        configuration: {
          persona: {
            role: "Operations & Maintenance Strategist",
            description: "Analista de operaciones y supply chain, proactiva y orientada a eficiencia",
            traits: ["Piensa en términos de prevención", "Orientada a inventario y optimización", "Proactiva"],
            focus: "Prevenir fallas mediante mantenimiento proactivo y gestión de partes EOL"
          },
          campaigns: ["EOL Parts Availability", "Preventive Maintenance Contracts"],
          responsibilities: [
            "Para EOL Parts: Identificar clientes con equipos antiguos que usan partes próximas a descontinuarse",
            "Crear urgencia sobre disponibilidad limitada de stock",
            "Recomendar cantidades óptimas de spare parts basándose en uso histórico",
            "Coordinar órdenes de compra y logística",
            "Para Preventive Maintenance: Analizar patrones de fallas y recomendar programas de mantenimiento",
            "Diseñar calendarios de servicio que minimicen impacto en producción",
            "Proveer insights basados en datos de equipos similares",
            "Demostrar ROI de mantenimiento preventivo vs. reactivo"
          ]
        }
      },
      {
        companyId: fagorCompanyId,
        agentId: `fagor-ivy-talent-${Date.now()}`,
        name: "Ivy-Talent",
        type: "talent",
        department: "operations",
        status: "active",
        capabilities: [
          "technical_assessment",
          "upgrade_planning",
          "migration_management",
          "training_delivery",
          "project_coordination",
          "compatibility_analysis"
        ],
        kpis: {
          technical_evaluations_completed: 0,
          upgrade_proposals_accepted: 0,
          projects_completed_on_time: 0,
          post_upgrade_satisfaction: 0
        },
        configuration: {
          persona: {
            role: "Technical Transformation Specialist",
            description: "Ingeniera de modernización técnica, experta en migraciones de sistemas",
            traits: ["Orientada a transformación tecnológica", "Experta en continuidad operacional", "Técnica"],
            focus: "Modernizar equipos CNC mediante upgrades de hardware y software"
          },
          campaign: "CNC Upgrades",
          upgrade_types: [
            "8025/8055: Win XP/7 → Win 10",
            "8060/8065/8070 → Win 10",
            "8025 → 8037 hardware upgrade"
          ],
          responsibilities: [
            "Evaluar equipos actuales del cliente y recomendar path de upgrade",
            "Explicar beneficios técnicos: seguridad (Win 10), performance, compatibilidad",
            "Diseñar plan de migración que minimice downtime de producción",
            "Coordinar con equipo técnico para scheduling de instalación",
            "Proveer training post-upgrade para nuevas funcionalidades",
            "Gestionar expectativas sobre compatibilidad con tooling existente"
          ]
        }
      },
      {
        companyId: fagorCompanyId,
        agentId: `fagor-ivy-insight-${Date.now()}`,
        name: "Ivy-Insight",
        type: "insight",
        department: "strategy",
        status: "active",
        capabilities: [
          "strategic_planning",
          "data_analytics",
          "roi_analysis",
          "digital_transformation",
          "competitive_analysis",
          "executive_communication"
        ],
        kpis: {
          digital_suite_demos: 0,
          modernization_projects_approved: 0,
          total_digital_investment_value: 0,
          client_kpi_improvement_percentage: 0
        },
        configuration: {
          persona: {
            role: "Digital Strategy & Analytics Advisor",
            description: "Consultora estratégica de transformación digital, visionaria y orientada a datos",
            traits: ["Habla el lenguaje de C-level: ROI, competitividad, futuro del negocio", "Visionaria", "Orientada a datos"],
            focus: "Impulsar transformación digital y modernización estratégica"
          },
          campaigns: ["FAGOR Digital Suite", "Equipment Modernization"],
          responsibilities: [
            "Para Digital Suite: Evangelizar beneficios de digitalización de producción",
            "Demostrar cómo data analytics mejora OEE (Overall Equipment Effectiveness)",
            "Presentar casos de uso: predictive maintenance, quality tracking, production optimization",
            "Diseñar roadmap de implementación de Digital Suite",
            "Proveer benchmarks de industria y análisis competitivo",
            "Para Modernization: Analizar ROI de modernizar vs. reemplazar equipos",
            "Identificar equipos candidatos para modernización basándose en edad y uso",
            "Presentar análisis financiero: CAPEX savings, extended equipment life",
            "Conectar modernización con estrategia de digitalización (Digital Suite)"
          ]
        }
      }
    ];

    for (const agentData of agentsToCreate) {
      try {
        await db.insert(agents).values(agentData);
        console.log(`✅ Created agent: ${agentData.name} (${agentData.type})`);
      } catch (error) {
        console.error(`❌ Failed to create agent ${agentData.name}:`, error.message);
      }
    }
    
    console.log("\n✅ All agents created successfully!\n");
  }

  // 4. Check existing campaigns
  console.log("📋 Step 4: Checking existing campaigns...");
  const existingCampaigns = await db.select().from(multiChannelCampaigns);
  
  const campaignNames = existingCampaigns.map(c => c.name);
  console.log(`Found ${existingCampaigns.length} existing campaigns:`);
  campaignNames.forEach(name => console.log(`   - ${name}`));
  
  // Define required campaigns
  const requiredCampaigns = [
    "FAGOR Training Programs 2025",
    "CNC Upgrades - Moderniza tu Producción",
    "Warranty Extension - Protege tu Inversión",
    "Equipment Repair Services",
    "EOL Parts Availability",
    "Preventive Maintenance Contracts",
    "FAGOR Digital Suite",
    "Equipment Modernization Strategy"
  ];
  
  const missingCampaigns = requiredCampaigns.filter(name => !campaignNames.includes(name));
  
  if (missingCampaigns.length > 0) {
    console.log(`\n⚠️  Missing ${missingCampaigns.length} campaigns. Please run the SQL seed script first:`);
    console.log("   mysql < scripts/seed-fagor-campaigns.sql");
    console.log("\n   Missing campaigns:");
    missingCampaigns.forEach(name => console.log(`   - ${name}`));
  } else {
    console.log("\n✅ All required campaigns exist!");
  }

  console.log("\n🎉 FAGOR agents and campaigns seed completed!");
  console.log("\n📊 Summary:");
  console.log(`   - Company: FAGOR Automation (ID: ${fagorCompanyId})`);
  console.log(`   - Agents: ${existingAgents.length > 0 ? existingAgents.length + ' (already existed)' : '6 (newly created)'}`);
  console.log(`   - Campaigns: ${existingCampaigns.length} total, ${requiredCampaigns.length} required`);
  
  console.log("\n📝 Next steps:");
  if (missingCampaigns.length > 0) {
    console.log("   1. Run: mysql < scripts/seed-fagor-campaigns.sql");
    console.log("   2. Assign agents to campaigns in the UI");
  } else {
    console.log("   1. Assign agents to campaigns in the UI");
    console.log("   2. Activate campaigns and start outreach");
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
