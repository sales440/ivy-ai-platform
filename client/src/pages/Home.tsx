import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import {
  Bot,
  Zap,
  Shield,
  BarChart3,
  Phone,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Brain,
  Target,
  Clock,
  Globe,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-cyan-500/10 via-black to-orange-500/10 animate-gradient-shift" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/20 backdrop-blur-sm sticky top-0">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8 rounded-md" />
            <span className="font-bold text-xl">{APP_TITLE}</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#ropa" className="text-sm font-medium hover:text-primary transition-colors">
              ROPA
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>Get Started</Button>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">Powered by AI & Autonomous Agents</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Transform Your Business with{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-orange-400 bg-clip-text text-transparent">
                Intelligent AI Agents
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Ivy.AI empowers your team with autonomous AI agents that handle calls, analyze markets,
              and optimize campaigns 24/7. Built on ROPA, our meta-agent orchestrator.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 gap-2">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 gap-2"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Link href="/ropa">
                <Button size="lg" variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10 text-white gap-2">
                  <Bot className="h-4 w-4" />
                  Meet ROPA
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-8">
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                  129
                </div>
                <div className="text-sm text-gray-500 mt-1">AI Tools</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-orange-400 bg-clip-text text-transparent">
                  24/7
                </div>
                <div className="text-sm text-gray-500 mt-1">Autonomous</div>
              </div>
              <div>
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
                  99.9%
                </div>
                <div className="text-sm text-gray-500 mt-1">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 border-t border-cyan-500/20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">
                Scale Your Business
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Comprehensive AI-powered tools for modern businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all hover:scale-105">
              <CardHeader>
                <Phone className="h-10 w-10 text-primary mb-2" />
                <CardTitle>IvyCall Training</CardTitle>
                <CardDescription>
                  AI voice agents that handle calls, analyze performance, and optimize scripts in
                  real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Call script generation
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Performance analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Auto-scheduling follow-ups
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all hover:scale-105">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Market Intelligence</CardTitle>
                <CardDescription>
                  Real-time competitor analysis, trend detection, and market opportunity identification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Competitor monitoring
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Trend analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Market predictions
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all hover:scale-105">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Analytics & BI</CardTitle>
                <CardDescription>
                  Advanced analytics, ROI calculation, churn prediction, and revenue forecasting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Custom dashboards
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Predictive analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Automated reporting
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all hover:scale-105">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Security & Compliance</CardTitle>
                <CardDescription>
                  Enterprise-grade security with automated vulnerability scanning and compliance
                  monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Automated security scans
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Compliance enforcement
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Data encryption
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all hover:scale-105">
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Automation & Workflows</CardTitle>
                <CardDescription>
                  Build custom workflows, schedule tasks, and automate repetitive processes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Visual workflow builder
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Smart scheduling
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Error handling
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all hover:scale-105">
              <CardHeader>
                <Globe className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Integration Hub</CardTitle>
                <CardDescription>
                  Connect with your favorite tools via webhooks, APIs, and pre-built integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    CRM integration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Webhook support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Data synchronization
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ROPA Section */}
      <section id="ropa" className="relative z-10 py-20 border-t border-cyan-500/20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-6">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-medium">Meet ROPA</span>
              </div>
              <h2 className="text-4xl font-bold mb-6">
                Your{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">
                  24/7 Autonomous Meta-Agent
                </span>
              </h2>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                ROPA (Robotic Operations & Process Automation) is the brain behind Ivy.AI. It
                orchestrates 129 specialized AI tools, monitors platform health, and autonomously
                fixes issues before they impact your business.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400">

                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Self-Learning System</h3>
                    <p className="text-sm text-gray-400">
                      ROPA learns from every interaction and continuously improves performance
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400">

                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Auto-Healing</h3>
                    <p className="text-sm text-gray-400">
                      Detects and fixes platform issues automatically without human intervention
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400">

                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 text-white">24/7 Operations</h3>
                    <p className="text-sm text-gray-400">
                      Runs maintenance cycles, health checks, and market intelligence around the clock
                    </p>
                  </div>
                </div>
              </div>

              <Link href="/ropa">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 gap-2">
                  Explore ROPA Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <Card className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-cyan-500/20 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    ROPA Live Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Platform Health</span>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      98% Excellent
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Tools</span>
                    <span className="font-semibold">129 / 129</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tasks Completed Today</span>
                    <span className="font-semibold">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Autonomous Cycles</span>
                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                      Running
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Health Check</span>
                    <span className="text-sm">2 minutes ago</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 border-t border-cyan-500/20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-orange-400 bg-clip-text text-transparent">
                Business?
              </span>
            </h2>
            <p className="text-xl text-gray-400">
              Join hundreds of companies using Ivy.AI to automate operations, boost sales, and scale
              effortlessly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 gap-2">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 gap-2"
                    onClick={() => (window.location.href = getLoginUrl())}
                  >
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-cyan-500/30 hover:bg-cyan-500/10 text-white">
                    Schedule Demo
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500/20 py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={APP_LOGO} alt={APP_TITLE} className="h-6 w-6 rounded" />
                <span className="font-bold">{APP_TITLE}</span>
              </div>
              <p className="text-sm text-gray-400">
                AI-powered autonomous agents for modern businesses
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#features" className="hover:text-cyan-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <Link href="/ropa" className="hover:text-cyan-400 transition-colors">
                    ROPA
                  </Link>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-cyan-400 transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-cyan-500/20 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2025 {APP_TITLE}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
