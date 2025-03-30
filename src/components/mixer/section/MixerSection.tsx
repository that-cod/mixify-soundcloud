
import React, { useState } from 'react';
import { MixedTrackView } from './MixedTrackView';
import { StagedMixingProcess } from '../StagedMixingProcess';
import { MixerControls } from './MixerControls';
import { AudioFeatures } from '@/types/audio';
import { StagedMixSettings } from '../staged/types';
import { PromptAnalysisResult } from '@/services/openai-service';
import WaveSurfer from 'wavesurfer.js';

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
  
  // Staged mixing props
  mixingMode,
  toggleMixingMode,
  isActiveStage,
  startStagedMixing,
  cancelStagedMixing,
  stagedSettings,
  updateStagedSetting
}) => {
  const [mixMode, setMixMode] = useState<'manual' | 'prompt'>('manual');

  // If we return to the mixer screen from the completed mix, reset the mix mode
  const handleCreateNewMix = () => {
    setMixMode('manual');
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

  // Show the mixed track if available
  if (mixedTrackUrl) {
    return (
      <MixedTrackView
        mixedTrackUrl={mixedTrackUrl}
        isPlaying={isPlaying}
        volume={volume}
        setVolume={setVolume}
        togglePlayback={togglePlayback}
        restartPlayback={restartPlayback}
        onMixedWavesurferReady={onMixedWavesurferReady}
        onCreateNewMix={handleCreateNewMix}
      />
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
  
  // Default view - mixing controls
  return (
    <MixerControls
      track1Url={track1Url}
      track2Url={track2Url}
      track1Name={track1Name}
      track2Name={track2Name}
      track1Features={track1Features}
      track2Features={track2Features}
      mixSettings={mixSettings}
      updateMixSetting={updateMixSetting}
      isMixing={isMixing}
      mixProgress={mixProgress}
      handleMix={handleMix}
      isProcessingPrompt={isProcessingPrompt}
      promptProcessProgress={promptProcessProgress}
      promptAnalysisResult={promptAnalysisResult || null}
      handlePromptMix={handlePromptMix}
      mixingMode={mixingMode}
      toggleMixingMode={toggleMixingMode}
      isActiveStage={isActiveStage}
      startStagedMixing={startStagedMixing}
      stagedSettings={stagedSettings}
      updateStagedSetting={updateStagedSetting}
    />
  );
};
