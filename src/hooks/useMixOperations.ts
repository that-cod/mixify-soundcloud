import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { MixSettingsType } from '@/types/mixer';
import { AudioFeatures, PrecomputedOperations } from '@/types/audio';
import { PromptAnalysisResult } from '@/services/anthropic-service';
import { API } from '@/config';
import { cachePrecomputedOps, getPrecomputedOps } from '@/services/analysis-cache';

// Types for track info
interface TrackInfo {
  path: string;
  name: string;
}

interface UseMixOperationsProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  track1Info: TrackInfo | null;
  track2Info: TrackInfo | null;
}

export const useMixOperations = ({ 
  track1Url, 
  track2Url, 
  track1Features, 
  track2Features,
  track1Info,
  track2Info
}: UseMixOperationsProps) => {
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [mixedTrackUrl, setMixedTrackUrl] = useState<string | undefined>();
  const { toast } = useToast();
  
  // Check for precomputed operations
  const getMixPrecomputedOps = (trackId: string): PrecomputedOperations | null => {
    // Get precomputed operations if available
    return getPrecomputedOps(trackId);
  };
  
  // Mix the tracks
  const handleMix = async (
    mixSettings: MixSettingsType, 
    promptAnalysis?: PromptAnalysisResult
  ) => {
    if (!track1Url || !track2Url) {
      toast({
        title: "Missing tracks",
        description: "Please upload both tracks before mixing.",
        variant: "destructive",
      });
      return false;
    }
    
    // Check if both tracks have been analyzed
    if (!track1Features || !track2Features) {
      toast({
        title: "Tracks not analyzed",
        description: "Please wait for track analysis to complete.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      setIsMixing(true);
      setMixProgress(0);
      
      // Check if we have precomputed operations for the first track
      const track1Id = track1Url.split('/').pop() || '';
      const precomputedOps = getMixPrecomputedOps(track1Id);
      
      // If we have precomputed operations and requested bpm is in cache, use it
      if (
        precomputedOps && 
        mixSettings.bpmMatch && 
        track2Features && 
        track2Features.bpm
      ) {
        const targetBpm = Math.round(track2Features.bpm).toString();
        if (precomputedOps.bpmVariants[targetBpm]) {
          console.log(`Using precomputed BPM variant: ${targetBpm}`);
          // Use precomputed variant
          // You would normally set this in the request to the mixing API
        }
      }
      
      // Create mix request payload
      const payload = {
        track1: track1Info?.path || track1Url.replace(API.endpoints.tracks, ''),
        track2: track2Info?.path || track2Url.replace(API.endpoints.tracks, ''),
        settings: mixSettings,
        bpm1: track1Features.bpm,
        bpm2: track2Features.bpm,
        key1: track1Features.key,
        key2: track2Features.key,
        // If we have a prompt analysis, include it
        promptAnalysis: promptAnalysis ? {
          instructions: promptAnalysis.instructions,
          summary: promptAnalysis.summary,
          recommendedSettings: promptAnalysis.recommendedSettings
        } : undefined,
        // Flag to indicate if we should use precomputed operations
        usePrecomputed: !!precomputedOps
      };
      
      // Start the mix
      const response = await axios.post(API.endpoints.mix, payload, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 10) / progressEvent.total) + 10;
            setMixProgress(Math.min(percentCompleted, 95));
          }
        }
      });
      
      // Handle successful response
      setMixProgress(100);
      setMixedTrackUrl(response.data.mixedTrackUrl);
      
      toast({
        title: "Mix Complete",
        description: "Your tracks have been mixed successfully!",
      });
      
      // Store precomputed operations if provided in response
      if (response.data.precomputedOperations) {
        cachePrecomputedOps(track1Id, response.data.precomputedOperations);
      }
      
      return true;
    } catch (error: any) {
      console.error('Mix error:', error);
      
      // Show error toast
      toast({
        title: "Mix Failed",
        description: error.response?.data?.error || "An error occurred while mixing. Please try again.",
        variant: "destructive",
      });
      
      setMixProgress(0);
      return false;
    } finally {
      setIsMixing(false);
    }
  };
  
  return {
    isMixing,
    mixProgress,
    mixedTrackUrl,
    handleMix
  };
};
