import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy, ExternalLink, Calendar, CheckCircle2, Clock, Sparkles, Trash2, Edit } from "lucide-react";

/**
 * LinkedIn Content Panel
 * 
 * Displays AI-generated LinkedIn posts for Juan Carlos Robledo's account.
 * Allows review, edit, copy-to-clipboard, and scheduling.
 */
export default function LinkedInContentPanel() {
  const [selectedTab, setSelectedTab] = useState("draft");

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">LinkedIn Content Panel</h1>
          <p className="text-muted-foreground mt-2">
            Posts generados por agentes de IA para{" "}
            <a
              href="https://www.linkedin.com/in/juan-carlos-robledo-5946a2392/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Juan Carlos Robledo
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Sparkles className="h-4 w-4 mr-2" />
            Generar Post
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Panel de contenido LinkedIn en construcción
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
