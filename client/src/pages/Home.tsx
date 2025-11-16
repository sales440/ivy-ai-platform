import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Bot, Zap, TrendingUp, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="container py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-gradient">{APP_TITLE}</span>
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="h-4 w-4" />
            Next-Generation AI Agent Platform
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Intelligent Agents for
            <span className="text-gradient"> Every Department</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ivy.AI orchestrates specialized AI agents across sales, support, operations, HR, and strategy—automating workflows and delivering actionable insights in real-time.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-primary/20">
            <CardHeader>
              <div className="p-2 w-fit rounded-lg bg-primary/10 mb-2">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>6 Specialized Agents</CardTitle>
              <CardDescription>
                Ivy-Prospect, Ivy-Closer, Ivy-Solve, Ivy-Logic, Ivy-Talent, and Ivy-Insight work together seamlessly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <div className="p-2 w-fit rounded-lg bg-primary/10 mb-2">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>The Hive Orchestrator</CardTitle>
              <CardDescription>
                Central intelligence that coordinates workflows and manages inter-agent communication
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <div className="p-2 w-fit rounded-lg bg-primary/10 mb-2">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-Time Analytics</CardTitle>
              <CardDescription>
                Track KPIs, monitor agent performance, and visualize insights across all departments
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Agents Section */}
      <section className="container py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Your AI Team</h2>
          
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'Ivy-Prospect', dept: 'Sales', desc: 'Lead generation and qualification' },
              { name: 'Ivy-Closer', dept: 'Sales', desc: 'Deal negotiation and closing' },
              { name: 'Ivy-Solve', dept: 'Support', desc: 'Customer support and troubleshooting' },
              { name: 'Ivy-Logic', dept: 'Operations', desc: 'Supply chain optimization' },
              { name: 'Ivy-Talent', dept: 'HR', desc: 'Recruitment and talent management' },
              { name: 'Ivy-Insight', dept: 'Strategy', desc: 'Business intelligence and analytics' }
            ].map((agent) => (
              <div key={agent.name} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.dept} • {agent.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to Transform Your Operations?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join leading companies using Ivy.AI to automate workflows, enhance productivity, and drive growth.
            </p>
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container py-8 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>© 2024 {APP_TITLE}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
