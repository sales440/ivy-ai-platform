import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Users, Mail, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SmartContactImport } from "@/components/SmartContactImport";
import { AgentRecommendation } from "@/components/AgentRecommendation";

export default function FAGORCampaign() {
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  const { data: contacts, refetch: refetchContacts } = trpc.fagorCampaign.getContacts.useQuery();
  const { data: stats } = trpc.fagorCampaign.getCampaignStats.useQuery({ campaignName: 'FAGOR_CNC_Training_2026' });
  const { data: enrollments } = trpc.fagorCampaign.getEnrollments.useQuery({ campaignName: 'FAGOR_CNC_Training_2026' });

  const enrollMutation = trpc.fagorCampaign.enrollInCampaign.useMutation();
  const sendEmailMutation = trpc.fagorCampaign.sendCampaignEmail.useMutation();

  const handleEnrollAll = async () => {
    if (!contacts || contacts.length === 0) {
      toast.error('No contacts to enroll');
      return;
    }

    try {
      const contactIds = contacts.map(c => c.id);
      const result = await enrollMutation.mutateAsync({
        contactIds,
        campaignName: 'FAGOR_CNC_Training_2026',
      });

      toast.success(`Enrolled ${result.enrolled} contacts${result.skipped > 0 ? `, skipped ${result.skipped} already enrolled` : ''}`);
    } catch (error: any) {
      toast.error(`Enrollment failed: ${error.message}`);
    }
  };

  const handleSendEmail = async (emailNumber: 1 | 2 | 3) => {
    if (!enrollments || enrollments.length === 0) {
      toast.error('No enrollments found');
      return;
    }

    // Filter enrollments that haven't received this email yet
    const eligibleEnrollments = enrollments.filter(e => {
      if (emailNumber === 1) return !e.enrollment.email1SentAt;
      if (emailNumber === 2) return e.enrollment.email1SentAt && !e.enrollment.email2SentAt;
      if (emailNumber === 3) return e.enrollment.email2SentAt && !e.enrollment.email3SentAt;
      return false;
    });

    if (eligibleEnrollments.length === 0) {
      toast.error(`No contacts eligible for Email ${emailNumber}`);
      return;
    }

    const confirmed = window.confirm(
      `Send Email ${emailNumber} to ${eligibleEnrollments.length} contacts?\n\n` +
      `Subject: ${emailNumber === 1 ? 'The Hidden Cost of Untrained CNC Operators' : emailNumber === 2 ? 'How to Turn CNC Features Into Competitive Advantages' : 'Your 2026 Training Opportunity: Secure Your Spot'}`
    );

    if (!confirmed) return;

    setSending(true);
    setSendProgress(0);

    try {
      const enrollmentIds = eligibleEnrollments.map(e => e.enrollment.id);
      
      // Send in batches of 10
      const batchSize = 10;
      let sent = 0;
      let failed = 0;

      for (let i = 0; i < enrollmentIds.length; i += batchSize) {
        const batch = enrollmentIds.slice(i, i + batchSize);
        const result = await sendEmailMutation.mutateAsync({
          enrollmentIds: batch,
          emailNumber,
        });

        sent += result.sent;
        failed += result.failed;
        setSendProgress(Math.round(((i + batch.length) / enrollmentIds.length) * 100));
      }

      toast.success(`Email ${emailNumber} sent to ${sent} contacts${failed > 0 ? `, ${failed} failed` : ''}`);
    } catch (error: any) {
      toast.error(`Send failed: ${error.message}`);
    } finally {
      setSending(false);
      setSendProgress(0);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">FAGOR CNC Training Campaign 2026</h1>
        <p className="text-muted-foreground">
          Manage contacts, send emails, and track campaign performance
        </p>
      </div>

      <Tabs defaultValue="send" className="space-y-6">
        <TabsList>
          <TabsTrigger value="send">
            <Send className="h-4 w-4 mr-2" />
            Send Emails
          </TabsTrigger>
          <TabsTrigger value="import">
            <Upload className="h-4 w-4 mr-2" />
            Import Contacts
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        {/* Send Emails Tab */}
        <TabsContent value="send" className="space-y-6">
          {/* Agent Recommendation */}
          <AgentRecommendation 
            campaignType="CNC Training"
            targetIndustry="Manufacturing"
          />

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Email 1: The Problem</CardTitle>
                <CardDescription>Hidden Cost of Untrained Operators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Sent: {stats?.emailStats.email1Sent || 0}</p>
                    <p>Opened: {stats?.emailStats.email1Opened || 0}</p>
                    <p>Clicked: {stats?.emailStats.email1Clicked || 0}</p>
                  </div>
                  <Button 
                    onClick={() => handleSendEmail(1)}
                    disabled={sending}
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email 1
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email 2: The Solution</CardTitle>
                <CardDescription>Turn Features Into Advantages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Sent: {stats?.emailStats.email2Sent || 0}</p>
                    <p>Opened: {stats?.emailStats.email2Opened || 0}</p>
                    <p>Clicked: {stats?.emailStats.email2Clicked || 0}</p>
                  </div>
                  <Button 
                    onClick={() => handleSendEmail(2)}
                    disabled={sending}
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email 2
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email 3: Urgency & CTA</CardTitle>
                <CardDescription>2026 Training Opportunity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>Sent: {stats?.emailStats.email3Sent || 0}</p>
                    <p>Opened: {stats?.emailStats.email3Opened || 0}</p>
                    <p>Clicked: {stats?.emailStats.email3Clicked || 0}</p>
                  </div>
                  <Button 
                    onClick={() => handleSendEmail(3)}
                    disabled={sending}
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email 3
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {sending && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sending emails...</span>
                    <span>{sendProgress}%</span>
                  </div>
                  <Progress value={sendProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Enrolled Contacts ({enrollments?.length || 0})</CardTitle>
              <CardDescription>Contacts enrolled in FAGOR CNC Training 2026 campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Step</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments?.map((e) => (
                    <TableRow key={e.enrollment.id}>
                      <TableCell>{e.contact.name}</TableCell>
                      <TableCell>{e.contact.email}</TableCell>
                      <TableCell>{e.contact.company || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Step {e.enrollment.currentStep}/3
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.enrollment.status === 'active' ? 'default' : 'secondary'}>
                          {e.enrollment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Contacts Tab */}
        <TabsContent value="import" className="space-y-6">
          <SmartContactImport onImportComplete={refetchContacts} />

          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-between">
                  <span>All Contacts ({contacts?.length || 0})</span>
                  <Button onClick={handleEnrollAll} size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Enroll All in Campaign
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts?.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>{contact.name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.company || '-'}</TableCell>
                      <TableCell>{contact.role || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contact.source}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.enrollments.total || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.enrollments.active || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.enrollments.completed || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Responded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.emailStats.responded || 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Open Rate</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>Click Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Email 1: The Problem</TableCell>
                    <TableCell>{stats?.emailStats.email1Sent || 0}</TableCell>
                    <TableCell>{stats?.emailStats.email1Opened || 0}</TableCell>
                    <TableCell>
                      {stats?.emailStats.email1Sent 
                        ? `${Math.round((stats.emailStats.email1Opened / stats.emailStats.email1Sent) * 100)}%`
                        : '-'}
                    </TableCell>
                    <TableCell>{stats?.emailStats.email1Clicked || 0}</TableCell>
                    <TableCell>
                      {stats?.emailStats.email1Sent 
                        ? `${Math.round((stats.emailStats.email1Clicked / stats.emailStats.email1Sent) * 100)}%`
                        : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Email 2: The Solution</TableCell>
                    <TableCell>{stats?.emailStats.email2Sent || 0}</TableCell>
                    <TableCell>{stats?.emailStats.email2Opened || 0}</TableCell>
                    <TableCell>
                      {stats?.emailStats.email2Sent 
                        ? `${Math.round((stats.emailStats.email2Opened / stats.emailStats.email2Sent) * 100)}%`
                        : '-'}
                    </TableCell>
                    <TableCell>{stats?.emailStats.email2Clicked || 0}</TableCell>
                    <TableCell>
                      {stats?.emailStats.email2Sent 
                        ? `${Math.round((stats.emailStats.email2Clicked / stats.emailStats.email2Sent) * 100)}%`
                        : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Email 3: Urgency & CTA</TableCell>
                    <TableCell>{stats?.emailStats.email3Sent || 0}</TableCell>
                    <TableCell>{stats?.emailStats.email3Opened || 0}</TableCell>
                    <TableCell>
                      {stats?.emailStats.email3Sent 
                        ? `${Math.round((stats.emailStats.email3Opened / stats.emailStats.email3Sent) * 100)}%`
                        : '-'}
                    </TableCell>
                    <TableCell>{stats?.emailStats.email3Clicked || 0}</TableCell>
                    <TableCell>
                      {stats?.emailStats.email3Sent 
                        ? `${Math.round((stats.emailStats.email3Clicked / stats.emailStats.email3Sent) * 100)}%`
                        : '-'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
