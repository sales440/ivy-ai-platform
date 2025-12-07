import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail } from 'lucide-react';

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  leadCompany: string;
  leadEmail: string;
  callOutcome?: string;
  onSend: (subject: string, body: string) => Promise<void>;
}

const EMAIL_TEMPLATES = {
  callback: {
    subject: (name: string) => `Following up on our call - ${name}`,
    body: (name: string, company: string) => `Hi ${name},

Thank you for taking the time to speak with me earlier. As discussed, I wanted to follow up and schedule a callback at your convenience.

I have a few time slots available this week:
- [Day 1] at [Time 1]
- [Day 2] at [Time 2]
- [Day 3] at [Time 3]

Please let me know which works best for you, or suggest an alternative time.

Looking forward to continuing our conversation about how we can help ${company}.

Best regards,
[Your Name]
[Your Company]`,
  },
  interested: {
    subject: (name: string) => `Next steps for ${name} - Proposal attached`,
    body: (name: string, company: string) => `Hi ${name},

It was great speaking with you! I'm excited about the opportunity to work with ${company}.

As promised, I've attached our proposal outlining how we can help you achieve [specific goals discussed].

Key highlights:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

I'd love to schedule a follow-up call to walk through the proposal and answer any questions you might have.

When would be a good time for you this week?

Best regards,
[Your Name]
[Your Company]`,
  },
  notInterested: {
    subject: (name: string) => `Thank you for your time, ${name}`,
    body: (name: string, company: string) => `Hi ${name},

Thank you for taking the time to speak with me today. I understand that our solution isn't the right fit for ${company} at this time.

I'll keep you on our mailing list for future updates and case studies that might be relevant to your industry. If your needs change in the future, please don't hesitate to reach out.

Wishing you and ${company} continued success!

Best regards,
[Your Name]
[Your Company]`,
  },
  voicemail: {
    subject: (name: string) => `Following up - ${name}`,
    body: (name: string, company: string) => `Hi ${name},

I tried reaching you earlier today but wasn't able to connect. I wanted to touch base about how we can help ${company} with [specific value proposition].

I'd love to schedule a brief 15-minute call to discuss:
- [Topic 1]
- [Topic 2]
- [Topic 3]

Please let me know a time that works for you, or feel free to book directly on my calendar: [Calendar Link]

Looking forward to connecting!

Best regards,
[Your Name]
[Your Company]`,
  },
};

export function SendEmailDialog({
  open,
  onOpenChange,
  leadName,
  leadCompany,
  leadEmail,
  callOutcome,
  onSend,
}: SendEmailDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(callOutcome || 'callback');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  // Update template when callOutcome changes
  useEffect(() => {
    if (callOutcome && EMAIL_TEMPLATES[callOutcome as keyof typeof EMAIL_TEMPLATES]) {
      setSelectedTemplate(callOutcome);
    }
  }, [callOutcome]);

  // Load template when selected
  useEffect(() => {
    const template = EMAIL_TEMPLATES[selectedTemplate as keyof typeof EMAIL_TEMPLATES];
    if (template) {
      setSubject(template.subject(leadName));
      setBody(template.body(leadName, leadCompany));
    }
  }, [selectedTemplate, leadName, leadCompany]);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      return;
    }

    setSending(true);
    try {
      await onSend(subject, body);
      onOpenChange(false);
      // Reset form
      setSubject('');
      setBody('');
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Follow-up Email
          </DialogTitle>
          <DialogDescription>
            To: {leadEmail} ({leadName} - {leadCompany})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="callback">Callback Request</SelectItem>
                <SelectItem value="interested">Interested - Send Proposal</SelectItem>
                <SelectItem value="notInterested">Not Interested - Nurture</SelectItem>
                <SelectItem value="voicemail">Voicemail Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email body..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
