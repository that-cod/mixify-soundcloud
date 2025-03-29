
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { TrackSection } from '@/components/mixer/TrackSection';
import { BucketStatusSection } from '@/components/mixer/BucketStatusSection';
import { MixerSection } from '@/components/mixer/MixerSection';
import { useBucketStatus } from '@/hooks/useBucketStatus';
import { useMixerControls } from '@/hooks/useMixerControls';

const Mixer: React.FC = () => {
  const { user } = useAuth();
  
  // Track states
  const [track1Url, setTrack1Url] = useState<string | undefined>();
  const [track1Name, setTrack1Name] = useState<string | undefined>();
  const [track2Url, setTrack2Url] = useState<string | undefined>();
  const [track2Name, setTrack2Name] = useState<string | undefined>();
  
  // Use custom hooks
  const { bucketStatus, storageBucketChecking } = useBucketStatus();
  const {
    isMixing,
    mixProgress,
    mixedTrackUrl,
    isPlaying,
    volume,
    setVolume,
    track1Features,
    track2Features,
    isAnalyzing,
    analyzeProgress,
    mixSettings,
    updateMixSetting,
    handleMix,
    togglePlayback,
    restartPlayback,
    handleTrack1WavesurferReady,
    handleTrack2WavesurferReady,
    handleMixedWavesurferReady,
  } = useMixerControls({ track1Url, track2Url });
  
  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const handleTrack1Upload = (url: string, fileName: string) => {
    console.log("Track 1 upload complete:", { url, fileName });
    setTrack1Url(url);
    setTrack1Name(fileName);
  };
  
  const handleTrack2Upload = (url: string, fileName: string) => {
    console.log("Track 2 upload complete:", { url, fileName });
    setTrack2Url(url);
    setTrack2Name(fileName);
  };

  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mix Studio</h1>
          <p className="text-white/70">Upload two tracks and create a professional AI mix</p>
        </div>
        
        {/* Bucket Status Section */}
        <BucketStatusSection 
          bucketStatus={bucketStatus} 
          storageBucketChecking={storageBucketChecking} 
        />
        
        {/* Tracks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Track 1 */}
          <TrackSection
            trackNumber={1}
            trackUrl={track1Url}
            trackName={track1Name}
            audioFeatures={track1Features}
            isAnalyzing={isAnalyzing && !track1Features}
            analyzeProgress={analyzeProgress}
            onUploadComplete={handleTrack1Upload}
            onWavesurferReady={handleTrack1WavesurferReady}
          />
          
          {/* Track 2 */}
          <TrackSection
            trackNumber={2}
            trackUrl={track2Url}
            trackName={track2Name}
            audioFeatures={track2Features}
            isAnalyzing={isAnalyzing && !track2Features}
            analyzeProgress={analyzeProgress}
            onUploadComplete={handleTrack2Upload}
            onWavesurferReady={handleTrack2WavesurferReady}
          />
        </div>
        
        {/* Mix Control Section */}
        <div className="mb-8">
          <MixerSection
            track1Url={track1Url}
            track2Url={track2Url}
            mixedTrackUrl={mixedTrackUrl}
            isMixing={isMixing}
            mixProgress={mixProgress}
            isPlaying={isPlaying}
            volume={volume}
            setVolume={setVolume}
            track1Features={track1Features}
            track2Features={track2Features}
            mixSettings={mixSettings}
            updateMixSetting={updateMixSetting}
            handleMix={handleMix}
            togglePlayback={togglePlayback}
            restartPlayback={restartPlayback}
            onMixedWavesurferReady={handleMixedWavesurferReady}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Mixer;
