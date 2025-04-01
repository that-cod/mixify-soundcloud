
import { API } from '@/config';
import axios from 'axios';
import { AudioFeatures } from '@/types/audio';
import { PromptAnalysisResult } from '@/services/openai-service';
import { processWithOpenAI } from './ai-fallback';
import { getApiKeys } from './api-key-validator';

/**
 * Process a mixing prompt with backend or fallback to direct OpenAI API
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
  
  // Double-check API key validity before proceeding
  const apiKeys = getApiKeys();
  if (!apiKeys.openai || !apiKeys.openai.trim()) {
    clearInterval(progressInterval);
    throw new Error("No valid OpenAI API key found. Please check API key status.");
  }
  
  try {
    // Process the prompt using the backend API
    console.log("Attempting backend prompt processing...");
    console.log("Using API endpoint:", API.endpoints.processPrompt);
    
    const payload = {
      prompt,
      track1Features,
      track2Features,
      apiKey: apiKeys.openai // Pass the key to the backend
    };
    console.log("Sending prompt request with payload:", JSON.stringify({
      ...payload,
      apiKey: '***REDACTED***' // Redact API key for logging
    }));
    
    const response = await axios.post(API.endpoints.processPrompt, payload);
    
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
    
    // Try fallback to the direct OpenAI API
    console.log("Attempting fallback to direct OpenAI API...");
    try {
      const result = await processWithOpenAI(
        prompt, 
        track1Features, 
        track2Features,
        processResults
      );
      
      clearInterval(progressInterval);
      onProgress(100);
      return result;
    } catch (fallbackError) {
      console.error("All prompt processing methods failed:", fallbackError);
      clearInterval(progressInterval);
      onProgress(0);
      throw fallbackError; // Re-throw to allow caller to handle
    }
  }
};
