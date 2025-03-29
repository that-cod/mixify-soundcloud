
import React, { useState, useEffect } from 'react';
import { WaveformDisplay } from './WaveformDisplay';
import { AudioUploader } from './AudioUploader';
import { TrackAnalysis } from './TrackAnalysis';
import WaveSurfer from 'wavesurfer.js';

interface TrackSectionProps {
  trackNumber: 1 | 2;
  trackUrl: string | undefined;
  trackName: string | undefined;
  onUploadComplete: (url: string, fileName: string) => void;
  onWavesurferReady: (wavesurfer: WaveSurfer) => void;
}

export const TrackSection: React.FC<TrackSectionProps> = ({
  trackNumber,
  trackUrl,
  trackName,
  onUploadComplete,
  onWavesurferReady,
}) => {
  // Mock track analysis state (would be populated by backend)
  const [trackAnalysis, setTrackAnalysis] = useState({
    isLoading: false,
    genre: trackNumber === 1 ? 'Pop' : 'Electronic',
    bpm: trackNumber === 1 ? 120 : 128,
    key: trackNumber === 1 ? 'C Major' : 'A Minor',
    duration: trackNumber === 1 ? 180 : 210,
  });

  const handleUpload = (url: string, fileName: string) => {
    onUploadComplete(url, fileName);
    setTrackAnalysis(prev => ({ ...prev, isLoading: true }));
    
    // Simulate analysis
    setTimeout(() => {
      setTrackAnalysis({
        isLoading: false,
        genre: trackNumber === 1 ? 'Pop' : 'Electronic',
        bpm: trackNumber === 1 ? 120 : 128,
        key: trackNumber === 1 ? 'C Major' : 'A Minor',
        duration: trackNumber === 1 ? 180 : 210,
      });
    }, 3000);
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
            isLoading={trackAnalysis.isLoading}
            genre={trackAnalysis.genre}
            bpm={trackAnalysis.bpm}
            key={trackAnalysis.key}
            duration={trackAnalysis.duration}
          />
        </>
      )}
    </div>
  );
};
