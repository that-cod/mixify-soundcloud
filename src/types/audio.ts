
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
}

export interface SeparatedTracks {
  vocals: string;
  instrumental: string;
  drums: string;
  bass: string;
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
