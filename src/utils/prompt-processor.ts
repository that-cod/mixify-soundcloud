
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
    const response = await axios.post(API.endpoints.processPrompt, {
      prompt,
      track1Features,
      track2Features
    });
    
    clearInterval(progressInterval);
    onProgress(100);
    
    // Extract analysis result from response
    const analysisResult: PromptAnalysisResult = response.data.analysis;
    
    // Process the results
    return processResults(analysisResult, "Server");
    
  } catch (error) {
    console.error("Error processing prompt:", error);
    clearInterval(progressInterval);
    
    // Try fallback to the direct AI API
    try {
      return await processWithFallbackAI(
        prompt, 
        track1Features, 
        track2Features,
        processResults
      );
    } catch (fallbackError) {
      console.error("Fallback prompt processing failed:", fallbackError);
      onProgress(0);
      return false;
    }
  }
};
