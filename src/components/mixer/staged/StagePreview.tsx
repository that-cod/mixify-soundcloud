
import React, { useEffect, useRef, useState } from 'react';
import { WaveformDisplay } from '../WaveformDisplay';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StagePreviewProps {
  previewUrl: string | undefined;
  showControls?: boolean;
}

export const StagePreview: React.FC<StagePreviewProps> = ({ 
  previewUrl,
  showControls = false 
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Create audio element for playback when preview URL changes
    if (previewUrl && audioRef.current) {
      audioRef.current.src = previewUrl;
      audioRef.current.load();
      setIsLoaded(false);
      
      // Reset playing state when URL changes
      setIsPlaying(false);
    }
  }, [previewUrl]);
  
  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleCanPlay = () => setIsLoaded(true);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      toast({
        title: "Audio Error",
        description: "There was a problem loading the audio file.",
        variant: "destructive",
      });
      setIsLoaded(false);
      setIsPlaying(false);
    };
    
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [toast]);
  
  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.play().catch(err => {
        console.error("Error playing audio:", err);
        toast({
          title: "Playback Error",
          description: "Could not play the audio. Please try again.",
          variant: "destructive",
        });
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, toast]);
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  const downloadTrack = () => {
    if (previewUrl) {
      const a = document.createElement('a');
      a.href = previewUrl;
      a.download = 'mixify-mixed-track.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!previewUrl) {
    return null;
  }
  
  return (
    <div className="mb-4">
      <h4 className="text-sm font-medium mb-2">Stage Preview</h4>
      <WaveformDisplay 
        audioUrl={previewUrl} 
        height={60}
        color="#9b87f5"
      />
      <audio 
        ref={audioRef} 
        style={{ display: 'none' }} 
        preload="auto"
      />
      
      {showControls && (
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlayback}
            disabled={!isLoaded}
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTrack}
            disabled={!isLoaded}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
};
