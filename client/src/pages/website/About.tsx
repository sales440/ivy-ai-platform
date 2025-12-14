import { WebsiteLayout } from "@/components/website/Layout";
import { Button } from "@/components/ui/button";
import { Users, Target, Rocket, Award } from "lucide-react";

export default function About() {
    return (
        <WebsiteLayout>
            <div className="bg-slate-50 min-h-screen">
                {/* Header */}
                <section className="bg-slate-900 text-white py-20">
                    <div className="container px-4 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">Sobre Nosotros</h1>
                        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                            Empoderamos a las empresas para que crezcan mediante una fuerza de ventas externa de alto rendimiento, impulsada por IA.
                        </p>
                    </div>
                </section>

                {/* Mission & Vision */}
                <section className="py-20 container px-4">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Nuestra Misión</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Nacimos para resolver el mayor dolor de las PYMES: la falta de un equipo de ventas eficiente. Nuestra misión es democratizar el acceso a procesos de venta de clase mundial, combinando talento humano experto con la potencia de la inteligencia artificial.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                                <Rocket className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4">Nuestra Visión</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Ser el socio de ventas preferido para cualquier negocio que quiera vender más sin complejidades. Visualizamos un futuro donde las empresas pueden escalar sus ingresos con un solo clic, confiando en nuestra infraestructura.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-20 bg-white">
                    <div className="container px-4 text-center">
                        <h2 className="text-3xl font-bold mb-12">Líderes en Ventas y Tecnología</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Team Member 1 */}
                            <div className="group">
                                <div className="relative overflow-hidden rounded-xl mb-4 h-64 mx-auto w-full max-w-xs bg-slate-200">
                                    {/* Placeholder Image */}
                                    <div className="absolute inset-0 bg-slate-300 flex items-center justify-center text-slate-500">
                                        <Users className="w-12 h-12" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold">Carlos Mendoza</h3>
                                <p className="text-blue-600 font-medium">CEO & Fundador</p>
                                <p className="text-sm text-slate-500 mt-2">Ex-VP de Ventas en TechGiant, con 15 años escalando equipos b2b.</p>
                            </div>

                            {/* Team Member 2 */}
                            <div className="group">
                                <div className="relative overflow-hidden rounded-xl mb-4 h-64 mx-auto w-full max-w-xs bg-slate-200">
                                    <div className="absolute inset-0 bg-slate-300 flex items-center justify-center text-slate-500">
                                        <Users className="w-12 h-12" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold">Laura Silva</h3>
                                <p className="text-blue-600 font-medium">Head of AI</p>
                                <p className="text-sm text-slate-500 mt-2">PhD en Machine Learning, liderando nuestro motor de predicción de ventas.</p>
                            </div>

                            {/* Team Member 3 */}
                            <div className="group">
                                <div className="relative overflow-hidden rounded-xl mb-4 h-64 mx-auto w-full max-w-xs bg-slate-200">
                                    <div className="absolute inset-0 bg-slate-300 flex items-center justify-center text-slate-500">
                                        <Users className="w-12 h-12" />
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold">David Torres</h3>
                                <p className="text-blue-600 font-medium">Director de Operaciones</p>
                                <p className="text-sm text-slate-500 mt-2">Experto en optimización de procesos y gestión de equipos de alto rendimiento.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Awards/Trust */}
                <section className="py-20 container px-4">
                    <div className="bg-slate-900 rounded-2xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                <Award className="w-8 h-8 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Reconocidos por la Industria</h3>
                                <p className="text-slate-400">Finalista en los Premios de Innovación 2024</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 opacity-70 grayscale">
                            {/* Logos */}
                            <div className="font-bold text-xl">Forbes</div>
                            <div className="font-bold text-xl">Entrepreneur</div>
                            <div className="font-bold text-xl">TechCrunch</div>
                            <div className="font-bold text-xl">El Financiero</div>
                        </div>
                    </div>
                </section>
            </div>
        </WebsiteLayout>
    );
}
