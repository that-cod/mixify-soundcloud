
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MicIcon } from 'lucide-react';
import { WaveformDisplay } from './WaveformDisplay';
import { PlaybackControls } from './PlaybackControls';
import WaveSurfer from 'wavesurfer.js';

interface MixerSectionProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
  mixedTrackUrl: string | undefined;
  isMixing: boolean;
  mixProgress: number;
  isPlaying: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  handleMix: () => void;
  togglePlayback: () => void;
  restartPlayback: () => void;
  onMixedWavesurferReady: (wavesurfer: WaveSurfer) => void;
}

export const MixerSection: React.FC<MixerSectionProps> = ({
  track1Url,
  track2Url,
  mixedTrackUrl,
  isMixing,
  mixProgress,
  isPlaying,
  volume,
  setVolume,
  handleMix,
  togglePlayback,
  restartPlayback,
  onMixedWavesurferReady,
}) => {
  if (mixedTrackUrl) {
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
      </div>
    );
  }
  
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Create Mix</CardTitle>
        <CardDescription>
          Mix your two tracks with AI assistance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isMixing ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="h-8 w-8 text-mixify-purple-light animate-spin mb-4" />
            <p className="text-white/70 mb-2">Creating your mix...</p>
            <div className="w-full max-w-md h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-mixify-purple to-mixify-accent" 
                style={{ width: `${mixProgress}%` }}
              />
            </div>
            <p className="text-xs text-white/50 mt-2">{mixProgress}% complete</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <p className="text-white/70 mb-4">
              Ready to mix your tracks? Our AI will analyze both tracks and create a professional mix.
            </p>
            <Button 
              onClick={handleMix} 
              disabled={!track1Url || !track2Url}
              className="bg-mixify-purple hover:bg-mixify-purple-dark"
            >
              <MicIcon className="mr-2 h-5 w-5" />
              Mix Tracks
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
