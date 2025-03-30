
import Anthropic from '@anthropic-ai/sdk';
import { PromptAnalysisResult } from '@/services/anthropic-types';
import { AudioFeatures } from '@/types/audio';
import { getApiKeys } from './api-key-validator';

/**
 * Fallback to direct Claude API if backend is not available
 */
export const processWithFallbackAI = async (
  prompt: string,
  track1Features: AudioFeatures | null,
  track2Features: AudioFeatures | null,
  processAnalysisCallback: (analysisResult: PromptAnalysisResult, source: string) => boolean
): Promise<boolean> => {
  console.log("Using fallback prompt processing method");
  
  // Get API keys from localStorage
  const apiKeys = getApiKeys();
  
  try {
    // First try with Claude if the API key is available
    if (apiKeys.claude) {
      console.log("Attempting direct Claude API call...");
      try {
        const { analyzePromptWithClaude } = await import('@/services/anthropic-service');
        
        // Process the prompt with Claude API
        const analysisResult = await analyzePromptWithClaude(
          prompt, 
          track1Features, 
          track2Features,
          apiKeys.claude
        );
        
        // If successful, use the Claude results
        console.log("Claude API direct call succeeded");
        return processAnalysisCallback(analysisResult, "Claude");
      } catch (claudeError) {
        console.error("Claude API direct call failed:", claudeError);
        // Fall through to OpenAI if Claude fails
      }
    } else {
      console.log("No Claude API key provided, skipping Claude fallback");
    }
    
    // Try OpenAI if Claude failed or no Claude key was provided
    if (apiKeys.openai) {
      console.log("Using OpenAI API...");
      try {
        // Import the OpenAI processor
        const { analyzePromptWithOpenAI } = await import('@/services/openai-service');
        
        // Process with OpenAI
        const openaiResult = await analyzePromptWithOpenAI(
          prompt,
          track1Features,
          track2Features,
          apiKeys.openai
        );
        
        // If successful, use the OpenAI results
        console.log("OpenAI API call succeeded");
        return processAnalysisCallback(openaiResult, "OpenAI");
        
      } catch (openaiError) {
        console.error("OpenAI API call failed:", openaiError);
        throw new Error("All AI direct API calls failed. Please check your API keys and try again.");
      }
    } else {
      console.log("No OpenAI key provided");
      // No OpenAI key, and Claude has already failed or was not provided
      throw new Error("No valid API keys found. Please add your Claude or OpenAI API key in settings.");
    }
  } catch (error) {
    console.error("All AI fallback methods failed:", error);
    throw error; // Re-throw to allow caller to handle
  }
};
