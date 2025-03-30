
import { API } from '@/config';
import axios from 'axios';
import { AudioFeatures } from '@/types/audio';
import { PromptAnalysisResult } from '@/services/anthropic-service';
import { processWithFallbackAI } from './ai-fallback';

/**
 * Process a mixing prompt with backend or fallback to direct AI APIs
 */
export const processPromptMix = async (
  prompt: string,
  track1Features: AudioFeatures | null,
  track2Features: AudioFeatures | null,
  onProgress: (progress: number) => void,
  processResults: (analysisResult: PromptAnalysisResult, source: string) => boolean
): Promise<boolean> => {
  onProgress(0);
  
  // Progress simulation
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += 5;
    if (progress <= 95) {
      onProgress(progress);
    }
  }, 300);
  
  try {
    // Process the prompt using the backend API
    console.log("Attempting backend prompt processing...");
    const response = await axios.post(API.endpoints.processPrompt, {
      prompt,
      track1Features,
      track2Features
    });
    
    clearInterval(progressInterval);
    onProgress(100);
    
    // Extract analysis result from response
    if (!response.data.analysis) {
      console.error("Invalid response from server - missing analysis data", response.data);
      throw new Error("Server returned invalid data. Trying fallback method...");
    }
    
    const analysisResult: PromptAnalysisResult = response.data.analysis;
    console.log("Received analysis from server:", analysisResult);
    
    // Process the results
    return processResults(analysisResult, "Server");
    
  } catch (error) {
    console.error("Error processing prompt with backend:", error);
    clearInterval(progressInterval);
    
    // Try fallback to the direct AI API
    console.log("Attempting fallback to direct AI APIs...");
    try {
      return await processWithFallbackAI(
        prompt, 
        track1Features, 
        track2Features,
        processResults
      );
    } catch (fallbackError) {
      console.error("All prompt processing methods failed:", fallbackError);
      onProgress(0);
      throw fallbackError; // Re-throw to allow caller to handle
    }
  }
};
