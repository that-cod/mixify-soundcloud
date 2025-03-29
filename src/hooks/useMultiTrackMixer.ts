
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { MixTrack, AudioFeatures, AudioEffects } from '@/types/audio';
import { analyzeAudio, separateTracks } from '@/utils/audioAnalysis';
import { v4 as uuidv4 } from 'uuid';

// Default audio effects
const DEFAULT_EFFECTS: AudioEffects = {
  eq: {
    lowGain: 0,
    midGain: 0,
    highGain: 0,
    lowFrequency: 200,
    highFrequency: 2000,
    enabled: false
  },
  compression: {
    threshold: -24,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
    enabled: false
  },
  reverb: {
    mix: 0.3,
    time: 1,
    decay: 0.8,
    enabled: false
  },
  delay: {
    time: 0.5,
    feedback: 0.3,
    mix: 0.2,
    enabled: false
  },
  distortion: {
    amount: 0.2,
    enabled: false
  }
};

export function useMultiTrackMixer() {
  const [tracks, setTracks] = useState<MixTrack[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [mixedTrackUrl, setMixedTrackUrl] = useState<string | undefined>();
  
  const { toast } = useToast();
  
  // Add a new track to the mixer
  const addTrack = async (url: string, name: string) => {
    const trackId = uuidv4();
    
    // Create new track with default settings
    const newTrack: MixTrack = {
      id: trackId,
      url,
      name,
      features: null,
      stems: null,
      effects: { ...DEFAULT_EFFECTS },
      volume: 0.8,
      pan: 0,
      muted: false,
      soloed: false
    };
    
    // Add track to list
    setTracks(prev => [...prev, newTrack]);
    toast({
      title: "Track Added",
      description: `Added ${name} to the mix`,
    });
    
    // Start analyzing the track
    await analyzeTrack(trackId);
    
    return trackId;
  };
  
  // Analyze a track to extract features
  const analyzeTrack = async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    setIsAnalyzing(true);
    
    try {
      // Analyze audio features
      const features = await analyzeAudio(track.url, {
        detectBeats: true,
        analyzeHarmonics: true,
        quality: 'medium'
      });
      
      // Update track with features
      setTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, features } : t
      ));
      
      toast({
        title: "Track Analysis Complete",
        description: `BPM: ${features.bpm}, Key: ${features.key}`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze track. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Separate stems for a track
  const separateTrackStems = async (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;
    
    try {
      // Show toast
      toast({
        title: "Separating Stems",
        description: "Extracting vocals, drums, bass, and other elements...",
      });
      
      // Separate stems
      const stems = await separateTracks(track.url, { quality: 'medium' });
      
      // Update track with stems
      setTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, stems } : t
      ));
      
      toast({
        title: "Stem Separation Complete",
        description: "Vocals and instruments have been separated",
      });
      
      return stems;
    } catch (error) {
      console.error('Stem separation error:', error);
      toast({
        title: "Separation Failed",
        description: "Could not separate stems. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Update track volume
  const updateTrackVolume = (trackId: string, volume: number) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, volume } : t
    ));
  };
  
  // Update track pan
  const updateTrackPan = (trackId: string, pan: number) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, pan } : t
    ));
  };
  
  // Toggle track mute
  const toggleTrackMute = (trackId: string) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, muted: !t.muted } : t
    ));
  };
  
  // Toggle track solo
  const toggleTrackSolo = (trackId: string) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, soloed: !t.soloed } : t
    ));
  };
  
  // Update track effects
  const updateTrackEffect = <K extends keyof AudioEffects>(
    trackId: string, 
    effectType: K, 
    settings: Partial<AudioEffects[K]>
  ) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        return {
          ...t,
          effects: {
            ...t.effects,
            [effectType]: {
              ...t.effects[effectType],
              ...settings
            }
          }
        };
      }
      return t;
    }));
  };
  
  // Remove a track
  const removeTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    toast({
      title: "Track Removed",
      description: "Track has been removed from the mix",
    });
  };
  
  // Create a mix of all tracks
  const createMix = async () => {
    if (tracks.length === 0) {
      toast({
        title: "No Tracks",
        description: "Please add at least one track to create a mix",
        variant: "destructive",
      });
      return;
    }
    
    setIsMixing(true);
    setMixProgress(0);
    
    // Simulate mixing progress
    const progressInterval = setInterval(() => {
      setMixProgress(prev => {
        const newProgress = prev + 5;
        return newProgress < 95 ? newProgress : prev;
      });
    }, 500);
    
    try {
      // Simulate processing time based on number of tracks
      const processingTime = 1000 + (tracks.length * 1000);
      
      // In a real implementation, this would call a backend service to mix the tracks
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Set a mock URL for the mixed track
      setMixedTrackUrl(`/api/mixed-tracks/multi-track-mix-${Date.now()}.mp3`);
      
      setMixProgress(100);
      toast({
        title: "Mix Complete",
        description: `Successfully mixed ${tracks.length} tracks`,
      });
    } catch (error) {
      console.error('Mixing error:', error);
      toast({
        title: "Mixing Failed",
        description: "Could not create mix. Please try again.",
        variant: "destructive",
      });
    } finally {
      clearInterval(progressInterval);
      setIsMixing(false);
    }
  };
  
  return {
    tracks,
    isAnalyzing,
    isMixing,
    mixProgress,
    mixedTrackUrl,
    addTrack,
    analyzeTrack,
    separateTrackStems,
    updateTrackVolume,
    updateTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    updateTrackEffect,
    removeTrack,
    createMix
  };
}
