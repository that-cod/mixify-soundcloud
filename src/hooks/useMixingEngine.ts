
import { useToast } from '@/hooks/use-toast';
import { PromptAnalysisResult } from '@/services/anthropic-service';
import { useTrackInfo } from './useTrackInfo';
import { useMixSettings } from './useMixSettings';
import { usePlaybackControls } from './usePlaybackControls';
import { useMixOperations } from './useMixOperations';
import { AudioFeatures } from '@/types/audio';

interface UseMixingEngineProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
}

export const useMixingEngine = ({
  track1Url,
  track2Url,
  track1Features,
  track2Features
}: UseMixingEngineProps) => {
  const { toast } = useToast();
  
  // Use our new modular hooks
  const { track1Info, track2Info } = useTrackInfo(track1Url, track2Url);
  
  const { 
    mixSettings, 
    updateMixSetting, 
    updateMixSettings, 
    applyPromptInstructions,
    lastPromptAnalysis
  } = useMixSettings();
  
  const {
    isPlaying,
    volume,
    setVolume,
    togglePlayback,
    restartPlayback,
    handleTrack1WavesurferReady,
    handleTrack2WavesurferReady,
    handleMixedWavesurferReady
  } = usePlaybackControls();
  
  const {
    isMixing,
    mixProgress,
    mixedTrackUrl,
    handleMix: performMix
  } = useMixOperations({
    track1Url,
    track2Url,
    track1Features,
    track2Features,
    track1Info,
    track2Info
  });
  
  // Wrapper for handleMix to use current mixSettings
  const handleMix = async () => {
    return await performMix(mixSettings, lastPromptAnalysis);
  };

  return {
    // State
    isMixing,
    mixProgress,
    mixedTrackUrl,
    isPlaying,
    volume,
    setVolume,
    
    // Mix settings
    mixSettings,
    updateMixSetting,
    updateMixSettings,
    
    // Methods
    handleMix,
    togglePlayback,
    restartPlayback,
    handleTrack1WavesurferReady,
    handleTrack2WavesurferReady,
    handleMixedWavesurferReady,
    
    // Prompt-related methods
    applyPromptInstructions,
  };
};
