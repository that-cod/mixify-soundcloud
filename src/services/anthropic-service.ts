import { API_URL, MODEL, MAX_TOKENS, MixingInstruction } from './anthropic-types';
import { MixSettingsType } from '@/types/mixer';

// Type definition for prompt analysis results
export interface PromptAnalysisResult {
  instructions: MixingInstruction[];
  summary: string;
  recommendedSettings: MixSettingsType;
}
