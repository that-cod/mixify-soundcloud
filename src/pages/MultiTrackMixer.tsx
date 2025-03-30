
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
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Advanced Mixer Studio</h1>
          <p className="text-white/70 mt-1">Mix multiple tracks with advanced audio processing tools</p>
        </div>
        
        <div className="overflow-hidden rounded-lg bg-black/20 border border-white/5 p-4 md:p-6 shadow-lg">
          <MultiTrackMixer />
        </div>
      </div>
    </MainLayout>
  );
};

export default MultiTrackMixerPage;
