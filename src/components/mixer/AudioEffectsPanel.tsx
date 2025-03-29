
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AudioEffects, MixTrack } from '@/types/audio';

interface AudioEffectsPanelProps {
  tracks: MixTrack[];
  onUpdateEffect: <K extends keyof AudioEffects>(
    trackId: string,
    effectType: K,
    settings: Partial<AudioEffects[K]>
  ) => void;
}

export function AudioEffectsPanel({ tracks, onUpdateEffect }: AudioEffectsPanelProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(
    tracks.length > 0 ? tracks[0].id : null
  );

  // If we have tracks but no selected track ID (or the selected track no longer exists)
  // then select the first track
  React.useEffect(() => {
    if (tracks.length > 0) {
      if (!selectedTrackId || !tracks.find(t => t.id === selectedTrackId)) {
        setSelectedTrackId(tracks[0].id);
      }
    } else {
      setSelectedTrackId(null);
    }
  }, [tracks, selectedTrackId]);

  const selectedTrack = selectedTrackId ? tracks.find(t => t.id === selectedTrackId) : null;
  const effects = selectedTrack?.effects || {} as AudioEffects;

  if (!selectedTrack) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Audio Effects</CardTitle>
          <CardDescription>No tracks available to apply effects</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleUpdateSelectedEffect = <K extends keyof AudioEffects>(
    effectType: K,
    settings: Partial<AudioEffects[K]>
  ) => {
    if (selectedTrackId) {
      onUpdateEffect(selectedTrackId, effectType, settings);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Audio Effects</CardTitle>
        <CardDescription>Apply effects to enhance your track</CardDescription>
        
        <div className="mt-4">
          <Label htmlFor="track-selector">Select Track</Label>
          <select 
            id="track-selector"
            className="w-full p-2 mt-1 bg-background border border-input rounded-md"
            value={selectedTrackId || ''}
            onChange={(e) => setSelectedTrackId(e.target.value)}
          >
            {tracks.map(track => (
              <option key={track.id} value={track.id}>
                {track.name}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="eq" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="eq">EQ</TabsTrigger>
            <TabsTrigger value="compression">Compression</TabsTrigger>
            <TabsTrigger value="reverb">Reverb</TabsTrigger>
            <TabsTrigger value="delay">Delay</TabsTrigger>
            <TabsTrigger value="distortion">Distortion</TabsTrigger>
          </TabsList>
          
          {/* EQ Controls */}
          <TabsContent value="eq" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="eq-enabled">Enable Equalizer</Label>
              <Switch 
                id="eq-enabled" 
                checked={effects.eq.enabled}
                onCheckedChange={(checked) => handleUpdateSelectedEffect('eq', { enabled: checked })} 
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="low-gain">Low Gain ({Math.round(effects.eq.lowGain * 100)}%)</Label>
                <Slider 
                  id="low-gain"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={[effects.eq.lowGain]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('eq', { lowGain: value })}
                  disabled={!effects.eq.enabled}
                />
              </div>
              
              <div>
                <Label htmlFor="mid-gain">Mid Gain ({Math.round(effects.eq.midGain * 100)}%)</Label>
                <Slider 
                  id="mid-gain"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={[effects.eq.midGain]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('eq', { midGain: value })}
                  disabled={!effects.eq.enabled}
                />
              </div>
              
              <div>
                <Label htmlFor="high-gain">High Gain ({Math.round(effects.eq.highGain * 100)}%)</Label>
                <Slider 
                  id="high-gain"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={[effects.eq.highGain]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('eq', { highGain: value })}
                  disabled={!effects.eq.enabled}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Compression Controls */}
          <TabsContent value="compression" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="comp-enabled">Enable Compression</Label>
              <Switch 
                id="comp-enabled" 
                checked={effects.compression.enabled}
                onCheckedChange={(checked) => handleUpdateSelectedEffect('compression', { enabled: checked })} 
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="threshold">Threshold ({effects.compression.threshold} dB)</Label>
                <Slider 
                  id="threshold"
                  min={-60}
                  max={0}
                  step={1}
                  value={[effects.compression.threshold]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('compression', { threshold: value })}
                  disabled={!effects.compression.enabled}
                />
              </div>
              
              <div>
                <Label htmlFor="ratio">Ratio ({effects.compression.ratio}:1)</Label>
                <Slider 
                  id="ratio"
                  min={1}
                  max={20}
                  step={0.5}
                  value={[effects.compression.ratio]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('compression', { ratio: value })}
                  disabled={!effects.compression.enabled}
                />
              </div>
              
              <div>
                <Label htmlFor="attack">Attack ({effects.compression.attack.toFixed(3)} s)</Label>
                <Slider 
                  id="attack"
                  min={0.001}
                  max={1}
                  step={0.001}
                  value={[effects.compression.attack]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('compression', { attack: value })}
                  disabled={!effects.compression.enabled}
                />
              </div>
              
              <div>
                <Label htmlFor="release">Release ({effects.compression.release.toFixed(2)} s)</Label>
                <Slider 
                  id="release"
                  min={0.01}
                  max={2}
                  step={0.01}
                  value={[effects.compression.release]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('compression', { release: value })}
                  disabled={!effects.compression.enabled}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Reverb Controls */}
          <TabsContent value="reverb" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="reverb-enabled">Enable Reverb</Label>
              <Switch 
                id="reverb-enabled" 
                checked={effects.reverb.enabled}
                onCheckedChange={(checked) => handleUpdateSelectedEffect('reverb', { enabled: checked })} 
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reverb-mix">Mix ({Math.round(effects.reverb.mix * 100)}%)</Label>
                <Slider 
                  id="reverb-mix"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[effects.reverb.mix]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('reverb', { mix: value })}
                  disabled={!effects.reverb.enabled}
                />
              </div>
              
              <div>
                <Label htmlFor="reverb-time">Time ({effects.reverb.time.toFixed(1)} s)</Label>
                <Slider 
                  id="reverb-time"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={[effects.reverb.time]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('reverb', { time: value })}
                  disabled={!effects.reverb.enabled}
                />
              </div>
              
              <div>
                <Label htmlFor="reverb-decay">Decay ({effects.reverb.decay.toFixed(2)})</Label>
                <Slider 
                  id="reverb-decay"
                  min={0.01}
                  max={0.99}
                  step={0.01}
                  value={[effects.reverb.decay]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('reverb', { decay: value })}
                  disabled={!effects.reverb.enabled}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Delay Controls */}
          <TabsContent value="delay" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="delay-enabled">Enable Delay</Label>
              <Switch 
                id="delay-enabled" 
                checked={effects.delay.enabled}
                onCheckedChange={(checked) => handleUpdateSelectedEffect('delay', { enabled: checked })} 
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="delay-time">Time ({effects.delay.time.toFixed(2)} s)</Label>
                <Slider 
                  id="delay-time"
                  min={0.05}
                  max={2}
                  step={0.01}
                  value={[effects.delay.time]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('delay', { time: value })}
                  disabled={!effects.delay.enabled}
                />
              </div>
              
              <div>
                <Label htmlFor="delay-feedback">Feedback ({Math.round(effects.delay.feedback * 100)}%)</Label>
                <Slider 
                  id="delay-feedback"
                  min={0}
                  max={0.95}
                  step={0.01}
                  value={[effects.delay.feedback]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('delay', { feedback: value })}
                  disabled={!effects.delay.enabled}
                />
              </div>
              
              <div>
                <Label htmlFor="delay-mix">Mix ({Math.round(effects.delay.mix * 100)}%)</Label>
                <Slider 
                  id="delay-mix"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[effects.delay.mix]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('delay', { mix: value })}
                  disabled={!effects.delay.enabled}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Distortion Controls */}
          <TabsContent value="distortion" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="distortion-enabled">Enable Distortion</Label>
              <Switch 
                id="distortion-enabled" 
                checked={effects.distortion.enabled}
                onCheckedChange={(checked) => handleUpdateSelectedEffect('distortion', { enabled: checked })} 
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="distortion-amount">Amount ({Math.round(effects.distortion.amount * 100)}%)</Label>
                <Slider 
                  id="distortion-amount"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[effects.distortion.amount]}
                  onValueChange={([value]) => handleUpdateSelectedEffect('distortion', { amount: value })}
                  disabled={!effects.distortion.enabled}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
