
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AudioWaveform, Music3, Clock } from 'lucide-react';
import { AudioFeatures } from '@/types/audio';

interface TrackAnalysisProps {
  trackName: string;
  features?: AudioFeatures | null;
  isLoading?: boolean;
  duration?: number;
  analyzingProgress?: number;
  isCompact?: boolean;
}

export const TrackAnalysis: React.FC<TrackAnalysisProps> = ({
  trackName,
  features = null,
  isLoading = false,
  duration = 0,
  analyzingProgress = 0,
  isCompact = false,
}) => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-mixify-purple to-mixify-accent animate-pulse-opacity" />
            <div className="truncate">{trackName}</div>
          </CardTitle>
          <CardDescription className="text-xs">
            {analyzingProgress > 0 
              ? `Analyzing track... ${analyzingProgress}%` 
              : "Analyzing track..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <AudioWaveform className="h-10 w-10 text-mixify-purple-light animate-pulse-opacity" />
            <p className="text-sm text-white/70">Extracting audio features</p>
            
            {analyzingProgress > 0 && (
              <div className="w-full max-w-md h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-mixify-purple to-mixify-accent" 
                  style={{ width: `${analyzingProgress}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`glass-card overflow-hidden ${isCompact ? 'p-2' : ''}`}>
      <CardHeader className={isCompact ? "p-2 pb-1" : "pb-2"}>
        <CardTitle className={`${isCompact ? 'text-sm' : 'text-base'} flex items-center gap-2`}>
          <Music3 className="h-4 w-4 text-mixify-purple-light" />
          <div className="truncate">{trackName}</div>
        </CardTitle>
        {!isCompact && <CardDescription className="text-xs">Analysis Results</CardDescription>}
      </CardHeader>
      <CardContent className={isCompact ? "p-2 py-1" : "py-4"}>
        <div className={`grid grid-cols-2 gap-${isCompact ? '2' : '4'}`}>
          <div className={`flex flex-col items-center p-${isCompact ? '1' : '3'} rounded-md bg-white/5`}>
            <span className="text-xs text-white/60 mb-1">Tempo</span>
            <span className={`${isCompact ? 'text-sm' : 'text-base'} font-medium`}>
              {features ? `${features.bpm}` : "0"} <span className="text-xs">BPM</span>
            </span>
          </div>
          <div className={`flex flex-col items-center p-${isCompact ? '1' : '3'} rounded-md bg-white/5`}>
            <span className="text-xs text-white/60 mb-1">Key</span>
            <span className={`${isCompact ? 'text-sm' : 'text-base'} font-medium`}>
              {features ? features.key : "Unknown"}
            </span>
          </div>
        </div>
        
        {features && !isCompact && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-3 rounded-md bg-white/5">
              <span className="text-xs text-white/60 mb-1">Energy</span>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                  style={{ width: `${features.energy * 100}%` }}
                />
              </div>
            </div>
            <div className="flex flex-col items-center p-3 rounded-md bg-white/5">
              <span className="text-xs text-white/60 mb-1">Clarity</span>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-teal-500" 
                  style={{ width: `${features.clarity * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
