import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useCompany } from '@/contexts/CompanyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Search, TrendingUp, Users, DollarSign, Filter, Download, Sparkles, UserPlus, Award, Briefcase, GraduationCap, Bookmark, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Component to display enriched LinkedIn data
function EnrichedDataView({ metadata }: { metadata: any }) {
  if (!metadata || typeof metadata !== 'object') {
    return <div className="text-muted-foreground">No enriched data available</div>;
  }

  const { skills, experience, education, languages, badges } = metadata;

  return (
    <Tabs defaultValue="skills" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="skills">Skills</TabsTrigger>
        <TabsTrigger value="experience">Experience</TabsTrigger>
        <TabsTrigger value="education">Education</TabsTrigger>
        <TabsTrigger value="other">Other</TabsTrigger>
      </TabsList>
      
      <TabsContent value="skills" className="space-y-4">
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Top Skills
          </h3>
          {skills && skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: any, index: number) => (
                <Badge key={index} variant="secondary">
                  {skill.name || skill}
                  {skill.endorsements && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({skill.endorsements})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No skills data</p>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="experience" className="space-y-4">
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Work Experience
          </h3>
          {experience && experience.length > 0 ? (
            <div className="space-y-4">
              {experience.map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-primary/20 pl-4 py-2">
                  <div className="font-medium">{exp.title || 'Position'}</div>
                  <div className="text-sm text-muted-foreground">
                    {exp.company || 'Company'}
                  </div>
                  {exp.duration && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {exp.duration}
                    </div>
                  )}
                  {exp.description && (
                    <p className="text-sm mt-2">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No experience data</p>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="education" className="space-y-4">
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Education
          </h3>
          {education && education.length > 0 ? (
            <div className="space-y-3">
              {education.map((edu: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="font-medium">{edu.school || 'Institution'}</div>
                  <div className="text-sm text-muted-foreground">
                    {edu.degree || 'Degree'}
                  </div>
                  {edu.field && (
                    <div className="text-sm mt-1">{edu.field}</div>
                  )}
                  {edu.years && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {edu.years}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No education data</p>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="other" className="space-y-4">
        <div>
          <h3 className="font-semibold mb-3">Languages</h3>
          {languages && languages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {languages.map((lang: any, index: number) => (
                <Badge key={index} variant="outline">
                  {typeof lang === 'string' ? lang : lang.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No language data</p>
          )}
        </div>
        
        {badges && badges.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">LinkedIn Badges</h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge: string, index: number) => (
                <Badge key={index} className="bg-blue-500/10 text-blue-600">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState<{
    status?: string;
    startDate?: string;
    endDate?: string;
  }>({});
  const [showExportFilters, setShowExportFilters] = useState(false);
  const [isProspectSearchOpen, setIsProspectSearchOpen] = useState(false);
  const [prospectQuery, setProspectQuery] = useState('');
  const [prospectIndustry, setProspectIndustry] = useState('');
  const [prospectLocation, setProspectLocation] = useState('');
  const [prospectCompanySize, setProspectCompanySize] = useState('');
  const [prospectSeniority, setProspectSeniority] = useState('');
  const [prospectSkills, setProspectSkills] = useState<string[]>([]);
   const [currentSearchId, setCurrentSearchId] = useState<number | null>(null);
  const [showSaveSearchDialog, setShowSaveSearchDialog] = useState(false);
  const [savedSearchName, setSavedSearchName] = useState('');

  const { selectedCompany } = useCompany();
  const { data: leadsData, isLoading, refetch } = trpc.leads.list.useQuery(
    selectedCompany ? { companyId: Number(selectedCompany.id) } : undefined
  );
  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success('Lead created successfully');
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create lead: ${error.message}`);
    }
  });
  
  const enrichProspect = trpc.prospect.enrich.useMutation();

  const exportLeads = trpc.export.leads.useQuery(
    exportFilters.status || exportFilters.startDate || exportFilters.endDate
      ? exportFilters as any
      : undefined,
    { enabled: false }
  );

  const handleExportCSV = async () => {
    try {
      const result = await exportLeads.refetch();
      if (result.data) {
        const blob = new Blob([result.data.content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', result.data.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${result.data.count} leads to CSV`);
        setShowExportFilters(false);
      }
    } catch (error) {
      toast.error('Failed to export leads');
    }
  };
  
  const handleExportWithFilters = () => {
    setShowExportFilters(true);
  };

  const searchProspects = trpc.prospect.search.useMutation({
    onSuccess: (data) => {
      setCurrentSearchId(data.searchId);
      if (data.prospects.length === 0) {
        toast.info('No prospects found matching your criteria');
      } else {
        toast.success(`Found ${data.prospects.length} prospects`);
      }
    },
    onError: (error) => {
      toast.error(`Search failed: ${error.message}`);
    }
  });

  const createSavedSearch = trpc.savedSearches.create.useMutation({
    onSuccess: () => {
      toast.success('Search saved successfully');
      setShowSaveSearchDialog(false);
      setSavedSearchName('');
    },
    onError: (error) => {
      toast.error(`Failed to save search: ${error.message}`);
    }
  });

  const handleSaveSearch = () => {
    if (!savedSearchName.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }

    createSavedSearch.mutate({
      companyId: selectedCompany?.id,
      name: savedSearchName,
      filters: {
        query: prospectQuery,
        industry: (prospectIndustry && prospectIndustry !== 'all') ? prospectIndustry : undefined,
        location: prospectLocation || undefined,
        companySize: (prospectCompanySize && prospectCompanySize !== 'all') ? prospectCompanySize : undefined,
        seniority: (prospectSeniority && prospectSeniority !== 'all') ? prospectSeniority : undefined,
        skills: prospectSkills.length > 0 ? prospectSkills : undefined,
      },
    });
  };

  const handleExecuteSavedSearch = (filters: any) => {
    // Pre-fill the Ivy-Prospect dialog with saved search filters
    setProspectQuery(filters.query || '');
    setProspectIndustry(filters.industry || '');
    setProspectLocation(filters.location || '');
    setProspectCompanySize(filters.companySize || '');
    setProspectSeniority(filters.seniority || '');
    setProspectSkills(filters.skills || []);
    setIsProspectSearchOpen(true);
  };

  const handleProspectSearch = () => {
    if (!prospectQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    searchProspects.mutate({
      query: prospectQuery,
      industry: (prospectIndustry && prospectIndustry !== 'all') ? prospectIndustry : undefined,
      location: prospectLocation || undefined,
      companySize: (prospectCompanySize && prospectCompanySize !== 'all') ? prospectCompanySize : undefined,
      seniority: (prospectSeniority && prospectSeniority !== 'all') ? prospectSeniority : undefined,
      skills: prospectSkills.length > 0 ? prospectSkills : undefined,
      limit: 10,
    });
  };

  const handleAddProspectAsLead = async (prospect: any) => {
    if (!selectedCompany) {
      toast.error('Please select a company first');
      return;
    }
    
    // Check if lead already exists by email
    const existingLead = leadsData?.leads?.find(
      (lead: any) => lead.email && prospect.email && lead.email.toLowerCase() === prospect.email.toLowerCase()
    );
    
    if (existingLead) {
      toast.error(`${prospect.name} is already in your leads`);
      return;
    }
    
    // Show enriching toast
    const enrichToast = toast.loading('Enriching profile from LinkedIn...');
    
    try {
      // Enrich prospect profile from LinkedIn
      const enrichResult = await enrichProspect.mutateAsync({
        linkedinUrl: prospect.linkedinUrl,
      });
      
      // Prepare metadata with enriched data
      const metadata: any = {};
      if (enrichResult.success && enrichResult.data) {
        metadata.enrichedData = enrichResult.data;
        metadata.enrichedAt = new Date().toISOString();
      }
      
      toast.dismiss(enrichToast);
      
      // Create lead with enriched data
      createLead.mutate({
        companyId: selectedCompany.id,
        name: prospect.name,
        email: prospect.email,
        company: prospect.company,
        title: prospect.title,
        industry: prospect.industry,
        location: prospect.location,
        prospectSearchId: currentSearchId,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      }, {
        onSuccess: () => {
          toast.success(`${prospect.name} added as lead with enriched profile`);
          refetch(); // Refresh leads table
        },
        onError: (error) => {
          toast.error(`Failed to add lead: ${error.message}`);
        }
      });
    } catch (error) {
      // If enrichment fails, create lead with basic data
      toast.dismiss(enrichToast);
      console.warn('Enrichment failed, creating lead with basic data:', error);
      
      createLead.mutate({
        companyId: selectedCompany.id,
        name: prospect.name,
        email: prospect.email,
        company: prospect.company,
        title: prospect.title,
        industry: prospect.industry,
        location: prospect.location,
        prospectSearchId: currentSearchId,
      }, {
        onSuccess: () => {
          toast.success(`${prospect.name} added as lead (enrichment unavailable)`);
          refetch(); // Refresh leads table
        },
        onError: (error) => {
          toast.error(`Failed to add lead: ${error.message}`);
        }
      });
    }
  };

  // Qualify lead functionality (to be implemented)
  const handleQualifyLead = (leadId: number) => {
    toast.info('Qualify functionality coming soon');
  };

  const leads = leadsData?.leads || [];

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.status === 'qualified').length;
  const avgScore = leads.length > 0 
    ? (leads.reduce((sum, l) => sum + (l.qualificationScore || 0), 0) / leads.length).toFixed(1)
    : '0';

  const handleCreateLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedCompany) {
      toast.error('Please select a company first');
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    
    createLead.mutate({
      companyId: selectedCompany.id,
      name: formData.get('contactName') as string,
      email: formData.get('email') as string,
      company: formData.get('company') as string,
    });
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'contacted': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'qualified': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'converted': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'lost': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-muted-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leads Management</h1>
          <p className="text-muted-foreground mt-1">
            Powered by Ivy-Prospect
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isProspectSearchOpen} onOpenChange={setIsProspectSearchOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Search Prospects
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ivy-Prospect: Search & Enrich Leads</DialogTitle>
                <DialogDescription>
                  Search for potential leads using LinkedIn-style filters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Search Query *</Label>
                  <Input
                    placeholder="e.g., CTO, VP Engineering, Director IT"
                    value={prospectQuery}
                    onChange={(e) => setProspectQuery(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select value={prospectIndustry || undefined} onValueChange={setProspectIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="All industries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Industries</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Software">Software</SelectItem>
                        <SelectItem value="Data Analytics">Data Analytics</SelectItem>
                        <SelectItem value="Cloud Computing">Cloud Computing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      placeholder="e.g., San Francisco, CA"
                      value={prospectLocation}
                      onChange={(e) => setProspectLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Size</Label>
                    <Select value={prospectCompanySize || undefined} onValueChange={setProspectCompanySize}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Size</SelectItem>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">501-1000 employees</SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Seniority Level</Label>
                    <Select value={prospectSeniority || undefined} onValueChange={setProspectSeniority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Level</SelectItem>
                        <SelectItem value="Entry">Entry Level</SelectItem>
                        <SelectItem value="Mid">Mid Level</SelectItem>
                        <SelectItem value="Senior">Senior Level</SelectItem>
                        <SelectItem value="Executive">Executive</SelectItem>
                        <SelectItem value="C-Level">C-Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Technical Skills (Optional)</Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[42px]">
                    {['React', 'Python', 'JavaScript', 'AWS', 'SQL', 'Docker', 'Kubernetes', 'Node.js', 'TypeScript', 'Java', 'C++', 'Go', 'Rust', 'Machine Learning', 'Data Science', 'DevOps', 'Agile', 'Scrum'].map((skill) => (
                      <Badge
                        key={skill}
                        variant={prospectSkills.includes(skill) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (prospectSkills.includes(skill)) {
                            setProspectSkills(prospectSkills.filter(s => s !== skill));
                          } else {
                            setProspectSkills([...prospectSkills, skill]);
                          }
                        }}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  {prospectSkills.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {prospectSkills.join(', ')}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleProspectSearch}
                    disabled={searchProspects.isPending}
                    className="flex-1"
                  >
                    {searchProspects.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search Prospects
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveSearchDialog(true)}
                    disabled={!prospectQuery.trim()}
                  >
                    💾 Save Search
                  </Button>
                </div>

                {searchProspects.data && searchProspects.data.prospects.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Results ({searchProspects.data.total})</h3>
                    </div>
                    <div className="space-y-3">
                      {searchProspects.data.prospects.map((prospect: any, idx: number) => (
                        <Card key={idx}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <img
                                src={prospect.profilePicture}
                                alt={prospect.name}
                                className="w-12 h-12 rounded-full"
                              />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold">{prospect.name}</h4>
                                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                                    Score: {prospect.qualificationScore}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{prospect.title}</p>
                                <p className="text-sm font-medium">{prospect.company}</p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{prospect.industry}</span>
                                  <span>•</span>
                                  <span>{prospect.location}</span>
                                  <span>•</span>
                                  <span>{prospect.companySize} employees</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddProspectAsLead(prospect)}
                                    disabled={createLead.isPending}
                                  >
                                    <UserPlus className="h-3 w-3 mr-1" />
                                    Add as Lead
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(prospect.linkedinUrl, '_blank')}
                                  >
                                    View LinkedIn
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Save Search Dialog */}
          <Dialog open={showSaveSearchDialog} onOpenChange={setShowSaveSearchDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save Search</DialogTitle>
                <DialogDescription>
                  Give this search a name to quickly execute it later
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="search-name">Search Name</Label>
                  <Input
                    id="search-name"
                    placeholder="e.g., Senior CTOs in Tech 1000+"
                    value={savedSearchName}
                    onChange={(e) => setSavedSearchName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && savedSearchName.trim()) {
                        handleSaveSearch();
                      }
                    }}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Current filters:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Query: {prospectQuery}</li>
                    {prospectIndustry && prospectIndustry !== 'all' && (
                      <li>Industry: {prospectIndustry}</li>
                    )}
                    {prospectLocation && <li>Location: {prospectLocation}</li>}
                    {prospectCompanySize && prospectCompanySize !== 'all' && (
                      <li>Company Size: {prospectCompanySize}</li>
                    )}
                    {prospectSeniority && prospectSeniority !== 'all' && (
                      <li>Seniority: {prospectSeniority}</li>
                    )}
                    {prospectSkills.length > 0 && (
                      <li>Skills: {prospectSkills.join(', ')}</li>
                    )}
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowSaveSearchDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSearch}
                  disabled={!savedSearchName.trim() || createSavedSearch.isPending}
                >
                  {createSavedSearch.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showExportFilters} onOpenChange={setShowExportFilters}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export Leads to CSV</DialogTitle>
                <DialogDescription>
                  Apply filters to export specific leads
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <Select
                    value={exportFilters.status || 'all'}
                    onValueChange={(value) =>
                      setExportFilters({ ...exportFilters, status: value === 'all' ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="nurture">Nurture</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={exportFilters.startDate || ''}
                    onChange={(e) => setExportFilters({ ...exportFilters, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={exportFilters.endDate || ''}
                    onChange={(e) => setExportFilters({ ...exportFilters, endDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowExportFilters(false)}>
                  Cancel
                </Button>
                <Button onClick={handleExportCSV} disabled={exportLeads.isFetching}>
                  {exportLeads.isFetching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateLead}>
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
                <DialogDescription>
                  Add a new lead to the pipeline. Ivy-Prospect will automatically qualify it.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input id="company" name="company" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input id="contactName" name="contactName" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source *</Label>
                  <Select name="source" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="cold_outreach">Cold Outreach</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createLead.isPending}>
                  {createLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Lead
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Saved Searches */}
      <SavedSearchesSection
        selectedCompany={selectedCompany}
        onExecuteSearch={handleExecuteSavedSearch}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              In pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{qualifiedLeads}</div>
            <p className="text-xs text-muted-foreground">
              Ready for sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}</div>
            <p className="text-xs text-muted-foreground">
              Lead quality
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
          <CardDescription>
            Manage and qualify your sales leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enriched</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No leads found. Create your first lead to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.company}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-muted-foreground">{lead.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={getScoreColor(lead.qualificationScore || 0)}>{lead.qualificationScore || 0}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.metadata && Object.keys(lead.metadata).length > 0 ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 cursor-pointer">
                                ✓ View
                              </Badge>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Enriched Profile Data</DialogTitle>
                                <DialogDescription>
                                  LinkedIn profile information for {lead.name}
                                </DialogDescription>
                              </DialogHeader>
                              <EnrichedDataView metadata={lead.metadata} />
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {lead.status === 'new' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQualifyLead(lead.id!)}
                          >
                            Qualify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Saved Searches Section Component
function SavedSearchesSection({
  selectedCompany,
  onExecuteSearch,
}: {
  selectedCompany: any;
  onExecuteSearch: (filters: any) => void;
}) {
  const { data: savedSearchesData } = trpc.savedSearches.list.useQuery(
    selectedCompany ? { companyId: Number(selectedCompany.id) } : undefined,
    { enabled: !!selectedCompany }
  );

  const executeSavedSearch = trpc.savedSearches.execute.useMutation({
    onSuccess: (data) => {
      onExecuteSearch(data.filters);
      toast.success('Search filters loaded');
    },
    onError: (error) => {
      toast.error(`Failed to execute search: ${error.message}`);
    },
  });

  const deleteSavedSearch = trpc.savedSearches.delete.useMutation({
    onSuccess: () => {
      toast.success('Search deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete search: ${error.message}`);
    },
  });

  const handleExecute = (searchId: number) => {
    executeSavedSearch.mutate({ searchId });
  };

  const handleDelete = (searchId: number, searchName: string) => {
    if (confirm(`Are you sure you want to delete "${searchName}"?`)) {
      deleteSavedSearch.mutate({ searchId });
    }
  };

  if (!savedSearchesData?.searches || savedSearchesData.searches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="h-5 w-5" />
          Saved Searches
        </CardTitle>
        <CardDescription>
          Quick access to your frequently used search filters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {savedSearchesData.searches.map((search: any) => (
            <Card key={search.id} className="relative">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm">{search.name}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(search.id, search.name)}
                    >
                      🗑️
                    </Button>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Query:</strong> {search.filters.query}</p>
                    {search.filters.industry && (
                      <p><strong>Industry:</strong> {search.filters.industry}</p>
                    )}
                    {search.filters.location && (
                      <p><strong>Location:</strong> {search.filters.location}</p>
                    )}
                    {search.filters.companySize && (
                      <p><strong>Company Size:</strong> {search.filters.companySize}</p>
                    )}
                    {search.filters.seniority && (
                      <p><strong>Seniority:</strong> {search.filters.seniority}</p>
                    )}
                    {search.filters.skills && search.filters.skills.length > 0 && (
                      <p><strong>Skills:</strong> {search.filters.skills.join(', ')}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Used {search.usageCount || 0} times
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleExecute(search.id)}
                      disabled={executeSavedSearch.isPending}
                    >
                      {executeSavedSearch.isPending ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 mr-1" />
                      )}
                      Execute
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
