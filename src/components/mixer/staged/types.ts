
// Define the stages of the mixing process
export type MixingStage = 
  | 'prepare' 
  | 'stemSeparation' 
  | 'bpmMatching' 
  | 'vocalProcessing' 
  | 'beatProcessing' 
  | 'effectsApplication' 
  | 'finalMix' 
  | 'complete';

export type StageStatus = 'pending' | 'processing' | 'complete' | 'paused';

export interface StageInfo {
  id: MixingStage;
  label: string;
  description: string;
  adjustableParams: string[];
}

// Define the parameters that can be adjusted at each stage
export interface StagedMixSettings {
  // Stage: stemSeparation
  stemSeparationQuality: number;
  
  // Stage: bpmMatching
  bpmMatchEnabled: boolean;
  bpmMatchStrength: number;
  
  // Stage: vocalProcessing
  vocalLevel1: number;
  vocalLevel2: number;
  vocalEQ: number;
  
  // Stage: beatProcessing
  beatLevel1: number;
  beatLevel2: number;
  beatEQ: number;
  
  // Stage: effectsApplication
  echo: number;
  reverb: number;
  compression: number;
  
  // Stage: finalMix
  crossfadeLength: number;
  outputGain: number;
  stereoWidth: number;
}
