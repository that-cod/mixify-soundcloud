
import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  Volume2,
  Volume1,
  VolumeX,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface PlaybackControlsProps {
  isPlaying: boolean;
  togglePlayback: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  restart: () => void;
  downloadUrl?: string;
  trackName?: string;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  togglePlayback,
  volume,
  setVolume,
  restart,
  downloadUrl,
  trackName,
}) => {
  const downloadTrack = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = trackName || 'mixify-track.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX />;
    if (volume < 0.5) return <Volume1 />;
    return <Volume2 />;
  };

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg border border-white/10 bg-black/30">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={restart}
                className="h-8 w-8 border-white/20 bg-white/5"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Restart</p>
            </TooltipContent>
          </Tooltip>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={togglePlayback}
            className="h-10 w-10 rounded-full border-white/20 bg-white/5"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center gap-3 flex-1 max-w-[180px]">
          <button onClick={() => setVolume(volume === 0 ? 0.5 : 0)}>
            {getVolumeIcon()}
          </button>
          <Slider
            value={[volume * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => setVolume(value[0] / 100)}
            className="flex-1"
          />
        </div>
        
        {downloadUrl && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={downloadTrack}
                className="h-8 w-8 border-white/20 bg-white/5"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download Track</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
