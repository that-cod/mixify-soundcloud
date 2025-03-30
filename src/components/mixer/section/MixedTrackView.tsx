
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, DownloadCloud } from 'lucide-react';
import { WaveformDisplay } from '../WaveformDisplay';
import { PlaybackControls } from '../PlaybackControls';
import { Progress } from '@/components/ui/progress';
import WaveSurfer from 'wavesurfer.js';

interface MixedTrackViewProps {
  mixedTrackUrl: string;
  isPlaying: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  togglePlayback: () => void;
  restartPlayback: () => void;
  onMixedWavesurferReady: (wavesurfer: WaveSurfer) => void;
  onCreateNewMix: () => void;
}

export const MixedTrackView: React.FC<MixedTrackViewProps> = ({
  mixedTrackUrl,
  isPlaying,
  volume,
  setVolume,
  togglePlayback,
  restartPlayback,
  onMixedWavesurferReady,
  onCreateNewMix
}) => {
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    if (!mixedTrackUrl) return;
    
    setIsDownloading(true);
    setDownloadProgress(10);
    
    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev === null) return 10;
        const next = prev + 15;
        return next >= 100 ? 100 : next;
      });
    }, 300);
    
    // Create download link and trigger download
    const downloadLink = document.createElement('a');
    downloadLink.href = mixedTrackUrl;
    downloadLink.download = "mixify-mixed-track.mp3";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Complete download simulation
    setTimeout(() => {
      clearInterval(interval);
      setDownloadProgress(100);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(null);
      }, 500);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Your Mixed Track</h2>
        <Button 
          onClick={handleDownload}
          variant="outline"
          className="flex items-center space-x-2"
          disabled={isDownloading}
        >
          <DownloadCloud className="h-4 w-4 mr-2" />
          {isDownloading ? "Downloading..." : "Download Mix"}
        </Button>
      </div>
      
      {downloadProgress !== null && (
        <div className="mb-4">
          <Progress value={downloadProgress} className="h-2" />
          <p className="text-xs text-center mt-1">{downloadProgress}% downloaded</p>
        </div>
      )}
      
      <WaveformDisplay 
        audioUrl={mixedTrackUrl} 
        color="#FF5500"
        onReady={onMixedWavesurferReady}
      />
      
      <PlaybackControls
        isPlaying={isPlaying}
        togglePlayback={togglePlayback}
        volume={volume}
        setVolume={setVolume}
        restart={restartPlayback}
        downloadUrl={mixedTrackUrl}
        trackName="mixify-mixed-track.mp3"
      />

      <Button 
        onClick={onCreateNewMix}
        variant="outline"
        className="mt-4"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Create New Mix
      </Button>
    </div>
  );
};
