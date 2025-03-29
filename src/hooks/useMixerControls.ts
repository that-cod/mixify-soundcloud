
import { useEffect, useState } from 'react';
import { useAudioAnalysis } from './useAudioAnalysis';
import { usePromptProcessing } from './usePromptProcessing';
import { useMixingEngine } from './useMixingEngine';
import { getInstructionInsights } from '@/utils/ai-prompt-analysis';
import { useStagedMixing } from './useStagedMixing';

interface UseMixerControlsProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
}

export const useMixerControls = ({ track1Url, track2Url }: UseMixerControlsProps) => {
  // Mixing mode state
  const [mixingMode, setMixingMode] = useState<'standard' | 'staged'>('standard');
  
  // Use the refactored hooks
  const {
    track1Features,
    track2Features,
    track1Separated,
    track2Separated,
    isAnalyzing,
    analyzeProgress,
    analyzeTrack
  } = useAudioAnalysis();
  
  // Track info derivation
  const track1Info = track1Url ? { 
    path: track1Url.replace('/api/tracks/', ''),
    name: track1Url.split('/').pop() || 'Track 1'
  } : null;
  
  const track2Info = track2Url ? {
    path: track2Url.replace('/api/tracks/', ''),
    name: track2Url.split('/').pop() || 'Track 2'
  } : null;
  
  // Initialize mixing engine first so we can pass its methods to the prompt processor
  const {
    isMixing,
    mixProgress,
    mixedTrackUrl,
    isPlaying,
    volume,
    setVolume,
    mixSettings,
    updateMixSetting,
    updateMixSettings,
    handleMix,
    togglePlayback,
    restartPlayback,
    handleTrack1WavesurferReady,
    handleTrack2WavesurferReady,
    handleMixedWavesurferReady,
    applyPromptInstructions
  } = useMixingEngine({
    track1Url,
    track2Url,
    track1Features,
    track2Features
  });
  
  // Initialize staged mixing hook
  const {
    isActiveStage,
    currentStage,
    stageStatus,
    stageProgress,
    overallProgress,
    mixedTrackUrl: stagedMixedTrackUrl,
    stagePreviewUrl,
    stagedSettings,
    startStagedMixing,
    cancelStagedMixing,
    updateStagedSetting,
    completeStage,
    completeMixing,
    convertToMixSettings
  } = useStagedMixing({
    track1Url,
    track2Url,
    track1Features,
    track2Features,
    track1Info,
    track2Info
  });
  
  // Now initialize prompt processing with the applyPromptInstructions function
  const {
    isProcessingPrompt,
    promptProcessProgress,
    promptAnalysisResult,
    handlePromptMix,
  } = usePromptProcessing({
    track1Features,
    track2Features,
    updateMixSettings,
    applyPromptInstructions
  });
  
  // Analyze tracks when they're loaded
  useEffect(() => {
    if (track1Url && !track1Features) {
      analyzeTrack(track1Url, 1);
    }
  }, [track1Url, track1Features]);
  
  useEffect(() => {
    if (track2Url && !track2Features) {
      analyzeTrack(track2Url, 2);
    }
  }, [track2Url, track2Features]);
  
  // Update effective mixed track URL based on mode
  const effectiveMixedTrackUrl = mixingMode === 'staged' ? stagedMixedTrackUrl : mixedTrackUrl;

  // Create a wrapper for the handlePromptMix function to connect it with the mix workflow
  const processPromptAndMix = async (prompt: string) => {
    const success = await handlePromptMix(prompt);
    if (success) {
      // We don't automatically mix here anymore, let the user decide when to mix
      // This allows them to review and adjust the AI-suggested settings if needed
      return true;
    }
    return false;
  };
  
  // Toggle between standard and staged mixing modes
  const toggleMixingMode = () => {
    setMixingMode(prev => prev === 'standard' ? 'staged' : 'standard');
  };

  return {
    // State
    isMixing,
    mixProgress,
    mixedTrackUrl: effectiveMixedTrackUrl,
    isPlaying,
    volume,
    setVolume,
    
    // Audio analysis
    track1Features,
    track2Features,
    isAnalyzing,
    analyzeProgress,
    
    // Prompt processing
    isProcessingPrompt,
    promptProcessProgress,
    promptAnalysisResult,
    getInstructionInsights: () => getInstructionInsights(promptAnalysisResult),
    
    // Mix settings
    mixSettings,
    updateMixSetting,
    
    // Staged mixing states and methods
    mixingMode,
    toggleMixingMode,
    isActiveStage,
    currentStage,
    stageStatus,
    stageProgress,
    overallProgress,
    stagePreviewUrl,
    stagedSettings,
    startStagedMixing,
    cancelStagedMixing,
    updateStagedSetting,
    
    // Methods
    handleMix,
    handlePromptMix: processPromptAndMix,
    togglePlayback,
    restartPlayback,
    handleTrack1WavesurferReady,
    handleTrack2WavesurferReady,
    handleMixedWavesurferReady,
  };
};
