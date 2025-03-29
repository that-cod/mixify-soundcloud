
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { PromptAnalysisResult } from '@/services/anthropic-service';
import { API } from '@/config';

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
      // Progress simulation
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        if (progress <= 95) {
          setPromptProcessProgress(progress);
        }
      }, 300);
      
      // Process the prompt using the backend API
      const response = await axios.post(API.endpoints.processPrompt, {
        prompt,
        track1Features,
        track2Features
      });
      
      clearInterval(progressInterval);
      setPromptProcessProgress(100);
      
      // Extract analysis result from response
      const analysisResult: PromptAnalysisResult = response.data.analysis;
      
      // Save the analysis result
      setPromptAnalysisResult(analysisResult);
      
      // Apply the AI-suggested settings
      updateMixSettings(analysisResult.recommendedSettings);
      
      // If additional instruction processing is available, use it
      if (applyPromptInstructions) {
        applyPromptInstructions(analysisResult);
      }
      
      // Log the instructions received from the analysis
      console.log("Prompt analysis instructions:", analysisResult.instructions);
      
      // Display the results to the user
      toast({
        title: "Analysis Complete",
        description: analysisResult.summary || "AI has determined the optimal mix settings based on your prompt!",
      });
      
      setIsProcessingPrompt(false);
      return true;
      
    } catch (error) {
      console.error("Error processing prompt:", error);
      
      // Try fallback to the direct AI API
      try {
        return await fallbackPromptProcessing(prompt);
      } catch (fallbackError) {
        console.error("Fallback prompt processing failed:", fallbackError);
        
        toast({
          title: "Prompt Processing Failed",
          description: "Failed to process your instructions. Please try again.",
          variant: "destructive",
        });
        
        setIsProcessingPrompt(false);
        setPromptProcessProgress(0);
        return false;
      }
    }
  };

  // Fallback to direct Claude API if backend is not available
  const fallbackPromptProcessing = async (prompt: string) => {
    console.log("Using fallback prompt processing method");
    
    // The API keys for direct fallback (first Claude, then OpenAI if Claude fails)
    const CLAUDE_API_KEY = "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";
    const OPENAI_API_KEY = "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";
    
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
      return processAnalysisResult(analysisResult, "Claude");
      
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
          return processAnalysisResult(openaiResult, "OpenAI");
          
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
  
  // Helper to process analysis results from any AI service
  const processAnalysisResult = (analysisResult: PromptAnalysisResult, source: string) => {
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
      title: `Analysis Complete (${source} Fallback Mode)`,
      description: analysisResult.summary || `AI has determined the optimal mix settings based on your prompt! (processed by ${source})`,
    });
    
    setIsProcessingPrompt(false);
    setPromptProcessProgress(100);
    return true;
  };

  // Analyze instructions for debugging and insights
  const getInstructionInsights = () => {
    if (!promptAnalysisResult || !promptAnalysisResult.instructions) {
      return null;
    }
    
    // Group instructions by type
    const instructionsByType = promptAnalysisResult.instructions.reduce((acc, instruction) => {
      const type = instruction.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(instruction);
      return acc;
    }, {} as Record<string, any[]>);
    
    return instructionsByType;
  };

  return {
    isProcessingPrompt,
    promptProcessProgress,
    promptAnalysisResult,
    handlePromptMix,
    getInstructionInsights
  };
};
