
import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { WaveformDisplay } from '@/components/mixer/WaveformDisplay';
import { AudioUploader } from '@/components/mixer/AudioUploader';
import { PlaybackControls } from '@/components/mixer/PlaybackControls';
import { TrackAnalysis } from '@/components/mixer/TrackAnalysis';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MicIcon, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import WaveSurfer from 'wavesurfer.js';
import { createBucketIfNotExists, STORAGE_BUCKET } from '@/lib/supabase';

const Mixer: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Track states
  const [track1Url, setTrack1Url] = useState<string | undefined>();
  const [track1Name, setTrack1Name] = useState<string | undefined>();
  const [track2Url, setTrack2Url] = useState<string | undefined>();
  const [track2Name, setTrack2Name] = useState<string | undefined>();
  const [mixedTrackUrl, setMixedTrackUrl] = useState<string | undefined>();
  
  // Storage states
  const [storageReady, setStorageReady] = useState<boolean | null>(null);
  
  // Analysis states (would be populated by backend)
  const [track1Analysis, setTrack1Analysis] = useState({
    isLoading: false,
    genre: 'Pop',
    bpm: 120,
    key: 'C Major',
    duration: 180,
  });
  const [track2Analysis, setTrack2Analysis] = useState({
    isLoading: false,
    genre: 'Electronic',
    bpm: 128,
    key: 'A Minor',
    duration: 210,
  });
  
  // Mixing states
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  
  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  
  // WaveSurfer refs
  const wavesurfer1Ref = useRef<WaveSurfer | null>(null);
  const wavesurfer2Ref = useRef<WaveSurfer | null>(null);
  const mixedWavesurferRef = useRef<WaveSurfer | null>(null);
  
  // Check storage bucket on component mount
  useEffect(() => {
    const checkStorage = async () => {
      try {
        console.log("Mixer: Checking storage bucket...");
        const result = await createBucketIfNotExists(STORAGE_BUCKET, true);
        setStorageReady(result);
        
        if (!result) {
          console.error(`Mixer: Failed to ensure bucket "${STORAGE_BUCKET}" exists`);
          toast({
            title: "Storage Setup Issue",
            description: `Please make sure you've created a bucket named "${STORAGE_BUCKET}" in your Supabase project with public access.`,
            variant: "destructive",
          });
        } else {
          console.log(`Mixer: Bucket "${STORAGE_BUCKET}" is ready for use`);
        }
      } catch (err) {
        console.error("Mixer: Error checking storage bucket:", err);
        setStorageReady(false);
        toast({
          title: "Storage Error",
          description: "Could not initialize storage. Check console for details.",
          variant: "destructive",
        });
      }
    };
    
    checkStorage();
  }, [toast]);
  
  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const handleTrack1Upload = (url: string, fileName: string) => {
    console.log("Mixer: Track 1 upload complete:", { url, fileName });
    setTrack1Url(url);
    setTrack1Name(fileName);
    setTrack1Analysis(prev => ({ ...prev, isLoading: true }));
    
    // Simulate analysis
    setTimeout(() => {
      setTrack1Analysis({
        isLoading: false,
        genre: 'Pop',
        bpm: 120,
        key: 'C Major',
        duration: 180,
      });
    }, 3000);
  };
  
  const handleTrack2Upload = (url: string, fileName: string) => {
    console.log("Mixer: Track 2 upload complete:", { url, fileName });
    setTrack2Url(url);
    setTrack2Name(fileName);
    setTrack2Analysis(prev => ({ ...prev, isLoading: true }));
    
    // Simulate analysis
    setTimeout(() => {
      setTrack2Analysis({
        isLoading: false,
        genre: 'Electronic',
        bpm: 128,
        key: 'A Minor',
        duration: 210,
      });
    }, 3000);
  };
  
  const handleMix = () => {
    if (!track1Url || !track2Url) {
      toast({
        title: "Missing tracks",
        description: "Please upload both tracks before mixing.",
        variant: "destructive",
      });
      return;
    }
    
    setIsMixing(true);
    
    // Simulate mixing process
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setMixProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsMixing(false);
        // In a real app, this would be the mixed track URL from the server
        setMixedTrackUrl(track1Url); 
        
        toast({
          title: "Mix complete",
          description: "Your tracks have been successfully mixed!",
        });
      }
    }, 500);
  };
  
  const togglePlayback = () => {
    if (mixedWavesurferRef.current) {
      if (isPlaying) {
        mixedWavesurferRef.current.pause();
      } else {
        mixedWavesurferRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const restartPlayback = () => {
    if (mixedWavesurferRef.current) {
      mixedWavesurferRef.current.seekTo(0);
    }
  };
  
  const handleTrack1WavesurferReady = (wavesurfer: WaveSurfer) => {
    wavesurfer1Ref.current = wavesurfer;
  };
  
  const handleTrack2WavesurferReady = (wavesurfer: WaveSurfer) => {
    wavesurfer2Ref.current = wavesurfer;
  };
  
  const handleMixedWavesurferReady = (wavesurfer: WaveSurfer) => {
    mixedWavesurferRef.current = wavesurfer;
    wavesurfer.setVolume(volume);
    
    wavesurfer.on('finish', () => {
      setIsPlaying(false);
    });
  };
  
  // Update volume when it changes
  useEffect(() => {
    if (mixedWavesurferRef.current) {
      mixedWavesurferRef.current.setVolume(volume);
    }
  }, [volume]);

  return (
    <MainLayout>
      <div className="w-full max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mix Studio</h1>
          <p className="text-white/70">Upload two tracks and create a professional AI mix</p>
        </div>
        
        {storageReady === false && (
          <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
              <div>
                <h3 className="text-md text-red-400 font-medium">Storage Not Available</h3>
                <p className="text-sm text-red-300/80">
                  The audio storage system is not properly configured. Please ensure bucket "{STORAGE_BUCKET}" exists in your Supabase project with public access enabled.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Track 1 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Track 1</h2>
            <AudioUploader 
              trackNumber={1} 
              onUploadComplete={handleTrack1Upload} 
            />
            
            {track1Url && (
              <>
                <WaveformDisplay 
                  audioUrl={track1Url} 
                  color="#9b87f5"
                  onReady={handleTrack1WavesurferReady}
                />
                
                <TrackAnalysis
                  trackName={track1Name || "Track 1"}
                  isLoading={track1Analysis.isLoading}
                  genre={track1Analysis.genre}
                  bpm={track1Analysis.bpm}
                  key={track1Analysis.key}
                  duration={track1Analysis.duration}
                />
              </>
            )}
          </div>
          
          {/* Track 2 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Track 2</h2>
            <AudioUploader 
              trackNumber={2} 
              onUploadComplete={handleTrack2Upload} 
            />
            
            {track2Url && (
              <>
                <WaveformDisplay 
                  audioUrl={track2Url} 
                  color="#FF5500"
                  onReady={handleTrack2WavesurferReady}
                />
                
                <TrackAnalysis
                  trackName={track2Name || "Track 2"}
                  isLoading={track2Analysis.isLoading}
                  genre={track2Analysis.genre}
                  bpm={track2Analysis.bpm}
                  key={track2Analysis.key}
                  duration={track2Analysis.duration}
                />
              </>
            )}
          </div>
        </div>
        
        {/* Mix Control */}
        <div className="mb-8">
          {!mixedTrackUrl && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Create Mix</CardTitle>
                <CardDescription>
                  Mix your two tracks with AI assistance
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
                      Ready to mix your tracks? Our AI will analyze both tracks and create a professional mix.
                    </p>
                    <Button 
                      onClick={handleMix} 
                      disabled={!track1Url || !track2Url || storageReady === false}
                      className="bg-mixify-purple hover:bg-mixify-purple-dark"
                    >
                      <MicIcon className="mr-2 h-5 w-5" />
                      Mix Tracks
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Mixed Track */}
          {mixedTrackUrl && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Mixed Track</h2>
              <WaveformDisplay 
                audioUrl={mixedTrackUrl} 
                color="#FF5500"
                onReady={handleMixedWavesurferReady}
              />
              
              <PlaybackControls
                isPlaying={isPlaying}
                togglePlayback={togglePlayback}
                volume={volume}
                setVolume={setVolume}
                restart={restartPlayback}
                downloadUrl={mixedTrackUrl}
                trackName="mixify-mixed-track.mp3"
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Mixer;
