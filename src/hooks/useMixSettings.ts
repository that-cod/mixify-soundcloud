
import { useState } from 'react';
import { MixSettingsType } from '@/types/mixer';
import { PromptAnalysisResult } from '@/services/anthropic-service';

export const useMixSettings = () => {
  // Mix settings
  const [mixSettings, setMixSettings] = useState<MixSettingsType>({
    bpmMatch: true,
    keyMatch: true,
    vocalLevel1: 0.8,
    vocalLevel2: 0.5,
    beatLevel1: 0.6,
    beatLevel2: 0.8,
    crossfadeLength: 8, // seconds
    echo: 0.2,
    tempo: 0, // -0.5 to 0.5, 0 means no change
  });
  
  // Last prompt analysis results
  const [lastPromptAnalysis, setLastPromptAnalysis] = useState<PromptAnalysisResult | null>(null);
  
  const updateMixSetting = (setting: keyof MixSettingsType, value: number | boolean) => {
    setMixSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const updateMixSettings = (newSettings: MixSettingsType) => {
    setMixSettings(newSettings);
    // Log the updated settings for debugging
    console.log("Mix settings updated:", newSettings);
  };
  
  // Apply specific mixing instructions from prompt analysis
  const applyPromptInstructions = (promptAnalysis: PromptAnalysisResult) => {
    setLastPromptAnalysis(promptAnalysis);
    
    // First apply the recommended settings
    updateMixSettings(promptAnalysis.recommendedSettings);
    
    // Then process any additional instructions that weren't directly mapped to settings
    const specialInstructions = promptAnalysis.instructions.filter(
      instruction => instruction.confidence > 0.7
    );
    
    console.log("Applying special mixing instructions:", specialInstructions);
    
    return promptAnalysis;
  };
  
  return {
    mixSettings,
    updateMixSetting,
    updateMixSettings,
    applyPromptInstructions,
    lastPromptAnalysis
  };
};
