
import React from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Music, Settings, Waveform as WaveformIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import a custom Mix3 icon since it's not in the standard Lucide library
const Mix3 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 4h20M2 9h12M2 14h12M2 19h12M16 19h3a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-3v9z" />
  </svg>
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Mock data for the dashboard
  const recentMixes = [
    { id: 1, name: "Summer Mix", date: "2023-05-15", tracks: 2 },
    { id: 2, name: "Party Playlist", date: "2023-05-12", tracks: 3 },
    { id: 3, name: "Workout Mix", date: "2023-05-08", tracks: 4 }
  ];
  
  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-white/70">Manage your mixes and account</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>Choose your mixing experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full bg-mixify-purple hover:bg-mixify-purple-dark" 
                onClick={() => navigate('/mixer')}
              >
                <Mix3 className="mr-2 h-4 w-4" />
                Standard Mixer
              </Button>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => navigate('/multi-track-mixer')}
              >
                <WaveformIcon className="mr-2 h-4 w-4" />
                Advanced Studio
              </Button>
            </CardContent>
          </Card>
          
          <Card className="glass-card md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Mixes</CardTitle>
              <CardDescription>Your most recent mixing projects</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMixes.map(mix => (
                <div key={mix.id} className="py-2 border-b border-white/10 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{mix.name}</p>
                      <p className="text-sm text-white/50">{mix.date} • {mix.tracks} tracks</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Music className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="ghost" className="mt-4 text-sm w-full">
                <History className="mr-2 h-4 w-4" />
                View All Mixes
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your profile and preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Profile</p>
                  <p className="text-sm text-white/50">Update your personal information</p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Subscription</p>
                  <p className="text-sm text-white/50">Free Plan</p>
                </div>
                <Button variant="outline" size="sm">Upgrade</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">API Integration</p>
                  <p className="text-sm text-white/50">Manage your API keys</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
