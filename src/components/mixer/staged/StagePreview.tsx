
import React, { useEffect, useRef, useState } from 'react';
import { WaveformDisplay } from '../WaveformDisplay';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, AlertCircle } from 'lucide-react';
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
  const [loadError, setLoadError] = useState(false);
  const { toast } = useToast();

  console.log("StagePreview rendering with URL:", previewUrl);

  // Reset states when URL changes
  useEffect(() => {
    if (previewUrl) {
      console.log("Preview URL changed:", previewUrl);
      setIsLoaded(false);
      setLoadError(false);
      setIsPlaying(false);
    }
  }, [previewUrl]);

  // Handle audio element setup
  useEffect(() => {
    // Create audio element for playback when preview URL changes
    if (!previewUrl) return;
    
    const audio = audioRef.current;
    if (!audio) return;
    
    // Set up audio
    audio.src = previewUrl;
    audio.load();
    
    // Handle audio events
    const handleCanPlay = () => {
      console.log("Audio can play:", previewUrl);
      setIsLoaded(true);
      setLoadError(false);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
    };
    
    const handleError = (e: Event) => {
      console.error("Audio error loading:", previewUrl, e);
      setLoadError(true);
      setIsLoaded(false);
      setIsPlaying(false);
      toast({
        title: "Audio Error",
        description: "There was a problem loading the audio file. Please try again.",
        variant: "destructive",
      });
    };
    
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [previewUrl, toast]);
  
  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLoaded) return;
    
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Error playing audio:", err);
          toast({
            title: "Playback Error",
            description: "Could not play the audio. Please try again.",
            variant: "destructive",
          });
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, isLoaded, toast]);
  
  const togglePlayback = () => {
    if (isLoaded) {
      setIsPlaying(!isPlaying);
    } else if (previewUrl && !loadError) {
      // If not loaded yet but URL exists and no error, try to load again
      if (audioRef.current) {
        audioRef.current.load();
      }
    }
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

  // If no preview URL is provided, show nothing
  if (!previewUrl) {
    return null;
  }
  
  return (
    <div className="mb-4 relative">
      <h4 className="text-sm font-medium mb-2">Stage Preview</h4>
      
      {/* Always show waveform regardless of load state */}
      <WaveformDisplay 
        audioUrl={previewUrl} 
        height={60}
        color="#9b87f5"
      />
      
      {/* Audio element */}
      <audio 
        ref={audioRef} 
        style={{ display: 'none' }} 
        preload="auto"
      />
      
      {/* Controls section */}
      {showControls && (
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlayback}
            disabled={loadError}
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTrack}
            disabled={loadError}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      )}
      
      {/* Error message when load fails */}
      {loadError && (
        <div className="text-destructive text-sm mt-2 bg-destructive/10 p-2 rounded flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-destructive" />
          Failed to load audio preview. The mixing process may not have completed correctly.
        </div>
      )}
    </div>
  );
};
