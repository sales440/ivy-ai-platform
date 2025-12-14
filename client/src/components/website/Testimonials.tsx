import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

export function Testimonials() {
    return (
        <section className="py-24 bg-slate-900 text-white">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                        Resultados Reales
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Empresas que escalaron sus ventas con Ivy.AI
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <Card className="bg-slate-800 border-none text-slate-200">
                        <CardContent className="pt-8 px-6 pb-6 relative">
                            <Quote className="absolute top-6 left-6 h-8 w-8 text-primary/20" />
                            <p className="mb-6 relative z-10 italic">
                                "Con Ivy.AI, nuestras ventas se incrementaron un 220% en solo 6 meses. Lo mejor es que no tuvimos que invertir tiempo en contratar ni entrenar vendedores."
                            </p>
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src="/placeholder-user.jpg" />
                                    <AvatarFallback className="bg-primary text-white">ML</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-bold text-white">María López</h4>
                                    <p className="text-xs text-slate-400">CEO, TechSolutions</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-sm font-semibold text-green-400">
                                <span>+250 leads/mes</span>
                                <span>ROI 450%</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800 border-none text-slate-200">
                        <CardContent className="pt-8 px-6 pb-6 relative">
                            <Quote className="absolute top-6 left-6 h-8 w-8 text-primary/20" />
                            <p className="mb-6 relative z-10 italic">
                                "La calidad de los leads que nos entrega Ivy.AI es impresionante. Su tecnología de scoring predictivo nos permite enfocarnos solo en quienes están listos para comprar."
                            </p>
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarFallback className="bg-blue-600 text-white">CR</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-bold text-white">Carlos Ruiz</h4>
                                    <p className="text-xs text-slate-400">Dir. Comercial, Logística Global</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-sm font-semibold text-green-400">
                                <span>Cierre en 23 días</span>
                                <span>+40% Conversión</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800 border-none text-slate-200">
                        <CardContent className="pt-8 px-6 pb-6 relative">
                            <Quote className="absolute top-6 left-6 h-8 w-8 text-primary/20" />
                            <p className="mb-6 relative z-10 italic">
                                "Como startup, no podíamos costear un director de ventas y un equipo completo. Ivy.AI nos dio acceso a una fuerza de ventas enterprise por una fracción del costo."
                            </p>
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarFallback className="bg-purple-600 text-white">AS</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-bold text-white">Ana Soto</h4>
                                    <p className="text-xs text-slate-400">Fundadora, GreenEats</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between text-sm font-semibold text-green-400">
                                <span>Ahorro del 60%</span>
                                <span>Escalabilidad Total</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
