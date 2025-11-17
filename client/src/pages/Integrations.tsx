import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';

const CRM_PROVIDERS = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM platform for sales and customer management',
    logo: '☁️',
    status: 'available',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Inbound marketing, sales, and service software',
    logo: '🟠',
    status: 'available',
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales CRM and pipeline management tool',
    logo: '🟢',
    status: 'available',
  },
];

export default function Integrations() {
  const handleConnect = (crmId: string) => {
    toast.info(`${crmId} integration coming soon!`);
  };

  return (
    <DashboardLayout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">CRM Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Connect external CRM systems to sync leads and tickets
            </p>
          </div>
        </div>

        {/* CRM Providers Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CRM_PROVIDERS.map((crm) => (
            <Card key={crm.id} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{crm.logo}</div>
                    <div>
                      <CardTitle>{crm.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {crm.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {crm.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => handleConnect(crm.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              About CRM Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Bidirectional Sync</h3>
              <p className="text-sm text-muted-foreground">
                Automatically sync leads and tickets between Ivy.AI and your CRM. Changes made in either system
                are reflected in real-time.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Field Mapping</h3>
              <p className="text-sm text-muted-foreground">
                Customize which fields are synced and how they map between systems. Configure default values
                and transformation rules.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Webhook Support</h3>
              <p className="text-sm text-muted-foreground">
                Receive instant updates when data changes in your CRM. No polling required - updates are
                pushed in real-time via webhooks.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
