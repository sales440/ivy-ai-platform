import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BarChart3, TrendingUp, Target, AlertCircle, CheckCircle2, Play, Pause, Trash2 } from "lucide-react";

export default function ABTestingDashboard() {
  const [selectedTest, setSelectedTest] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Queries
  const { data: tests, isLoading } = trpc.abTesting.list.useQuery();
  const { data: testResults } = trpc.abTesting.getResults.useQuery(
    { testId: selectedTest! },
    { enabled: !!selectedTest }
  );

  // Mutations
  const createTest = trpc.abTesting.create.useMutation({
    onSuccess: () => {
      toast.success("Test A/B creado exitosamente");
      utils.abTesting.list.invalidate();
      setShowCreateForm(false);
    },
  });

  const startTest = trpc.abTesting.start.useMutation({
    onSuccess: () => {
      toast.success("Test iniciado");
      utils.abTesting.list.invalidate();
    },
  });

  const pauseTest = trpc.abTesting.pause.useMutation({
    onSuccess: () => {
      toast.success("Test pausado");
      utils.abTesting.list.invalidate();
    },
  });

  const selectWinner = trpc.abTesting.selectWinner.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Ganador seleccionado! Mejora: ${data.improvement?.toFixed(1)}%`);
        utils.abTesting.list.invalidate();
      } else {
        toast.error(data.message);
      }
    },
  });

  const deleteTest = trpc.abTesting.delete.useMutation({
    onSuccess: () => {
      toast.success("Test eliminado");
      utils.abTesting.list.invalidate();
      setSelectedTest(null);
    },
  });

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    testName: "",
    testType: "email_subject" as const,
    hypothesis: "",
    variants: [
      { variantName: "Control", isControl: true, content: "", trafficPercentage: 50 },
      { variantName: "Variant A", isControl: false, content: "", trafficPercentage: 50 },
    ],
  });

  const handleCreateTest = () => {
    createTest.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            A/B Testing Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Optimiza tus campañas con tests estadísticamente significativos
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} size="lg">
          {showCreateForm ? "Cancelar" : "Crear Nuevo Test"}
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Crear Nuevo Test A/B</CardTitle>
            <CardDescription>Define tu hipótesis y variantes a probar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Test</Label>
                <Input
                  value={formData.testName}
                  onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                  placeholder="Ej: Test de Subject Line Q1 2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Test</Label>
                <Select
                  value={formData.testType}
                  onValueChange={(value: any) => setFormData({ ...formData, testType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email_subject">Email Subject</SelectItem>
                    <SelectItem value="email_content">Email Content</SelectItem>
                    <SelectItem value="call_script">Call Script</SelectItem>
                    <SelectItem value="sms_content">SMS Content</SelectItem>
                    <SelectItem value="landing_page">Landing Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hipótesis</Label>
              <Textarea
                value={formData.hypothesis}
                onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
                placeholder="Ej: Un subject line más corto aumentará el open rate en 15%"
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <Label>Variantes</Label>
              {formData.variants.map((variant, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Input
                        value={variant.variantName}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[idx].variantName = e.target.value;
                          setFormData({ ...formData, variants: newVariants });
                        }}
                        className="w-48"
                      />
                      {variant.isControl && <Badge>Control</Badge>}
                    </div>
                    <Textarea
                      value={variant.content}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[idx].content = e.target.value;
                        setFormData({ ...formData, variants: newVariants });
                      }}
                      placeholder="Contenido de la variante..."
                      rows={3}
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Tráfico: {variant.trafficPercentage}%</Label>
                      <Input
                        type="range"
                        min="10"
                        max="90"
                        value={variant.trafficPercentage}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[idx].trafficPercentage = parseInt(e.target.value);
                          setFormData({ ...formData, variants: newVariants });
                        }}
                        className="flex-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  setFormData({
                    ...formData,
                    variants: [
                      ...formData.variants,
                      {
                        variantName: `Variant ${String.fromCharCode(64 + formData.variants.length)}`,
                        isControl: false,
                        content: "",
                        trafficPercentage: 50,
                      },
                    ],
                  })
                }
              >
                Agregar Variante
              </Button>
            </div>

            <Button onClick={handleCreateTest} disabled={createTest.isPending} className="w-full">
              {createTest.isPending ? "Creando..." : "Crear Test"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tests List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Tests Activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tests?.map((test) => (
              <Card
                key={test.id}
                className={`cursor-pointer transition-colors ${
                  selectedTest === test.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedTest(test.id!)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm">{test.testName}</h3>
                    <Badge
                      variant={
                        test.status === "running"
                          ? "default"
                          : test.status === "completed"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {test.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{test.testType}</p>
                </CardContent>
              </Card>
            ))}
            {(!tests || tests.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No hay tests creados</p>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resultados del Test</CardTitle>
            {selectedTest && testResults && (
              <div className="flex gap-2">
                {testResults.test.status === "draft" && (
                  <Button size="sm" onClick={() => startTest.mutate({ testId: selectedTest })}>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar
                  </Button>
                )}
                {testResults.test.status === "running" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => pauseTest.mutate({ testId: selectedTest })}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => selectWinner.mutate({ testId: selectedTest })}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Seleccionar Ganador
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteTest.mutate({ testId: selectedTest })}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedTest ? (
              <div className="text-center py-12 text-muted-foreground">
                Selecciona un test para ver los resultados
              </div>
            ) : testResults ? (
              <div className="space-y-6">
                {/* Hypothesis */}
                {testResults.test.hypothesis && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-1">Hipótesis:</p>
                    <p className="text-sm">{testResults.test.hypothesis}</p>
                  </div>
                )}

                {/* Variants Results */}
                <div className="space-y-4">
                  {testResults.analysis.map((item) => (
                    <Card key={item.variant.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{item.variant.variantName}</CardTitle>
                          <div className="flex gap-2">
                            {item.variant.isControl === 1 && <Badge variant="outline">Control</Badge>}
                            {item.significance?.significant && (
                              <Badge variant="default">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Significativo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {item.result ? (
                          <>
                            <div className="grid grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Impresiones</p>
                                <p className="text-2xl font-bold">{item.result.impressions}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Opens</p>
                                <p className="text-2xl font-bold">{item.result.opens}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Clicks</p>
                                <p className="text-2xl font-bold">{item.result.clicks}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Conversiones</p>
                                <p className="text-2xl font-bold">{item.result.conversions}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Open Rate</span>
                                <span className="font-medium">
                                  {((item.result.openRate || 0) / 100).toFixed(2)}%
                                </span>
                              </div>
                              <Progress value={(item.result.openRate || 0) / 100} />

                              <div className="flex justify-between text-sm">
                                <span>Click Rate</span>
                                <span className="font-medium">
                                  {((item.result.clickRate || 0) / 100).toFixed(2)}%
                                </span>
                              </div>
                              <Progress value={(item.result.clickRate || 0) / 100} />

                              <div className="flex justify-between text-sm">
                                <span>Conversion Rate</span>
                                <span className="font-medium">
                                  {((item.result.conversionRate || 0) / 100).toFixed(2)}%
                                </span>
                              </div>
                              <Progress value={(item.result.conversionRate || 0) / 100} />
                            </div>

                            {item.significance && !item.variant.isControl && (
                              <div
                                className={`p-3 rounded-lg ${
                                  item.significance.significant
                                    ? "bg-green-50 border border-green-200"
                                    : "bg-yellow-50 border border-yellow-200"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  {item.significance.significant ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                  )}
                                  <span className="font-medium text-sm">
                                    {item.significance.significant
                                      ? "Significancia Alcanzada"
                                      : "Sin Significancia"}
                                  </span>
                                </div>
                                <p className="text-sm">
                                  Mejora: {item.significance.improvement.toFixed(1)}% vs Control
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  p-value: {item.significance.pValue.toFixed(3)}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No hay datos aún</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
