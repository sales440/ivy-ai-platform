import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingDown, DollarSign, Users, ArrowRight } from "lucide-react";
import { APP_TITLE } from "@/const";

/**
 * ROI Calculator - Interactive tool to demonstrate cost savings
 * Core piece of the AI-Native marketing campaign
 */
export default function ROICalculator() {
  const [numSDRs, setNumSDRs] = useState<number>(5);
  const [avgSalary, setAvgSalary] = useState<number>(60000);
  const [benefits, setBenefits] = useState<number>(15); // percentage
  const [turnoverRate, setTurnoverRate] = useState<number>(30); // percentage
  const [recruitingCost, setRecruitingCost] = useState<number>(15000);

  // Calculate total costs
  const totalSalaryCost = numSDRs * avgSalary;
  const benefitsCost = totalSalaryCost * (benefits / 100);
  const turnoverCost = numSDRs * (turnoverRate / 100) * recruitingCost;
  const totalHumanCost = totalSalaryCost + benefitsCost + turnoverCost;

  // Ivy.AI costs (pricing model)
  const ivyAICostPerAgent = 1499; // monthly
  const ivyAIAnnualCost = numSDRs * ivyAICostPerAgent * 12;

  // Savings calculation
  const annualSavings = totalHumanCost - ivyAIAnnualCost;
  const savingsPercentage = (annualSavings / totalHumanCost) * 100;
  const roi = ((annualSavings / ivyAIAnnualCost) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="container py-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{APP_TITLE}</span>
          </div>
          <Button variant="outline" asChild>
            <a href="/">Volver al Inicio</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-12">
        <div className="max-w-6xl mx-auto text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">
            Calculadora de Ahorro de SDR
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Descubre cuánto puedes ahorrar reemplazando tu equipo de ventas tradicional 
            con agentes de IA de Ivy.AI. Ingresa tus datos y obtén un análisis de ROI instantáneo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Configuración de tu Equipo Actual
              </CardTitle>
              <CardDescription>
                Ingresa los datos de tu fuerza de ventas humana
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="numSDRs">Número de SDRs</Label>
                <Input
                  id="numSDRs"
                  type="number"
                  min="1"
                  max="100"
                  value={numSDRs}
                  onChange={(e) => setNumSDRs(Number(e.target.value))}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  ¿Cuántos representantes de desarrollo de ventas tienes?
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avgSalary">Salario Promedio Anual (USD)</Label>
                <Input
                  id="avgSalary"
                  type="number"
                  min="30000"
                  max="200000"
                  step="5000"
                  value={avgSalary}
                  onChange={(e) => setAvgSalary(Number(e.target.value))}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Salario base promedio por SDR
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefits">Beneficios y Cargas Sociales (%)</Label>
                <Input
                  id="benefits"
                  type="number"
                  min="0"
                  max="50"
                  value={benefits}
                  onChange={(e) => setBenefits(Number(e.target.value))}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Seguro médico, vacaciones, impuestos sobre nómina
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="turnoverRate">Tasa de Rotación Anual (%)</Label>
                <Input
                  id="turnoverRate"
                  type="number"
                  min="0"
                  max="100"
                  value={turnoverRate}
                  onChange={(e) => setTurnoverRate(Number(e.target.value))}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Promedio de la industria: 30-40%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recruitingCost">Costo de Reclutamiento por SDR (USD)</Label>
                <Input
                  id="recruitingCost"
                  type="number"
                  min="5000"
                  max="50000"
                  step="1000"
                  value={recruitingCost}
                  onChange={(e) => setRecruitingCost(Number(e.target.value))}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Reclutamiento, onboarding, capacitación
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Cost Breakdown */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <TrendingDown className="h-5 w-5" />
                  Costo Actual (Equipo Humano)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Salarios Anuales:</span>
                  <span className="font-semibold">${totalSalaryCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Beneficios ({benefits}%):</span>
                  <span className="font-semibold">${benefitsCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Costo de Rotación:</span>
                  <span className="font-semibold">${turnoverCost.toLocaleString()}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Costo Total Anual:</span>
                    <span className="text-2xl font-bold text-destructive">
                      ${totalHumanCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ivy.AI Cost */}
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <DollarSign className="h-5 w-5" />
                  Costo con Ivy.AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {numSDRs} Agente{numSDRs > 1 ? 's' : ''} de IA:
                  </span>
                  <span className="font-semibold">
                    ${ivyAICostPerAgent.toLocaleString()}/mes cada uno
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Costo Total Anual:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${ivyAIAnnualCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Savings */}
            <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-400">
                  💰 Tu Ahorro Anual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-5xl font-bold text-green-700 dark:text-green-400">
                    ${annualSavings.toLocaleString()}
                  </div>
                  <div className="text-xl text-green-600 dark:text-green-500">
                    {savingsPercentage.toFixed(1)}% de ahorro
                  </div>
                </div>

                <div className="border-t border-green-200 dark:border-green-800 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">ROI del Primer Año:</span>
                    <span className="font-bold text-green-700 dark:text-green-400">
                      {roi.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payback Period:</span>
                    <span className="font-bold text-green-700 dark:text-green-400">
                      {(12 / (roi / 100 + 1)).toFixed(1)} meses
                    </span>
                  </div>
                </div>

                <Button className="w-full mt-6" size="lg" asChild>
                  <a href="/demo-request">
                    Agendar Demo de ROI Personalizada
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Benefits */}
        <div className="max-w-6xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Beneficios Adicionales (No Incluidos en el Cálculo)</CardTitle>
              <CardDescription>
                Más allá del ahorro directo de costos, Ivy.AI ofrece ventajas competitivas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">🚀 Escalabilidad Instantánea</h3>
                  <p className="text-sm text-muted-foreground">
                    Agrega 10, 50 o 100 agentes en minutos sin procesos de contratación
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">⏰ Operación 24/7</h3>
                  <p className="text-sm text-muted-foreground">
                    Sin vacaciones, días de enfermedad o límites de horario laboral
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">📊 Datos en Tiempo Real</h3>
                  <p className="text-sm text-muted-foreground">
                    Análisis instantáneo de rendimiento y optimización continua
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">🎯 Consistencia Perfecta</h3>
                  <p className="text-sm text-muted-foreground">
                    Cada interacción sigue el mismo script optimizado, sin variación humana
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">🌍 Multilingüe Nativo</h3>
                  <p className="text-sm text-muted-foreground">
                    Expande a nuevos mercados sin contratar equipos locales
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">🔄 Cero Rotación</h3>
                  <p className="text-sm text-muted-foreground">
                    Elimina el costo oculto de pérdida de conocimiento y reentrenamiento
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
