import { WebsiteLayout } from "@/components/website/Layout";
import { Button } from "@/components/ui/button";
import { BrainCircuit, MessageBot, LineChart, Zap } from "lucide-react";

export default function Technology() {
    return (
        <WebsiteLayout>
            <div className="bg-slate-900 min-h-screen text-white">
                {/* Header */}
                <section className="py-20 relative overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                    <div className="container px-4 text-center relative z-10">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            El Cerebro Detrás de Tus Ventas
                        </h1>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                            Nuestra plataforma propietaria combina modelos LLM avanzados con análisis predictivo para automatizar y optimizar cada interacción.
                        </p>
                    </div>
                </section>

                {/* Tech Features */}
                <section className="py-20 container px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
                                {/* Fake Dashboard UI */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm text-slate-400 mb-2">
                                        <span>Predicción de Cierre</span>
                                        <span>94% Precisión</span>
                                    </div>
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[94%]"></div>
                                    </div>

                                    <div className="pt-4 space-y-3">
                                        <div className="flex gap-3 items-center p-3 rounded bg-white/5 border border-white/5">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                <MessageBot size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Lead Calificado: John Doe</p>
                                                <p className="text-xs text-slate-500">Motivo: Alta interacción con pricing page</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-center p-3 rounded bg-white/5 border border-white/5">
                                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                <Zap size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Acción Recomendada: Agendar Demo</p>
                                                <p className="text-xs text-slate-500">Enviar email personalizado #3</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                                    <BrainCircuit className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Módulo Predictivo</h3>
                                    <p className="text-slate-400">IA que analiza miles de puntos de datos para predecir qué leads están listos para comprar, priorizando el tiempo de nuestros ejecutivos en oportunidades reales.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                                    <MessageBot className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Automatización Inteligente</h3>
                                    <p className="text-slate-400">Desde chatbots que califican visitantes hasta emails que se redactan solos basándose en el comportamiento del usuario. Automatizamos el 70% del trabajo manual.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                                    <LineChart className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Dashboard en Tiempo Real</h3>
                                    <p className="text-slate-400">Transparencia total. Accede a tu panel de control para ver cada llamada, cada email y cada venta en tiempo real.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonial Technical */}
                <section className="py-20 bg-white/5 mx-4 md:mx-0">
                    <div className="container px-4 text-center max-w-3xl mx-auto">
                        <p className="text-2xl font-light italic mb-8">"La precisión de la IA de Ivy.AI nos permitió reducir el ciclo de venta en un 35%, eliminando el 'ruido' de leads que no iban a comprar."</p>
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-700"></div>
                            <div className="text-left">
                                <p className="font-bold">Roberto Gómez</p>
                                <p className="text-sm text-slate-400">CTO, DataSystems</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </WebsiteLayout>
    );
}
