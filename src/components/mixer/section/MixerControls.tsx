
import React, { useState } from 'react';
import { PromptAnalysisResult } from '@/services/openai-service';
import { MixSettings } from '../MixSettings';
import { PromptMixingInterface } from '../PromptMixingInterface';
import { MixActionCard } from './MixActionCard';
import { MixModeSwitcher } from './MixModeSwitcher';
import { AudioFeatures } from '@/types/audio';
import { StagedMixSettings } from '../staged/types';
import { ApiKeyStatus } from '../ApiKeyStatus';
import { useToast } from '@/hooks/use-toast';
import { useApiKeyStatus } from '@/hooks/useApiKeyStatus';

interface MixerControlsProps {
  track1Url?: string;
  track2Url?: string;
  track1Name?: string;
  track2Name?: string;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  mixSettings: any;
  updateMixSetting: (setting: string, value: number | boolean) => void;
  isMixing: boolean;
  mixProgress: number;
  handleMix: () => void;
  
  // Prompt related props
  isProcessingPrompt: boolean;
  promptProcessProgress: number;
  promptAnalysisResult: PromptAnalysisResult | null;
  handlePromptMix: (prompt: string) => void;
  
  // Staged mixing props
  mixingMode: 'standard' | 'staged';
  toggleMixingMode: () => void;
  isActiveStage: boolean;
  startStagedMixing: () => void;
  stagedSettings: StagedMixSettings;
  updateStagedSetting: (setting: keyof StagedMixSettings, value: number | boolean) => void;
}

export const MixerControls: React.FC<MixerControlsProps> = ({
  track1Url,
  track2Url,
  track1Name,
  track2Name,
  track1Features,
  track2Features,
  mixSettings,
  updateMixSetting,
  isMixing,
  mixProgress,
  handleMix,
  isProcessingPrompt,
  promptProcessProgress,
  promptAnalysisResult,
  handlePromptMix,
  mixingMode,
  toggleMixingMode,
  isActiveStage,
  startStagedMixing,
  stagedSettings,
  updateStagedSetting
}) => {
  const [mixMode, setMixMode] = useState<'manual' | 'prompt'>('manual');
  const { toast } = useToast();
  const { openai } = useApiKeyStatus();
  
  // Calculate if OpenAI key is valid
  const anyKeyValid = openai?.valid === true;

  const handlePromptSubmit = (prompt: string) => {
    // Check for API key before submitting
    if (!anyKeyValid) {
      toast({
        title: "API Key Issue",
        description: "No valid OpenAI API key found. Please check API key status.",
        variant: "destructive",
      });
      return;
    }
    
    // Process the prompt
    handlePromptMix(prompt);
  };

  // Handle the Apply and Mix button clicked in the PromptMixingInterface
  const handleApplyAndMix = () => {
    if (promptAnalysisResult) {
      toast({
        title: "Applying AI Suggestions",
        description: "Creating mix based on your instructions...",
      });
      handleMix();
    }
  };

  if (!track1Url && !track2Url) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Display API key status */}
      <ApiKeyStatus />

      <MixModeSwitcher 
        mixMode={mixMode} 
        setMixMode={setMixMode}
        mixingMode={mixingMode}
        toggleMixingMode={toggleMixingMode}
        track1Url={track1Url}
        track2Url={track2Url}
      />

      {mixMode === 'manual' && (track1Url || track2Url) && (
        <MixSettings 
          mixSettings={mixSettings}
          updateMixSetting={updateMixSetting}
          track1Features={track1Features}
          track2Features={track2Features}
        />
      )}

      {mixMode === 'prompt' && (track1Url || track2Url) && (
        <PromptMixingInterface
          isProcessing={isProcessingPrompt}
          processProgress={promptProcessProgress}
          track1Features={track1Features}
          track2Features={track2Features}
          track1Name={track1Name}
          track2Name={track2Name}
          promptAnalysisResult={promptAnalysisResult}
          onPromptSubmit={handlePromptSubmit}
          onApplyAndMix={handleApplyAndMix}
        />
      )}
    
      {(mixMode === 'manual' || (mixMode === 'prompt' && promptAnalysisResult)) && (
        <MixActionCard
          mixingMode={mixingMode}
          promptAnalysisResult={promptAnalysisResult}
          isMixing={isMixing}
          mixProgress={mixProgress}
          track1Url={track1Url}
          track2Url={track2Url}
          track1Features={track1Features}
          track2Features={track2Features}
          handleMix={handleMix}
          startStagedMixing={startStagedMixing}
        />
      )}
    </div>
  );
};
