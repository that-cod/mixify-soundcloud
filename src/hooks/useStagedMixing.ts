
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { MixSettingsType } from '@/types/mixer';
import { AudioFeatures } from '@/types/audio';
import { API } from '@/config';
import { MixingStage, StageStatus, StagedMixSettings } from '@/components/mixer/StagedMixingProcess';

interface UseStagedMixingProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  track1Info: {path: string, name: string} | null;
  track2Info: {path: string, name: string} | null;
}

export const useStagedMixing = ({
  track1Url,
  track2Url,
  track1Features,
  track2Features,
  track1Info,
  track2Info
}: UseStagedMixingProps) => {
  // Mixing states
  const [isActiveStage, setIsActiveStage] = useState(false);
  const [currentStage, setCurrentStage] = useState<MixingStage>('prepare');
  const [stageStatus, setStageStatus] = useState<StageStatus>('pending');
  const [stageProgress, setStageProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [mixedTrackUrl, setMixedTrackUrl] = useState<string | undefined>();
  const [stagePreviewUrl, setStagePreviewUrl] = useState<string | undefined>();
  
  // Settings state with default values
  const [stagedSettings, setStagedSettings] = useState<StagedMixSettings>({
    // Stem separation
    stemSeparationQuality: 0.8,
    
    // BPM matching
    bpmMatchEnabled: true,
    bpmMatchStrength: 0.7,
    
    // Vocal processing
    vocalLevel1: 0.8,
    vocalLevel2: 0.5,
    vocalEQ: 0.5,
    
    // Beat processing
    beatLevel1: 0.6,
    beatLevel2: 0.8,
    beatEQ: 0.5,
    
    // Effects
    echo: 0.2,
    reverb: 0.3,
    compression: 0.4,
    
    // Final mix
    crossfadeLength: 0.5, // normalized 0-1 value (will be converted to seconds)
    outputGain: 0.7,
    stereoWidth: 0.5
  });
  
  const { toast } = useToast();
  
  // Start the staged mixing process
  const startStagedMixing = () => {
    if (!track1Url || !track2Url || !track1Features || !track2Features) {
      toast({
        title: "Missing tracks",
        description: "Please upload both tracks before mixing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsActiveStage(true);
    setCurrentStage('prepare');
    setStageStatus('pending');
    setStageProgress(0);
    setOverallProgress(0);
    setMixedTrackUrl(undefined);
  };
  
  // Cancel the staged mixing process
  const cancelStagedMixing = () => {
    setIsActiveStage(false);
  };
  
  // Update a single setting
  const updateStagedSetting = (setting: keyof StagedMixSettings, value: number | boolean) => {
    setStagedSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Show toast when setting is updated
    if (typeof value === 'boolean') {
      toast({
        title: "Setting Updated",
        description: `${formatSettingName(setting)}: ${value ? 'Enabled' : 'Disabled'}`,
      });
    } else {
      toast({
        title: "Setting Updated",
        description: `${formatSettingName(setting)}: ${Math.round(Number(value) * 100)}%`,
      });
    }
  };
  
  // When a stage is completed
  const completeStage = (previewUrl?: string) => {
    setStageStatus('complete');
    if (previewUrl) {
      setStagePreviewUrl(previewUrl);
    }
  };
  
  // When mixing is completed
  const completeMixing = (mixedUrl: string) => {
    setMixedTrackUrl(mixedUrl);
    setIsActiveStage(false);
    
    toast({
      title: "Mix Complete",
      description: "Your tracks have been successfully mixed!",
    });
  };
  
  // Helper to format setting names for display
  const formatSettingName = (setting: string): string => {
    return setting
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };
  
  // Convert staged settings to regular mix settings
  const convertToMixSettings = (): MixSettingsType => {
    return {
      bpmMatch: stagedSettings.bpmMatchEnabled,
      keyMatch: true, // Always enable key matching
      vocalLevel1: stagedSettings.vocalLevel1,
      vocalLevel2: stagedSettings.vocalLevel2,
      beatLevel1: stagedSettings.beatLevel1,
      beatLevel2: stagedSettings.beatLevel2,
      crossfadeLength: Math.round(stagedSettings.crossfadeLength * 16), // Convert 0-1 to seconds (max 16)
      echo: stagedSettings.echo,
      tempo: 0 // No tempo change in staged mixing
    };
  };
  
  return {
    isActiveStage,
    currentStage,
    stageStatus,
    stageProgress,
    overallProgress,
    mixedTrackUrl,
    stagePreviewUrl,
    stagedSettings,
    startStagedMixing,
    cancelStagedMixing,
    updateStagedSetting,
    completeStage,
    completeMixing,
    convertToMixSettings
  };
};
