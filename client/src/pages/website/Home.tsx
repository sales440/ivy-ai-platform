import { WebsiteLayout } from "@/components/website/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { Benefits } from "@/components/website/Benefits";
import { HowItWorks } from "@/components/website/HowItWorks";
import { Testimonials } from "@/components/website/Testimonials";
import { TargetAudience } from "@/components/website/TargetAudience";

export default function Home() {
    return (
        <WebsiteLayout>
            <section className="relative min-h-[90vh] flex items-center pt-20 bg-slate-900 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-blue-900/20 to-transparent rounded-full blur-3xl"></div>
                </div>

                <div className="container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-white text-sm font-medium">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Tu equipo de ventas 24/7
                        </div>

                        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
                            Fuerza de Ventas <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">360° con IA</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0">
                            Incrementa tus ventas hasta un 300% sin necesidad de tener un equipo propio. Ivy.AI gestiona todo el ciclo de ventas por ti, desde la prospección hasta el cierre.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <Button size="lg" className="rounded-full text-lg h-12 px-8 bg-green-600 hover:bg-green-700">
                                Reserva una Demo Gratis <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-full text-lg h-12 px-8 border-white/30 text-white hover:bg-white/10">
                                <Play className="mr-2 h-5 w-5 fill-current" /> Ver Video
                            </Button>
                        </div>

                        <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 opacity-80 grayscale hover:grayscale-0 transition-all">
                            {/* Client Logos Placeholders */}
                            <div className="text-white font-bold opacity-50 text-sm tracking-widest">EMPRESAS QUE CONFÍAN EN IVY.AI</div>
                            <div className="text-white font-bold text-lg">TechCorp</div>
                            <div className="text-white font-bold text-lg">GrowthInc</div>
                            <div className="text-white font-bold text-lg">SalesFlow</div>
                        </div>
                    </div>

                    <div className="hidden lg:block relative">
                        <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-700 group">
                            <div className="absolute -top-10 -right-10 bg-gradient-to-br from-green-400 to-blue-500 w-24 h-24 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>

                            {/* Abstract Dashboard Mockup */}
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="h-32 flex-1 rounded-lg bg-white/10 p-4 border border-white/5 flex flex-col justify-between">
                                        <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">+124</div>
                                            <div className="text-xs text-slate-400">Leads Calificados</div>
                                        </div>
                                    </div>
                                    <div className="h-32 flex-1 rounded-lg bg-white/10 p-4 border border-white/5 flex flex-col justify-between">
                                        <div className="w-8 h-8 rounded bg-green-500/20 text-green-400 flex items-center justify-center"><ArrowRight className="w-5 h-5 -rotate-45" /></div>
                                        <div>
                                            <div className="text-2xl font-bold text-white">$45.2k</div>
                                            <div className="text-xs text-slate-400">Ingresos Generados</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-48 rounded-lg bg-gradient-to-b from-white/5 to-transparent border border-white/5 p-4">
                                    <div className="flex items-end gap-2 h-full pb-2">
                                        <div className="w-full bg-blue-500/30 rounded-t h-[40%] animate-pulse"></div>
                                        <div className="w-full bg-blue-500/40 rounded-t h-[60%] animate-pulse delay-75"></div>
                                        <div className="w-full bg-blue-500/50 rounded-t h-[30%] animate-pulse delay-100"></div>
                                        <div className="w-full bg-blue-500/60 rounded-t h-[80%] animate-pulse delay-150"></div>
                                        <div className="w-full bg-green-500 rounded-t h-[95%] shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Benefits />
            <HowItWorks />
            <Testimonials />
            <TargetAudience />

            {/* Final CTA */}
            <section className="py-24 bg-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="container relative z-10 text-center text-white">
                    <h2 className="text-4xl font-bold mb-6">¿Listo para Escalar tus Ventas?</h2>
                    <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
                        Deja de perder tiempo en tareas operativas y empieza a cerrar negocios con tu nuevo equipo de ventas inteligente.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" variant="secondary" className="rounded-full text-lg h-14 px-10 text-primary font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                            Agenda tu Consulta Hoy
                        </Button>
                        <Button size="lg" variant="outline" className="rounded-full text-lg h-14 px-10 border-white text-white hover:bg-white/10">
                            Ver Planes y Precios
                        </Button>
                    </div>
                </div>
            </section>
        </WebsiteLayout>
    );
}
