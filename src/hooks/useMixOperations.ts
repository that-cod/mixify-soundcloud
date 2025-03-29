
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { MixSettingsType } from '@/types/mixer';
import { AudioFeatures } from '@/types/audio';

// Backend API URL
const API_URL = 'http://localhost:5000/api';

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
  
  const { toast } = useToast();
  
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

  return {
    isMixing,
    mixProgress,
    mixedTrackUrl,
    handleMix
  };
};
