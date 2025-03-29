
export interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
  waveform?: number[];
  spectrum?: Record<string, number>;
}

export interface SeparatedTracks {
  vocals: string;
  instrumental: string;
  drums: string;
  bass: string;
}
