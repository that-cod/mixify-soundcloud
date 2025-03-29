
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MicIcon, RefreshCw, Sparkles, GitBranch } from 'lucide-react';
import { WaveformDisplay } from './WaveformDisplay';
import { PlaybackControls } from './PlaybackControls';
import { MixSettings } from './MixSettings';
import { PromptMixingInterface } from './PromptMixingInterface';
import { StagedMixingProcess } from './StagedMixingProcess';
import { StagedMixSettings } from './staged/types';
import WaveSurfer from 'wavesurfer.js';
import { useToast } from '@/hooks/use-toast';
import { PromptAnalysisResult } from '@/services/anthropic-service';
import { AudioFeatures } from '@/types/audio';

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
  
  // New staged mixing props
  mixingMode: 'standard' | 'staged';
  toggleMixingMode: () => void;
  isActiveStage: boolean;
  startStagedMixing: () => void;
  cancelStagedMixing: () => void;
  stagedSettings: StagedMixSettings;
  updateStagedSetting: (setting: keyof StagedMixSettings, value: number | boolean) => void;
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
  
  // New staged mixing props
  mixingMode,
  toggleMixingMode,
  isActiveStage,
  startStagedMixing,
  cancelStagedMixing,
  stagedSettings,
  updateStagedSetting
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

  // Staged mixing completed handler
  const handleStagedMixComplete = (mixedUrl: string) => {
    // Instead of creating an empty WaveSurfer instance, we should simply call the callback
    // to notify that the mixed track is ready. The actual WaveSurfer instance will be
    // created when the WaveformDisplay component renders with the new URL.
    if (mixedUrl) {
      onMixedWavesurferReady(null as any); // Pass null for now, the actual instance will be created by WaveformDisplay
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
  
  // Render the staged mixing interface when active
  if (mixingMode === 'staged' && isActiveStage) {
    return (
      <StagedMixingProcess 
        track1Url={track1Url}
        track2Url={track2Url}
        onComplete={handleStagedMixComplete}
        onCancel={cancelStagedMixing}
        initialSettings={stagedSettings}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      {(track1Url || track2Url) && (
        <div className="flex flex-col space-y-4 mb-2">
          <div className="flex items-center justify-center space-x-4">
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
          
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              onClick={toggleMixingMode}
              className="text-xs"
              size="sm"
            >
              <GitBranch className="mr-2 h-3 w-3" />
              {mixingMode === 'standard' ? 'Switch to Multi-Stage Mixing' : 'Switch to Standard Mixing'}
            </Button>
          </div>
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
            <CardTitle>{mixingMode === 'staged' ? 'Multi-Stage Mix' : 'Create Mix'}</CardTitle>
            <CardDescription>
              {promptAnalysisResult 
                ? "Apply AI-suggested settings and create your mix" 
                : mixingMode === 'staged' 
                  ? "Mix your tracks with step-by-step control over the process"
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
                    : mixingMode === 'staged'
                      ? "Ready to start the multi-stage mixing process with full control at each step."
                      : "Ready to mix your tracks? Our AI will analyze both tracks and create a professional mix."}
                </p>
                <Button 
                  onClick={mixingMode === 'staged' ? startStagedMixing : handleMix} 
                  disabled={!track1Url || !track2Url || !track1Features || !track2Features}
                  className="bg-mixify-purple hover:bg-mixify-purple-dark"
                >
                  <MicIcon className="mr-2 h-5 w-5" />
                  {mixingMode === 'staged' 
                    ? "Start Multi-Stage Mix" 
                    : promptAnalysisResult 
                      ? "Create AI Mix" 
                      : "Mix Tracks"}
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
