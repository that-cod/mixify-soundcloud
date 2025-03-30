
import Anthropic from '@anthropic-ai/sdk';
import { MixSettingsType } from '@/types/mixer';
import { AudioFeatures } from '@/types/audio';
import { getSystemPrompt } from './anthropic-prompt';
import { parseClaudeResponse, handleApiError, validateApiKey } from './anthropic-utils';

// Explicitly export the imported type so it's available to other modules
export type { PromptAnalysisResult } from './anthropic-types';

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
    
    // Create Anthropic client
    const anthropic = new Anthropic({
      apiKey: validatedApiKey,
    });
    
    const systemPrompt = getSystemPrompt(track1Features, track2Features);
    
    console.log("Sending request to Anthropic Claude API using SDK...");
    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 4000,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    console.log("Claude API response received, ID:", response.id);

    // Parse the Claude response
    const content = response.content[0].text;
    return parseClaudeResponse({ content: [{ text: content }] });
    
  } catch (error) {
    console.error("Claude API error:", error);
    
    // Check for specific error types
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        throw new Error("Invalid API key. Please check your Anthropic API key and try again.");
      } else if (error.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few minutes.");
      } else {
        throw new Error(`API error: ${error.status} - ${error.message}`);
      }
    }
    
    return handleApiError(error);
  }
};
