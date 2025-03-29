
import React from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { MultiTrackMixer } from '@/components/mixer/MultiTrackMixer';

const MultiTrackMixerPage: React.FC = () => {
  const { user } = useAuth();
  
  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Advanced Mixer Studio</h1>
          <p className="text-white/70">Mix multiple tracks with advanced audio processing tools</p>
        </div>
        
        <MultiTrackMixer />
      </div>
    </MainLayout>
  );
};

export default MultiTrackMixerPage;
