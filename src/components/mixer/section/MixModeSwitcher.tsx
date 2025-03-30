
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, GitBranch } from 'lucide-react';

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
          className={mixMode === 'manual' ? 'bg-mixify-purple hover:bg-mixify-purple-dark' : ''}
        >
          Manual Mix
        </Button>
        <Button
          variant={mixMode === 'prompt' ? 'default' : 'outline'}
          onClick={() => setMixMode('prompt')}
          className={mixMode === 'prompt' ? 'bg-mixify-purple hover:bg-mixify-purple-dark' : ''}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          AI Prompt Mix
        </Button>
      </div>
      
      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          onClick={toggleMixingMode}
          className="text-xs"
          size="sm"
        >
          <GitBranch className="mr-2 h-3 w-3" />
          {mixingMode === 'standard' ? 'Switch to Multi-Stage Mixing' : 'Switch to Standard Mixing'}
        </Button>
      </div>
    </div>
  );
};
