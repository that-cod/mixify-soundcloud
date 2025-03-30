
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MicIcon } from 'lucide-react';
import { AudioFeatures } from '@/types/audio';

interface MixActionCardProps {
  mixingMode: 'standard' | 'staged';
  promptAnalysisResult: any | null;
  isMixing: boolean;
  mixProgress: number;
  track1Url?: string;
  track2Url?: string;
  track1Features: AudioFeatures | null;
  track2Features: AudioFeatures | null;
  handleMix: () => void;
  startStagedMixing: () => void;
}

export const MixActionCard: React.FC<MixActionCardProps> = ({
  mixingMode,
  promptAnalysisResult,
  isMixing,
  mixProgress,
  track1Url,
  track2Url,
  track1Features,
  track2Features,
  handleMix,
  startStagedMixing
}) => {
  const actionFn = mixingMode === 'staged' ? startStagedMixing : handleMix;
  const isDisabled = !track1Url || !track2Url || !track1Features || !track2Features;
  
  const getActionText = () => {
    if (mixingMode === 'staged') return "Start Multi-Stage Mix";
    if (promptAnalysisResult) return "Create AI Mix";
    return "Mix Tracks";
  };
  
  const getDescription = () => {
    if (promptAnalysisResult) {
      return "Ready to create your AI-guided mix using your instructions.";
    }
    
    if (mixingMode === 'staged') {
      return "Ready to start the multi-stage mixing process with full control at each step.";
    }
    
    return "Ready to mix your tracks? Our AI will analyze both tracks and create a professional mix.";
  };
  
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>{mixingMode === 'staged' ? 'Multi-Stage Mix' : 'Create Mix'}</CardTitle>
        <CardDescription>
          {promptAnalysisResult 
            ? "Apply AI-suggested settings and create your mix" 
            : mixingMode === 'staged' 
              ? "Mix your tracks with step-by-step control over the process"
              : "Mix your two tracks with the current settings"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isMixing ? (
          <div className="flex flex-col items-center py-4">
            <Loader2 className="h-8 w-8 text-mixify-purple-light animate-spin mb-4" />
            <p className="text-white/70 mb-2">Creating your mix...</p>
            <div className="w-full max-w-md h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-mixify-purple to-mixify-accent" 
                style={{ width: `${mixProgress}%` }}
              />
            </div>
            <p className="text-xs text-white/50 mt-2">{mixProgress}% complete</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <p className="text-white/70 mb-4">
              {getDescription()}
            </p>
            <Button 
              onClick={actionFn} 
              disabled={isDisabled}
              className="bg-mixify-purple hover:bg-mixify-purple-dark"
            >
              <MicIcon className="mr-2 h-5 w-5" />
              {getActionText()}
            </Button>
            {isDisabled && (track1Url && track2Url) && (
              <p className="text-xs text-amber-300 mt-2">Waiting for track analysis to complete...</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
