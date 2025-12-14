import { WebsiteLayout } from "@/components/website/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, Phone, Users, BarChart, CheckSquare, RefreshCw } from "lucide-react";

export default function Services() {
    return (
        <WebsiteLayout>
            <div className="bg-white min-h-screen">
                {/* Header */}
                <section className="bg-slate-900 text-white py-20 pb-32">
                    <div className="container px-4 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">Nuestros Servicios 360°</h1>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                            Gestionamos cada fase del embudo de ventas combinando inteligencia artificial y expertos humanos para maximizar tus resultados.
                        </p>
                    </div>
                </section>

                {/* Services Timeline/Flow */}
                <section className="container px-4 -mt-20 pb-20 relative z-10">
                    <div className="space-y-8">
                        {/* Service 1 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col md:flex-row gap-8 items-start border-l-4 border-blue-500">
                            <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                <MessageSquare className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">1. Generación y Calificación de Leads</h3>
                                <p className="text-slate-600 mb-4">
                                    Nuestra IA analiza bases de datos globales, redes sociales y comportamiento online para identificar a tus prospects ideales. No más listas frías; entregamos leads con intención de compra.
                                </p>
                                <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-500">
                                    <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-green-500" /> Scoring Predictivo</li>
                                    <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-green-500" /> Enriquecimiento de Datos</li>
                                </ul>
                            </div>
                        </div>

                        {/* Service 2 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col md:flex-row gap-8 items-start border-l-4 border-purple-500">
                            <div className="w-16 h-16 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                                <Phone className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">2. Prospección Personalizada</h3>
                                <p className="text-slate-600 mb-4">
                                    Ejecutamos campañas multicanal (Email, LinkedIn, Llamadas) totalmente automatizadas pero hiper-personalizadas. La IA decide el mejor momento y canal para contactar a cada prospecto.
                                </p>
                                <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-500">
                                    <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-green-500" /> Secuencias Inteligentes</li>
                                    <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-green-500" /> IA Conversacional</li>
                                </ul>
                            </div>
                        </div>

                        {/* Service 3 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col md:flex-row gap-8 items-start border-l-4 border-green-500">
                            <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">3. Demostraciones y Cierre</h3>
                                <p className="text-slate-600 mb-4">
                                    Nuestros ejecutivos de ventas (humanos) toman el relevo para realizar demos consultivas y negociar el cierre, armados con todos los insights que la IA ha recolectado.
                                </p>
                                <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-500">
                                    <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-green-500" /> Ejecutivos Senior</li>
                                    <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-green-500" /> Negociación Estratégica</li>
                                </ul>
                            </div>
                        </div>

                        {/* Service 4 */}
                        <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col md:flex-row gap-8 items-start border-l-4 border-orange-500">
                            <div className="w-16 h-16 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                                <RefreshCw className="w-8 h-8 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-slate-900 mb-3">4. Postventa y Retención</h3>
                                <p className="text-slate-600 mb-4">
                                    El trabajo no termina en la firma. Realizamos seguimiento para asegurar la satisfacción, reducir el churn y detectar oportunidades de upsell/cross-sell.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="bg-slate-50 py-20">
                    <div className="container px-4 text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl font-bold mb-6">¿Tu equipo actual puede hacer todo esto?</h2>
                        <p className="text-slate-600 mb-8 max-w-50">
                            Si la respuesta es no, es momento de actualizar tu estrategia comercial. Contrata tu fuerza de ventas hoy mismo.
                        </p>
                        <Button size="lg" className="rounded-full h-12 px-8">
                            Contrata Tu Fuerza de Ventas Ahora <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </section>
            </div>
        </WebsiteLayout>
    );
}
