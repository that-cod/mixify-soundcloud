
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PromptAnalysisResult } from '@/services/openai-service';
import { AudioFeatures } from '@/types/audio';
import { processPromptMix } from '@/utils/prompt-processor';
import { getInstructionInsights } from '@/utils/ai-prompt-analysis';
import { useApiKeyStatus } from '@/hooks/useApiKeyStatus';
import { useOpenAIProcessor } from '@/hooks/useOpenAIProcessor';

interface UsePromptProcessingProps {
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  updateMixSettings: (settings: any) => void;
  applyPromptInstructions?: (analysis: PromptAnalysisResult) => void;
}

export const usePromptProcessing = ({ 
  track1Features, 
  track2Features,
  updateMixSettings,
  applyPromptInstructions
}: UsePromptProcessingProps) => {
  // Prompt processing states
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [promptProcessProgress, setPromptProcessProgress] = useState(0);
  const [promptAnalysisResult, setPromptAnalysisResult] = useState<PromptAnalysisResult | null>(null);
  const [promptProcessError, setPromptProcessError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { openai } = useApiKeyStatus();
  const { handleApiError, hasValidApiKey, getOpenAIApiKey } = useOpenAIProcessor();
  
  // Handler to process analysis results from any AI service
  const processAnalysisResult = (analysisResult: PromptAnalysisResult, source: string): boolean => {
    try {
      // Save the analysis result
      setPromptAnalysisResult(analysisResult);
      
      console.log(`Processing analysis result from ${source}:`, analysisResult);
      
      // Apply the AI-suggested settings
      if (analysisResult.recommendedSettings) {
        updateMixSettings(analysisResult.recommendedSettings);
      } else {
        console.warn("Missing recommendedSettings in AI analysis result");
      }
      
      // If additional instruction processing is available, use it
      if (applyPromptInstructions) {
        applyPromptInstructions(analysisResult);
      }
      
      // Display the results to the user
      const sourceLabel = source === "Server" 
        ? "Analysis Complete" 
        : `Analysis Complete (${source})`;
        
      toast({
        title: sourceLabel,
        description: analysisResult.summary || `AI has determined the optimal mix settings based on your prompt!`,
      });
      
      setIsProcessingPrompt(false);
      setPromptProcessProgress(100);
      setPromptProcessError(null);
      return true;
    } catch (error) {
      console.error("Error processing analysis result:", error);
      setPromptProcessError("Failed to process AI analysis results");
      setIsProcessingPrompt(false);
      return false;
    }
  };

  // Function to handle AI prompt-based mixing
  const handlePromptMix = async (prompt: string) => {
    if (!track1Features || !track2Features) {
      toast({
        title: "Incomplete analysis",
        description: "Please wait for track analysis to complete.",
        variant: "destructive",
      });
      return false;
    }
    
    // Double-check API key validity before proceeding
    if (!hasValidApiKey()) {
      toast({
        title: "API Key Issue",
        description: "No valid OpenAI API key found. Please check your API key in settings.",
        variant: "destructive",
      });
      return false;
    }
    
    // Ensure the openai key from useApiKeyStatus is marked as valid
    if (!openai?.valid) {
      toast({
        title: "API Key Not Validated",
        description: "Your API key hasn't been validated. Please check API key status.",
        variant: "destructive",
      });
      return false;
    }
    
    setIsProcessingPrompt(true);
    setPromptProcessProgress(0);
    setPromptProcessError(null);
    
    toast({
      title: "Processing your prompt",
      description: "Analyzing your instructions to create the perfect mix...",
    });

    try {
      // Pass the API key directly to ensure it's available
      const success = await processPromptMix(
        prompt,
        track1Features,
        track2Features,
        setPromptProcessProgress,
        processAnalysisResult
      );
      
      if (!success) {
        throw new Error("Failed to process your instructions");
      }
      
      return success;
    } catch (error) {
      console.error("Prompt processing error:", error);
      
      // Use the API error handler for better error messages
      const errorMessage = handleApiError(error);
      
      setPromptProcessError(errorMessage);
      setIsProcessingPrompt(false);
      setPromptProcessProgress(0);
      return false;
    }
  };

  return {
    isProcessingPrompt,
    promptProcessProgress,
    promptAnalysisResult,
    promptProcessError,
    handlePromptMix,
    getInstructionInsights: () => getInstructionInsights(promptAnalysisResult),
    hasValidApiKey: hasValidApiKey() && openai?.valid === true
  };
};
