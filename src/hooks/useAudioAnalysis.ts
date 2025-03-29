
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyzeAudio, separateTracks } from '@/utils/audioAnalysis';

interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
}

interface SeparatedTracks {
  vocals: string;
  instrumental: string;
  drums: string;
  bass: string;
}

export const useAudioAnalysis = () => {
  // Audio analysis states
  const [track1Features, setTrack1Features] = useState<AudioFeatures | null>(null);
  const [track2Features, setTrack2Features] = useState<AudioFeatures | null>(null);
  const [track1Separated, setTrack1Separated] = useState<SeparatedTracks | null>(null);
  const [track2Separated, setTrack2Separated] = useState<SeparatedTracks | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  
  const { toast } = useToast();
  
  const analyzeTrack = async (trackUrl: string, trackNumber: 1 | 2) => {
    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    
    try {
      toast({
        title: `Analyzing Track ${trackNumber}`,
        description: "Extracting BPM, key and audio features...",
      });
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalyzeProgress(prev => {
          const newProgress = prev + 5;
          return newProgress < 90 ? newProgress : prev;
        });
      }, 300);
      
      // Analyze the audio
      const features = await analyzeAudio(trackUrl);
      
      // Update the analyze progress
      setAnalyzeProgress(90);
      
      // Update the state based on track number
      if (trackNumber === 1) {
        setTrack1Features(features);
      } else {
        setTrack2Features(features);
      }
      
      toast({
        title: `Track ${trackNumber} Analysis Complete`,
        description: `BPM: ${features.bpm}, Key: ${features.key}`,
      });
      
      // Start track separation
      toast({
        title: `Separating Track ${trackNumber}`,
        description: "Extracting vocals, beats, and instruments...",
      });
      
      const separated = await separateTracks(trackUrl);
      
      // Update the state based on track number
      if (trackNumber === 1) {
        setTrack1Separated(separated);
      } else {
        setTrack2Separated(separated);
      }
      
      // Completed
      setAnalyzeProgress(100);
      clearInterval(progressInterval);
      
      toast({
        title: `Track ${trackNumber} Separation Complete`,
        description: "Ready for mixing!",
      });
    } catch (error) {
      console.error(`Error analyzing track ${trackNumber}:`, error);
      toast({
        title: "Analysis Failed",
        description: `Could not analyze track ${trackNumber}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    track1Features,
    track2Features,
    track1Separated,
    track2Separated,
    isAnalyzing,
    analyzeProgress,
    analyzeTrack
  };
};
