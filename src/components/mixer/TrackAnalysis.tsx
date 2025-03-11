
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Waveform, Music3, Clock } from 'lucide-react';

interface TrackAnalysisProps {
  trackName: string;
  isLoading?: boolean;
  genre?: string;
  bpm?: number;
  key?: string;
  duration?: number;
}

export const TrackAnalysis: React.FC<TrackAnalysisProps> = ({
  trackName,
  isLoading = false,
  genre = "Unknown",
  bpm = 0,
  key = "Unknown",
  duration = 0,
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
          <CardDescription className="text-xs">Analyzing track...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <div className="flex flex-col items-center justify-center gap-3">
            <Waveform className="h-10 w-10 text-mixify-purple-light animate-pulse-opacity" />
            <p className="text-sm text-white/70">Extracting audio features</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Music3 className="h-4 w-4 text-mixify-purple-light" />
          <div className="truncate">{trackName}</div>
        </CardTitle>
        <CardDescription className="text-xs">Analysis Results</CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center p-3 rounded-md bg-white/5">
            <span className="text-xs text-white/60 mb-1">Genre</span>
            <Badge variant="outline" className="font-normal text-xs bg-white/10">
              {genre}
            </Badge>
          </div>
          <div className="flex flex-col items-center p-3 rounded-md bg-white/5">
            <span className="text-xs text-white/60 mb-1">Tempo</span>
            <span className="text-base font-medium">{bpm} <span className="text-xs">BPM</span></span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-md bg-white/5">
            <span className="text-xs text-white/60 mb-1">Key</span>
            <span className="text-base font-medium">{key}</span>
          </div>
          <div className="flex flex-col items-center p-3 rounded-md bg-white/5">
            <span className="text-xs text-white/60 mb-1">Duration</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-white/70" />
              <span className="text-base font-medium">{formatDuration(duration)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
