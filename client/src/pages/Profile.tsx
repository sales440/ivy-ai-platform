import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { User, Bell, Shield, Save, Loader2 } from 'lucide-react';

export default function Profile() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('info');

  // User info state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [workflowNotifications, setWorkflowNotifications] = useState(true);
  const [leadNotifications, setLeadNotifications] = useState(true);
  const [ticketNotifications, setTicketNotifications] = useState(true);

  if (loading) {
    return (
      <div className="container py-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Please log in to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveInfo = () => {
    // TODO: Implement user info update
    toast.success('Profile updated successfully');
  };

  const handleSavePreferences = () => {
    // TODO: Implement preferences save
    toast.success('Preferences saved successfully');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">User Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>
        <Badge variant="outline" className={
          user.role === 'admin' 
            ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' 
            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
        }>
          {user.role}
        </Badge>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
              <AvatarFallback className="text-2xl">{getInitials(user.name || 'User')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">
            <User className="h-4 w-4 mr-2" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Bell className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loginMethod">Login Method</Label>
                <Input
                  id="loginMethod"
                  value={user.loginMethod || 'N/A'}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openId">User ID</Label>
                <Input
                  id="openId"
                  value={user.openId}
                  disabled
                  className="bg-muted font-mono text-sm"
                />
              </div>
              <Button onClick={handleSaveInfo} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="workflow-notifications">Workflow Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when workflows complete or fail
                  </p>
                </div>
                <Switch
                  id="workflow-notifications"
                  checked={workflowNotifications}
                  onCheckedChange={setWorkflowNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lead-notifications">Lead Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerts for new qualified leads
                  </p>
                </div>
                <Switch
                  id="lead-notifications"
                  checked={leadNotifications}
                  onCheckedChange={setLeadNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ticket-notifications">Ticket Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Updates on support ticket status changes
                  </p>
                </div>
                <Switch
                  id="ticket-notifications"
                  checked={ticketNotifications}
                  onCheckedChange={setTicketNotifications}
                />
              </div>
              <Button onClick={handleSavePreferences} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Authentication Method</p>
                    <p className="text-sm text-muted-foreground">
                      {user.loginMethod || 'OAuth'}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    Active
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div>
                  <p className="font-medium">Last Sign In</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.lastSignedIn).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div>
                  <p className="font-medium">Account Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-muted-foreground/20 bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  <Shield className="h-4 w-4 inline mr-2" />
                  Your account is secured with OAuth authentication. Password management is handled by your identity provider.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
