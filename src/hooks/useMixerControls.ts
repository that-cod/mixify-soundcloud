
import { useEffect } from 'react';
import { useAudioAnalysis } from './useAudioAnalysis';
import { usePromptProcessing } from './usePromptProcessing';
import { useMixingEngine } from './useMixingEngine';

interface UseMixerControlsProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
}

export const useMixerControls = ({ track1Url, track2Url }: UseMixerControlsProps) => {
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
  
  // Now initialize prompt processing with the applyPromptInstructions function
  const {
    isProcessingPrompt,
    promptProcessProgress,
    promptAnalysisResult,
    handlePromptMix,
    getInstructionInsights
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

  return {
    // State
    isMixing,
    mixProgress,
    mixedTrackUrl,
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
    getInstructionInsights,
    
    // Mix settings
    mixSettings,
    updateMixSetting,
    
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
