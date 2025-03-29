
// Audio feature types
export interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
}

export interface SeparatedTracks {
  vocals: string;
  instrumental: string;
  drums: string;
  bass: string;
}
