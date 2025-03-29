
import { MixSettingsType } from '@/types/mixer';
import { PromptAnalysisResult, AnthropicResponse, DEFAULT_MIX_SETTINGS } from './anthropic-types';

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): string {
  if (!apiKey) {
    throw new Error("API key is required");
  }
  
  // Basic validation for Anthropic API key format
  if (!apiKey.trim().startsWith('sk-')) {
    throw new Error("Invalid API key format. Anthropic API keys should start with 'sk-'");
  }
  
  return apiKey.trim();
}

/**
 * Parse response from Claude API
 */
export function parseClaudeResponse(data: AnthropicResponse): PromptAnalysisResult {
  try {
    // Extract the text content from the response
    const responseText = data.content?.[0]?.text || '';
    
    // Try to find a JSON block in the response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                     responseText.match(/```\n([\s\S]*?)\n```/) ||
                     responseText.match(/{[\s\S]*?}/);
    
    let parsedData: Partial<PromptAnalysisResult> = {};
    
    if (jsonMatch) {
      try {
        // Extract the JSON content
        const jsonContent = jsonMatch[1] || jsonMatch[0];
        parsedData = JSON.parse(jsonContent);
      } catch (jsonError) {
        console.error("Failed to parse JSON from Claude response:", jsonError);
      }
    }
    
    // If no JSON was found or it was invalid, try to extract structured data from the text
    if (!parsedData.instructions || !parsedData.recommendedSettings) {
      // Extract instructions from text
      const instructions = extractInstructionsFromText(responseText);
      
      // Extract recommended settings
      const recommendedSettings = extractSettingsFromText(responseText) || DEFAULT_MIX_SETTINGS;
      
      // Create a summary
      const summary = extractSummaryFromText(responseText) || "Generated mix based on your instructions";
      
      parsedData = {
        instructions,
        recommendedSettings,
        summary
      };
    }
    
    // Ensure the result has all required fields
    return {
      instructions: parsedData.instructions || [],
      recommendedSettings: parsedData.recommendedSettings || DEFAULT_MIX_SETTINGS,
      summary: parsedData.summary || "Generated mix based on your instructions"
    };
    
  } catch (error) {
    console.error("Error parsing Claude response:", error);
    return {
      instructions: [],
      recommendedSettings: DEFAULT_MIX_SETTINGS,
      summary: "Failed to parse AI response"
    };
  }
}

/**
 * Handle API errors
 */
export function handleApiError(error: any): PromptAnalysisResult {
  const errorMessage = error.message || "Unknown error";
  console.error("API error:", errorMessage);
  
  return {
    instructions: [],
    recommendedSettings: DEFAULT_MIX_SETTINGS,
    summary: `Error: ${errorMessage}`
  };
}

/**
 * Extract mixing instructions from text
 */
function extractInstructionsFromText(text: string) {
  const instructions = [];
  
  // Extract BPM matching instructions
  if (text.includes('match BPM') || text.includes('sync tempo') || text.includes('tempo matching')) {
    instructions.push({
      type: 'bpmMatch',
      description: 'Match BPM between tracks',
      value: true,
      confidence: 0.9
    });
  }
  
  // Extract vocal level instructions
  const vocalMatch = text.match(/(?:vocals?|singing) (?:level|volume).*?(\d+)%/i);
  if (vocalMatch) {
    const vocalLevel = parseInt(vocalMatch[1]) / 100;
    instructions.push({
      type: 'vocalLevel',
      description: 'Adjust vocal levels',
      value: vocalLevel,
      confidence: 0.8
    });
  }
  
  // Extract beat level instructions
  const beatMatch = text.match(/(?:beat|drums?) (?:level|volume).*?(\d+)%/i);
  if (beatMatch) {
    const beatLevel = parseInt(beatMatch[1]) / 100;
    instructions.push({
      type: 'beatLevel',
      description: 'Adjust beat levels',
      value: beatLevel,
      confidence: 0.8
    });
  }
  
  // Extract echo/reverb instructions
  if (text.includes('echo') || text.includes('reverb')) {
    const echoMatch = text.match(/(?:echo|reverb).*?(\d+)%/i);
    const echoLevel = echoMatch ? parseInt(echoMatch[1]) / 100 : 0.3;
    
    instructions.push({
      type: 'echo',
      description: 'Add echo/reverb effect',
      value: echoLevel,
      confidence: 0.7
    });
  }
  
  // Add a default instruction if none were extracted
  if (instructions.length === 0) {
    instructions.push({
      type: 'standard',
      description: 'Create a balanced mix',
      value: true,
      confidence: 0.5
    });
  }
  
  return instructions;
}

/**
 * Extract recommended settings from text
 */
function extractSettingsFromText(text: string): MixSettingsType | null {
  // Default settings
  const settings: MixSettingsType = { ...DEFAULT_MIX_SETTINGS };
  
  // Detect if BPM matching is mentioned
  if (text.includes('match BPM') || text.includes('sync tempo')) {
    settings.bpmMatch = true;
  } else if (text.includes('don\'t match BPM') || text.includes('keep original tempo')) {
    settings.bpmMatch = false;
  }
  
  // Extract vocal levels
  const vocalMatch = text.match(/(?:vocals?|singing).*?(\d+)%/i);
  if (vocalMatch) {
    const vocalLevel = parseInt(vocalMatch[1]) / 100;
    settings.vocalLevel1 = vocalLevel;
    settings.vocalLevel2 = vocalLevel;
  }
  
  // Extract beat levels
  const beatMatch = text.match(/(?:beat|drums?).*?(\d+)%/i);
  if (beatMatch) {
    const beatLevel = parseInt(beatMatch[1]) / 100;
    settings.beatLevel1 = beatLevel;
    settings.beatLevel2 = beatLevel;
  }
  
  // Extract crossfade length
  const crossfadeMatch = text.match(/(?:crossfade|transition).*?(\d+)\s*(?:sec|seconds)/i);
  if (crossfadeMatch) {
    const crossfade = parseInt(crossfadeMatch[1]);
    settings.crossfadeLength = Math.min(16, Math.max(1, crossfade));
  }
  
  // Extract echo amount
  const echoMatch = text.match(/(?:echo|reverb).*?(\d+)%/i);
  if (echoMatch) {
    settings.echo = parseInt(echoMatch[1]) / 100;
  }
  
  return settings;
}

/**
 * Extract summary from text
 */
function extractSummaryFromText(text: string): string | null {
  // Try to find a summary section
  const summaryMatch = text.match(/(?:summary|overview|in summary)[:;]\s*(.*?)(?:\n|$)/i);
  if (summaryMatch) {
    return summaryMatch[1].trim();
  }
  
  // If no explicit summary, take the first sentence that's not too long
  const sentences = text.split(/[.!?]\s+/);
  for (const sentence of sentences) {
    if (sentence.length > 20 && sentence.length < 120) {
      return sentence.trim() + '.';
    }
  }
  
  return null;
}
