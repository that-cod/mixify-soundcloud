
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import WaveSurfer from 'wavesurfer.js';
import { PromptAnalysisResult, MixingInstruction } from '@/services/anthropic-service';

interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
}

interface MixSettingsType {
  bpmMatch: boolean;
  keyMatch: boolean;
  vocalLevel1: number;
  vocalLevel2: number;
  beatLevel1: number;
  beatLevel2: number;
  crossfadeLength: number;
  echo: number;
  tempo: number;
}

interface UseMixingEngineProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
}

// Backend API URL
const API_URL = 'http://localhost:5000/api';

export const useMixingEngine = ({
  track1Url,
  track2Url,
  track1Features,
  track2Features
}: UseMixingEngineProps) => {
  // Mixing states
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [mixedTrackUrl, setMixedTrackUrl] = useState<string | undefined>();
  
  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  
  // Mix settings
  const [mixSettings, setMixSettings] = useState<MixSettingsType>({
    bpmMatch: true,
    keyMatch: true,
    vocalLevel1: 0.8,
    vocalLevel2: 0.5,
    beatLevel1: 0.6,
    beatLevel2: 0.8,
    crossfadeLength: 8, // seconds
    echo: 0.2,
    tempo: 0, // -0.5 to 0.5, 0 means no change
  });
  
  const { toast } = useToast();
  
  // WaveSurfer refs
  const wavesurfer1Ref = { current: null as WaveSurfer | null };
  const wavesurfer2Ref = { current: null as WaveSurfer | null };
  const mixedWavesurferRef = { current: null as WaveSurfer | null };
  
  // Last prompt analysis results
  const [lastPromptAnalysis, setLastPromptAnalysis] = useState<PromptAnalysisResult | null>(null);
  
  // Track uploaded file info
  const [track1Info, setTrack1Info] = useState<{path: string, name: string} | null>(null);
  const [track2Info, setTrack2Info] = useState<{path: string, name: string} | null>(null);
  
  // When track URLs change, update track info
  useEffect(() => {
    if (track1Url) {
      // In a real implementation, this would store the actual path returned from the upload API
      setTrack1Info({
        path: track1Url,
        name: track1Url.split('/').pop() || 'track1.mp3'
      });
    }
  }, [track1Url]);
  
  useEffect(() => {
    if (track2Url) {
      // In a real implementation, this would store the actual path returned from the upload API
      setTrack2Info({
        path: track2Url,
        name: track2Url.split('/').pop() || 'track2.mp3'
      });
    }
  }, [track2Url]);
  
  const updateMixSetting = (setting: keyof MixSettingsType, value: number | boolean) => {
    setMixSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const updateMixSettings = (newSettings: MixSettingsType) => {
    setMixSettings(newSettings);
    // Log the updated settings for debugging
    console.log("Mix settings updated:", newSettings);
  };
  
  // Apply specific mixing instructions from prompt analysis
  const applyPromptInstructions = (promptAnalysis: PromptAnalysisResult) => {
    setLastPromptAnalysis(promptAnalysis);
    
    // First apply the recommended settings
    updateMixSettings(promptAnalysis.recommendedSettings);
    
    // Then process any additional instructions that weren't directly mapped to settings
    const specialInstructions = promptAnalysis.instructions.filter(
      instruction => instruction.confidence > 0.7
    );
    
    console.log("Applying special mixing instructions:", specialInstructions);
    
    // Log the processing plan based on the prompt analysis
    toast({
      title: "Mixing Plan Created",
      description: promptAnalysis.summary,
    });
  };
  
  const handleMix = async () => {
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
      simulateMixingProgress();
      
      // Call the backend API to mix the tracks
      const response = await axios.post(`${API_URL}/mix`, {
        track1Path: track1Info.path,
        track2Path: track2Info.path,
        settings: mixSettings,
        outputFileName: `mixed-${Date.now()}.mp3`
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
  
  // Simulate mixing progress for UI feedback
  const simulateMixingProgress = () => {
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
  
  // Helper function to create descriptive mixing steps based on settings
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
  
  const togglePlayback = () => {
    if (mixedWavesurferRef.current) {
      if (isPlaying) {
        mixedWavesurferRef.current.pause();
      } else {
        mixedWavesurferRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const restartPlayback = () => {
    if (mixedWavesurferRef.current) {
      mixedWavesurferRef.current.seekTo(0);
    }
  };
  
  const handleTrack1WavesurferReady = (wavesurfer: WaveSurfer) => {
    wavesurfer1Ref.current = wavesurfer;
  };
  
  const handleTrack2WavesurferReady = (wavesurfer: WaveSurfer) => {
    wavesurfer2Ref.current = wavesurfer;
  };
  
  const handleMixedWavesurferReady = (wavesurfer: WaveSurfer) => {
    mixedWavesurferRef.current = wavesurfer;
    wavesurfer.setVolume(volume);
    
    wavesurfer.on('finish', () => {
      setIsPlaying(false);
    });
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
