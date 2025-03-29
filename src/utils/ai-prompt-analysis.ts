
import { PromptAnalysisResult } from '@/services/anthropic-service';

/**
 * Get insights about instructions grouped by type
 */
export const getInstructionInsights = (promptAnalysisResult: PromptAnalysisResult | null) => {
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
