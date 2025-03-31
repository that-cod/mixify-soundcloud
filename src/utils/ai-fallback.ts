
import { PromptAnalysisResult, analyzePromptWithOpenAI } from '@/services/openai-service';
import { AudioFeatures } from '@/types/audio';
import { getApiKeys } from './api-key-validator';
import { useToast } from '@/hooks/use-toast';

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
  
  if (!apiKeys.openai || !apiKeys.openai.trim()) {
    console.error("No OpenAI API key available");
    throw new Error("No OpenAI API key available. Please add your OpenAI API key in settings.");
  }
  
  // Check API key format
  if (!apiKeys.openai.startsWith('sk-')) {
    console.error("Invalid OpenAI API key format");
    throw new Error("Invalid OpenAI API key format. API keys should start with 'sk-'.");
  }
  
  try {
    // Use OpenAI
    console.log("Using OpenAI API...");
    try {
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
      
    } catch (openaiError: any) {
      console.error("OpenAI API call failed:", openaiError);
      
      // Create a more detailed error message
      const errorMessage = openaiError instanceof Error 
        ? openaiError.message 
        : "Unknown error occurred";
        
      // Add more specific error details if available
      let specificError = "API call failed";
      if (errorMessage.includes("401")) {
        specificError = "Invalid API key";
      } else if (errorMessage.includes("429")) {
        specificError = "Rate limit exceeded";
      } else if (errorMessage.includes("insufficient_quota")) {
        specificError = "Insufficient quota";
      }
      
      throw new Error(`OpenAI API call failed: ${specificError}. ${errorMessage}`);
    }
  } catch (error) {
    console.error("OpenAI fallback method failed:", error);
    throw error; // Re-throw to allow caller to handle
  }
};
