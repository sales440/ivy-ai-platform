import { useState } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, PhoneOff, Clock, TrendingUp, TrendingDown, Minus, Mail } from "lucide-react";
import { SendEmailDialog } from "@/components/SendEmailDialog";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function CallHistory() {
  const { selectedCompany } = useCompany();
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedCallForEmail, setSelectedCallForEmail] = useState<any>(null);

  const { data: callsData, isLoading } = trpc.calls.list.useQuery(
    selectedCompany ? { companyId: Number(selectedCompany.id) } : { companyId: 0 },
    { enabled: !!selectedCompany }
  );

  const sendFollowUp = trpc.emails.sendFollowUp.useMutation();

  const calls = callsData?.calls || [];

  // Calculate analytics
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const answeredCalls = calls.filter(c => c.status === 'answered' || c.status === 'completed').length;
  const failedCalls = calls.filter(c => c.status === 'failed' || c.status === 'no-answer').length;
  const successRate = totalCalls > 0 ? ((answeredCalls / totalCalls) * 100).toFixed(1) : '0';
  const avgDuration = completedCalls > 0 
    ? Math.round(calls.filter(c => c.duration).reduce((sum, c) => sum + (c.duration || 0), 0) / completedCalls)
    : 0;

  // Outcome distribution
  const outcomeData = [
    { name: 'Interested', value: calls.filter(c => c.outcome === 'interested').length, color: '#10b981' },
    { name: 'Callback', value: calls.filter(c => c.outcome === 'callback').length, color: '#3b82f6' },
    { name: 'Not Interested', value: calls.filter(c => c.outcome === 'not-interested').length, color: '#ef4444' },
    { name: 'Voicemail', value: calls.filter(c => c.outcome === 'voicemail').length, color: '#f59e0b' },
    { name: 'No Answer', value: calls.filter(c => c.outcome === 'no-answer').length, color: '#6b7280' },
  ].filter(d => d.value > 0);

  // Sentiment distribution
  const sentimentData = [
    { name: 'Positive', value: calls.filter(c => c.sentiment === 'positive').length },
    { name: 'Neutral', value: calls.filter(c => c.sentiment === 'neutral').length },
    { name: 'Negative', value: calls.filter(c => c.sentiment === 'negative').length },
  ].filter(d => d.value > 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'answered': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'failed': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'no-answer': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getSentimentIcon = (sentiment: string | null) => {
    if (!sentiment) return <Minus className="h-4 w-4" />;
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!selectedCompany) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please select a company to view call history.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Call History</h1>
        <p className="text-muted-foreground">Track and analyze all outbound calls</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">{answeredCalls} answered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(avgDuration / 60)}:{(avgDuration % 60).toString().padStart(2, '0')}</div>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Calls</CardTitle>
            <PhoneOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCalls}</div>
            <p className="text-xs text-muted-foreground">{totalCalls > 0 ? ((failedCalls / totalCalls) * 100).toFixed(1) : 0}% of total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {totalCalls > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Call Outcomes</CardTitle>
              <CardDescription>Distribution of call results</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
              <CardDescription>Call sentiment distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sentimentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
          <CardDescription>All outbound calls with details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading calls...</p>
          ) : calls.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No calls yet. Start calling leads to see history here.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-medium">{call.phoneNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSentimentIcon(call.sentiment)}
                          {call.sentiment || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {call.outcome ? (
                          <Badge variant="outline">{call.outcome}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(call.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCallForEmail(call);
                              setEmailDialogOpen(true);
                            }}
                            disabled={!call.outcome || call.outcome === 'no-answer' || call.outcome === 'wrong-number'}
                            title={!call.outcome ? "No outcome set" : "Send follow-up email"}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Follow-up
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedCall(call)}
                              >
                                View Details
                              </Button>
                            </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Call Details</DialogTitle>
                              <DialogDescription>
                                Call to {call.phoneNumber} on {new Date(call.createdAt).toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium">Status</p>
                                  <Badge variant="outline" className={getStatusColor(call.status)}>
                                    {call.status}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Duration</p>
                                  <p className="text-sm text-muted-foreground">
                                    {call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Sentiment</p>
                                  <p className="text-sm text-muted-foreground">{call.sentiment || 'Not analyzed'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Outcome</p>
                                  <p className="text-sm text-muted-foreground">{call.outcome || 'Not set'}</p>
                                </div>
                              </div>

                              {call.recordingUrl && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Recording</p>
                                  <audio controls className="w-full">
                                    <source src={call.recordingUrl} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                  </audio>
                                </div>
                              )}

                              {call.transcript && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Transcript</p>
                                  <div className="bg-muted p-4 rounded-md max-h-60 overflow-y-auto">
                                    <p className="text-sm whitespace-pre-wrap">{call.transcript}</p>
                                  </div>
                                </div>
                              )}

                              {call.notes && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Notes</p>
                                  <div className="bg-muted p-4 rounded-md">
                                    <p className="text-sm whitespace-pre-wrap">{call.notes}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Email Dialog */}
      {selectedCallForEmail && (
        <SendEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          leadName={selectedCallForEmail.leadId ? `Lead #${selectedCallForEmail.leadId}` : 'Unknown'}
          leadCompany="Company"
          leadEmail={selectedCallForEmail.phoneNumber}
          callOutcome={selectedCallForEmail.outcome}
          onSend={async (subject, body) => {
            try {
              await sendFollowUp.mutateAsync({
                leadId: selectedCallForEmail.leadId,
                callId: selectedCallForEmail.id,
                outcome: selectedCallForEmail.outcome as any,
                customSubject: subject,
                customBody: body,
              });
              toast.success('Follow-up email sent successfully!');
            } catch (error: any) {
              toast.error(`Failed to send email: ${error.message}`);
              throw error;
            }
          }}
        />
      )}
    </div>
  );
}
