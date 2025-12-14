import { WebsiteLayout } from "@/components/website/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle2, TrendingUp, Users, ShieldCheck, Zap } from "lucide-react";
import { Benefits } from "@/components/website/Benefits";
import { HowItWorks } from "@/components/website/HowItWorks";
import { Testimonials } from "@/components/website/Testimonials";
import { TargetAudience } from "@/components/website/TargetAudience";
import { Link } from "wouter";
import { MotionContainer, FadeIn } from "@/components/ui/motion-container";

export default function Home() {
    return (
        <WebsiteLayout>
            {/* --- HERO SECTION --- */}
            <section className="relative min-h-[95vh] flex items-center pt-20 bg-[#0B0F19] overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Aurora Borealis Gradients */}
                    <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[70%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }}></div>

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                </div>

                <div className="container relative z-10 grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left Content */}
                    <div className="space-y-8 text-center lg:text-left">
                        <FadeIn delay={0.2}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-green-400 text-sm font-medium shadow-[0_0_15px_rgba(74,222,128,0.2)] hover:bg-white/10 transition-colors cursor-default">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                AI Agent Squad v2.0 Live
                            </div>
                        </FadeIn>

                        <MotionContainer delay={0.3} className="space-y-6">
                            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
                                Sales Force <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 animate-gradient-x">
                                    Autonomy
                                </span>
                            </h1>

                            <p className="text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
                                Deploy an elite squad of AI agents that <span className="text-white font-medium">Research</span>, <span className="text-white font-medium">Negotiate</span>, and <span className="text-white font-medium">Close Deals</span> 24/7.
                            </p>
                        </MotionContainer>

                        <MotionContainer delay={0.4} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <Link href="/demo-request">
                                <Button size="lg" className="rounded-full text-lg h-14 px-8 bg-blue-600 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] transition-all hover:scale-105 border-t border-white/20">
                                    Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/technology">
                                <Button size="lg" variant="outline" className="rounded-full text-lg h-14 px-8 border-white/10 bg-white/5 backdrop-blur-sm text-slate-300 hover:bg-white/10 hover:text-white transition-all">
                                    <Play className="mr-2 h-5 w-5 fill-current" /> How It Works
                                </Button>
                            </Link>
                        </MotionContainer>

                        <MotionContainer delay={0.5} className="pt-8 border-t border-white/5 mt-8">
                            <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-6">Trusted by 500+ Growth Teams</p>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                                {/* Simulated Logos */}
                                <div className="flex items-center gap-2 text-white font-semibold text-lg"><ShieldCheck className="h-6 w-6 text-blue-500" /> TechSecure</div>
                                <div className="flex items-center gap-2 text-white font-semibold text-lg"><TrendingUp className="h-6 w-6 text-green-500" /> GrowthFlow</div>
                                <div className="flex items-center gap-2 text-white font-semibold text-lg"><Zap className="h-6 w-6 text-yellow-500" /> FastScale</div>
                            </div>
                        </MotionContainer>
                    </div>

                    {/* Right content: 3D Floating Dashboard */}
                    <FadeIn delay={0.6} className="hidden lg:block relative perspective-1000">
                        <div className="relative rounded-2xl border border-white/10 bg-[#131b2c]/80 backdrop-blur-xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform rotate-y-[-12deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-all duration-1000 group">
                            {/* Glow behind card */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                            {/* Inner Content */}
                            <div className="relative z-10 space-y-6">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                                        <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                                        <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                                    </div>
                                    <div className="text-xs font-mono text-slate-500">IVY-SQUAD-V2 // ACTIVE</div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors">
                                        <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase tracking-wider">
                                            <Users className="h-3 w-3" /> Pipeline Value
                                        </div>
                                        <div className="text-2xl font-bold text-white">$452,000</div>
                                        <div className="text-xs text-green-400 mt-1 flex items-center">
                                            <TrendingUp className="h-3 w-3 mr-1" /> +24% this week
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-colors">
                                        <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs uppercase tracking-wider">
                                            <CheckCircle2 className="h-3 w-3" /> Meetings Booked
                                        </div>
                                        <div className="text-2xl font-bold text-white">48</div>
                                        <div className="text-xs text-blue-400 mt-1 flex items-center">
                                            <TrendingUp className="h-3 w-3 mr-1" /> 12 today
                                        </div>
                                    </div>
                                </div>

                                {/* Live Feed */}
                                <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                    <div className="text-xs text-slate-500 mb-3 font-mono">LIVE ACTIVITY FEED</div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            <div className="text-slate-300 text-xs"><span className="text-blue-400 font-bold">Ivy-Closer</span> negotiated term sheet with <span className="text-white">Apex Corp</span></div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                            <div className="text-slate-300 text-xs"><span className="text-purple-400 font-bold">Ivy-Prospect</span> found 15 qualified leads in <span className="text-white">Fintech</span></div>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                                            <div className="text-slate-300 text-xs"><span className="text-green-400 font-bold">Logic</span> optimized campaign "Q4 Outreach"</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>

            <Benefits />
            <HowItWorks />
            <Testimonials />
            <TargetAudience />

            {/* --- FINAL CTA --- */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/30 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[100px]"></div>
                </div>

                <MotionContainer className="container relative z-10 text-center text-white">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">Ready to Scale to Superhuman?</h2>
                    <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-light">
                        Stop manual prospecting. Hire the AI squad that works while you sleep.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link href="/demo-request">
                            <Button size="lg" variant="secondary" className="rounded-full text-lg h-16 px-12 text-blue-900 font-bold shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 transition-all">
                                Get Started Now
                            </Button>
                        </Link>
                        <Link href="/pricing">
                            <Button size="lg" variant="outline" className="rounded-full text-lg h-16 px-10 border-white/30 text-white hover:bg-white/10 transition-all">
                                View Pricing
                            </Button>
                        </Link>
                    </div>
                </MotionContainer>
            </section>
        </WebsiteLayout>
    );
}
