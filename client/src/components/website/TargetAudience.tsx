import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket, Building2, TrendingUp, Store } from "lucide-react";

const audiences = [
    {
        icon: Rocket,
        title: "Startups",
        description: "Acelera tu crecimiento inicial sin quemar capital en contrataciones riesgosas. Valida tu mercado rápidamente.",
        color: "bg-blue-100 text-blue-600",
    },
    {
        icon: Store,
        title: "PYMES",
        description: "Profesionaliza tu área comercial. Deja de depender del 'dueño vendedor' y construye un sistema predecible.",
        color: "bg-green-100 text-green-600",
    },
    {
        icon: TrendingUp,
        title: "Escalando (Scale-ups)",
        description: "Expande tu operación a nuevas regiones o segmentos sin la fricción de abrir oficinas físicas.",
        color: "bg-purple-100 text-purple-600",
    },
    {
        icon: Building2,
        title: "Empresas Maduras",
        description: "Reduce costos operativos y optimiza procesos legacy con nuestra capa de inteligencia artificial.",
        color: "bg-orange-100 text-orange-600",
    },
];

export function TargetAudience() {
    return (
        <section className="py-24 bg-slate-50">
            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-slate-900">
                            ¿Para Quién es Ivy.AI?
                        </h2>
                        <p className="text-lg text-slate-600">
                            Diseñamos nuestra solución pensando en organizaciones que necesitan agilidad, resultados y tecnología de punta sin la burocracia tradicional.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {audiences.map((item, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{item.title}</h3>
                                        <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4">
                            <Button size="lg" asChild className="rounded-full">
                                <a href="/contact">
                                    Habla con un Asesor
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </a>
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20 rounded-2xl blur-3xl transform rotate-3"></div>
                        <img
                            src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
                            alt="Reunión de equipo analizando datos"
                            className="relative rounded-2xl shadow-2xl border-4 border-white object-cover h-[500px] w-full"
                        />
                        {/* Floating Stats Card */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 hidden md:block">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-semibold">Crecimiento Promedio</p>
                                    <p className="text-xl font-bold text-slate-900">+127% YoY</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
