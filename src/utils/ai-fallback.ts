
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
