import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  DollarSign,
  Users,
  Brain,
} from "lucide-react";

export default function PredictiveInsights() {
  const [formData, setFormData] = useState({
    channelType: "email" as "email" | "phone" | "sms" | "social_media",
    targetAudienceSize: 1000,
    industryType: "technology",
    timeOfDay: 10,
    dayOfWeek: 2,
    seasonality: 1,
    hasPersonalization: true,
    hasUrgency: false,
    hasCallToAction: true,
    subjectLineLength: 45,
    contentSentimentScore: 0.5,
  });

  // Queries
  const { data: modelStatus } = trpc.predictiveAnalytics.status.useQuery();

  // Mutations
  const predictMutation = trpc.predictiveAnalytics.predict.useMutation({
    onSuccess: () => {
      toast.success("Predicción generada exitosamente");
    },
  });

  const analyzeMutation = trpc.predictiveAnalytics.analyze.useMutation({
    onSuccess: () => {
      toast.success("Análisis completado");
    },
  });

  const autoTrainMutation = trpc.predictiveAnalytics.autoTrain.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
  });

  const handlePredict = () => {
    predictMutation.mutate(formData);
  };

  const handleAnalyze = () => {
    analyzeMutation.mutate(formData);
  };

  const prediction = predictMutation.data;
  const analysis = analyzeMutation.data;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "low":
        return <CheckCircle2 className="h-5 w-5" />;
      case "medium":
        return <AlertTriangle className="h-5 w-5" />;
      case "high":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Predictive Insights
          </h1>
          <p className="text-muted-foreground mt-2">
            Predice el éxito de tus campañas con Machine Learning
          </p>
        </div>
        {modelStatus && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Estado del Modelo</p>
                  <Badge variant={modelStatus.trained ? "default" : "outline"}>
                    {modelStatus.trained ? "Entrenado" : "No Entrenado"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Datos de Entrenamiento</p>
                  <p className="text-lg font-bold">{modelStatus.dataPoints}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confianza</p>
                  <p className="text-lg font-bold">{(modelStatus.confidence * 100).toFixed(0)}%</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => autoTrainMutation.mutate()}
                  disabled={autoTrainMutation.isPending}
                >
                  {autoTrainMutation.isPending ? "Entrenando..." : "Re-entrenar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Campaña</CardTitle>
            <CardDescription>Define las características de tu campaña</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Canal</Label>
                <Select
                  value={formData.channelType}
                  onValueChange={(value: any) => setFormData({ ...formData, channelType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Teléfono</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="social_media">Redes Sociales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tamaño de Audiencia</Label>
                <Input
                  type="number"
                  value={formData.targetAudienceSize}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAudienceSize: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora del Día (0-23)</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.timeOfDay}
                  onChange={(e) => setFormData({ ...formData, timeOfDay: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Día de la Semana</Label>
                <Select
                  value={formData.dayOfWeek.toString()}
                  onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Domingo</SelectItem>
                    <SelectItem value="1">Lunes</SelectItem>
                    <SelectItem value="2">Martes</SelectItem>
                    <SelectItem value="3">Miércoles</SelectItem>
                    <SelectItem value="4">Jueves</SelectItem>
                    <SelectItem value="5">Viernes</SelectItem>
                    <SelectItem value="6">Sábado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.channelType === "email" && (
              <div className="space-y-2">
                <Label>Longitud del Subject Line</Label>
                <Input
                  type="number"
                  value={formData.subjectLineLength}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectLineLength: parseInt(e.target.value) })
                  }
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Personalización</Label>
                <Switch
                  checked={formData.hasPersonalization}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasPersonalization: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Urgencia</Label>
                <Switch
                  checked={formData.hasUrgency}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasUrgency: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Call-to-Action</Label>
                <Switch
                  checked={formData.hasCallToAction}
                  onCheckedChange={(checked) => setFormData({ ...formData, hasCallToAction: checked })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePredict} disabled={predictMutation.isPending} className="flex-1">
                {predictMutation.isPending ? "Prediciendo..." : "Predecir"}
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                {analyzeMutation.isPending ? "Analizando..." : "Analizar & Optimizar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Prediction Results */}
        <div className="space-y-6">
          {prediction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Predicción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Success Probability */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Probabilidad de Éxito</span>
                    <span className="text-2xl font-bold">
                      {(prediction.successProbability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={prediction.successProbability * 100} className="h-3" />
                </div>

                {/* Risk Level */}
                <div className={`p-4 rounded-lg border ${getRiskColor(prediction.riskLevel)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {getRiskIcon(prediction.riskLevel)}
                    <span className="font-semibold">
                      Nivel de Riesgo: {prediction.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm">
                    Confianza del modelo: {(prediction.confidence * 100).toFixed(0)}%
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Conversion Rate</span>
                      </div>
                      <p className="text-2xl font-bold">{prediction.expectedConversionRate.toFixed(2)}%</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Revenue Esperado</span>
                      </div>
                      <p className="text-2xl font-bold">${prediction.expectedRevenue.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recommendations */}
                {prediction.recommendations.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold">Recomendaciones</span>
                    </div>
                    <div className="space-y-2">
                      {prediction.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm bg-muted p-3 rounded-lg">
                          <span className="text-muted-foreground">•</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Análisis de Optimización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Versión Actual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {(analysis.currentPrediction.successProbability * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Probabilidad de éxito</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-green-500 bg-green-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-green-700">Versión Optimizada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-700">
                        {(analysis.optimizedPrediction.successProbability * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        +
                        {(
                          (analysis.optimizedPrediction.successProbability -
                            analysis.currentPrediction.successProbability) *
                          100
                        ).toFixed(1)}
                        % mejora
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Improvements */}
                {analysis.improvements.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Mejoras Sugeridas (por impacto)</h3>
                    <div className="space-y-2">
                      {analysis.improvements.map((improvement, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{improvement.change}</span>
                              <Badge variant="default">+{improvement.impact.toFixed(1)}%</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimized Recommendations */}
                {analysis.optimizedPrediction.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Plan de Acción Optimizado</h3>
                    <div className="space-y-2">
                      {analysis.optimizedPrediction.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm bg-green-50 p-3 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!prediction && !analysis && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Configura tu campaña y haz clic en "Predecir" para ver los resultados</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
