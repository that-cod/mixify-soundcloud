
import React from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

interface Instruction {
  type: string;
  description: string;
  confidence: number;
  parameters?: Record<string, any>;
}

interface PromptInstructionsListProps {
  instructions: Instruction[];
}

export const PromptInstructionsList: React.FC<PromptInstructionsListProps> = ({ 
  instructions 
}) => {
  if (!instructions || instructions.length === 0) {
    return (
      <div className="text-center py-4 text-white/60">
        <Info className="w-5 h-5 mx-auto mb-2" />
        No specific instructions detected.
      </div>
    );
  }

  // Group instructions by type
  const groupedInstructions: Record<string, Instruction[]> = {};
  
  instructions.forEach(instruction => {
    if (!groupedInstructions[instruction.type]) {
      groupedInstructions[instruction.type] = [];
    }
    groupedInstructions[instruction.type].push(instruction);
  });

  return (
    <div className="space-y-4">
      {Object.entries(groupedInstructions).map(([type, typeInstructions]) => (
        <div key={type} className="space-y-2">
          <h3 className="text-sm font-medium text-white/80 uppercase">{formatInstructionType(type)}</h3>
          <ul className="space-y-1.5">
            {typeInstructions.map((instruction, idx) => (
              <li 
                key={idx} 
                className="flex items-start text-sm"
              >
                {getConfidenceIcon(instruction.confidence)}
                <span className="ml-2">{instruction.description}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

// Helper functions
const formatInstructionType = (type: string): string => {
  return type
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
};

const getConfidenceIcon = (confidence: number) => {
  if (confidence >= 0.8) {
    return <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />;
  } else if (confidence >= 0.5) {
    return <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />;
  } else {
    return <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />;
  }
};
