
// Audio feature types
export interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
  cached?: boolean;
  cacheTimestamp?: number;
  waveform?: number[];
  spectrum?: {
    low: number;
    mid: number;
    high: number;
  };
  // Added for harmonic analysis
  harmonicProfile?: {
    dominantFrequencies: number[];
    harmonicStructure: string;
    tonality: 'major' | 'minor' | 'ambiguous';
  };
  // Added for beat detection
  beatGrid?: {
    positions: number[];
    strength: number[];
    confidence: number;
  };
}

export interface SeparatedTracks {
  vocals: string;
  instrumental: string;
  drums: string;
  bass: string;
  other?: string;
  cached?: boolean;
}

// Pre-computed operations interface
export interface PrecomputedOperations {
  trackId: string;
  bpmVariants: {
    [targetBpm: string]: string; // Paths to pre-computed speed variants
  };
  keyVariants: {
    [targetKey: string]: string; // Paths to pre-computed key-shifted variants
  };
  stemCache: SeparatedTracks;
  effectVariants: {
    [effectName: string]: {
      [intensity: string]: string; // Paths to pre-computed effect variants
    };
  };
  cacheTimestamp: number;
}

// Add new audio effects types
export interface AudioEffects {
  eq: EqualizerSettings;
  compression: CompressionSettings;
  reverb: ReverbSettings;
  delay: DelaySettings;
  distortion: DistortionSettings;
}

export interface EqualizerSettings {
  lowGain: number;
  midGain: number;
  highGain: number;
  lowFrequency: number;
  highFrequency: number;
  enabled: boolean;
}

export interface CompressionSettings {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  enabled: boolean;
}

export interface ReverbSettings {
  mix: number;
  time: number;
  decay: number;
  enabled: boolean;
}

export interface DelaySettings {
  time: number;
  feedback: number;
  mix: number;
  enabled: boolean;
}

export interface DistortionSettings {
  amount: number;
  enabled: boolean;
}

// Add multi-track support
export interface MixTrack {
  id: string;
  url: string;
  name: string;
  features: AudioFeatures | null;
  stems: SeparatedTracks | null;
  effects: AudioEffects;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
}
