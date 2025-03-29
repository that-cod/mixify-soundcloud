
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings2 } from 'lucide-react';
import { StagedMixSettings } from './types';
import { formatParamLabel } from './utils';

interface StageParametersProps {
  params: string[];
  settings: StagedMixSettings;
  updateSetting: (param: keyof StagedMixSettings, value: number | boolean) => void;
  isProcessing: boolean;
}

export const StageParameters: React.FC<StageParametersProps> = ({
  params,
  settings,
  updateSetting,
  isProcessing
}) => {
  if (!params.length) {
    return null;
  }
  
  return (
    <div className="space-y-4 mt-4 p-4 bg-black/10 rounded-md">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <Settings2 className="h-4 w-4" />
        Adjustable Parameters
      </h4>
      
      {params.map(param => {
        const paramKey = param as keyof StagedMixSettings;
        const paramValue = settings[paramKey];
        
        if (typeof paramValue === 'boolean') {
          return (
            <div key={param} className="flex justify-between items-center">
              <Label htmlFor={param} className="text-xs">{formatParamLabel(param)}</Label>
              <input
                type="checkbox"
                id={param}
                checked={paramValue}
                onChange={e => updateSetting(paramKey, e.target.checked)}
                disabled={isProcessing}
                className="h-4 w-4"
              />
            </div>
          );
        }
        
        return (
          <div key={param} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={param} className="text-xs">{formatParamLabel(param)}</Label>
              <span className="text-xs text-white/50">
                {typeof paramValue === 'number' ? Math.round(paramValue * 100) + '%' : paramValue}
              </span>
            </div>
            <Slider
              id={param}
              value={[typeof paramValue === 'number' ? paramValue * 100 : Number(paramValue)]}
              min={0}
              max={100}
              step={5}
              disabled={isProcessing}
              onValueChange={value => updateSetting(paramKey, value[0] / 100)}
            />
          </div>
        );
      })}
    </div>
  );
};
