
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, GitBranch, Sliders, Wand2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MixModeSwitcherProps {
  mixMode: 'manual' | 'prompt';
  setMixMode: (mode: 'manual' | 'prompt') => void;
  mixingMode: 'standard' | 'staged';
  toggleMixingMode: () => void;
  track1Url?: string;
  track2Url?: string;
}

export const MixModeSwitcher: React.FC<MixModeSwitcherProps> = ({
  mixMode,
  setMixMode,
  mixingMode,
  toggleMixingMode,
  track1Url,
  track2Url
}) => {
  if (!track1Url && !track2Url) return null;
  
  return (
    <div className="flex flex-col space-y-4 mb-2">
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant={mixMode === 'manual' ? 'default' : 'outline'}
          onClick={() => setMixMode('manual')}
          className={`flex items-center ${mixMode === 'manual' ? 'bg-mixify-purple hover:bg-mixify-purple-dark' : ''}`}
        >
          <Sliders className="mr-2 h-4 w-4" />
          Manual Mix
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={mixMode === 'prompt' ? 'default' : 'outline'}
                onClick={() => setMixMode('prompt')}
                className={`flex items-center ${mixMode === 'prompt' ? 'bg-mixify-purple hover:bg-mixify-purple-dark' : ''}`}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                AI Prompt Mix
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Describe how you want your mix to sound in plain language</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex items-center justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={toggleMixingMode}
                className="text-xs"
                size="sm"
              >
                <GitBranch className="mr-2 h-3 w-3" />
                {mixingMode === 'standard' ? 'Switch to Multi-Stage Mixing' : 'Switch to Standard Mixing'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{mixingMode === 'standard' 
                ? 'Multi-stage mixing gives you control at each step of the mixing process' 
                : 'Standard mixing creates your mix in one go'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
