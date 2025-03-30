
import { PromptAnalysisResult } from '@/services/openai-service';
import { AudioFeatures } from '@/types/audio';
import { getApiKeys } from './api-key-validator';

/**
 * Process with OpenAI API if backend is not available
 */
export const processWithOpenAI = async (
  prompt: string,
  track1Features: AudioFeatures | null,
  track2Features: AudioFeatures | null,
  processAnalysisCallback: (analysisResult: PromptAnalysisResult, source: string) => boolean
): Promise<boolean> => {
  console.log("Using OpenAI for prompt processing");
  
  // Get API keys from localStorage
  const apiKeys = getApiKeys();
  
  if (!apiKeys.openai) {
    console.error("No OpenAI API key available");
    throw new Error("No OpenAI API key available. Please add your OpenAI API key in settings.");
  }
  
  try {
    // Use OpenAI
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
      throw new Error("OpenAI API call failed: " + (openaiError instanceof Error ? openaiError.message : "Unknown error"));
    }
  } catch (error) {
    console.error("OpenAI fallback method failed:", error);
    throw error; // Re-throw to allow caller to handle
  }
};
