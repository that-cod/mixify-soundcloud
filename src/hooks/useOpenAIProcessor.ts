
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PromptAnalysisResult } from '@/services/openai-service';

/**
 * Hook for managing OpenAI API key validation and status
 */
export const useOpenAIProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Validate an OpenAI API key format
   */
  const validateApiKeyFormat = (key: string): boolean => {
    // Basic validation for OpenAI API key format
    return /^sk-[a-zA-Z0-9]{48,}$/.test(key.trim());
  };

  /**
   * Handle API errors with better user feedback
   */
  const handleApiError = (error: any): string => {
    console.error("API processing error:", error);
    
    // Extract useful information from the error
    let errorMessage = "An unexpected error occurred";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common OpenAI API errors
      if (errorMessage.includes("401")) {
        errorMessage = "Invalid API key. Please check your OpenAI API key.";
      } else if (errorMessage.includes("429")) {
        errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
      } else if (errorMessage.includes("insufficient_quota")) {
        errorMessage = "Your OpenAI API key has insufficient quota. Please check your billing.";
      }
    }
    
    // Show user-friendly toast
    toast({
      title: "API Error",
      description: errorMessage,
      variant: "destructive"
    });
    
    return errorMessage;
  };

  return {
    isProcessing,
    setIsProcessing,
    error,
    setError,
    validateApiKeyFormat,
    handleApiError
  };
};
