import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Phone, Loader2 } from "lucide-react";

interface CallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  leadCompany: string;
  phoneNumber: string;
  onInitiateCall: (script: string) => Promise<void>;
}

const SCRIPT_TEMPLATES = {
  intro: {
    name: "Introduction Call",
    template: (name: string, company: string) => 
`Hi ${name}, this is [Your Name] from [Your Company].

I'm reaching out because I noticed ${company} might benefit from our [product/service].

Do you have a few minutes to discuss how we can help [specific pain point]?

[Wait for response and adjust accordingly]`
  },
  followup: {
    name: "Follow-up Call",
    template: (name: string, company: string) =>
`Hi ${name}, this is [Your Name] following up on our previous conversation about ${company}.

I wanted to check if you had a chance to review the information I sent over, and see if you have any questions.

[Listen and address concerns]`
  },
  demo: {
    name: "Demo Request",
    template: (name: string, company: string) =>
`Hi ${name}, I'm calling to schedule a demo of our platform for ${company}.

Based on our previous discussion, I think a 30-minute walkthrough would be valuable to show you how we can [solve specific problem].

What does your calendar look like this week?

[Schedule demo]`
  },
  custom: {
    name: "Custom Script",
    template: () => ""
  }
};

export function CallDialog({ open, onOpenChange, leadName, leadCompany, phoneNumber, onInitiateCall }: CallDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof SCRIPT_TEMPLATES>("intro");
  const [script, setScript] = useState(SCRIPT_TEMPLATES.intro.template(leadName, leadCompany));
  const [isInitiating, setIsInitiating] = useState(false);

  const handleTemplateChange = (value: keyof typeof SCRIPT_TEMPLATES) => {
    setSelectedTemplate(value);
    setScript(SCRIPT_TEMPLATES[value].template(leadName, leadCompany));
  };

  const handleInitiateCall = async () => {
    setIsInitiating(true);
    try {
      await onInitiateCall(script);
      onOpenChange(false);
      // Reset for next use
      setSelectedTemplate("intro");
      setScript(SCRIPT_TEMPLATES.intro.template(leadName, leadCompany));
    } catch (error) {
      console.error("Failed to initiate call:", error);
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Call {leadName}</DialogTitle>
          <DialogDescription>
            Calling {phoneNumber} • {leadCompany}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Script Template</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCRIPT_TEMPLATES).map(([key, { name }]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Call Script</Label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your call script here..."
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This script will be saved with the call for reference. You can also use it during the call.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Call Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Speak clearly and at a moderate pace</li>
              <li>Listen actively and take notes</li>
              <li>Ask open-ended questions</li>
              <li>Confirm next steps before ending</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isInitiating}>
            Cancel
          </Button>
          <Button onClick={handleInitiateCall} disabled={isInitiating}>
            {isInitiating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initiating Call...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Start Call
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
