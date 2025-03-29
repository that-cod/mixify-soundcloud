
// Types for the prompt processing
export interface MixingInstruction {
  type: 'bpm' | 'key' | 'vocals' | 'beats' | 'transition' | 'effects' | 'tempo' | 'general';
  description: string;
  value?: number | boolean | string;
  confidence: number; // 0-1 scale
}

export interface PromptAnalysisResult {
  instructions: MixingInstruction[];
  summary: string;
  recommendedSettings: {
    bpmMatch: boolean;
    keyMatch: boolean;
    vocalLevel1: number;
    vocalLevel2: number;
    beatLevel1: number;
    beatLevel2: number;
    crossfadeLength: number;
    echo: number;
    tempo: number;
  };
}

export interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
}

export interface AnthropicMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | AnthropicContent[];
}

export interface AnthropicContent {
  type: 'text';
  text: string;
}

export interface AnthropicRequestBody {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature: number;
}

export interface AnthropicResponseContent {
  type: 'text';
  text: string;
}

export interface AnthropicResponse {
  id: string;
  content: AnthropicResponseContent[];
  model: string;
  role: string;
}

// Default mixing settings
export const DEFAULT_MIX_SETTINGS = {
  bpmMatch: true,
  keyMatch: true,
  vocalLevel1: 0.8,
  vocalLevel2: 0.5,
  beatLevel1: 0.6,
  beatLevel2: 0.8,
  crossfadeLength: 8,
  echo: 0.2,
  tempo: 0
};

// Constants
export const API_URL = "https://api.anthropic.com/v1/messages";
export const MODEL = "claude-3-sonnet-20240229"; // or claude-3-opus-20240229 for better quality
export const MAX_TOKENS = 4000;
