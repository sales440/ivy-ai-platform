import { ArrowRight, Search, Settings, PhoneCall, LineChart } from "lucide-react";

const steps = [
    {
        icon: Search,
        title: "1. Diagnóstico Inicial",
        description: "Analizamos tu negocio, mercado objetivo y metas comerciales para diseñar la estrategia ganadora.",
    },
    {
        icon: Settings,
        title: "2. Implementación",
        description: "Configuramos la plataforma, integramos tus datos y asignamos tu equipo híbrido (IA + Humanos).",
    },
    {
        icon: PhoneCall,
        title: "3. Ejecución del Ciclo",
        description: "Iniciamos la prospección, calificación, demostraciones y cierre de ventas de forma autónoma.",
    },
    {
        icon: LineChart,
        title: "4. Optimización Continua",
        description: "Entregamos reportes detallados y la IA aprende de cada interacción para mejorar los resultados.",
    },
];

export function HowItWorks() {
    return (
        <section className="py-24 bg-white">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-slate-900 mb-4">
                        Cómo Funciona
                    </h2>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Integra una fuerza de ventas de alto rendimiento en 4 sencillos pasos.
                    </p>
                </div>

                <div className="relative grid md:grid-cols-4 gap-8">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-200 via-primary/50 to-blue-200 z-0"></div>

                    {steps.map((step, index) => (
                        <div key={index} className="relative z-10 flex flex-col items-center text-center group">
                            <div className="w-24 h-24 rounded-full bg-white border-4 border-blue-100 flex items-center justify-center mb-6 shadow-sm group-hover:border-primary transition-colors duration-300">
                                <step.icon className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed px-2">
                                {step.description}
                            </p>

                            {/* Mobile Arrow */}
                            {index < steps.length - 1 && (
                                <ArrowRight className="md:hidden mt-6 text-slate-300 transform rotate-90" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
