
import { toast } from "@/hooks/use-toast";
import { PromptAnalysisResult, DEFAULT_MIX_SETTINGS, AnthropicResponse } from './anthropic-types';

/**
 * Safely parses the JSON response from Claude
 */
export const parseClaudeResponse = (data: AnthropicResponse): PromptAnalysisResult => {
  try {
    // Validate response structure
    if (!data.content || data.content.length === 0 || !data.content[0].text) {
      throw new Error("Invalid response format from Claude API");
    }

    const jsonText = data.content[0].text.trim();
    console.log("Raw Claude response:", jsonText.length > 200 ? jsonText.substring(0, 200) + '...' : jsonText);
    
    // Try to find and extract a JSON object if there's additional text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON object found in Claude response");
    }
    
    const cleanedJsonText = jsonMatch[0];
    console.log("Extracted JSON:", cleanedJsonText.length > 200 ? cleanedJsonText.substring(0, 200) + '...' : cleanedJsonText);
    
    let result: PromptAnalysisResult;
    try {
      result = JSON.parse(cleanedJsonText) as PromptAnalysisResult;
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
      throw new Error(`Failed to parse Claude response as JSON: ${(jsonError as Error).message}`);
    }
    
    // Validate the result structure
    if (!result.instructions || !Array.isArray(result.instructions)) {
      throw new Error("Missing or invalid instructions in Claude response");
    }
    
    if (!result.recommendedSettings) {
      throw new Error("Missing recommendedSettings in Claude response");
    }
    
    // Merge with defaults for any missing fields
    result.recommendedSettings = {
      ...DEFAULT_MIX_SETTINGS,
      ...result.recommendedSettings
    };
    
    // Add default summary if missing
    if (!result.summary) {
      result.summary = "AI-generated mix based on your instructions.";
    }
    
    console.log("Parsed result successfully");
    return result;
  } catch (parseError) {
    console.error("Error parsing Claude response:", parseError);
    console.error("Raw response:", data.content?.[0]?.text);
    throw new Error(`Failed to parse Claude API response: ${(parseError as Error).message}`);
  }
};

/**
 * Handles API errors and shows appropriate toast messages
 */
export const handleApiError = (error: unknown): PromptAnalysisResult => {
  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
  console.error("Error analyzing prompt with Claude:", error);
  
  // Categorize error for better user feedback
  let toastTitle = "AI Processing Error";
  let toastDescription = errorMessage;
  
  if (errorMessage.includes("API key") || errorMessage.includes("Authentication")) {
    toastTitle = "API Key Error";
    toastDescription = "There was a problem with the Claude API key. Please check your key and try again.";
  } else if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
    toastTitle = "Rate Limit Exceeded";
    toastDescription = "The Claude API rate limit has been reached. Please try again in a few minutes.";
  } else if (errorMessage.includes("parse") || errorMessage.includes("JSON")) {
    toastTitle = "Response Processing Error";
    toastDescription = "Could not process the AI response format. Using default settings instead.";
  }
  
  // Show error toast with specific message
  toast({
    title: toastTitle,
    description: toastDescription,
    variant: "destructive",
  });
  
  // Return default settings in case of error
  return {
    instructions: [
      {
        type: 'general',
        description: 'Error processing prompt. Using default settings.',
        confidence: 1,
        value: 'error'
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
  
  // Basic format validation for Claude API keys
  if (!apiKey.startsWith('sk-')) {
    throw new Error("Invalid API key format. Claude API keys should start with 'sk-'");
  }
  
  return apiKey;
};
