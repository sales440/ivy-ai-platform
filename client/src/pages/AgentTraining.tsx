import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, FileText, Mail, BookOpen, TrendingUp, Trash2, Eye, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TrainingDocument {
  id: number;
  title: string;
  type: 'product_doc' | 'email_example' | 'case_study' | 'best_practice';
  content: string;
  agentType?: string;
  uploadedAt: Date;
  effectiveness?: number;
}

export default function AgentTraining() {
  const [selectedTab, setSelectedTab] = useState('documents');
  const [uploadType, setUploadType] = useState<TrainingDocument['type']>('product_doc');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [selectedAgentType, setSelectedAgentType] = useState<string>('all');

  // Mock data - replace with real tRPC queries
  const mockDocuments: TrainingDocument[] = [
    {
      id: 1,
      title: 'FAGOR CNC Machine Specifications',
      type: 'product_doc',
      content: 'Technical specifications for FAGOR 8065 CNC system...',
      uploadedAt: new Date('2024-01-15'),
      effectiveness: 85,
    },
    {
      id: 2,
      title: 'Successful Cold Outreach Email - Manufacturing',
      type: 'email_example',
      content: 'Subject: Reduce CNC downtime by 40%...',
      agentType: 'prospect',
      uploadedAt: new Date('2024-01-20'),
      effectiveness: 92,
    },
    {
      id: 3,
      title: 'Case Study: Automotive Plant Upgrade',
      type: 'case_study',
      content: 'How we helped a major automotive manufacturer...',
      uploadedAt: new Date('2024-01-25'),
      effectiveness: 78,
    },
  ];

  const handleUpload = () => {
    if (!uploadTitle.trim() || !uploadContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    // TODO: Implement actual upload with tRPC mutation
    toast.success('Training document uploaded successfully');
    setUploadTitle('');
    setUploadContent('');
  };

  const handleDelete = (id: number) => {
    // TODO: Implement delete with tRPC mutation
    toast.success('Document deleted');
  };

  const getTypeIcon = (type: TrainingDocument['type']) => {
    switch (type) {
      case 'product_doc':
        return <FileText className="h-4 w-4" />;
      case 'email_example':
        return <Mail className="h-4 w-4" />;
      case 'case_study':
        return <BookOpen className="h-4 w-4" />;
      case 'best_practice':
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: TrainingDocument['type']) => {
    switch (type) {
      case 'product_doc':
        return 'bg-blue-500';
      case 'email_example':
        return 'bg-green-500';
      case 'case_study':
        return 'bg-purple-500';
      case 'best_practice':
        return 'bg-orange-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Agent Training System</h1>
          <p className="text-muted-foreground mt-2">
            Upload documentation, email examples, and best practices to improve agent performance
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockDocuments.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Examples</CardTitle>
              <Mail className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockDocuments.filter(d => d.type === 'email_example').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                High-performing templates
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Effectiveness</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  mockDocuments.reduce((sum, d) => sum + (d.effectiveness || 0), 0) / mockDocuments.length
                )}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on agent performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Case Studies</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockDocuments.filter(d => d.type === 'case_study').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Success stories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="documents">Knowledge Base</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
            <TabsTrigger value="analytics">Training Analytics</TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex gap-4">
              <Select value={uploadType} onValueChange={(v) => setUploadType(v as any)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="product_doc">Product Docs</SelectItem>
                  <SelectItem value="email_example">Email Examples</SelectItem>
                  <SelectItem value="case_study">Case Studies</SelectItem>
                  <SelectItem value="best_practice">Best Practices</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedAgentType} onValueChange={setSelectedAgentType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="prospect">Ivy-Prospect</SelectItem>
                  <SelectItem value="closer">Ivy-Closer</SelectItem>
                  <SelectItem value="solve">Ivy-Solve</SelectItem>
                  <SelectItem value="logic">Ivy-Logic</SelectItem>
                  <SelectItem value="talent">Ivy-Talent</SelectItem>
                  <SelectItem value="insight">Ivy-Insight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(doc.type)}
                        <CardTitle className="text-base">{doc.title}</CardTitle>
                      </div>
                      <Badge className={getTypeBadgeColor(doc.type)}>
                        {doc.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription>
                      Uploaded {doc.uploadedAt.toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {doc.content}
                    </p>

                    {doc.effectiveness && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${doc.effectiveness}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{doc.effectiveness}%</span>
                      </div>
                    )}

                    {doc.agentType && (
                      <Badge variant="outline">
                        Ivy-{doc.agentType.charAt(0).toUpperCase() + doc.agentType.slice(1)}
                      </Badge>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(doc.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Training Material</CardTitle>
                <CardDescription>
                  Add new documents to improve agent knowledge and performance
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., FAGOR 8065 Product Specifications"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Document Type</Label>
                  <Select value={uploadType} onValueChange={(v) => setUploadType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product_doc">Product Documentation</SelectItem>
                      <SelectItem value="email_example">Email Example</SelectItem>
                      <SelectItem value="case_study">Case Study</SelectItem>
                      <SelectItem value="best_practice">Best Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent">Target Agent (Optional)</Label>
                  <Select value={selectedAgentType} onValueChange={setSelectedAgentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agents</SelectItem>
                      <SelectItem value="prospect">Ivy-Prospect</SelectItem>
                      <SelectItem value="closer">Ivy-Closer</SelectItem>
                      <SelectItem value="solve">Ivy-Solve</SelectItem>
                      <SelectItem value="logic">Ivy-Logic</SelectItem>
                      <SelectItem value="talent">Ivy-Talent</SelectItem>
                      <SelectItem value="insight">Ivy-Insight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste document content or email template here..."
                    rows={10}
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpload} className="flex-1">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Training Impact</CardTitle>
                  <CardDescription>
                    How training materials affect agent performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Conversion Rate Improvement</span>
                      <span className="text-sm font-bold text-green-500">+12.5%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Open Rate Improvement</span>
                      <span className="text-sm font-bold text-green-500">+8.3%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Time Reduction</span>
                      <span className="text-sm font-bold text-green-500">-15%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Most Effective Materials</CardTitle>
                  <CardDescription>
                    Top performing training documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockDocuments
                      .sort((a, b) => (b.effectiveness || 0) - (a.effectiveness || 0))
                      .slice(0, 3)
                      .map((doc, idx) => (
                        <div key={doc.id} className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">{doc.effectiveness}% effective</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
