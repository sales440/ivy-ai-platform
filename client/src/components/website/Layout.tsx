import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Bot, ChevronRight, Phone, Mail, MapPin, Facebook, Linkedin, Twitter, Instagram } from "lucide-react";
import { useState, useEffect } from "react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { AnimatedLogo } from "@/components/AnimatedLogo";

const navItems = [
    { label: "Inicio", href: "/" },
    { label: "Sobre Nosotros", href: "/about" },
    { label: "Servicios", href: "/services" },
    { label: "Tecnología", href: "/technology" },
    { label: "Precios", href: "/pricing" },
    { label: "Contacto", href: "/contact" },
];

export function WebsiteLayout({ children }: { children: React.ReactNode }) {
    const [location] = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen flex flex-col font-sans">
            {/* Navigation */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"
                    }`}
            >
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <Link href="/">
                        <a className="flex items-center gap-2 group">
                            <div className="relative">
                                <Bot className={`h-8 w-8 transition-colors ${scrolled ? "text-primary" : "text-white"}`} />
                                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className={`text-2xl font-bold transition-colors ${scrolled ? "text-foreground" : "text-white"}`}>
                                {APP_TITLE}
                            </span>
                        </a>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <a
                                    className={`text-sm font-medium transition-colors hover:text-primary ${location === item.href
                                        ? "text-primary"
                                        : scrolled
                                            ? "text-muted-foreground"
                                            : "text-white/90"
                                        }`}
                                >
                                    {item.label}
                                </a>
                            </Link>
                        ))}
                        <Button asChild variant="ghost" className={`ml-4 ${scrolled ? "text-slate-600 hover:text-primary" : "text-slate-300 hover:text-white"}`}>
                            <a href={getLoginUrl()}>Log In</a>
                        </Button>
                        <Button asChild className="rounded-full px-6 bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20">
                            <Link href="/demo-request">Book Demo</Link>
                        </Button>
                    </nav>

                    {/* Mobile Nav */}
                    <div className="md:hidden">
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className={scrolled ? "text-foreground" : "text-white"}>
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                <div className="flex flex-col gap-8 mt-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Bot className="h-8 w-8 text-primary" />
                                        <span className="text-xl font-bold">{APP_TITLE}</span>
                                    </div>
                                    <nav className="flex flex-col gap-4">
                                        {navItems.map((item) => (
                                            <Link key={item.href} href={item.href}>
                                                <a
                                                    className={`text-lg font-medium transition-colors hover:text-primary ${location === item.href ? "text-primary" : "text-foreground"
                                                        }`}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    {item.label}
                                                </a>
                                            </Link>
                                        ))}
                                        <div className="border-t pt-4 mt-4">
                                            <Button asChild className="w-full mb-2">
                                                <a href={getLoginUrl()}>Acceso Clientes</a>
                                            </Button>
                                            <Button asChild variant="outline" className="w-full">
                                                <Link href="/demo-request">Agenda una Demo</Link>
                                            </Button>
                                        </div>
                                    </nav>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white pt-20 pb-10">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Bot className="h-8 w-8 text-primary" />
                                <span className="text-2xl font-bold">{APP_TITLE}</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                Tu fuerza de ventas 360° impulsada por Inteligencia Artificial.
                                Vendemos más por ti, sin que tengas que contratar, entrenar o gestionar personal.
                            </p>
                            <div className="flex gap-4 pt-2">
                                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-primary hover:text-white transition-colors"><Linkedin size={18} /></a>
                                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-primary hover:text-white transition-colors"><Twitter size={18} /></a>
                                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-primary hover:text-white transition-colors"><Instagram size={18} /></a>
                                <a href="#" className="bg-slate-800 p-2 rounded-full hover:bg-primary hover:text-white transition-colors"><Facebook size={18} /></a>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-6 text-white">Enlaces Rápidos</h3>
                            <ul className="space-y-3">
                                {navItems.map((item) => (
                                    <li key={item.href}>
                                        <Link href={item.href}>
                                            <a className="text-slate-400 hover:text-primary transition-colors inline-flex items-center gap-2">
                                                <ChevronRight size={14} /> {item.label}
                                            </a>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-6 text-white">Servicios</h3>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Generación de Leads</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Cualificación IA</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Cierre de Ventas</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Consultoría de Ventas</a></li>
                                <li><a href="#" className="text-slate-400 hover:text-primary transition-colors">Optimización CRM</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-6 text-white">Contáctanos</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-slate-400">
                                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-1" />
                                    <span>Calle Principal 123, Oficina 4B<br />Ciudad de México, CP 01234</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-400">
                                    <Phone className="h-5 w-5 text-primary shrink-0" />
                                    <span>+52 (55) 1234-5678</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-400">
                                    <Mail className="h-5 w-5 text-primary shrink-0" />
                                    <span>contacto@ivy.ai</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                        <p>&copy; {new Date().getFullYear()} {APP_TITLE}. Todos los derechos reservados.</p>
                        <div className="flex gap-6">
                            <Link href="/privacy-policy"><a className="hover:text-white transition-colors">Política de Privacidad</a></Link>
                            <a href="#" className="hover:text-white transition-colors">Términos de Servicio</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
