
import React from 'react';
import { Loader2 } from 'lucide-react';
import { MixingStage, StageStatus } from './types';
import { MIXING_STAGES } from './mixingStages';

interface StageProgressProps {
  overallProgress: number;
  stageProgress: number;
  currentStage: MixingStage;
  stageStatus: StageStatus;
}

export const StageProgress: React.FC<StageProgressProps> = ({
  overallProgress,
  stageProgress,
  currentStage,
  stageStatus
}) => {
  return (
    <>
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
          {MIXING_STAGES.filter(stage => stage.id !== 'prepare' && stage.id !== 'complete').map((stage, index) => {
            const isActive = stage.id === currentStage;
            const isCompleted = MIXING_STAGES.findIndex(s => s.id === currentStage) > MIXING_STAGES.findIndex(s => s.id === stage.id);
            
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
      
      {/* Current stage progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {MIXING_STAGES.find(stage => stage.id === currentStage)?.label}
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
      </div>
    </>
  );
};
