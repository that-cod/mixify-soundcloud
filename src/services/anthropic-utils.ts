
import { toast } from "@/hooks/use-toast";
import { PromptAnalysisResult, DEFAULT_MIX_SETTINGS, AnthropicResponse } from './anthropic-types';

/**
 * Safely parses the JSON response from Claude
 */
export const parseClaudeResponse = (data: AnthropicResponse): PromptAnalysisResult => {
  try {
    if (!data.content || data.content.length === 0 || !data.content[0].text) {
      throw new Error("Invalid response format from Claude API");
    }

    const jsonText = data.content[0].text.trim();
    // Try to find and extract a JSON object if there's additional text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    const cleanedJsonText = jsonMatch ? jsonMatch[0] : jsonText;
    
    const result = JSON.parse(cleanedJsonText) as PromptAnalysisResult;
    
    // Validate the result structure
    if (!result.instructions || !result.recommendedSettings) {
      throw new Error("Incomplete response structure from Claude API");
    }
    
    // Merge with defaults for any missing fields
    result.recommendedSettings = {
      ...DEFAULT_MIX_SETTINGS,
      ...result.recommendedSettings
    };
    
    console.log("Parsed result successfully");
    return result;
  } catch (parseError) {
    console.error("Error parsing Claude response as JSON:", parseError);
    console.error("Raw response:", data.content?.[0]?.text);
    throw new Error("Failed to parse Claude API response as JSON");
  }
};

/**
 * Handles API errors and shows appropriate toast messages
 */
export const handleApiError = (error: unknown): PromptAnalysisResult => {
  console.error("Error analyzing prompt with Claude:", error);
  
  // Show error toast with specific message
  toast({
    title: "AI Processing Error",
    description: error instanceof Error ? error.message : "An unexpected error occurred processing your instructions",
    variant: "destructive",
  });
  
  // Return default settings in case of error
  return {
    instructions: [
      {
        type: 'general',
        description: 'Error processing prompt. Using default settings.',
        confidence: 1
      }
    ],
    summary: "Error processing your mixing instructions. Using default settings.",
    recommendedSettings: DEFAULT_MIX_SETTINGS
  };
};

/**
 * Validates the API key
 */
export const validateApiKey = (apiKey: string | null): string => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API key is required");
  }
  return apiKey;
};
