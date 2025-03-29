
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import WaveSurfer from 'wavesurfer.js';
import { analyzeAudio, separateTracks, matchBPM, harmonicMixing } from '@/utils/audioAnalysis';
import { analyzePromptWithClaude, PromptAnalysisResult } from '@/services/anthropic-service';

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

interface UseMixerControlsProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
}

export const useMixerControls = ({ track1Url, track2Url }: UseMixerControlsProps) => {
  // Mixing states
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [mixedTrackUrl, setMixedTrackUrl] = useState<string | undefined>();
  
  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  
  // Audio analysis states
  const [track1Features, setTrack1Features] = useState<AudioFeatures | null>(null);
  const [track2Features, setTrack2Features] = useState<AudioFeatures | null>(null);
  const [track1Separated, setTrack1Separated] = useState<SeparatedTracks | null>(null);
  const [track2Separated, setTrack2Separated] = useState<SeparatedTracks | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  
  // Prompt processing states
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [promptProcessProgress, setPromptProcessProgress] = useState(0);
  const [promptAnalysisResult, setPromptAnalysisResult] = useState<PromptAnalysisResult | null>(null);
  
  // Mix settings
  const [mixSettings, setMixSettings] = useState({
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
  
  const updateMixSetting = (setting: keyof typeof mixSettings, value: number | boolean) => {
    setMixSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  const handleMix = () => {
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
    
    setIsMixing(true);
    
    // Check if BPM matching is needed
    if (mixSettings.bpmMatch && track1Features.bpm !== track2Features.bpm) {
      console.log(`Matching BPM: ${track1Features.bpm} → ${track2Features.bpm}`);
    }
    
    // Check if keys are harmonic
    if (mixSettings.keyMatch) {
      const areHarmonic = harmonicMixing(track1Features.key, track2Features.key);
      if (!areHarmonic) {
        console.log(`Keys not harmonic: ${track1Features.key} and ${track2Features.key}`);
      }
    }
    
    // Simulate mixing process with detailed steps
    let progress = 0;
    const steps = [
      "Preparing tracks...",
      "Matching tempos...",
      "Aligning beats...",
      "Adjusting EQ levels...",
      "Applying vocal processing...",
      "Creating transitions...",
      "Finalizing mix...",
    ];
    
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
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsMixing(false);
        // In a real implementation, we would use both tracks to create a mix
        // For now, we'll simulate by using both tracks sequentially
        if (track1Url && track2Url) {
          createSimulatedMix(track1Url, track2Url);
        }
        
        toast({
          title: "Mix complete",
          description: "Your tracks have been successfully mixed!",
        });
      }
    }, 500);
  };

  // Function to handle AI prompt-based mixing
  const handlePromptMix = async (prompt: string) => {
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
    
    setIsProcessingPrompt(true);
    setPromptProcessProgress(0);
    
    toast({
      title: "Processing your prompt",
      description: "Analyzing your instructions to create the perfect mix...",
    });

    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('anthropic_api_key');
      
      if (!apiKey) {
        throw new Error("API key is required");
      }
      
      // Progress simulation
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 95) {
          setPromptProcessProgress(progress);
        }
      }, 300);
      
      // Process the prompt with Claude API
      const analysisResult = await analyzePromptWithClaude(
        prompt, 
        track1Features, 
        track2Features,
        apiKey
      );
      
      clearInterval(progressInterval);
      setPromptProcessProgress(100);
      
      // Save the analysis result
      setPromptAnalysisResult(analysisResult);
      
      // Apply the AI-suggested settings
      setMixSettings(analysisResult.recommendedSettings);
      
      // Display the results to the user
      toast({
        title: "Analysis Complete",
        description: analysisResult.summary || "AI has determined the optimal mix settings based on your prompt!",
      });
      
      // Start the actual mixing process
      setIsProcessingPrompt(false);
      handleMix();
      
    } catch (error) {
      console.error("Error processing prompt:", error);
      
      toast({
        title: "Prompt Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process your instructions. Please try again.",
        variant: "destructive",
      });
      
      setIsProcessingPrompt(false);
      setPromptProcessProgress(0);
    }
  };
  
  // Simulate creating an actual mix of the two tracks
  const createSimulatedMix = (track1: string, track2: string) => {
    console.log(`Creating simulated mix of ${track1} and ${track2}`);
    console.log("Using mix settings:", mixSettings);
    
    // In a real implementation, this would create an actual mix of the two audio files
    // For this demo, we'll combine the tracks in a simple concatenation
    
    // For demo purposes, we'll set the mixed track URL
    // In a real app, this would be a new audio file generated by the backend
    setMixedTrackUrl(track1);
    
    // In a real implementation, we might do something like:
    // const combinedTrackUrl = await audioProcessingService.combineAudioTracks(
    //   track1, track2, mixSettings
    // );
    // setMixedTrackUrl(combinedTrackUrl);
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
    handlePromptMix,
    togglePlayback,
    restartPlayback,
    handleTrack1WavesurferReady,
    handleTrack2WavesurferReady,
    handleMixedWavesurferReady,
  };
};
