
import { MixSettingsType } from '@/types/mixer';
import { AudioFeatures } from '@/types/audio';

// API constants
export const API_URL = "https://api.openai.com/v1/chat/completions";
export const MODEL = "gpt-4o-mini"; // Using a modern model
export const MAX_TOKENS = 4000;

// Default mix settings that will be used as fallback
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

// Prompt analysis result type
export interface MixingInstruction {
  type: string;
  description: string;
  value: any;
  confidence: number;
}

export interface PromptAnalysisResult {
  instructions: MixingInstruction[];
  summary: string;
  recommendedSettings: MixSettingsType;
  source?: string;
}

/**
 * Main function to analyze prompt using OpenAI API
 */
export const analyzePromptWithOpenAI = async (
  prompt: string, 
  track1Features: AudioFeatures | null, 
  track2Features: AudioFeatures | null,
  apiKey: string
): Promise<PromptAnalysisResult> => {
  try {
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
      throw new Error("Missing OpenAI API key");
    }
    
    // Create the system prompt with track features
    const systemPrompt = createSystemPrompt(track1Features, track2Features);
    
    // Prepare messages
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    console.log("Sending request to OpenAI API...");
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        max_tokens: MAX_TOKENS,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI API error:", errorData);
      
      // Check for specific error types
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your OpenAI API key and try again.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      } else {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log("OpenAI API response received");
    
    // Extract content from the assistant message
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from OpenAI API");
    }
    
    const content = data.choices[0].message.content;
    
    // Try to extract JSON from the response
    try {
      // Look for JSON object in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      
      const jsonContent = jsonMatch[0];
      const parsedResult = JSON.parse(jsonContent);
      
      // Validate the structure
      if (!parsedResult.instructions || !Array.isArray(parsedResult.instructions)) {
        throw new Error("Missing or invalid instructions array in response");
      }
      
      if (!parsedResult.recommendedSettings) {
        throw new Error("Missing recommendedSettings in response");
      }
      
      // Add a default summary if missing
      if (!parsedResult.summary) {
        parsedResult.summary = "AI-generated mix based on your instructions (processed by OpenAI).";
      }
      
      // Mark the source
      parsedResult.source = "openai";
      
      return parsedResult;
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("OpenAI API processing error:", error);
    
    // Return a fallback analysis result
    return createFallbackAnalysis(track1Features, track2Features, 
      `OpenAI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}. Using default settings.`);
  }
};

/**
 * Create system prompt for OpenAI based on track features
 */
function createSystemPrompt(track1Features: AudioFeatures | null, track2Features: AudioFeatures | null): string {
  return `You are an AI audio mixing assistant that specializes in analyzing user instructions for mixing two musical tracks.

TRACK INFORMATION:
- Track 1: BPM: ${track1Features?.bpm || 'unknown'}, Key: ${track1Features?.key || 'unknown'}, Energy: ${track1Features?.energy || 'unknown'}, Clarity: ${track1Features?.clarity || 'unknown'}
- Track 2: BPM: ${track2Features?.bpm || 'unknown'}, Key: ${track2Features?.key || 'unknown'}, Energy: ${track2Features?.energy || 'unknown'}, Clarity: ${track2Features?.clarity || 'unknown'}

Your job is to analyze a user's text prompt and extract specific mixing instructions. 

You should respond ONLY with a JSON object (no explanations or other text) that has the following structure:
{
  "instructions": [
    {
      "type": "bpm", // one of: bpm, key, vocals, beats, transition, effects, tempo, general
      "description": "Match the tempo of both tracks",
      "value": true, // can be number, boolean or string depending on type
      "confidence": 0.9 // how confident you are this is what the user wants, 0-1
    }
    // more instructions...
  ],
  "summary": "A short summary of the mixing plan in 1-2 sentences",
  "recommendedSettings": {
    "bpmMatch": true, // boolean
    "keyMatch": true, // boolean
    "vocalLevel1": 0.8, // 0-1 scale
    "vocalLevel2": 0.5, // 0-1 scale
    "beatLevel1": 0.6, // 0-1 scale
    "beatLevel2": 0.8, // 0-1 scale
    "crossfadeLength": 8, // seconds (1-20)
    "echo": 0.2, // 0-1 scale
    "tempo": 0 // -0.5 to 0.5, 0 means no change
  }
}

Understand music terminology and extract both explicit and implicit instructions from the user's prompt. For instance, if they ask for a "smooth transition," that implies a longer crossfadeLength.`;
}

/**
 * Create fallback analysis if OpenAI API call fails
 */
function createFallbackAnalysis(
  track1Features: AudioFeatures | null, 
  track2Features: AudioFeatures | null,
  summary: string
): PromptAnalysisResult {
  console.log("Creating fallback analysis result due to OpenAI processing failure");
  
  // Create sensible defaults based on track features
  const shouldMatchBpm = track1Features && track2Features && 
    Math.abs(track1Features.bpm - track2Features.bpm) > 5;
  
  const shouldMatchKey = track1Features && track2Features && 
    track1Features.key !== track2Features.key;
  
  return {
    instructions: [
      {
        type: "general",
        description: "Use default mixing settings due to AI processing failure",
        value: true,
        confidence: 1.0
      },
      {
        type: "bpm",
        description: "Match the tempo of both tracks",
        value: shouldMatchBpm || false,
        confidence: 0.9
      },
      {
        type: "key",
        description: "Harmonize the keys of both tracks",
        value: shouldMatchKey || false,
        confidence: 0.9
      }
    ],
    summary: summary || "Automatic mix with balanced levels. (AI analysis failed, using default settings.)",
    recommendedSettings: {
      ...DEFAULT_MIX_SETTINGS
    }
  };
}
