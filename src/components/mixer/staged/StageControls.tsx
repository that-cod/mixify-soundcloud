
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, ChevronRight } from 'lucide-react';
import { MixingStage, StageStatus } from './types';

interface StageControlsProps {
  currentStage: MixingStage;
  status: StageStatus;
  stageName: string;
  onStartStage: () => void;
  onPauseStage: () => void;
  onResumeStage: () => void;
  onSkipToNextStage: () => void;
  onRestartStage: () => void;
  onCancel: () => void;
}

export const StageControls: React.FC<StageControlsProps> = ({
  currentStage,
  status,
  stageName,
  onStartStage,
  onPauseStage,
  onResumeStage,
  onSkipToNextStage,
  onRestartStage,
  onCancel
}) => {
  return (
    <div className="flex items-center justify-center gap-3 my-4">
      {status === 'pending' && (
        <Button 
          onClick={onStartStage}
          className="bg-mixify-purple hover:bg-mixify-purple-dark"
        >
          <Play className="mr-2 h-4 w-4" />
          Start {stageName}
        </Button>
      )}
      
      {status === 'processing' && (
        <Button 
          onClick={onPauseStage}
          variant="outline"
        >
          <Pause className="mr-2 h-4 w-4" />
          Pause
        </Button>
      )}
      
      {status === 'paused' && (
        <Button 
          onClick={onResumeStage}
          className="bg-mixify-purple hover:bg-mixify-purple-dark"
        >
          <Play className="mr-2 h-4 w-4" />
          Resume
        </Button>
      )}
      
      {status === 'complete' && currentStage !== 'finalMix' && currentStage !== 'complete' && (
        <Button 
          onClick={onSkipToNextStage}
          className="bg-mixify-purple hover:bg-mixify-purple-dark"
        >
          <ChevronRight className="mr-2 h-4 w-4" />
          Next Stage
        </Button>
      )}
      
      {status !== 'pending' && status !== 'processing' && (
        <Button 
          onClick={onRestartStage}
          variant="outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Restart Stage
        </Button>
      )}
      
      {currentStage === 'complete' && (
        <Button 
          onClick={onCancel}
          variant="outline"
        >
          Create New Mix
        </Button>
      )}
    </div>
  );
};
