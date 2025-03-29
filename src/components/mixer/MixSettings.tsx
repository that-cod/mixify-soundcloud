
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Music2, 
  Settings2, 
  Music4, 
  Waveform,
  Volume2,
  RefreshCw,
  Mic2
} from 'lucide-react';

interface MixSettingsProps {
  mixSettings: {
    bpmMatch: boolean;
    keyMatch: boolean;
    vocalLevel1: number;
    vocalLevel2: number;
    beatLevel1: number;
    beatLevel2: number;
    crossfadeLength: number;
    echo: number;
    tempo: number;
  };
  updateMixSetting: (setting: string, value: number | boolean) => void;
  track1Features: { bpm: number; key: string } | null;
  track2Features: { bpm: number; key: string } | null;
}

export const MixSettings: React.FC<MixSettingsProps> = ({
  mixSettings,
  updateMixSetting,
  track1Features,
  track2Features
}) => {
  return (
    <Card className="glass-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-mixify-purple-light" />
          Mix Settings
        </CardTitle>
        <CardDescription className="text-xs">
          Adjust parameters for optimal mixing
        </CardDescription>
      </CardHeader>
      <CardContent className="py-4">
        <div className="space-y-6">
          {/* BPM & Key Matching Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5" />
              Synchronization
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="bpm-match" className="text-xs">BPM Match</Label>
                  <p className="text-[10px] text-white/50">
                    {track1Features && track2Features ? 
                      `${track1Features.bpm} → ${track2Features.bpm} BPM` : 
                      "Match track tempos"}
                  </p>
                </div>
                <Switch
                  id="bpm-match"
                  checked={mixSettings.bpmMatch}
                  onCheckedChange={(value) => updateMixSetting('bpmMatch', value)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="key-match" className="text-xs">Key Match</Label>
                  <p className="text-[10px] text-white/50">
                    {track1Features && track2Features ? 
                      `${track1Features.key} ↔ ${track2Features.key}` : 
                      "Harmonize keys"}
                  </p>
                </div>
                <Switch
                  id="key-match"
                  checked={mixSettings.keyMatch}
                  onCheckedChange={(value) => updateMixSetting('keyMatch', value)}
                />
              </div>
            </div>
          </div>
          
          {/* Vocals Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
              <Mic2 className="h-3.5 w-3.5" />
              Vocals
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="vocal-level-1" className="text-xs">Track 1 Vocals</Label>
                  <span className="text-xs text-white/50">{Math.round(mixSettings.vocalLevel1 * 100)}%</span>
                </div>
                <Slider
                  id="vocal-level-1"
                  value={[mixSettings.vocalLevel1 * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => updateMixSetting('vocalLevel1', value[0] / 100)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="vocal-level-2" className="text-xs">Track 2 Vocals</Label>
                  <span className="text-xs text-white/50">{Math.round(mixSettings.vocalLevel2 * 100)}%</span>
                </div>
                <Slider
                  id="vocal-level-2"
                  value={[mixSettings.vocalLevel2 * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => updateMixSetting('vocalLevel2', value[0] / 100)}
                />
              </div>
            </div>
          </div>
          
          {/* Beats Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
              <Waveform className="h-3.5 w-3.5" />
              Beats
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="beat-level-1" className="text-xs">Track 1 Beats</Label>
                  <span className="text-xs text-white/50">{Math.round(mixSettings.beatLevel1 * 100)}%</span>
                </div>
                <Slider
                  id="beat-level-1"
                  value={[mixSettings.beatLevel1 * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => updateMixSetting('beatLevel1', value[0] / 100)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="beat-level-2" className="text-xs">Track 2 Beats</Label>
                  <span className="text-xs text-white/50">{Math.round(mixSettings.beatLevel2 * 100)}%</span>
                </div>
                <Slider
                  id="beat-level-2"
                  value={[mixSettings.beatLevel2 * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => updateMixSetting('beatLevel2', value[0] / 100)}
                />
              </div>
            </div>
          </div>
          
          {/* Effects Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/90 flex items-center gap-2">
              <Music4 className="h-3.5 w-3.5" />
              Effects
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="echo" className="text-xs">Echo</Label>
                  <span className="text-xs text-white/50">{Math.round(mixSettings.echo * 100)}%</span>
                </div>
                <Slider
                  id="echo"
                  value={[mixSettings.echo * 100]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => updateMixSetting('echo', value[0] / 100)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="tempo" className="text-xs">Tempo Adjust</Label>
                  <span className="text-xs text-white/50">{mixSettings.tempo > 0 ? '+' : ''}{mixSettings.tempo * 100}%</span>
                </div>
                <Slider
                  id="tempo"
                  value={[mixSettings.tempo * 100 + 50]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => updateMixSetting('tempo', (value[0] - 50) / 100)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="crossfade" className="text-xs">Crossfade</Label>
                  <span className="text-xs text-white/50">{mixSettings.crossfadeLength}s</span>
                </div>
                <Slider
                  id="crossfade"
                  value={[mixSettings.crossfadeLength]}
                  min={1}
                  max={16}
                  step={1}
                  onValueChange={(value) => updateMixSetting('crossfadeLength', value[0])}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
