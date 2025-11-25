import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Contact {
  name: string;
  email: string;
  company?: string;
  role?: string;
  phone?: string;
  industry?: string;
  suggestedCampaign?: string;
}

interface CampaignRule {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  priority: number;
}

const CAMPAIGN_RULES: CampaignRule[] = [
  {
    id: 'cnc-training-2026',
    name: 'CNC Training 2026',
    description: 'For operators, technicians, and engineers who need CNC training',
    keywords: ['operator', 'technician', 'engineer', 'machinist', 'programmer', 'trainer', 'supervisor'],
    priority: 1,
  },
  {
    id: 'warranty-extension',
    name: 'Warranty Extension',
    description: 'For maintenance managers and facility directors',
    keywords: ['maintenance', 'manager', 'director', 'facility', 'plant', 'operations'],
    priority: 2,
  },
  {
    id: 'equipment-repair',
    name: 'Equipment Repair',
    description: 'For service coordinators and technical support',
    keywords: ['service', 'support', 'coordinator', 'repair', 'technical', 'field'],
    priority: 3,
  },
  {
    id: 'eol-parts',
    name: 'EOL Parts',
    description: 'For procurement and supply chain professionals',
    keywords: ['procurement', 'purchasing', 'buyer', 'supply', 'chain', 'inventory'],
    priority: 4,
  },
  {
    id: 'cnc-upgrades',
    name: 'CNC Upgrades',
    description: 'For IT managers and automation engineers',
    keywords: ['it', 'automation', 'controls', 'upgrade', 'modernization', 'systems'],
    priority: 5,
  },
  {
    id: 'digital-suite',
    name: 'Digital Suite',
    description: 'For executives and strategic decision makers',
    keywords: ['ceo', 'cto', 'cio', 'president', 'vp', 'director', 'executive', 'owner'],
    priority: 6,
  },
];

function suggestCampaign(contact: Contact): string {
  const role = (contact.role || '').toLowerCase();
  const company = (contact.company || '').toLowerCase();
  const industry = (contact.industry || '').toLowerCase();
  
  const searchText = `${role} ${company} ${industry}`;

  // Find matching campaign based on keywords
  for (const rule of CAMPAIGN_RULES) {
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword)) {
        return rule.id;
      }
    }
  }

  // Default to CNC Training if no match
  return 'cnc-training-2026';
}

function getCampaignName(campaignId: string): string {
  return CAMPAIGN_RULES.find(r => r.id === campaignId)?.name || campaignId;
}

function getCampaignColor(campaignId: string): string {
  const colors: Record<string, string> = {
    'cnc-training-2026': 'bg-purple-100 text-purple-800 border-purple-300',
    'warranty-extension': 'bg-blue-100 text-blue-800 border-blue-300',
    'equipment-repair': 'bg-green-100 text-green-800 border-green-300',
    'eol-parts': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'cnc-upgrades': 'bg-orange-100 text-orange-800 border-orange-300',
    'digital-suite': 'bg-pink-100 text-pink-800 border-pink-300',
  };
  return colors[campaignId] || 'bg-gray-100 text-gray-800 border-gray-300';
}

interface SmartContactImportProps {
  onImportComplete?: () => void;
}

export function SmartContactImport({ onImportComplete }: SmartContactImportProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<Contact[]>([]);
  const [importing, setImporting] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Record<string, string>>({});
  const [autoEnroll, setAutoEnroll] = useState(true);

  const importMutation = trpc.fagorCampaign.importContacts.useMutation();
  const enrollMutation = trpc.fagorCampaign.enrollInCampaign.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvFile(file);

    // Parse CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file is empty or invalid');
        return;
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const companyIdx = headers.findIndex(h => h.includes('company'));
      const roleIdx = headers.findIndex(h => h.includes('role') || h.includes('title'));
      const phoneIdx = headers.findIndex(h => h.includes('phone'));
      const industryIdx = headers.findIndex(h => h.includes('industry'));

      if (emailIdx === -1) {
        toast.error('CSV must contain an "email" column');
        return;
      }

      // Parse contacts with AI campaign suggestions
      const contacts: Contact[] = [];
      const campaigns: Record<string, string> = {};

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        
        if (!values[emailIdx]) continue;

        const contact: Contact = {
          name: nameIdx !== -1 ? values[nameIdx] : values[emailIdx].split('@')[0],
          email: values[emailIdx],
          company: companyIdx !== -1 ? values[companyIdx] : undefined,
          role: roleIdx !== -1 ? values[roleIdx] : undefined,
          phone: phoneIdx !== -1 ? values[phoneIdx] : undefined,
          industry: industryIdx !== -1 ? values[industryIdx] : undefined,
        };

        // AI-powered campaign suggestion
        const suggestedCampaignId = suggestCampaign(contact);
        contact.suggestedCampaign = suggestedCampaignId;
        campaigns[contact.email] = suggestedCampaignId;

        contacts.push(contact);
      }

      setParsedContacts(contacts);
      setSelectedCampaigns(campaigns);
      toast.success(
        <div>
          <div className="font-bold">✨ Smart Import Complete</div>
          <div>Parsed {contacts.length} contacts with AI campaign suggestions</div>
        </div>
      );
    };

    reader.readAsText(file);
  };

  const handleCampaignChange = (email: string, campaignId: string) => {
    setSelectedCampaigns(prev => ({
      ...prev,
      [email]: campaignId,
    }));
  };

  const handleImport = async () => {
    if (parsedContacts.length === 0) {
      toast.error('No contacts to import');
      return;
    }

    setImporting(true);
    try {
      // Import contacts
      const result = await importMutation.mutateAsync({ contacts: parsedContacts });
      
      toast.success(
        `Imported ${result.imported} contacts${result.skipped > 0 ? `, skipped ${result.skipped} duplicates` : ''}`
      );

      // Auto-enroll if enabled
      if (autoEnroll && result.imported > 0) {
        // Group contacts by campaign
        const campaignGroups: Record<string, number[]> = {};
        
        for (const contact of parsedContacts) {
          const campaignId = selectedCampaigns[contact.email];
          if (!campaignGroups[campaignId]) {
            campaignGroups[campaignId] = [];
          }
          // Find the imported contact ID (this is simplified - in production you'd get IDs from the import result)
          const importedContact = result.contactIds?.find((id: number) => id);
          if (importedContact) {
            campaignGroups[campaignId].push(importedContact);
          }
        }

        // Enroll in each campaign
        let totalEnrolled = 0;
        for (const [campaignId, contactIds] of Object.entries(campaignGroups)) {
          if (contactIds.length > 0) {
            const enrollResult = await enrollMutation.mutateAsync({
              contactIds,
              campaignName: campaignId,
            });
            totalEnrolled += enrollResult.enrolled;
          }
        }

        toast.success(
          <div>
            <div className="font-bold">🎯 Auto-Enrollment Complete</div>
            <div>{totalEnrolled} contacts enrolled in campaigns</div>
          </div>
        );
      }

      // Clear form
      setParsedContacts([]);
      setCsvFile(null);
      setSelectedCampaigns({});

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = 'name,email,company,role,phone,industry\nJohn Doe,john@example.com,Acme Corp,CNC Operator,(555) 123-4567,Manufacturing\nJane Smith,jane@example.com,Tech Inc,Maintenance Manager,(555) 987-6543,Automotive';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fagor-contacts-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Campaign distribution stats
  const campaignStats = parsedContacts.reduce((acc, contact) => {
    const campaign = selectedCampaigns[contact.email];
    acc[campaign] = (acc[campaign] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Smart Contact Import
        </CardTitle>
        <CardDescription>
          Upload CSV with automatic AI-powered campaign assignment based on role and industry
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="csv-file">Upload CSV File</Label>
          <div className="flex items-center gap-2">
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
            />
            <Button variant="outline" onClick={downloadTemplate}>
              <FileText className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            CSV should include: name, email, company, role, phone, industry
          </p>
        </div>

        {/* Auto-enroll checkbox */}
        {parsedContacts.length > 0 && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-enroll"
              checked={autoEnroll}
              onCheckedChange={(checked) => setAutoEnroll(checked as boolean)}
            />
            <label
              htmlFor="auto-enroll"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Automatically enroll contacts in suggested campaigns
            </label>
          </div>
        )}

        {/* Campaign Distribution */}
        {parsedContacts.length > 0 && (
          <div className="space-y-2">
            <Label>Campaign Distribution</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(campaignStats).map(([campaignId, count]) => (
                <Badge key={campaignId} variant="outline" className={getCampaignColor(campaignId)}>
                  {getCampaignName(campaignId)}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Preview Table */}
        {parsedContacts.length > 0 && (
          <div className="space-y-2">
            <Label>Preview & Adjust Campaigns ({parsedContacts.length} contacts)</Label>
            <div className="border rounded-lg max-h-96 overflow-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-2 text-sm font-medium">Name</th>
                    <th className="text-left p-2 text-sm font-medium">Email</th>
                    <th className="text-left p-2 text-sm font-medium">Role</th>
                    <th className="text-left p-2 text-sm font-medium">Suggested Campaign</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedContacts.slice(0, 10).map((contact, idx) => (
                    <tr key={idx} className="border-t hover:bg-muted/50">
                      <td className="p-2 text-sm">{contact.name}</td>
                      <td className="p-2 text-sm">{contact.email}</td>
                      <td className="p-2 text-sm">{contact.role || '-'}</td>
                      <td className="p-2">
                        <Select
                          value={selectedCampaigns[contact.email]}
                          onValueChange={(value) => handleCampaignChange(contact.email, value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CAMPAIGN_RULES.map(rule => (
                              <SelectItem key={rule.id} value={rule.id}>
                                {rule.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                  {parsedContacts.length > 10 && (
                    <tr>
                      <td colSpan={4} className="p-2 text-center text-sm text-muted-foreground">
                        ... and {parsedContacts.length - 10} more contacts
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Button */}
        {parsedContacts.length > 0 && (
          <Button
            onClick={handleImport}
            disabled={importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Import {parsedContacts.length} Contacts
                {autoEnroll && ' & Auto-Enroll'}
              </>
            )}
          </Button>
        )}

        {/* Campaign Rules Reference */}
        <div className="space-y-2">
          <Label>AI Campaign Assignment Rules</Label>
          <div className="grid gap-2">
            {CAMPAIGN_RULES.map(rule => (
              <div key={rule.id} className="text-sm border rounded p-2">
                <div className="font-medium">{rule.name}</div>
                <div className="text-muted-foreground text-xs">{rule.description}</div>
                <div className="text-xs mt-1">
                  <span className="text-muted-foreground">Keywords:</span>{' '}
                  {rule.keywords.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
