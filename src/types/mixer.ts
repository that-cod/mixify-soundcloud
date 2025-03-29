
export interface MixSettingsType {
  bpmMatch: boolean;
  keyMatch: boolean;
  vocalLevel1: number;
  vocalLevel2: number;
  beatLevel1: number;
  beatLevel2: number;
  crossfadeLength: number;
  echo: number;
  tempo: number;
}

export interface MixingInstruction {
  type: string;
  value: string | number | boolean;
  confidence: number;
  description?: string;
}
