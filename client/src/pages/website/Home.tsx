import { WebsiteLayout } from "@/components/website/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

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
                            Vende más, sin contratar, entrenar ni gestionar un equipo. Nosotros nos encargamos de todo el ciclo de ventas, desde la generación de leads hasta el cierre.
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
                            <div className="text-white font-bold opacity-50">TRUSTED BY</div>
                            <div className="text-white font-bold text-xl">ACME Corp</div>
                            <div className="text-white font-bold text-xl">GlobalTech</div>
                        </div>
                    </div>

                    <div className="hidden lg:block relative">
                        <div className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-700">
                            {/* Abstract Dashboard Mockup */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="h-24 rounded-lg bg-white/10 animate-pulse"></div>
                                <div className="h-24 rounded-lg bg-white/10 animate-pulse delay-100"></div>
                                <div className="h-24 rounded-lg bg-white/10 animate-pulse delay-200"></div>
                            </div>
                            <div className="h-64 rounded-lg bg-gradient-to-b from-white/5 to-transparent border border-white/5"></div>
                        </div>
                    </div>
                </div>
            </section>
        </WebsiteLayout>
    );
}
