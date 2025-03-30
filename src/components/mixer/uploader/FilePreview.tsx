
import React from 'react';
import { Music2, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface FilePreviewProps {
  file: File;
  uploading: boolean;
  progress: number;
  onRemove: () => void;
  onUpload: () => void;
  trackNumber: number;
  uploadError?: string | null;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  uploading,
  progress,
  onRemove,
  onUpload,
  trackNumber,
  uploadError,
}) => {
  return (
    <div className="rounded-lg border border-white/20 p-4 bg-white/5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <Music2 className="h-6 w-6 text-mixify-purple-light" />
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-white/50">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onRemove}
          disabled={uploading}
          className="h-7 w-7 text-white/70 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {uploadError && (
        <div className="mb-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs flex items-start">
          <AlertTriangle className="h-3 w-3 text-red-400 mr-1 mt-0.5 flex-shrink-0" />
          <span className="text-red-300">{uploadError}</span>
        </div>
      )}
      
      {uploading ? (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-white/70">
            Uploading... {Math.round(progress)}%
          </p>
        </div>
      ) : (
        <Button 
          onClick={onUpload} 
          className="w-full bg-mixify-purple hover:bg-mixify-purple-dark"
          size="sm"
        >
          Upload Track {trackNumber}
        </Button>
      )}
    </div>
  );
};
