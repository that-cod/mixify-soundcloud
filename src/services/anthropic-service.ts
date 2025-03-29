
import { toast } from "@/hooks/use-toast";

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

interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
}

interface AnthropicMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | AnthropicContent[];
}

interface AnthropicContent {
  type: 'text';
  text: string;
}

interface AnthropicRequestBody {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  temperature: number;
}

interface AnthropicResponseContent {
  type: 'text';
  text: string;
}

interface AnthropicResponse {
  id: string;
  content: AnthropicResponseContent[];
  model: string;
  role: string;
}

// Constants
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-3-sonnet-20240229"; // or claude-3-opus-20240229 for better quality
const MAX_TOKENS = 4000;

// Setup system prompt for track mixing
const getSystemPrompt = (track1Features: AudioFeatures | null, track2Features: AudioFeatures | null) => {
  return `You are an AI audio mixing assistant that specializes in analyzing user instructions for mixing two musical tracks.

TRACK INFORMATION:
${track1Features ? `- Track 1: BPM: ${track1Features.bpm}, Key: ${track1Features.key}, Energy: ${track1Features.energy}, Clarity: ${track1Features.clarity}` : '- Track 1: No analysis available'}
${track2Features ? `- Track 2: BPM: ${track2Features.bpm}, Key: ${track2Features.key}, Energy: ${track2Features.energy}, Clarity: ${track2Features.clarity}` : '- Track 2: No analysis available'}

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
};

// Main function to analyze prompt using Claude API
export const analyzePromptWithClaude = async (
  prompt: string, 
  track1Features: AudioFeatures | null, 
  track2Features: AudioFeatures | null,
  apiKey: string
): Promise<PromptAnalysisResult> => {
  try {
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
      throw new Error("API key is required");
    }

    const systemPrompt = getSystemPrompt(track1Features, track2Features);
    
    const messages: AnthropicMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const requestBody: AnthropicRequestBody = {
      model: MODEL,
      messages: messages,
      max_tokens: MAX_TOKENS,
      temperature: 0.2
    };

    console.log("Sending request to Anthropic Claude API...");
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Claude API error:", errorData);
      
      // Check for specific error types
      if (response.status === 401) {
        throw new Error("Invalid API key. Please check your Anthropic API key and try again.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      } else {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json() as AnthropicResponse;
    console.log("Claude API response received");

    // Extract the JSON response from Claude's text
    if (!data.content || data.content.length === 0 || !data.content[0].text) {
      throw new Error("Invalid response format from Claude API");
    }

    // Safe parsing with error handling for malformed JSON
    try {
      const jsonText = data.content[0].text.trim();
      // Try to find and extract a JSON object if there's additional text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      const cleanedJsonText = jsonMatch ? jsonMatch[0] : jsonText;
      
      const result = JSON.parse(cleanedJsonText) as PromptAnalysisResult;
      
      // Validate the result structure
      if (!result.instructions || !result.recommendedSettings) {
        throw new Error("Incomplete response structure from Claude API");
      }
      
      // Ensure all required fields in recommendedSettings have values
      const defaultSettings = {
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
      
      // Merge with defaults for any missing fields
      result.recommendedSettings = {
        ...defaultSettings,
        ...result.recommendedSettings
      };
      
      console.log("Parsed result successfully");
      return result;
    } catch (parseError) {
      console.error("Error parsing Claude response as JSON:", parseError);
      console.error("Raw response:", data.content[0].text);
      throw new Error("Failed to parse Claude API response as JSON");
    }
  } catch (error) {
    console.error("Error analyzing prompt with Claude:", error);
    // Show error toast with specific message
    toast({
      title: "AI Processing Error",
      description: error instanceof Error ? error.message : "An unexpected error occurred processing your instructions",
      variant: "destructive",
    });
    
    // Return default settings in case of error
    return {
      instructions: [
        {
          type: 'general',
          description: 'Error processing prompt. Using default settings.',
          confidence: 1
        }
      ],
      summary: "Error processing your mixing instructions. Using default settings.",
      recommendedSettings: {
        bpmMatch: true,
        keyMatch: true,
        vocalLevel1: 0.8,
        vocalLevel2: 0.5,
        beatLevel1: 0.6,
        beatLevel2: 0.8,
        crossfadeLength: 8,
        echo: 0.2,
        tempo: 0
      }
    };
  }
};

