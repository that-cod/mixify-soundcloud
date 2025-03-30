
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PromptAnalysisResult } from '@/services/openai-service';
import { AudioFeatures } from '@/types/audio';
import { processPromptMix } from '@/utils/prompt-processor';
import { getInstructionInsights } from '@/utils/ai-prompt-analysis';
import { useApiKeyStatus } from '@/hooks/useApiKeyStatus';

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
  const { anyKeyValid } = useApiKeyStatus();
  
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
      toast({
        title: source === "Server" ? "Analysis Complete" : `Analysis Complete (OpenAI)`,
        description: analysisResult.summary || `AI has determined the optimal mix settings based on your prompt! ${source !== "Server" ? `(processed by OpenAI)` : ""}`,
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
    
    if (!anyKeyValid) {
      toast({
        title: "API Key Issue",
        description: "No valid OpenAI API key found. Please check API key status.",
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
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to process your instructions. Please try again.";
      
      setPromptProcessError(errorMessage);
      
      toast({
        title: "Prompt Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
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
    hasValidApiKey: anyKeyValid
  };
};
