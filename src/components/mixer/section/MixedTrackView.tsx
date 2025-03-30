
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { WaveformDisplay } from '../WaveformDisplay';
import { PlaybackControls } from '../PlaybackControls';
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
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Mixed Track</h2>
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
