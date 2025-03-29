import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { MixSettingsType } from '@/types/mixer';
import { AudioFeatures, PrecomputedOperations } from '@/types/audio';
import { API } from '@/config';
import { getPrecomputedOps, cachePrecomputedOps } from '@/services/analysis-cache';
import { isAudioProcessorReady } from '@/services/wasm-audio-processor';

interface UseMixOperationsProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  track1Info: {path: string, name: string} | null;
  track2Info: {path: string, name: string} | null;
}

export const useMixOperations = ({
  track1Url,
  track2Url,
  track1Features,
  track2Features,
  track1Info,
  track2Info
}: UseMixOperationsProps) => {
  // Mixing states
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [mixedTrackUrl, setMixedTrackUrl] = useState<string | undefined>();
  const [precomputedOps, setPrecomputedOps] = useState<{
    track1: PrecomputedOperations | null;
    track2: PrecomputedOperations | null;
  }>({ track1: null, track2: null });
  
  const { toast } = useToast();
  
  // Load precomputed operations when tracks change
  useEffect(() => {
    if (track1Url && track1Info) {
      const trackId = track1Info.path;
      const cached = getPrecomputedOps(trackId);
      
      if (cached) {
        setPrecomputedOps(prev => ({ ...prev, track1: cached }));
        console.log('Using cached precomputed operations for track 1');
      } else {
        // Reset precomputed ops for track 1
        setPrecomputedOps(prev => ({ ...prev, track1: null }));
      }
    }
  }, [track1Url, track1Info]);
  
  useEffect(() => {
    if (track2Url && track2Info) {
      const trackId = track2Info.path;
      const cached = getPrecomputedOps(trackId);
      
      if (cached) {
        setPrecomputedOps(prev => ({ ...prev, track2: cached }));
        console.log('Using cached precomputed operations for track 2');
      } else {
        // Reset precomputed ops for track 2
        setPrecomputedOps(prev => ({ ...prev, track2: null }));
      }
    }
  }, [track2Url, track2Info]);
  
  // Create mixing steps based on settings
  const createMixingSteps = (
    settings: MixSettingsType, 
    track1: AudioFeatures | null, 
    track2: AudioFeatures | null
  ): string[] => {
    const steps = ["Preparing tracks..."];
    
    if (settings.bpmMatch && track1 && track2 && track1.bpm !== track2.bpm) {
      steps.push(`Matching tempos (${track1.bpm} → ${track2.bpm} BPM)...`);
    }
    
    if (settings.keyMatch && track1 && track2 && track1.key !== track2.key) {
      steps.push(`Harmonizing keys (${track1.key} & ${track2.key})...`);
    }
    
    // Add steps based on vocal levels
    if (settings.vocalLevel1 > 0.7 && settings.vocalLevel2 < 0.5) {
      steps.push("Emphasizing vocals from track 1...");
    } else if (settings.vocalLevel2 > 0.7 && settings.vocalLevel1 < 0.5) {
      steps.push("Emphasizing vocals from track 2...");
    } else if (settings.vocalLevel1 > 0.6 && settings.vocalLevel2 > 0.6) {
      steps.push("Balancing vocals from both tracks...");
    }
    
    // Add steps based on beat levels
    if (settings.beatLevel1 > 0.7 && settings.beatLevel2 < 0.5) {
      steps.push("Emphasizing beats from track 1...");
    } else if (settings.beatLevel2 > 0.7 && settings.beatLevel1 < 0.5) {
      steps.push("Emphasizing beats from track 2...");
    } else if (settings.beatLevel1 > 0.6 && settings.beatLevel2 > 0.6) {
      steps.push("Balancing beats from both tracks...");
    }
    
    // Add steps for effects
    if (settings.echo > 0.5) {
      steps.push("Applying echo effect...");
    }
    
    if (settings.tempo !== 0) {
      const direction = settings.tempo > 0 ? "Increasing" : "Decreasing";
      steps.push(`${direction} overall tempo by ${Math.abs(settings.tempo * 100)}%...`);
    }
    
    if (settings.crossfadeLength > 10) {
      steps.push(`Creating long crossfade (${settings.crossfadeLength}s)...`);
    } else if (settings.crossfadeLength > 5) {
      steps.push(`Creating medium crossfade (${settings.crossfadeLength}s)...`);
    } else {
      steps.push(`Creating short crossfade (${settings.crossfadeLength}s)...`);
    }
    
    steps.push("Finalizing mix...");
    
    return steps;
  };
  
  // Simulate mixing progress for UI feedback
  const simulateMixingProgress = (mixSettings: MixSettingsType) => {
    const steps = createMixingSteps(mixSettings, track1Features, track2Features);
    let progress = 0;
    let currentStep = 0;
    
    const interval = setInterval(() => {
      progress += 5;
      setMixProgress(progress);
      
      // Update toast with current step
      if (progress % 15 === 0 && currentStep < steps.length) {
        toast({
          title: "Mixing in progress",
          description: steps[currentStep],
        });
        currentStep++;
      }
      
      if (progress >= 95) {
        clearInterval(interval);
      }
    }, 500);
  };
  
  // Fallback to frontend simulation if backend is not available
  const fallbackMixing = () => {
    console.log("Using fallback mixing method");
    
    // For demo purposes, we'll set the mixed track URL to one of the original tracks
    // In a real app, this would be a new audio file generated by the backend
    setTimeout(() => {
      setMixedTrackUrl(track1Url);
      setIsMixing(false);
      setMixProgress(100);
      
      toast({
        title: "Mix complete (Simulation)",
        description: "Your tracks have been combined with simulated mixing.",
      });
    }, 3000);
  };
  
  // Pre-compute operations for a track
  const precomputeOperations = async (
    trackUrl: string, 
    trackInfo: {path: string, name: string},
    features: AudioFeatures
  ) => {
    if (!trackUrl || !trackInfo || !features) return;
    
    try {
      toast({
        title: "Pre-computing operations",
        description: `Preparing optimizations for ${trackInfo.name}`,
      });
      
      // Call the backend to pre-compute operations
      const response = await axios.post(API.endpoints.precompute, {
        filePath: trackInfo.path,
        features,
        useWasm: isAudioProcessorReady()
      });
      
      const precomputed: PrecomputedOperations = response.data.precomputed;
      
      // Cache the precomputed operations
      cachePrecomputedOps(trackInfo.path, precomputed);
      
      return precomputed;
    } catch (error) {
      console.error("Error pre-computing operations:", error);
      
      // Create basic precomputed operations object as fallback
      const fallbackOps: PrecomputedOperations = {
        trackId: trackInfo.path,
        bpmVariants: {},
        keyVariants: {},
        stemCache: {
          vocals: `${trackUrl.split('.')[0]}_vocals.mp3`,
          instrumental: `${trackUrl.split('.')[0]}_instrumental.mp3`,
          drums: `${trackUrl.split('.')[0]}_drums.mp3`,
          bass: `${trackUrl.split('.')[0]}_bass.mp3`
        },
        effectVariants: {},
        cacheTimestamp: Date.now()
      };
      
      return fallbackOps;
    }
  };
  
  const handleMix = async (mixSettings: MixSettingsType, lastPromptAnalysis = null) => {
    if (!track1Url || !track2Url) {
      toast({
        title: "Missing tracks",
        description: "Please upload both tracks before mixing.",
        variant: "destructive",
      });
      return;
    }
    
    if (!track1Features || !track2Features) {
      toast({
        title: "Incomplete analysis",
        description: "Please wait for track analysis to complete.",
        variant: "destructive",
      });
      return;
    }
    
    if (!track1Info || !track2Info) {
      toast({
        title: "Track information missing",
        description: "Track information is not available. Please reload and try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsMixing(true);
    setMixProgress(0);
    
    // Pre-compute operations if not already cached
    if (!precomputedOps.track1 && track1Info) {
      const track1Ops = await precomputeOperations(track1Url, track1Info, track1Features);
      if (track1Ops) {
        setPrecomputedOps(prev => ({ ...prev, track1: track1Ops }));
      }
    }
    
    if (!precomputedOps.track2 && track2Info) {
      const track2Ops = await precomputeOperations(track2Url, track2Info, track2Features);
      if (track2Ops) {
        setPrecomputedOps(prev => ({ ...prev, track2: track2Ops }));
      }
    }
    
    // Check if we have prompt analysis to use
    if (lastPromptAnalysis) {
      console.log("Using prompt analysis for mixing:", lastPromptAnalysis.summary);
      toast({
        title: "AI-Guided Mix",
        description: `Creating mix based on your instructions: ${lastPromptAnalysis.summary.substring(0, 100)}${lastPromptAnalysis.summary.length > 100 ? '...' : ''}`,
      });
    }
    
    try {
      // Simulate mixing process steps for UI feedback
      simulateMixingProgress(mixSettings);
      
      // Call the backend API to mix the tracks
      const response = await axios.post(API.endpoints.mix, {
        track1Path: track1Info.path,
        track2Path: track2Info.path,
        settings: mixSettings,
        outputFileName: `mixed-${Date.now()}.mp3`,
        precomputed: {
          track1: precomputedOps.track1 ? precomputedOps.track1.trackId : null,
          track2: precomputedOps.track2 ? precomputedOps.track2.trackId : null
        },
        useWasm: isAudioProcessorReady()
      });
      
      // Get the mixed track URL from the response
      const mixedUrl = response.data.mixedTrackPath;
      
      // Set the mixed track URL
      setMixedTrackUrl(mixedUrl);
      
      setIsMixing(false);
      setMixProgress(100);
      
      toast({
        title: "Mix complete",
        description: lastPromptAnalysis 
          ? "Your AI-guided mix is ready!" 
          : "Your tracks have been successfully mixed!",
      });
      
    } catch (error) {
      console.error("Mixing error:", error);
      
      // Fallback to frontend simulation if backend fails
      fallbackMixing();
      
      toast({
        title: "Backend Mixing Failed",
        description: "Using fallback mixing mode. Limited features available.",
        variant: "warning",
      });
    }
  };

  return {
    isMixing,
    mixProgress,
    mixedTrackUrl,
    handleMix,
    hasPrecomputedOps: !!(precomputedOps.track1 || precomputedOps.track2)
  };
};
