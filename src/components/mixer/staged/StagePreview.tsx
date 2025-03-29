
import React from 'react';
import { WaveformDisplay } from '../WaveformDisplay';

interface StagePreviewProps {
  previewUrl: string | undefined;
}

export const StagePreview: React.FC<StagePreviewProps> = ({ previewUrl }) => {
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
    </div>
  );
};
