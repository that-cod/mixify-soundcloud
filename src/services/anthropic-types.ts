
import { MixSettingsType } from '@/types/mixer';
import { AudioFeatures } from '@/types/audio';

// API constants
export const API_URL = "https://api.anthropic.com/v1/messages";
export const MODEL = "claude-3-sonnet-20240229";
export const MAX_TOKENS = 2000;

// Message type for Anthropic API
export interface AnthropicMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Request body type for Anthropic API
export interface AnthropicRequestBody {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature: number;
}

// Mixing instruction type for prompt analysis
export interface MixingInstruction {
  type: string;
  description: string;
  value: any;
  confidence: number;
}

// Prompt analysis result type
export interface PromptAnalysisResultType {
  instructions: MixingInstruction[];
  summary: string;
  recommendedSettings: MixSettingsType;
}

// Re-export AudioFeatures
export { AudioFeatures };

// Define AnthropicResponse
export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: {
    type: string;
    text: string;
  }[];
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Add default mix settings
export const DEFAULT_MIX_SETTINGS: MixSettingsType = {
  bpmMatch: true,
  keyMatch: true,
  vocalLevel1: 0.8,
  vocalLevel2: 0.8,
  beatLevel1: 0.8,
  beatLevel2: 0.8,
  crossfadeLength: 8,
  echo: 0.3,
  tempo: 0
};

// Export PromptAnalysisResult
export type PromptAnalysisResult = PromptAnalysisResultType;
