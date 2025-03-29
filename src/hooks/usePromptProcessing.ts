
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { analyzePromptWithClaude, PromptAnalysisResult } from '@/services/anthropic-service';

interface AudioFeatures {
  bpm: number;
  key: string;
  energy: number;
  clarity: number;
}

interface UsePromptProcessingProps {
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  updateMixSettings: (settings: any) => void;
}

export const usePromptProcessing = ({ 
  track1Features, 
  track2Features,
  updateMixSettings
}: UsePromptProcessingProps) => {
  // Prompt processing states
  const [isProcessingPrompt, setIsProcessingPrompt] = useState(false);
  const [promptProcessProgress, setPromptProcessProgress] = useState(0);
  const [promptAnalysisResult, setPromptAnalysisResult] = useState<PromptAnalysisResult | null>(null);
  
  const { toast } = useToast();

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
    
    setIsProcessingPrompt(true);
    setPromptProcessProgress(0);
    
    toast({
      title: "Processing your prompt",
      description: "Analyzing your instructions to create the perfect mix...",
    });

    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('anthropic_api_key');
      
      if (!apiKey) {
        throw new Error("API key is required");
      }
      
      // Progress simulation
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 95) {
          setPromptProcessProgress(progress);
        }
      }, 300);
      
      // Process the prompt with Claude API
      const analysisResult = await analyzePromptWithClaude(
        prompt, 
        track1Features, 
        track2Features,
        apiKey
      );
      
      clearInterval(progressInterval);
      setPromptProcessProgress(100);
      
      // Save the analysis result
      setPromptAnalysisResult(analysisResult);
      
      // Apply the AI-suggested settings
      updateMixSettings(analysisResult.recommendedSettings);
      
      // Display the results to the user
      toast({
        title: "Analysis Complete",
        description: analysisResult.summary || "AI has determined the optimal mix settings based on your prompt!",
      });
      
      setIsProcessingPrompt(false);
      return true;
      
    } catch (error) {
      console.error("Error processing prompt:", error);
      
      toast({
        title: "Prompt Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process your instructions. Please try again.",
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
    handlePromptMix
  };
};
