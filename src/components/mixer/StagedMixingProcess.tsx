
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  Play, 
  SkipForward, 
  Pause, 
  RefreshCw, 
  Settings2, 
  ChevronRight 
} from 'lucide-react';
import { WaveformDisplay } from './WaveformDisplay';

// Define the stages of the mixing process
export type MixingStage = 
  | 'prepare' 
  | 'stemSeparation' 
  | 'bpmMatching' 
  | 'vocalProcessing' 
  | 'beatProcessing' 
  | 'effectsApplication' 
  | 'finalMix' 
  | 'complete';

export type StageStatus = 'pending' | 'processing' | 'complete' | 'paused';

export interface StageInfo {
  id: MixingStage;
  label: string;
  description: string;
  adjustableParams: string[];
}

// Define the parameters that can be adjusted at each stage
export interface StagedMixSettings {
  // Stage: stemSeparation
  stemSeparationQuality: number;
  
  // Stage: bpmMatching
  bpmMatchEnabled: boolean;
  bpmMatchStrength: number;
  
  // Stage: vocalProcessing
  vocalLevel1: number;
  vocalLevel2: number;
  vocalEQ: number;
  
  // Stage: beatProcessing
  beatLevel1: number;
  beatLevel2: number;
  beatEQ: number;
  
  // Stage: effectsApplication
  echo: number;
  reverb: number;
  compression: number;
  
  // Stage: finalMix
  crossfadeLength: number;
  outputGain: number;
  stereoWidth: number;
}

interface StagedMixingProcessProps {
  track1Url: string | undefined;
  track2Url: string | undefined;
  onComplete: (mixedUrl: string) => void;
  onCancel: () => void;
  initialSettings: StagedMixSettings;
}

export const StagedMixingProcess: React.FC<StagedMixingProcessProps> = ({
  track1Url,
  track2Url,
  onComplete,
  onCancel,
  initialSettings
}) => {
  // States for the mixing process
  const [currentStage, setCurrentStage] = useState<MixingStage>('prepare');
  const [stageStatus, setStageStatus] = useState<StageStatus>('pending');
  const [stageProgress, setStageProgress] = useState(0);
  const [stagePreviewUrl, setStagePreviewUrl] = useState<string | undefined>();
  const [settings, setSettings] = useState<StagedMixSettings>(initialSettings);
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Define the stages of the process
  const stages: StageInfo[] = [
    {
      id: 'prepare',
      label: 'Prepare Tracks',
      description: 'Loading and preprocessing audio files',
      adjustableParams: []
    },
    {
      id: 'stemSeparation',
      label: 'Stem Separation',
      description: 'Separating vocals, drums, bass, and other instruments',
      adjustableParams: ['stemSeparationQuality']
    },
    {
      id: 'bpmMatching',
      label: 'BPM Matching',
      description: 'Synchronizing the tempo of both tracks',
      adjustableParams: ['bpmMatchEnabled', 'bpmMatchStrength']
    },
    {
      id: 'vocalProcessing',
      label: 'Vocal Processing',
      description: 'Adjusting vocal levels and applying effects',
      adjustableParams: ['vocalLevel1', 'vocalLevel2', 'vocalEQ']
    },
    {
      id: 'beatProcessing',
      label: 'Beat Processing',
      description: 'Adjusting drum and bass levels',
      adjustableParams: ['beatLevel1', 'beatLevel2', 'beatEQ']
    },
    {
      id: 'effectsApplication',
      label: 'Effects',
      description: 'Applying audio effects to enhance the mix',
      adjustableParams: ['echo', 'reverb', 'compression']
    },
    {
      id: 'finalMix',
      label: 'Final Mix',
      description: 'Combining all elements into final output',
      adjustableParams: ['crossfadeLength', 'outputGain', 'stereoWidth']
    },
    {
      id: 'complete',
      label: 'Complete',
      description: 'Mix completed successfully',
      adjustableParams: []
    }
  ];
  
  // Get current stage info
  const currentStageInfo = stages.find(stage => stage.id === currentStage) || stages[0];
  
  // Handler for updating settings
  const updateSetting = (param: keyof StagedMixSettings, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  // Handlers for process control
  const handleStartStage = () => {
    setStageStatus('processing');
    // In a real implementation, this would call the mixing service
    simulateStageProgress();
  };
  
  const handlePauseStage = () => {
    setStageStatus('paused');
  };
  
  const handleResumeStage = () => {
    setStageStatus('processing');
    simulateStageProgress();
  };
  
  const handleSkipToNextStage = () => {
    const currentIndex = stages.findIndex(stage => stage.id === currentStage);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1].id;
      setCurrentStage(nextStage);
      setStageStatus('pending');
      setStageProgress(0);
      setOverallProgress(((currentIndex + 1) / (stages.length - 1)) * 100);
    }
  };
  
  const handleRestartStage = () => {
    setStageStatus('pending');
    setStageProgress(0);
    // Reset preview for this stage
    setStagePreviewUrl(undefined);
  };
  
  // Simulate stage progress (in a real implementation, this would be real-time feedback from the mixing process)
  const simulateStageProgress = () => {
    let progress = stageProgress;
    const interval = setInterval(() => {
      progress += 5;
      setStageProgress(progress);
      
      // Update overall progress
      const currentIndex = stages.findIndex(stage => stage.id === currentStage);
      const stageWeight = 1 / (stages.length - 1); // First stage is 'prepare', last is 'complete'
      const overallProgress = ((currentIndex * stageWeight) + (progress / 100 * stageWeight)) * 100;
      setOverallProgress(Math.min(overallProgress, 99)); // Cap at 99% until complete
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Set stage preview URL (simulated)
        const previewUrl = currentStage === 'finalMix' 
          ? track1Url // Just for demo, in real implementation this would be a real preview
          : track1Url;
          
        setStagePreviewUrl(previewUrl);
        setStageStatus('complete');
        
        // Automatically proceed to next stage if not the final stage
        if (currentStage !== 'finalMix') {
          setTimeout(() => handleSkipToNextStage(), 1000);
        } else {
          // If this is the final stage, mark as complete
          setTimeout(() => {
            setCurrentStage('complete');
            setOverallProgress(100);
            if (track1Url) {
              onComplete(track1Url); // In real implementation, use the actual mixed URL
            }
          }, 1000);
        }
      }
    }, 200);
  };
  
  // Generate param controls based on the current stage
  const renderParamControls = () => {
    if (!currentStageInfo.adjustableParams.length) {
      return null;
    }
    
    return (
      <div className="space-y-4 mt-4 p-4 bg-black/10 rounded-md">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Adjustable Parameters
        </h4>
        
        {currentStageInfo.adjustableParams.map(param => {
          const paramKey = param as keyof StagedMixSettings;
          const paramValue = settings[paramKey];
          
          if (typeof paramValue === 'boolean') {
            return (
              <div key={param} className="flex justify-between items-center">
                <Label htmlFor={param} className="text-xs">{formatParamLabel(param)}</Label>
                <input
                  type="checkbox"
                  id={param}
                  checked={paramValue}
                  onChange={e => updateSetting(paramKey, e.target.checked)}
                  disabled={stageStatus === 'processing'}
                  className="h-4 w-4"
                />
              </div>
            );
          }
          
          return (
            <div key={param} className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor={param} className="text-xs">{formatParamLabel(param)}</Label>
                <span className="text-xs text-white/50">
                  {typeof paramValue === 'number' ? Math.round(paramValue * 100) + '%' : paramValue}
                </span>
              </div>
              <Slider
                id={param}
                value={[typeof paramValue === 'number' ? paramValue * 100 : Number(paramValue)]}
                min={0}
                max={100}
                step={5}
                disabled={stageStatus === 'processing'}
                onValueChange={value => updateSetting(paramKey, value[0] / 100)}
              />
            </div>
          );
        })}
      </div>
    );
  };
  
  // Helper to format parameter labels
  const formatParamLabel = (param: string): string => {
    // Convert camelCase to Title Case with spaces
    return param
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/([0-9]+)/g, ' $1');
  };
  
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Multi-Stage Mixing Process</CardTitle>
        <CardDescription>
          {currentStageInfo?.description || 'Processing tracks'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overall progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-white/70">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-mixify-purple to-mixify-accent" 
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
        
        {/* Stages progress */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {stages.filter(stage => stage.id !== 'prepare' && stage.id !== 'complete').map((stage, index) => {
              const isActive = stage.id === currentStage;
              const isCompleted = stages.findIndex(s => s.id === currentStage) > stages.findIndex(s => s.id === stage.id);
              
              return (
                <div 
                  key={stage.id}
                  className={`relative px-3 py-1.5 text-xs rounded-full flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-mixify-purple text-white' 
                      : isCompleted 
                        ? 'bg-mixify-purple/30 text-white/80' 
                        : 'bg-white/10 text-white/50'
                  }`}
                >
                  <span>{index + 1}</span>
                  <span>{stage.label}</span>
                  {isCompleted && <span className="h-1.5 w-1.5 rounded-full bg-green-400" />}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Current stage info */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {currentStageInfo?.label}
              {stageStatus === 'processing' && (
                <Loader2 className="h-4 w-4 text-mixify-purple-light animate-spin" />
              )}
            </h3>
            <span className="text-sm text-white/70">{Math.round(stageProgress)}%</span>
          </div>
          
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-mixify-purple" 
              style={{ width: `${stageProgress}%` }}
            />
          </div>
          
          {/* Stage preview */}
          {stagePreviewUrl && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Stage Preview</h4>
              <WaveformDisplay 
                audioUrl={stagePreviewUrl} 
                height={60}
                color="#9b87f5"
              />
            </div>
          )}
          
          {/* Controls */}
          <div className="flex items-center justify-center gap-3 my-4">
            {stageStatus === 'pending' && (
              <Button 
                onClick={handleStartStage}
                className="bg-mixify-purple hover:bg-mixify-purple-dark"
              >
                <Play className="mr-2 h-4 w-4" />
                Start {currentStageInfo?.label}
              </Button>
            )}
            
            {stageStatus === 'processing' && (
              <Button 
                onClick={handlePauseStage}
                variant="outline"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            
            {stageStatus === 'paused' && (
              <Button 
                onClick={handleResumeStage}
                className="bg-mixify-purple hover:bg-mixify-purple-dark"
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            
            {stageStatus === 'complete' && currentStage !== 'finalMix' && currentStage !== 'complete' && (
              <Button 
                onClick={handleSkipToNextStage}
                className="bg-mixify-purple hover:bg-mixify-purple-dark"
              >
                <ChevronRight className="mr-2 h-4 w-4" />
                Next Stage
              </Button>
            )}
            
            {stageStatus !== 'pending' && stageStatus !== 'processing' && (
              <Button 
                onClick={handleRestartStage}
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Restart Stage
              </Button>
            )}
            
            {currentStage === 'complete' && (
              <Button 
                onClick={() => onCancel()}
                variant="outline"
              >
                Create New Mix
              </Button>
            )}
          </div>
          
          {/* Adjustable parameters */}
          {renderParamControls()}
        </div>
      </CardContent>
    </Card>
  );
};
