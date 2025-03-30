
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MixingStage, StageStatus, StagedMixSettings } from './staged/types';
import { MIXING_STAGES } from './staged/mixingStages';
import { StageProgress } from './staged/StageProgress';
import { StageParameters } from './staged/StageParameters';
import { StageControls } from './staged/StageControls';
import { StagePreview } from './staged/StagePreview';
import { PlaybackControls } from './PlaybackControls';
import { formatParamLabel } from './staged/utils';
import { useToast } from '@/hooks/use-toast';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  
  // Get current stage info
  const currentStageInfo = MIXING_STAGES.find(stage => stage.id === currentStage) || MIXING_STAGES[0];
  
  // Handler for updating settings
  const updateSetting = (param: keyof StagedMixSettings, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  // Effect to handle playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          toast({
            title: "Playback Error",
            description: "Could not play the audio. Please try again.",
            variant: "destructive",
          });
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
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
    const currentIndex = MIXING_STAGES.findIndex(stage => stage.id === currentStage);
    if (currentIndex < MIXING_STAGES.length - 1) {
      const nextStage = MIXING_STAGES[currentIndex + 1].id;
      setCurrentStage(nextStage);
      setStageStatus('pending');
      setStageProgress(0);
      setOverallProgress(((currentIndex + 1) / (MIXING_STAGES.length - 1)) * 100);
    }
  };
  
  const handleRestartStage = () => {
    setStageStatus('pending');
    setStageProgress(0);
    // Reset preview for this stage
    setStagePreviewUrl(undefined);
    // Stop playback if playing
    setIsPlaying(false);
  };
  
  // Playback controls handlers
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  const restartPlayback = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
  };
  
  // Simulate stage progress (in a real implementation, this would be real-time feedback from the mixing process)
  const simulateStageProgress = () => {
    let progress = stageProgress;
    const interval = setInterval(() => {
      progress += 5;
      setStageProgress(progress);
      
      // Update overall progress
      const currentIndex = MIXING_STAGES.findIndex(stage => stage.id === currentStage);
      const stageWeight = 1 / (MIXING_STAGES.length - 1); // First stage is 'prepare', last is 'complete'
      const overallProgress = ((currentIndex * stageWeight) + (progress / 100 * stageWeight)) * 100;
      setOverallProgress(Math.min(overallProgress, 99)); // Cap at 99% until complete
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Set stage preview URL (simulated)
        let previewUrl;
        if (currentStage === 'finalMix') {
          // Use track1Url as the final mix result (in a real implementation, this would be the actual mixed track)
          previewUrl = track1Url;
          // Show success toast
          toast({
            title: "Final Mix Complete",
            description: "Your tracks have been successfully mixed!",
          });
        } else {
          // For other stages, use track1Url as a preview
          previewUrl = track1Url;
        }
        
        if (previewUrl) {
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
              if (previewUrl) {
                onComplete(previewUrl); // In real implementation, use the actual mixed URL
              }
            }, 1000);
          }
        }
      }
    }, 200);
  };

  // Show playback controls when in complete stage or when final mix is complete
  const showPlaybackControls = currentStage === 'complete' || 
    (currentStage === 'finalMix' && stageStatus === 'complete');
  
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Multi-Stage Mixing Process</CardTitle>
        <CardDescription>
          {currentStage === 'complete' 
            ? 'Mix completed successfully' 
            : currentStageInfo?.description || 'Processing tracks'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress indicators */}
        <StageProgress
          overallProgress={overallProgress}
          stageProgress={stageProgress}
          currentStage={currentStage}
          stageStatus={stageStatus}
        />
        
        {/* Stage preview */}
        <StagePreview previewUrl={stagePreviewUrl} />
        
        {/* Hidden audio element for playback */}
        <audio ref={audioRef} src={stagePreviewUrl} style={{ display: 'none' }} />
        
        {/* Playback controls for completed mix */}
        {showPlaybackControls && stagePreviewUrl && (
          <div className="my-4">
            <PlaybackControls
              isPlaying={isPlaying}
              togglePlayback={togglePlayback}
              volume={volume}
              setVolume={setVolume}
              restart={restartPlayback}
              downloadUrl={stagePreviewUrl}
              trackName="mixify-mixed-track.mp3"
            />
          </div>
        )}
        
        {/* Controls */}
        <StageControls
          currentStage={currentStage}
          status={stageStatus}
          stageName={currentStageInfo?.label || ''}
          onStartStage={handleStartStage}
          onPauseStage={handlePauseStage}
          onResumeStage={handleResumeStage}
          onSkipToNextStage={handleSkipToNextStage}
          onRestartStage={handleRestartStage}
          onCancel={onCancel}
        />
        
        {/* Adjustable parameters */}
        <StageParameters
          params={currentStageInfo?.adjustableParams || []}
          settings={settings}
          updateSetting={updateSetting}
          isProcessing={stageStatus === 'processing'}
        />
      </CardContent>
    </Card>
  );
};
