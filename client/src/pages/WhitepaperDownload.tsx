import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, CheckCircle2, TrendingUp, Users, DollarSign } from "lucide-react";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Whitepaper Download Landing Page - Awareness Stage
 * Lead magnet to capture high-intent prospects
 */
export default function WhitepaperDownload() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    numSDRs: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const captureLeadMutation = trpc.marketing.captureWhitepaperLead.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("¡Whitepaper enviado! Revisa tu email.");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    captureLeadMutation.mutate(formData);
  };

  const handleDownload = () => {
    // Trigger download of whitepaper PDF
    window.open("/whitepaper-ivy-ai-roi.pdf", "_blank");
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl">¡Gracias por tu Interés!</CardTitle>
            <CardDescription className="text-lg">
              El whitepaper ha sido enviado a tu email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">¿Qué Sigue?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Revisa tu email:</strong> Recibirás el whitepaper en PDF en los próximos 2 minutos
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Calcula tu ahorro:</strong> Usa nuestra calculadora interactiva para ver tu ROI específico
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Agenda una demo:</strong> Nuestro equipo te contactará en 24-48 horas para una demo personalizada
                  </span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1" size="lg" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Descargar Whitepaper Gratis
              </Button>
              <Button className="flex-1" variant="outline" size="lg" asChild>
                <a href="/roi-calculator">
                  Calcular Mi Ahorro
                </a>
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>¿Preguntas? Contáctanos en <a href="mailto:sales@rpcommercegroupllc.com" className="text-primary hover:underline">sales@rpcommercegroupllc.com</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="container py-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{APP_TITLE}</span>
          </div>
          <Button variant="outline" asChild>
            <a href="/">Volver al Inicio</a>
          </Button>
        </div>
      </header>

      <div className="container py-12">
        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto items-center">
          {/* Left Column: Value Proposition */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                Whitepaper Gratuito
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                El Costo Oculto de la Fuerza de Ventas Humana
              </h1>
              <p className="text-xl text-muted-foreground">
                Un análisis detallado de ROI que revela por qué los equipos de SDRs tradicionales 
                cuestan <strong>$95,000-$140,000 USD por persona anual</strong> y cómo la IA puede 
                reducir estos costos en <strong>80-85%</strong>.
              </p>
            </div>

            {/* Key Takeaways */}
            <Card>
              <CardHeader>
                <CardTitle>Lo que Aprenderás:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Anatomía completa de costos:</strong> Desglose detallado de salarios, beneficios, 
                      rotación e infraestructura que conforman el costo real de un SDR
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>El factor de rotación:</strong> Por qué la rotación del 35-40% anual en SDRs 
                      es el costo más oculto y cómo eliminarlo completamente
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Análisis comparativo IA vs. Humano:</strong> Comparación lado a lado de costos, 
                      rendimiento y escalabilidad entre modelos tradicionales y basados en IA
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Casos de estudio reales:</strong> Empresas B2B que ahorraron $189K-$870K anuales 
                      implementando agentes de IA
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Modelo de implementación:</strong> Framework paso a paso para transición gradual 
                      de SDRs humanos a agentes de IA
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Social Proof */}
            <div className="bg-muted p-6 rounded-lg">
              <p className="text-sm text-muted-foreground mb-4">Empresas que confiaron en este análisis:</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">150+</div>
                  <div className="text-xs text-muted-foreground">Empresas B2B</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">$25M+</div>
                  <div className="text-xs text-muted-foreground">Ahorrado Anual</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">518%</div>
                  <div className="text-xs text-muted-foreground">ROI Promedio</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Lead Capture Form */}
          <Card className="lg:sticky lg:top-8">
            <CardHeader>
              <CardTitle>Descarga el Whitepaper Gratis</CardTitle>
              <CardDescription>
                Completa el formulario para recibir el análisis completo de 40+ páginas en tu email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Corporativo *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa *</Label>
                  <Input
                    id="company"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol / Título *</Label>
                  <Input
                    id="role"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="VP de Ventas"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numSDRs">¿Cuántos SDRs tiene tu equipo?</Label>
                  <Input
                    id="numSDRs"
                    type="number"
                    min="0"
                    value={formData.numSDRs}
                    onChange={(e) => setFormData({ ...formData, numSDRs: e.target.value })}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Esto nos ayuda a personalizar el follow-up
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={captureLeadMutation.isPending}
                >
                  {captureLeadMutation.isPending ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar Whitepaper Gratis
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Al descargar, aceptas recibir comunicaciones de {APP_TITLE}. 
                  Puedes darte de baja en cualquier momento.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
