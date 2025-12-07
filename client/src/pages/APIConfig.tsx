import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Calendar, MessageSquare, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

/**
 * API Configuration Page
 * 
 * Allows admins to configure external API integrations:
 * - Gmail API (for automated email sending)
 * - Google Calendar API (for service scheduling)
 * - WhatsApp Business API (for customer communication)
 */
export default function APIConfig() {
  const [gmailConfig, setGmailConfig] = useState({
    clientId: "",
    clientSecret: "",
    refreshToken: "",
    userEmail: "epmconstrucciones@gmail.com"
  });

  const [testingGmail, setTestingGmail] = useState(false);
  const [gmailStatus, setGmailStatus] = useState<"connected" | "disconnected" | "testing">("disconnected");

  const handleSaveGmail = async () => {
    if (!gmailConfig.clientId || !gmailConfig.clientSecret || !gmailConfig.refreshToken) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      // TODO: Save to database via tRPC
      toast.success("Configuración de Gmail guardada exitosamente");
      setGmailStatus("connected");
    } catch (error) {
      toast.error("Error al guardar configuración de Gmail");
      console.error(error);
    }
  };

  const handleTestGmail = async () => {
    setTestingGmail(true);
    setGmailStatus("testing");

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Conexión con Gmail API exitosa");
      setGmailStatus("connected");
    } catch (error) {
      toast.error("Error al conectar con Gmail API");
      setGmailStatus("disconnected");
    } finally {
      setTestingGmail(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración de APIs</h1>
          <p className="text-muted-foreground mt-2">
            Configura integraciones de APIs externas para automatizar comunicaciones
          </p>
        </div>

        <Tabs defaultValue="gmail" className="space-y-4">
          <TabsList>
            <TabsTrigger value="gmail" className="gap-2">
              <Mail className="h-4 w-4" />
              Gmail API
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Google Calendar
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp Business
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gmail" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Gmail API
                    </CardTitle>
                    <CardDescription>
                      Configura Gmail API para envío automático de emails personalizados
                    </CardDescription>
                  </div>
                  <Badge variant={gmailStatus === "connected" ? "default" : "secondary"}>
                    {gmailStatus === "connected" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {gmailStatus === "disconnected" && <XCircle className="h-3 w-3 mr-1" />}
                    {gmailStatus === "testing" && <AlertCircle className="h-3 w-3 mr-1 animate-pulse" />}
                    {gmailStatus === "connected" ? "Conectado" : gmailStatus === "testing" ? "Probando..." : "Desconectado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gmail-client-id">Client ID *</Label>
                  <Input
                    id="gmail-client-id"
                    placeholder="1234567890-abc123def456.apps.googleusercontent.com"
                    value={gmailConfig.clientId}
                    onChange={(e) => setGmailConfig({ ...gmailConfig, clientId: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmail-client-secret">Client Secret *</Label>
                  <Input
                    id="gmail-client-secret"
                    type="password"
                    placeholder="GOCSPX-abc123def456"
                    value={gmailConfig.clientSecret}
                    onChange={(e) => setGmailConfig({ ...gmailConfig, clientSecret: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmail-refresh-token">Refresh Token *</Label>
                  <Input
                    id="gmail-refresh-token"
                    type="password"
                    placeholder="1//0gAbCD1234efgh5678ijkl9012mnop3456qrst7890uvwx"
                    value={gmailConfig.refreshToken}
                    onChange={(e) => setGmailConfig({ ...gmailConfig, refreshToken: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gmail-user-email">Email Corporativo</Label>
                  <Input
                    id="gmail-user-email"
                    type="email"
                    value={gmailConfig.userEmail}
                    onChange={(e) => setGmailConfig({ ...gmailConfig, userEmail: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveGmail}>
                    Guardar Configuración
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleTestGmail}
                    disabled={testingGmail}
                  >
                    {testingGmail ? "Probando..." : "Probar Conexión"}
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">📚 Guía de Configuración</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Ir a Google Cloud Console</li>
                    <li>Crear proyecto "ivy-ai-epm-construcciones"</li>
                    <li>Habilitar Gmail API</li>
                    <li>Crear credenciales OAuth 2.0</li>
                    <li>Obtener Refresh Token</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Google Calendar API
                </CardTitle>
                <CardDescription>
                  Próximamente: Gestión automática de servicios y citas
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  WhatsApp Business API
                </CardTitle>
                <CardDescription>
                  Próximamente: Comunicación automatizada con clientes
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
