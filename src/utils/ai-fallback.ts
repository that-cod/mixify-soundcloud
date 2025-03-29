
import axios from 'axios';
import { PromptAnalysisResult } from '@/services/anthropic-service';
import { AudioFeatures } from '@/types/audio';

// API keys for direct fallback (first Claude, then OpenAI if Claude fails)
const CLAUDE_API_KEY = "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";
const OPENAI_API_KEY = "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";

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
  
  try {
    // First try with Claude
    console.log("Attempting direct Claude API call...");
    const { analyzePromptWithClaude } = await import('@/services/anthropic-service');
    
    // Process the prompt with Claude API
    const analysisResult = await analyzePromptWithClaude(
      prompt, 
      track1Features, 
      track2Features,
      CLAUDE_API_KEY
    );
    
    // If successful, use the Claude results
    console.log("Claude API direct call succeeded");
    return processAnalysisCallback(analysisResult, "Claude");
    
  } catch (claudeError) {
    // If Claude fails and OpenAI key is available, try OpenAI
    console.error("Claude API direct call failed:", claudeError);
    
    if (OPENAI_API_KEY) {
      console.log("Falling back to OpenAI API...");
      try {
        // Import the OpenAI processor
        const { analyzePromptWithOpenAI } = await import('@/services/openai-service');
        
        // Process with OpenAI
        const openaiResult = await analyzePromptWithOpenAI(
          prompt,
          track1Features,
          track2Features,
          OPENAI_API_KEY
        );
        
        // If successful, use the OpenAI results
        console.log("OpenAI API fallback succeeded");
        return processAnalysisCallback(openaiResult, "OpenAI");
        
      } catch (openaiError) {
        console.error("OpenAI API fallback failed:", openaiError);
        throw new Error("Both Claude and OpenAI direct API calls failed");
      }
    } else {
      // No OpenAI key, rethrow Claude error
      throw claudeError;
    }
  }
};
