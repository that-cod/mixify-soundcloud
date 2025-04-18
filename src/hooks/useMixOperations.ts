
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { MixSettingsType } from '@/types/mixer';
import { AudioFeatures, PrecomputedOperations } from '@/types/audio';
import { PromptAnalysisResult } from '@/services/openai-service';
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
  const [lastMixError, setLastMixError] = useState<string | null>(null);
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
    
    // Reset error state
    setLastMixError(null);
    
    try {
      setIsMixing(true);
      setMixProgress(0);
      
      // Check if we have precomputed operations for the first track
      const track1Id = track1Url.split('/').pop() || '';
      const precomputedOps = getMixPrecomputedOps(track1Id);
      
      // Extract track paths from URLs
      const track1Path = track1Info?.path || track1Url.replace(API.endpoints.tracks, '');
      const track2Path = track2Info?.path || track2Url.replace(API.endpoints.tracks, '');
      
      // Log the exact paths for debugging
      console.log("Track 1 info:", track1Info);
      console.log("Track 2 info:", track2Info);
      console.log("Extracted track1Path:", track1Path);
      console.log("Extracted track2Path:", track2Path);
      
      // Ensure the track paths look valid and remove leading slashes if present
      const cleanTrack1Path = track1Path.startsWith('/') ? track1Path.substring(1) : track1Path;
      const cleanTrack2Path = track2Path.startsWith('/') ? track2Path.substring(1) : track2Path;
      
      if (!cleanTrack1Path || !cleanTrack2Path) {
        throw new Error("Invalid track paths: Could not extract valid paths from URLs");
      }
      
      // Make sure we have the correct API endpoint
      const mixEndpoint = API.endpoints.mix;
      if (!mixEndpoint) {
        throw new Error("Mix endpoint not configured");
      }
      
      // Create mix request payload
      const payload = {
        track1: cleanTrack1Path,
        track2: cleanTrack2Path,
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
        usePrecomputed: !!precomputedOps,
        // Explicitly add an output file name
        outputFileName: `mixed-track-${Date.now()}.mp3`
      };
      
      console.log("Starting mix with payload:", JSON.stringify(payload, null, 2));
      console.log("Using mix endpoint:", mixEndpoint);
      
      // Add progress simulation for better UX
      const progressInterval = setInterval(() => {
        setMixProgress(prev => {
          const newProgress = prev + 2;
          return newProgress < 90 ? newProgress : prev;
        });
      }, 500);
      
      // Start the mix with improved request configuration
      try {
        const response = await axios.post(mixEndpoint, payload, {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 10) / progressEvent.total) + 10;
              setMixProgress(Math.min(percentCompleted, 95));
            }
          },
          timeout: 180000, // Increase timeout to 3 minutes for large files
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Clear progress simulation
        clearInterval(progressInterval);
        
        // Handle successful response
        setMixProgress(100);
        
        console.log("Mix response:", response.data);
        
        if (response.data.mixedTrackPath) {
          const fullUrl = response.data.mixedTrackPath;
          console.log("Mix successful, track URL:", fullUrl);
          setMixedTrackUrl(fullUrl);
          
          toast({
            title: "Mix Complete",
            description: "Your tracks have been mixed successfully!",
          });
        } else {
          throw new Error("Missing mixed track URL in response");
        }
        
        // Store precomputed operations if provided in response
        if (response.data.precomputedOperations) {
          cachePrecomputedOps(track1Id, response.data.precomputedOperations);
        }
        
        return true;
      } catch (axiosError: any) {
        clearInterval(progressInterval);
        
        // Log detailed axios error information
        console.error("Axios error during mix request:", axiosError);
        if (axiosError.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Response data:", axiosError.response.data);
          console.error("Response status:", axiosError.response.status);
          console.error("Response headers:", axiosError.response.headers);
        } else if (axiosError.request) {
          // The request was made but no response was received
          console.error("No response received:", axiosError.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Error during request setup:", axiosError.message);
        }
        
        throw axiosError;
      }
    } catch (error: any) {
      console.error('Mix error:', error);
      
      // Extract the most useful error message
      let errorMessage = "An error occurred while mixing. Please try again.";
      
      if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
        console.error('Server error details:', error.response.data.details);
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Save the error message
      setLastMixError(errorMessage);
      
      // Show error toast
      toast({
        title: "Mix Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setMixProgress(0);
      setIsMixing(false);
      return false;
    } finally {
      setIsMixing(false);
    }
  };
  
  return {
    isMixing,
    mixProgress,
    mixedTrackUrl,
    lastMixError,
    handleMix
  };
};
