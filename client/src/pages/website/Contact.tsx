import { WebsiteLayout } from "@/components/website/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
    return (
        <WebsiteLayout>
            <div className="bg-slate-50 min-h-screen py-20">
                <div className="container px-4">
                    <div className="grid lg:grid-cols-2 gap-16">
                        {/* Contact Info */}
                        <div>
                            <h1 className="text-4xl font-bold text-slate-900 mb-6">Hablemos de tu Crecimiento</h1>
                            <p className="text-xl text-slate-600 mb-12">
                                Tu crecimiento no puede esperar. Agenda una reunión con nuestros consultores expertos para analizar tu caso.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center text-primary shrink-0">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Llámanos</h3>
                                        <p className="text-slate-500">+52 (55) 1234-5678</p>
                                        <p className="text-sm text-slate-400">Lun-Vie de 9am a 6pm</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center text-primary shrink-0">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Escríbenos</h3>
                                        <p className="text-slate-500">ventas@ivy.ai</p>
                                        <p className="text-sm text-slate-400">Respondemos en menos de 2h</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center text-primary shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Visítanos</h3>
                                        <p className="text-slate-500">Calle Principal 123, Oficina 4B</p>
                                        <p className="text-slate-500">Ciudad de México, CP 01234</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
                            <h2 className="text-2xl font-bold mb-6">Envíanos un mensaje</h2>
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre</Label>
                                        <Input id="name" placeholder="Tu nombre" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastname">Apellido</Label>
                                        <Input id="lastname" placeholder="Tu apellido" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Corporativo</Label>
                                    <Input id="email" type="email" placeholder="tu@empresa.com" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="company">Empresa</Label>
                                    <Input id="company" placeholder="Nombre de tu empresa" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reason">¿En qué podemos ayudarte?</Label>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una opción" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="demo">Quiero agendar una Demo</SelectItem>
                                            <SelectItem value="pricing">Consultar Precios</SelectItem>
                                            <SelectItem value="support">Soporte Técnico</SelectItem>
                                            <SelectItem value="other">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Mensaje</Label>
                                    <Textarea id="message" placeholder="Cuéntanos más sobre tus necesidades..." className="min-h-[120px]" />
                                </div>

                                <Button type="submit" className="w-full h-12 text-lg">
                                    Enviar Mensaje
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </WebsiteLayout>
    );
}
