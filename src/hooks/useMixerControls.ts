
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
  } = useMixingEngine({
    track1Url,
    track2Url,
    track1Features,
    track2Features
  });
  
  const {
    isProcessingPrompt,
    promptProcessProgress,
    promptAnalysisResult,
    handlePromptMix
  } = usePromptProcessing({
    track1Features,
    track2Features,
    updateMixSettings
  });
  
  // Analyze tracks when they're loaded
  useEffect(() => {
    if (track1Url && !track1Features) {
      analyzeTrack(track1Url, 1);
    }
  }, [track1Url]);
  
  useEffect(() => {
    if (track2Url && !track2Features) {
      analyzeTrack(track2Url, 2);
    }
  }, [track2Url]);

  // Create a wrapper for the handlePromptMix function to connect it with the mix workflow
  const processPromptAndMix = async (prompt: string) => {
    const success = await handlePromptMix(prompt);
    if (success) {
      handleMix();
    }
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
