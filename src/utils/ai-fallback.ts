
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
  
  // Get API keys from the validator
  const apiKeys = getApiKeys();
  
  try {
    // First try with Claude
    console.log("Attempting direct Claude API call...");
    const { analyzePromptWithClaude } = await import('@/services/anthropic-service');
    
    if (!apiKeys.claude) {
      console.warn("No Claude API key provided, skipping Claude fallback");
      throw new Error("Claude API key not found");
    }
    
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
    // If Claude fails and OpenAI key is available, try OpenAI
    console.error("Claude API direct call failed:", claudeError);
    
    if (apiKeys.openai) {
      console.log("Falling back to OpenAI API...");
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
        console.log("OpenAI API fallback succeeded");
        return processAnalysisCallback(openaiResult, "OpenAI");
        
      } catch (openaiError) {
        console.error("OpenAI API fallback failed:", openaiError);
        throw new Error("Both Claude and OpenAI direct API calls failed. Please check your API keys and try again.");
      }
    } else {
      // No OpenAI key, rethrow Claude error
      throw new Error("No valid API keys found. Please add your Claude or OpenAI API key in settings.");
    }
  }
};
