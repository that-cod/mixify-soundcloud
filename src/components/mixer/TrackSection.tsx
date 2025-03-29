
import React, { useState } from 'react';
import { WaveformDisplay } from './WaveformDisplay';
import { AudioUploader } from './AudioUploader';
import { TrackAnalysis } from './TrackAnalysis';
import { Badge } from '@/components/ui/badge';
import WaveSurfer from 'wavesurfer.js';
import { Database, HardDrive } from 'lucide-react';
import { AudioFeatures } from '@/types/audio';

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
      <h2 className="text-xl font-semibold flex items-center gap-2">
        Track {trackNumber}
        {audioFeatures?.cached && (
          <Badge variant="outline" className="bg-white/10 text-xs font-normal flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            Cached
          </Badge>
        )}
      </h2>
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
