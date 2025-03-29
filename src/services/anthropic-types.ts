
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
