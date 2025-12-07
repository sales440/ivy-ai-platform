import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle2, Video, Clock, Users } from "lucide-react";
import { APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Demo Request Landing Page - Decision Stage
 * High-intent prospects ready for personalized ROI demo
 */
export default function DemoRequest() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    role: "",
    phone: "",
    numSDRs: "",
    timeline: "",
    challenges: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const requestDemoMutation = trpc.marketing.requestDemo.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("¡Demo agendada! Te contactaremos pronto.");
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestDemoMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl">¡Solicitud Recibida!</CardTitle>
            <CardDescription className="text-lg">
              Nuestro equipo te contactará en las próximas 24 horas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg">¿Qué Esperar en tu Demo?</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Análisis de ROI Personalizado:</strong> Calcularemos tu ahorro específico basado en tu equipo actual
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Demo en Vivo:</strong> Verás a nuestros agentes de IA en acción con casos de uso reales
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Plan de Implementación:</strong> Diseñaremos un roadmap específico para tu empresa
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Q&A Abierto:</strong> Responderemos todas tus preguntas técnicas y de negocio
                  </span>
                </li>
              </ul>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-semibold">45 minutos</div>
                <div className="text-xs text-muted-foreground">Duración típica</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <Video className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-semibold">Video Call</div>
                <div className="text-xs text-muted-foreground">Zoom o Google Meet</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-semibold">Tu Equipo</div>
                <div className="text-xs text-muted-foreground">Invita stakeholders</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex-1" size="lg" asChild>
                <a href="/roi-calculator">
                  Calcular Mi ROI
                </a>
              </Button>
              <Button className="flex-1" variant="outline" size="lg" asChild>
                <a href="/">
                  Volver al Inicio
                </a>
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>¿Preguntas urgentes? Llámanos al <a href="tel:+1234567890" className="text-primary hover:underline">+1 (234) 567-890</a></p>
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
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">{APP_TITLE}</span>
          </div>
          <Button variant="outline" asChild>
            <a href="/">Volver al Inicio</a>
          </Button>
        </div>
      </header>

      <div className="container py-12">
        <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto items-start">
          {/* Left Column: Value Proposition */}
          <div className="space-y-8 lg:sticky lg:top-8">
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                Demo Personalizada
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                Descubre Cómo Ahorrar $500K+ Anuales en tu Equipo de Ventas
              </h1>
              <p className="text-xl text-muted-foreground">
                Agenda una demo de ROI personalizada de 45 minutos donde te mostraremos exactamente 
                cuánto puedes ahorrar reemplazando SDRs humanos con agentes de IA.
              </p>
            </div>

            {/* What You'll Get */}
            <Card>
              <CardHeader>
                <CardTitle>En tu Demo Recibirás:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <div className="font-semibold">Análisis de Costo Total de Propiedad</div>
                      <div className="text-sm text-muted-foreground">
                        Desglose completo de tus costos actuales de SDRs vs. modelo de IA
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <div className="font-semibold">Demo en Vivo de Agentes de IA</div>
                      <div className="text-sm text-muted-foreground">
                        Verás llamadas reales, emails y secuencias de prospección en acción
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <div className="font-semibold">Casos de Estudio Relevantes</div>
                      <div className="text-sm text-muted-foreground">
                        Empresas similares a la tuya que lograron ahorros de $189K-$870K anuales
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">4</span>
                    </div>
                    <div>
                      <div className="font-semibold">Plan de Implementación Personalizado</div>
                      <div className="text-sm text-muted-foreground">
                        Roadmap específico para tu transición gradual de humanos a IA
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">5</span>
                    </div>
                    <div>
                      <div className="font-semibold">Propuesta de Piloto sin Riesgo</div>
                      <div className="text-sm text-muted-foreground">
                        Opción de piloto de 30 días con garantía de rendimiento
                      </div>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Testimonial */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm italic">
                      "La demo de Ivy.AI fue reveladora. En 45 minutos entendimos que estábamos 
                      gastando $1.1M anuales en un equipo de SDRs que podíamos reemplazar por 
                      $340K con mejor rendimiento. Implementamos en 3 meses y nunca miramos atrás."
                    </p>
                    <div className="text-sm">
                      <div className="font-semibold">Sarah Chen</div>
                      <div className="text-muted-foreground">VP de Ventas, TechCorp (Serie B)</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Demo Request Form */}
          <Card className="lg:sticky lg:top-8">
            <CardHeader>
              <CardTitle>Agenda tu Demo Personalizada</CardTitle>
              <CardDescription>
                Completa el formulario y te contactaremos en 24 horas para coordinar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
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
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (234) 567-8900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numSDRs">Tamaño Actual del Equipo de SDRs *</Label>
                  <Select
                    value={formData.numSDRs}
                    onValueChange={(value) => setFormData({ ...formData, numSDRs: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona rango" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 SDRs</SelectItem>
                      <SelectItem value="3-5">3-5 SDRs</SelectItem>
                      <SelectItem value="6-10">6-10 SDRs</SelectItem>
                      <SelectItem value="11-20">11-20 SDRs</SelectItem>
                      <SelectItem value="20+">20+ SDRs</SelectItem>
                      <SelectItem value="0">Aún no tenemos SDRs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline de Implementación *</Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => setFormData({ ...formData, timeline: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="¿Cuándo planeas implementar?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Inmediato (próximas 2 semanas)</SelectItem>
                      <SelectItem value="1-month">1 mes</SelectItem>
                      <SelectItem value="1-3-months">1-3 meses</SelectItem>
                      <SelectItem value="3-6-months">3-6 meses</SelectItem>
                      <SelectItem value="exploring">Solo explorando opciones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenges">Principales Desafíos con tu Equipo Actual</Label>
                  <Textarea
                    id="challenges"
                    value={formData.challenges}
                    onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                    placeholder="Ej: Alta rotación, costos crecientes, dificultad para escalar, inconsistencia en calidad..."
                    rows={4}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={requestDemoMutation.isPending}
                >
                  {requestDemoMutation.isPending ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Solicitar Demo Personalizada
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Al solicitar una demo, aceptas recibir comunicaciones de {APP_TITLE}. 
                  Sin compromiso ni presión de ventas.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
