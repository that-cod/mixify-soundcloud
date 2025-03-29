
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Music, Mic, Disc3 } from 'lucide-react';
import { WaveformDisplay } from './WaveformDisplay';
import { AudioEffectsPanel } from './AudioEffectsPanel';
import { useMultiTrackMixer } from '@/hooks/useMultiTrackMixer';
import { MixTrack } from '@/types/audio';

interface MultiTrackMixerProps {
  initialTracks?: MixTrack[];
}

export function MultiTrackMixer({ initialTracks = [] }: MultiTrackMixerProps) {
  const {
    tracks,
    isAnalyzing,
    isMixing,
    mixProgress,
    mixedTrackUrl,
    addTrack,
    updateTrackVolume,
    updateTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    updateTrackEffect,
    removeTrack,
    createMix,
    separateTrackStems
  } = useMultiTrackMixer();
  
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [trackUploadDialogOpen, setTrackUploadDialogOpen] = useState(false);
  
  // Find currently selected track
  const selectedTrack = selectedTrackId 
    ? tracks.find(t => t.id === selectedTrackId) 
    : tracks.length > 0 ? tracks[0] : null;
  
  // Handle track selection
  const handleSelectTrack = (trackId: string) => {
    setSelectedTrackId(trackId);
  };
  
  // Handle vocal removal
  const handleRemoveVocals = async (trackId: string) => {
    // In a real implementation, this would call a function to process the track
    await separateTrackStems(trackId);
  };
  
  // Update effect for selected track
  const handleUpdateEffect = <K extends keyof MixTrack['effects']>(
    effectType: K,
    settings: Partial<MixTrack['effects'][K]>
  ) => {
    if (selectedTrackId) {
      updateTrackEffect(selectedTrackId, effectType, settings);
    }
  };
  
  // Simple track upload handler (mock implementation)
  const handleTrackUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // In a real implementation, this would upload the file to a server
    // For demo purposes, we'll create a fake URL
    const file = files[0];
    const url = URL.createObjectURL(file);
    
    // Add the track to the mixer
    const trackId = await addTrack(url, file.name);
    setSelectedTrackId(trackId);
  };
  
  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Multi-Track Mixer</span>
            <Button onClick={() => document.getElementById('track-upload')?.click()}>
              Add Track
            </Button>
            <input
              id="track-upload"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleTrackUpload}
            />
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {tracks.length === 0 ? (
            <div className="text-center py-8">
              <Music className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No tracks added yet. Upload a track to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Track List */}
              <div className="space-y-4 lg:col-span-1">
                <h3 className="text-lg font-medium">Tracks</h3>
                
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {tracks.map(track => (
                    <div 
                      key={track.id}
                      className={`p-3 rounded-md flex items-center justify-between ${
                        selectedTrackId === track.id ? 'bg-primary/10' : 'bg-secondary/10'
                      }`}
                      onClick={() => handleSelectTrack(track.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {track.features?.bpm ? <Disc3 size={18} /> : <Music size={18} />}
                        <span className="font-medium truncate max-w-[150px]">{track.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); toggleTrackMute(track.id); }}
                        >
                          {track.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </Button>
                        
                        <Button
                          variant={track.soloed ? "default" : "ghost"}
                          size="sm"
                          className="h-8 px-2"
                          onClick={(e) => { e.stopPropagation(); toggleTrackSolo(track.id); }}
                        >
                          S
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="w-full" 
                  disabled={tracks.length === 0 || isMixing} 
                  onClick={createMix}
                >
                  {isMixing ? `Mixing... ${mixProgress}%` : 'Create Mix'}
                </Button>
              </div>
              
              {/* Track Editor */}
              <div className="lg:col-span-2">
                {selectedTrack ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">{selectedTrack.name}</h3>
                    
                    <WaveformDisplay 
                      audioUrl={selectedTrack.url} 
                      color="#4f46e5"
                      height={100}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label>Volume ({Math.round(selectedTrack.volume * 100)}%)</Label>
                        <div className="flex items-center space-x-2">
                          <VolumeX size={18} />
                          <Slider
                            value={[selectedTrack.volume]}
                            min={0}
                            max={1}
                            step={0.01}
                            onValueChange={([value]) => updateTrackVolume(selectedTrack.id, value)}
                            className="flex-1"
                          />
                          <Volume2 size={18} />
                        </div>
                        
                        <Label>Pan</Label>
                        <Slider
                          value={[selectedTrack.pan]}
                          min={-1}
                          max={1}
                          step={0.01}
                          onValueChange={([value]) => updateTrackPan(selectedTrack.id, value)}
                        />
                        
                        {!selectedTrack.stems && (
                          <Button 
                            variant="outline" 
                            onClick={() => handleRemoveVocals(selectedTrack.id)}
                          >
                            <Mic className="mr-2 h-4 w-4" />
                            Separate Vocals & Instruments
                          </Button>
                        )}
                        
                        {selectedTrack.stems && (
                          <div className="pt-2">
                            <h4 className="font-medium mb-2">Stems</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <Button size="sm" variant="outline">Vocals</Button>
                              <Button size="sm" variant="outline">Drums</Button>
                              <Button size="sm" variant="outline">Bass</Button>
                              <Button size="sm" variant="outline">Other</Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        {selectedTrack.features && (
                          <div className="bg-secondary/10 p-3 rounded-md space-y-2">
                            <h4 className="font-medium">Track Analysis</h4>
                            <div className="grid grid-cols-2 gap-y-2 text-sm">
                              <span>BPM:</span>
                              <span>{selectedTrack.features.bpm}</span>
                              
                              <span>Key:</span>
                              <span>{selectedTrack.features.key}</span>
                              
                              <span>Energy:</span>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${selectedTrack.features.energy * 100}%` }}
                                ></div>
                              </div>
                              
                              <span>Clarity:</span>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${selectedTrack.features.clarity * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {selectedTrack.features?.harmonicProfile && (
                          <div className="bg-secondary/10 p-3 rounded-md space-y-2 mt-3">
                            <h4 className="font-medium">Harmonic Analysis</h4>
                            <div className="text-sm">
                              <p>Tonality: {selectedTrack.features.harmonicProfile.tonality}</p>
                              <p>Structure: {selectedTrack.features.harmonicProfile.harmonicStructure}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Tabs defaultValue="effects" className="w-full">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="effects">Effects</TabsTrigger>
                        <TabsTrigger value="advanced">Advanced</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="effects">
                        <AudioEffectsPanel 
                          effects={selectedTrack.effects}
                          onUpdateEffect={handleUpdateEffect}
                        />
                      </TabsContent>
                      
                      <TabsContent value="advanced">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => removeTrack(selectedTrack.id)}
                              >
                                Remove Track
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Select a track to edit</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Mixed Track */}
          {mixedTrackUrl && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium mb-4">Mixed Track</h3>
              <WaveformDisplay 
                audioUrl={mixedTrackUrl} 
                color="#10b981"
                height={100}
              />
              <div className="flex justify-end mt-4">
                <Button 
                  as="a" 
                  href={mixedTrackUrl} 
                  download="mixed-track.mp3"
                >
                  Download Mix
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
