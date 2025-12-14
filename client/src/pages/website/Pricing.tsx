import { WebsiteLayout } from "@/components/website/Layout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
    {
        name: "Plan por Resultado",
        price: "Variable",
        description: "Ideal para minimizar riesgos. Pagas por resultados tangibles.",
        features: [
            "Pago por Lead Calificado (CPL)",
            "Pago por Venta Cerrada (CPA)",
            "Dashboard Básico",
            "Soporte por Email",
            "Equipo compartido",
        ],
        buttonText: "Consultar Tarifas",
        highlight: false,
    },
    {
        name: "Equipo Dedicado",
        price: "$2,500",
        period: "/mes + comisión",
        description: "Tu propio equipo de ventas, dedicado 100% a tu marca.",
        features: [
            "1 Ejecutivo de Ventas Dedicado",
            "Infraestructura IA Completa",
            "Dashboard Avanzado en Tiempo Real",
            "Reuniones de Estrategia Semanales",
            "Grabación de llamadas y análisis",
            "Garantía de Satisfacción",
        ],
        buttonText: "Empezar Ahora",
        highlight: true,
    },
    {
        name: "Enterprise",
        price: "Personalizado",
        description: "Para grandes volúmenes y necesidades complejas.",
        features: [
            "Múltiples Squads de Ventas",
            "Integraciones CRM a medida",
            "Gerente de Cuenta Exclusivo",
            "Soporte 24/7",
            "Capacitación de IA con tus datos",
            "Acuerdos de Nivel de Servicio (SLA)",
        ],
        buttonText: "Hablar con Ventas",
        highlight: false,
    },
];

export default function Pricing() {
    return (
        <WebsiteLayout>
            <div className="bg-slate-50 min-h-screen py-20">
                <div className="container px-4 text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Planes Flexibles y Transparentes</h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Elige el modelo que mejor se adapte a tu etapa actual. Escala cuando quieras.
                    </p>
                </div>

                <div className="container px-4 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`rounded-2xl p-8 bg-white border ${plan.highlight ? 'border-primary ring-4 ring-primary/10 shadow-xl scale-105 z-10' : 'border-slate-200 shadow-sm hover:shadow-md'} transition-all flex flex-col`}
                        >
                            {plan.highlight && (
                                <div className="bg-primary text-white text-xs font-bold uppercase tracking-wide py-1 px-3 rounded-full w-fit mx-auto mb-4">
                                    Más Popular
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">{plan.name}</h3>
                            <div className="text-center mb-6">
                                <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                                {plan.period && <span className="text-slate-500">{plan.period}</span>}
                            </div>
                            <p className="text-slate-500 text-center mb-8 h-12">{plan.description}</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                                        <Check className="w-5 h-5 text-green-500 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button className={`w-full ${plan.highlight ? 'bg-primary hover:bg-primary/90' : 'bg-slate-900 hover:bg-slate-800'}`} size="lg">
                                {plan.buttonText}
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="container px-4 mt-20 text-center">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 max-w-3xl mx-auto">
                        <h3 className="text-xl font-bold text-blue-900 mb-2">Garantía de Resultados</h3>
                        <p className="text-blue-700">
                            Estamos tan seguros de nuestro método que si no generamos leads calificados en los primeros 60 días, no pagas el fee de servicio. Transparencia total.
                        </p>
                    </div>
                </div>
            </div>
        </WebsiteLayout>
    );
}
