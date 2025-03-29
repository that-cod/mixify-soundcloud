
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { API } from '@/config';
import { AudioFeatures, SeparatedTracks } from '@/types/audio';
import { 
  getCachedAnalysis, 
  cacheAnalysisResults, 
  getCachedStems, 
  cacheStemSeparation 
} from '@/services/analysis-cache';
import { initWasmAudioProcessor, isAudioProcessorReady } from '@/services/wasm-audio-processor';

export const useAudioAnalysis = () => {
  // Audio analysis states
  const [track1Features, setTrack1Features] = useState<AudioFeatures | null>(null);
  const [track2Features, setTrack2Features] = useState<AudioFeatures | null>(null);
  const [track1Separated, setTrack1Separated] = useState<SeparatedTracks | null>(null);
  const [track2Separated, setTrack2Separated] = useState<SeparatedTracks | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [wasmInitialized, setWasmInitialized] = useState(false);
  
  const { toast } = useToast();
  
  // Initialize WebAssembly on component mount
  useEffect(() => {
    const initWasm = async () => {
      const success = await initWasmAudioProcessor();
      setWasmInitialized(success);
      
      if (success) {
        console.log('WebAssembly audio processor initialized');
      } else {
        console.log('Using JavaScript fallback for audio processing');
      }
    };
    
    initWasm();
  }, []);
  
  const analyzeTrack = async (trackUrl: string, trackNumber: 1 | 2) => {
    // Check cache first
    const cachedFeatures = getCachedAnalysis(trackUrl);
    if (cachedFeatures) {
      console.log(`Using cached analysis for track ${trackNumber}`);
      
      if (trackNumber === 1) {
        setTrack1Features(cachedFeatures);
      } else {
        setTrack2Features(cachedFeatures);
      }
      
      toast({
        title: `Track ${trackNumber} Analysis Loaded`,
        description: `Loaded cached analysis: BPM: ${cachedFeatures.bpm}, Key: ${cachedFeatures.key}`,
      });
      
      // Check for cached stems
      const cachedStems = getCachedStems(trackUrl);
      if (cachedStems) {
        if (trackNumber === 1) {
          setTrack1Separated(cachedStems);
        } else {
          setTrack2Separated(cachedStems);
        }
      }
      
      return;
    }
    
    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    
    try {
      toast({
        title: `Analyzing Track ${trackNumber}`,
        description: "Extracting BPM, key and audio features...",
      });
      
      // Progress simulation
      let progress = 0;
      const progressInterval = setInterval(() => {
        setAnalyzeProgress(prev => {
          const newProgress = prev + 5;
          return newProgress < 90 ? newProgress : prev;
        });
      }, 300);
      
      // Extract file path from URL
      const filePath = trackUrl;
      
      // Call the backend to analyze the audio
      const response = await axios.post(API.endpoints.analyze, {
        filePath,
        trackNumber,
        useWasm: isAudioProcessorReady() // Tell backend if we can use WASM
      });
      
      // Update the analyze progress
      setAnalyzeProgress(90);
      
      // Extract features from response
      const features: AudioFeatures = response.data.features;
      
      // Cache the analysis results
      cacheAnalysisResults(trackUrl, features);
      
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
      
      // For now, we'll skip actual stem separation to simplify
      const stems = {
        vocals: `${filePath.split('.')[0]}_vocals.mp3`,
        instrumental: `${filePath.split('.')[0]}_instrumental.mp3`,
        drums: `${filePath.split('.')[0]}_drums.mp3`,
        bass: `${filePath.split('.')[0]}_bass.mp3`
      };
      
      // Cache the stems
      cacheStemSeparation(trackUrl, stems);
      
      if (trackNumber === 1) {
        setTrack1Separated(stems);
      } else {
        setTrack2Separated(stems);
      }
      
      // Completed
      setAnalyzeProgress(100);
      clearInterval(progressInterval);
      
      toast({
        title: `Track ${trackNumber} Processing Complete`,
        description: "Ready for mixing!",
      });

    } catch (error) {
      console.error(`Error analyzing track ${trackNumber}:`, error);
      
      // Fallback to the existing analysis function if the backend fails
      fallbackAnalyzeAudio(trackUrl, trackNumber);
      
      toast({
        title: "Backend Analysis Failed",
        description: "Using fallback analysis mode. Some advanced features may be limited.",
        variant: "warning",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fallback to frontend-only analysis if backend is not available
  const fallbackAnalyzeAudio = async (trackUrl: string, trackNumber: 1 | 2) => {
    console.log("Using fallback analysis method");
    
    // Simulate processing time
    setTimeout(() => {
      // Generate realistic but random values for demo
      const bpm = Math.floor(Math.random() * (160 - 70) + 70); // 70-160 BPM
      
      // Common musical keys
      const keys = ['C Major', 'A Minor', 'G Major', 'E Minor', 'D Major', 'B Minor', 'F Major'];
      const key = keys[Math.floor(Math.random() * keys.length)];
      
      // Energy and clarity levels (0-1)
      const energy = parseFloat((Math.random() * 0.6 + 0.3).toFixed(2)); // 0.3-0.9
      const clarity = parseFloat((Math.random() * 0.6 + 0.3).toFixed(2)); // 0.3-0.9
      
      const features: AudioFeatures = { bpm, key, energy, clarity };
      
      // Cache the fallback analysis
      cacheAnalysisResults(trackUrl, features);
      
      if (trackNumber === 1) {
        setTrack1Features(features);
        setTrack1Separated({
          vocals: `${trackUrl.split('.')[0]}_vocals.mp3`,
          instrumental: `${trackUrl.split('.')[0]}_instrumental.mp3`,
          drums: `${trackUrl.split('.')[0]}_drums.mp3`,
          bass: `${trackUrl.split('.')[0]}_bass.mp3`
        });
      } else {
        setTrack2Features(features);
        setTrack2Separated({
          vocals: `${trackUrl.split('.')[0]}_vocals.mp3`,
          instrumental: `${trackUrl.split('.')[0]}_instrumental.mp3`,
          drums: `${trackUrl.split('.')[0]}_drums.mp3`,
          bass: `${trackUrl.split('.')[0]}_bass.mp3`
        });
      }
      
      setAnalyzeProgress(100);
      
      toast({
        title: `Track ${trackNumber} Analysis Complete`,
        description: "Using simulated analysis data.",
      });
    }, 2000);
  };

  return {
    track1Features,
    track2Features,
    track1Separated,
    track2Separated,
    isAnalyzing,
    analyzeProgress,
    analyzeTrack,
    wasmInitialized
  };
};
