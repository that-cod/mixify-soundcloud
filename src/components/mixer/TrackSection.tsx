
import React, { useState, useEffect } from 'react';
import { WaveformDisplay } from './WaveformDisplay';
import { AudioUploader } from './AudioUploader';
import { TrackAnalysis } from './TrackAnalysis';
import WaveSurfer from 'wavesurfer.js';

interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
}

interface TrackSectionProps {
  trackNumber: 1 | 2;
  trackUrl: string | undefined;
  trackName: string | undefined;
  audioFeatures: AudioFeatures | null;
  isAnalyzing: boolean;
  analyzeProgress: number;
  onUploadComplete: (url: string, fileName: string) => void;
  onWavesurferReady: (wavesurfer: WaveSurfer) => void;
}

export const TrackSection: React.FC<TrackSectionProps> = ({
  trackNumber,
  trackUrl,
  trackName,
  audioFeatures,
  isAnalyzing,
  analyzeProgress,
  onUploadComplete,
  onWavesurferReady,
}) => {
  // Mock duration state
  const [trackDuration, setTrackDuration] = useState(trackNumber === 1 ? 180 : 210);

  const handleUpload = (url: string, fileName: string) => {
    onUploadComplete(url, fileName);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Track {trackNumber}</h2>
      <AudioUploader 
        trackNumber={trackNumber} 
        onUploadComplete={handleUpload} 
      />
      
      {trackUrl && (
        <>
          <WaveformDisplay 
            audioUrl={trackUrl} 
            color={trackNumber === 1 ? "#9b87f5" : "#FF5500"}
            onReady={onWavesurferReady}
          />
          
          <TrackAnalysis
            trackName={trackName || `Track ${trackNumber}`}
            isLoading={isAnalyzing}
            features={audioFeatures}
            duration={trackDuration}
            analyzingProgress={analyzeProgress}
          />
        </>
      )}
    </div>
  );
};
