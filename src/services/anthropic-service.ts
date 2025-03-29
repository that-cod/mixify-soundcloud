
import { 
  AudioFeatures, 
  PromptAnalysisResult, 
  AnthropicMessage,
  AnthropicRequestBody,
  API_URL,
  MODEL,
  MAX_TOKENS
} from './anthropic-types';
import { getSystemPrompt } from './anthropic-prompt';
import { parseClaudeResponse, handleApiError, validateApiKey } from './anthropic-utils';

// Re-export the types that were previously defined here
export type { MixingInstruction, PromptAnalysisResult } from './anthropic-types';

/**
 * Main function to analyze prompt using Claude API
 */
export const analyzePromptWithClaude = async (
  prompt: string, 
  track1Features: AudioFeatures | null, 
  track2Features: AudioFeatures | null,
  apiKey: string
): Promise<PromptAnalysisResult> => {
  try {
    // Validate API key
    const validatedApiKey = validateApiKey(apiKey);
    
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
        'x-api-key': validatedApiKey,
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

    const data = await response.json();
    console.log("Claude API response received");

    // Parse the Claude response
    return parseClaudeResponse(data);
    
  } catch (error) {
    return handleApiError(error);
  }
};
