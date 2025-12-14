import { CheckCircle2, Bot, Users, BarChart3, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const benefits = [
    {
        icon: CheckCircle2,
        title: "Cobertura Total del Ciclo de Ventas",
        description: "Desde la generación del lead hasta la facturación. Gestionamos todo el proceso para que tú solo te preocupes de entregar el producto.",
    },
    {
        icon: Bot,
        title: "Tecnología IA que Predice y Optimiza",
        description: "Algoritmos avanzados que identifican los prospects con mayor probabilidad de conversión, personalizando cada interacción.",
    },
    {
        icon: Users,
        title: "Expertos en Ventas Dedicados",
        description: "Profesionales experimentados que hablan tu idioma y conocen tu industria, potenciados por nuestras herramientas de IA.",
    },
    {
        icon: BarChart3,
        title: "Transparencia Total",
        description: "Dashboard en tiempo real con métricas claras: leads, conversiones y ROI. Sin cajas negras.",
    },
    {
        icon: Wallet,
        title: "Ahorro de Hasta 40% en Costos",
        description: "Elimina gastos de reclutamiento, salarios fijos, comisiones complejas y capacitación. Paga por resultados.",
    },
];

export function Benefits() {
    return (
        <section className="py-24 bg-slate-50">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-slate-900 mb-4">
                        ¿Por Qué Elegir Ivy.AI?
                    </h2>
                    <p className="text-slate-600 text-lg">
                        La combinación perfecta entre inteligencia artificial y experiencia humana para escalar tus ventas.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {benefits.map((benefit, index) => (
                        <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader>
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <benefit.icon className="w-6 h-6 text-primary" />
                                </div>
                                <CardTitle className="text-xl font-bold text-slate-900">
                                    {benefit.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-600 leading-relaxed">
                                    {benefit.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
