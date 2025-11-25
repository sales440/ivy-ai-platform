import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, RefreshCw, Settings, TrendingUp, Mail, DollarSign, Target, CheckCircle2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Separator } from "@/components/ui/separator";

interface MilestoneConfig {
  conversions: number[];
  conversion_rate: number[];
  roi: number[];
  emails_sent: number[];
  open_rate: number[];
}

export default function MilestoneConfig() {
  const { data: config, isLoading, refetch } = trpc.agentMilestones.getMilestoneConfig.useQuery();
  const saveMutation = trpc.agentMilestones.saveMilestoneConfig.useMutation();

  const [editedConfig, setEditedConfig] = useState<MilestoneConfig | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize edited config when data loads
  if (config && !editedConfig) {
    setEditedConfig(config);
  }

  const handleArrayChange = (key: keyof MilestoneConfig, index: number, value: string) => {
    if (!editedConfig) return;

    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0) return;

    const newArray = [...editedConfig[key]];
    newArray[index] = numValue;

    setEditedConfig({
      ...editedConfig,
      [key]: newArray,
    });
  };

  const handleAddThreshold = (key: keyof MilestoneConfig) => {
    if (!editedConfig) return;

    const currentArray = editedConfig[key];
    const lastValue = currentArray[currentArray.length - 1] || 0;
    const newValue = lastValue + (key === 'conversion_rate' || key === 'open_rate' ? 10 : 50);

    setEditedConfig({
      ...editedConfig,
      [key]: [...currentArray, newValue],
    });
  };

  const handleRemoveThreshold = (key: keyof MilestoneConfig, index: number) => {
    if (!editedConfig) return;

    const newArray = editedConfig[key].filter((_, i) => i !== index);

    setEditedConfig({
      ...editedConfig,
      [key]: newArray,
    });
  };

  const handleSave = async () => {
    if (!editedConfig) return;

    // Validation
    for (const key of Object.keys(editedConfig) as (keyof MilestoneConfig)[]) {
      const array = editedConfig[key];
      
      if (array.length === 0) {
        toast.error(`${key} must have at least one threshold`);
        return;
      }

      // Check ascending order
      for (let i = 1; i < array.length; i++) {
        if (array[i] <= array[i - 1]) {
          toast.error(`${key} thresholds must be in ascending order`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      await saveMutation.mutateAsync(editedConfig);
      toast.success('Milestone configuration saved successfully!');
      refetch();
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      setEditedConfig(config);
      toast.info('Configuration reset to saved values');
    }
  };

  if (isLoading || !editedConfig) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const hasChanges = JSON.stringify(config) !== JSON.stringify(editedConfig);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Milestone Configuration
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure notification thresholds for agent performance milestones
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {hasChanges && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-orange-800">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">You have unsaved changes</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Conversions Milestones
            </CardTitle>
            <CardDescription>
              Notify when an agent reaches these numbers of conversions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {editedConfig.conversions.map((value, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs">Threshold {index + 1}</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleArrayChange('conversions', index, e.target.value)}
                      min={0}
                      className="h-9"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveThreshold('conversions', index)}
                      className="h-9 w-9 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddThreshold('conversions')}
            >
              + Add Threshold
            </Button>
            <div className="flex flex-wrap gap-2 pt-2">
              {editedConfig.conversions.map((value, index) => (
                <Badge key={index} variant="secondary">
                  {value} conversions
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Conversion Rate Milestones
            </CardTitle>
            <CardDescription>
              Notify when an agent reaches these conversion rate percentages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {editedConfig.conversion_rate.map((value, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs">Threshold {index + 1}</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleArrayChange('conversion_rate', index, e.target.value)}
                      min={0}
                      max={100}
                      className="h-9"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveThreshold('conversion_rate', index)}
                      className="h-9 w-9 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddThreshold('conversion_rate')}
            >
              + Add Threshold
            </Button>
            <div className="flex flex-wrap gap-2 pt-2">
              {editedConfig.conversion_rate.map((value, index) => (
                <Badge key={index} variant="secondary">
                  {value}% conversion rate
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ROI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              ROI Milestones
            </CardTitle>
            <CardDescription>
              Notify when an agent reaches these ROI percentages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {editedConfig.roi.map((value, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs">Threshold {index + 1}</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleArrayChange('roi', index, e.target.value)}
                      min={0}
                      className="h-9"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveThreshold('roi', index)}
                      className="h-9 w-9 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddThreshold('roi')}
            >
              + Add Threshold
            </Button>
            <div className="flex flex-wrap gap-2 pt-2">
              {editedConfig.roi.map((value, index) => (
                <Badge key={index} variant="secondary">
                  {value}% ROI
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Emails Sent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              Emails Sent Milestones
            </CardTitle>
            <CardDescription>
              Notify when an agent sends these numbers of emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {editedConfig.emails_sent.map((value, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs">Threshold {index + 1}</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleArrayChange('emails_sent', index, e.target.value)}
                      min={0}
                      className="h-9"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveThreshold('emails_sent', index)}
                      className="h-9 w-9 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddThreshold('emails_sent')}
            >
              + Add Threshold
            </Button>
            <div className="flex flex-wrap gap-2 pt-2">
              {editedConfig.emails_sent.map((value, index) => (
                <Badge key={index} variant="secondary">
                  {value} emails
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Open Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-cyan-500" />
              Open Rate Milestones
            </CardTitle>
            <CardDescription>
              Notify when an agent reaches these open rate percentages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {editedConfig.open_rate.map((value, index) => (
                <div key={index} className="space-y-1">
                  <Label className="text-xs">Threshold {index + 1}</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={value}
                      onChange={(e) => handleArrayChange('open_rate', index, e.target.value)}
                      min={0}
                      max={100}
                      className="h-9"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveThreshold('open_rate', index)}
                      className="h-9 w-9 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddThreshold('open_rate')}
            >
              + Add Threshold
            </Button>
            <div className="flex flex-wrap gap-2 pt-2">
              {editedConfig.open_rate.map((value, index) => (
                <Badge key={index} variant="secondary">
                  {value}% open rate
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-medium">💡 How Milestone Notifications Work:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Notifications are sent when an agent first reaches a milestone threshold</li>
                <li>Each milestone is only notified once per agent</li>
                <li>The system checks for new milestones every hour automatically</li>
                <li>Thresholds must be in ascending order</li>
                <li>Changes take effect immediately after saving</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
