
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PromptAnalysisResult } from '@/services/anthropic-service';
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
  
  const { toast } = useToast();
  const { anyKeyValid } = useApiKeyStatus();

  // Handler to process analysis results from any AI service
  const processAnalysisResult = (analysisResult: PromptAnalysisResult, source: string): boolean => {
    // Save the analysis result
    setPromptAnalysisResult(analysisResult);
    
    // Apply the AI-suggested settings
    updateMixSettings(analysisResult.recommendedSettings);
    
    // If additional instruction processing is available, use it
    if (applyPromptInstructions) {
      applyPromptInstructions(analysisResult);
    }
    
    // Display the results to the user
    toast({
      title: source === "Server" ? "Analysis Complete" : `Analysis Complete (${source} Fallback Mode)`,
      description: analysisResult.summary || `AI has determined the optimal mix settings based on your prompt! ${source !== "Server" ? `(processed by ${source})` : ""}`,
    });
    
    setIsProcessingPrompt(false);
    setPromptProcessProgress(100);
    return true;
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
        description: "No valid AI API keys found. Please check API key status.",
        variant: "destructive",
      });
      return false;
    }
    
    setIsProcessingPrompt(true);
    
    toast({
      title: "Processing your prompt",
      description: "Analyzing your instructions to create the perfect mix...",
    });

    const success = await processPromptMix(
      prompt,
      track1Features,
      track2Features,
      setPromptProcessProgress,
      processAnalysisResult
    );
    
    if (!success) {
      toast({
        title: "Prompt Processing Failed",
        description: "Failed to process your instructions. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPrompt(false);
      setPromptProcessProgress(0);
    }
    
    return success;
  };

  return {
    isProcessingPrompt,
    promptProcessProgress,
    promptAnalysisResult,
    handlePromptMix,
    getInstructionInsights: () => getInstructionInsights(promptAnalysisResult),
    hasValidApiKey: anyKeyValid
  };
};
