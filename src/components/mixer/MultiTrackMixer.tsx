
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  Music, 
  Plus, 
  Trash2,
  Save,
  Download,
  Pause,
  Play,
  SkipBack,
  Settings,
  Sliders,
  Volume2
} from 'lucide-react';
import { useMultiTrackMixer } from '@/hooks/useMultiTrackMixer';
import { MixTrack, AudioFeatures, AudioEffects } from '@/types/audio';
import { WaveformDisplay } from './WaveformDisplay';
import { AudioUploader } from './AudioUploader';
import { TrackAnalysis } from './TrackAnalysis';
import { AudioEffectsPanel } from './AudioEffectsPanel';
import { useToast } from '@/hooks/use-toast';

export const MultiTrackMixer: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'tracks' | 'effects' | 'mixer'>('tracks');
  
  const {
    tracks,
    mixedTrackUrl,
    isAnalyzing,
    isMixing,
    isPlaying,
    masterVolume,
    analyzeProgress,
    mixProgress,
    
    addTrack,
    removeTrack,
    updateTrackVolume,
    updateTrackPan,
    updateTrackEffect,
    toggleMute,
    toggleSolo,
    startMixing,
    togglePlayback,
    restartPlayback,
    setMasterVolume,
    handleWavesurferReady
  } = useMultiTrackMixer();
  
  // Automatically switch to mixer tab when mixing is complete
  useEffect(() => {
    if (mixedTrackUrl) {
      setActiveTab('mixer');
    }
  }, [mixedTrackUrl]);

  const handleTrackUpload = (url: string, name: string) => {
    addTrack(url, name);
    toast({
      title: "Track Added",
      description: `${name} has been added to your mix.`,
    });
  };
  
  const handleRemoveTrack = (id: string) => {
    removeTrack(id);
  };
  
  const handleStartMixing = () => {
    startMixing();
  };
  
  // Track card component
  const TrackCard = ({ track, index }: { track: MixTrack, index: number }) => {
    return (
      <Card className="relative mb-4 overflow-hidden glass-card border-white/10">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-md flex items-center">
              <Music className="h-4 w-4 mr-2" />
              {track.name}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleRemoveTrack(track.id)}
              className="h-7 w-7 p-0 rounded-full"
            >
              <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 pb-3">
          {isAnalyzing && !track.features ? (
            <div className="h-16 flex items-center justify-center">
              <div className="text-sm text-white/50">Analyzing track...</div>
            </div>
          ) : (
            <>
              {track.features && (
                <div className="mb-2">
                  <TrackAnalysis 
                    trackName={track.name}
                    features={track.features}
                    isCompact={true}
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 my-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Volume</span>
                    <span className="text-xs text-white/50">{Math.round(track.volume * 100)}%</span>
                  </div>
                  <Slider
                    value={[track.volume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(values) => updateTrackVolume(track.id, values[0] / 100)}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/70">Pan</span>
                    <span className="text-xs text-white/50">
                      {track.pan === 0 ? "C" : track.pan < 0 ? `L${Math.abs(Math.round(track.pan * 100))}` : `R${Math.round(track.pan * 100)}`}
                    </span>
                  </div>
                  <Slider
                    value={[track.pan * 100]}
                    min={-100}
                    max={100}
                    step={1}
                    onValueChange={(values) => updateTrackPan(track.id, values[0] / 100)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between space-x-2 mt-2">
                <Button
                  variant={track.muted ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 h-8 text-xs ${track.muted ? "bg-amber-800 hover:bg-amber-700" : ""}`}
                  onClick={() => toggleMute(track.id)}
                >
                  {track.muted ? "Unmute" : "Mute"}
                </Button>
                
                <Button
                  variant={track.soloed ? "default" : "outline"}
                  size="sm"
                  className={`flex-1 h-8 text-xs ${track.soloed ? "bg-green-800 hover:bg-green-700" : ""}`}
                  onClick={() => toggleSolo(track.id)}
                >
                  {track.soloed ? "Unsolo" : "Solo"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setActiveTab('effects')}
                >
                  <Sliders className="h-3 w-3 mr-1" />
                  FX
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Handle effect updates - this function adapts the component interface to our hook interface
  const handleUpdateEffect = (trackId: string, effectType: keyof AudioEffects, settings: Partial<AudioEffects[keyof AudioEffects]>) => {
    updateTrackEffect(trackId, effectType, settings);
  };
  
  return (
    <div className="mx-auto max-w-7xl">
      <Tabs defaultValue="tracks" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
          <TabsTrigger value="mixer">Mixer</TabsTrigger>
        </TabsList>
        
        {/* Tracks Tab */}
        <TabsContent value="tracks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Add Track Card */}
            <Card className="glass-card border-dashed border-white/20 hover:border-white/40 transition-all">
              <CardContent className="flex flex-col items-center justify-center p-6 h-48">
                <AudioUploader 
                  trackNumber={1}
                  onUploadComplete={handleTrackUpload} 
                />
              </CardContent>
            </Card>
            
            {/* Track List */}
            {tracks.map((track, index) => (
              <TrackCard key={track.id} track={track} index={index} />
            ))}
          </div>
          
          {tracks.length > 1 && (
            <div className="flex justify-center mt-8">
              <Button 
                onClick={handleStartMixing}
                disabled={isMixing || isAnalyzing || tracks.some(t => !t.features)}
                className="bg-mixify-purple hover:bg-mixify-purple-dark"
              >
                {isMixing ? (
                  <>Processing Mix ({mixProgress}%)...</>
                ) : (
                  <>Mix Tracks</>
                )}
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Effects Tab */}
        <TabsContent value="effects" className="space-y-6">
          <AudioEffectsPanel 
            tracks={tracks}
            onUpdateEffect={handleUpdateEffect}
          />
        </TabsContent>
        
        {/* Mixer Tab */}
        <TabsContent value="mixer" className="space-y-6">
          {mixedTrackUrl ? (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Mixed Track</h2>
              <WaveformDisplay 
                audioUrl={mixedTrackUrl} 
                color="#FF5500"
                onReady={handleWavesurferReady}
              />
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={restartPlayback}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="default"
                    size="icon"
                    onClick={togglePlayback}
                    className="bg-mixify-purple hover:bg-mixify-purple-dark"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2 flex-1 max-w-xs">
                  <Volume2 className="h-4 w-4 text-white/70" />
                  <Slider
                    value={[masterVolume * 100]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(values) => setMasterVolume(values[0] / 100)}
                  />
                  <span className="text-sm text-white/70 w-8 text-right">{Math.round(masterVolume * 100)}%</span>
                </div>
                
                <div>
                  <Button
                    variant="default"
                    asChild
                  >
                    <a 
                      href={mixedTrackUrl} 
                      download="mixify-multi-track.mp3"
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Mix
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Settings className="h-12 w-12 text-white/30 mb-4" />
              <h3 className="text-xl font-medium mb-2">No Mix Available</h3>
              <p className="text-white/60 mb-6 max-w-md">
                Add at least two tracks and mix them to see the result here.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('tracks')}
              >
                Go to Tracks
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
