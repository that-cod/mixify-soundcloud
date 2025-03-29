import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MicIcon, RefreshCw, Sparkles } from 'lucide-react';
import { WaveformDisplay } from './WaveformDisplay';
import { PlaybackControls } from './PlaybackControls';
import { MixSettings } from './MixSettings';
import { PromptMixingInterface } from './PromptMixingInterface';
import WaveSurfer from 'wavesurfer.js';
import { useToast } from '@/hooks/use-toast';
import { PromptAnalysisResult } from '@/services/anthropic-service';

interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
}

interface MixerSectionProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
  track1Name: string | undefined;
  track2Name: string | undefined;
  mixedTrackUrl: string | undefined;
  isMixing: boolean;
  mixProgress: number;
  isPlaying: boolean;
  volume: number;
  setVolume: (volume: number) => void;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  mixSettings: {
    bpmMatch: boolean;
    keyMatch: boolean;
    vocalLevel1: number;
    vocalLevel2: number;
    beatLevel1: number;
    beatLevel2: number;
    crossfadeLength: number;
    echo: number;
    tempo: number;
  };
  updateMixSetting: (setting: string, value: number | boolean) => void;
  handleMix: () => void;
  togglePlayback: () => void;
  restartPlayback: () => void;
  onMixedWavesurferReady: (wavesurfer: WaveSurfer) => void;
  isProcessingPrompt: boolean;
  promptProcessProgress: number;
  promptAnalysisResult?: PromptAnalysisResult | null;
  handlePromptMix: (prompt: string) => void;
}

export const MixerSection: React.FC<MixerSectionProps> = ({
  track1Url,
  track2Url,
  track1Name,
  track2Name,
  mixedTrackUrl,
  isMixing,
  mixProgress,
  isPlaying,
  volume,
  setVolume,
  track1Features,
  track2Features,
  mixSettings,
  updateMixSetting,
  handleMix,
  togglePlayback,
  restartPlayback,
  onMixedWavesurferReady,
  isProcessingPrompt,
  promptProcessProgress,
  promptAnalysisResult,
  handlePromptMix,
}) => {
  const [mixMode, setMixMode] = useState<'manual' | 'prompt'>('manual');
  const { toast } = useToast();

  const handlePromptSubmit = (prompt: string) => {
    // Directly process the prompt without API key check
    handlePromptMix(prompt);
  };

  // If we return to the mixer screen from the completed mix, reset the mix mode
  const handleCreateNewMix = () => {
    setMixMode('manual');
  };

  // Handle the Apply and Mix button clicked in the PromptMixingInterface
  const handleApplyAndMix = () => {
    if (promptAnalysisResult) {
      toast({
        title: "Applying AI Suggestions",
        description: "Creating mix based on your instructions...",
      });
      handleMix();
    }
  };

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

        <Button 
          onClick={handleCreateNewMix}
          variant="outline"
          className="mt-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Create New Mix
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {(track1Url || track2Url) && (
        <div className="flex items-center justify-center space-x-4 mb-2">
          <Button
            variant={mixMode === 'manual' ? 'default' : 'outline'}
            onClick={() => setMixMode('manual')}
            className={mixMode === 'manual' ? 'bg-mixify-purple hover:bg-mixify-purple-dark' : ''}
          >
            Manual Mix
          </Button>
          <Button
            variant={mixMode === 'prompt' ? 'default' : 'outline'}
            onClick={() => setMixMode('prompt')}
            className={mixMode === 'prompt' ? 'bg-mixify-purple hover:bg-mixify-purple-dark' : ''}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI Prompt Mix
          </Button>
        </div>
      )}

      {mixMode === 'manual' && (track1Url || track2Url) && (
        <MixSettings 
          mixSettings={mixSettings}
          updateMixSetting={updateMixSetting}
          track1Features={track1Features}
          track2Features={track2Features}
        />
      )}

      {mixMode === 'prompt' && (track1Url || track2Url) && (
        <PromptMixingInterface
          isProcessing={isProcessingPrompt}
          processProgress={promptProcessProgress}
          track1Features={track1Features}
          track2Features={track2Features}
          track1Name={track1Name}
          track2Name={track2Name}
          promptAnalysisResult={promptAnalysisResult}
          onPromptSubmit={handlePromptSubmit}
          onApplyAndMix={handleApplyAndMix}
          hasApiKey={true} // Always true now since we have the API key hardcoded
        />
      )}
    
      {(mixMode === 'manual' || (mixMode === 'prompt' && promptAnalysisResult)) && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Create Mix</CardTitle>
            <CardDescription>
              {promptAnalysisResult 
                ? "Apply AI-suggested settings and create your mix" 
                : "Mix your two tracks with the current settings"}
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
                  {promptAnalysisResult
                    ? "Ready to create your AI-guided mix using your instructions."
                    : "Ready to mix your tracks? Our AI will analyze both tracks and create a professional mix."}
                </p>
                <Button 
                  onClick={handleMix} 
                  disabled={!track1Url || !track2Url || !track1Features || !track2Features}
                  className="bg-mixify-purple hover:bg-mixify-purple-dark"
                >
                  <MicIcon className="mr-2 h-5 w-5" />
                  {promptAnalysisResult ? "Create AI Mix" : "Mix Tracks"}
                </Button>
                {(!track1Features || !track2Features) && (track1Url && track2Url) && (
                  <p className="text-xs text-amber-300 mt-2">Waiting for track analysis to complete...</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
