
import React from 'react';
import { Upload } from 'lucide-react';
import { DropzoneOptions, useDropzone } from 'react-dropzone';

interface DropZoneProps {
  onDrop: DropzoneOptions['onDrop'];
  acceptedFileTypes: Record<string, string[]>;
}

export const DropZone: React.FC<DropZoneProps> = ({ onDrop, acceptedFileTypes }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: 1,
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-mixify-purple bg-mixify-purple/10' 
          : 'border-white/20 hover:border-white/30 hover:bg-white/5'
        }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-10 w-10 text-white/60" />
      <p className="mt-2 text-sm text-white/80">
        {isDragActive 
          ? 'Drop the audio file here' 
          : 'Drag & drop an audio file here, or click to select'}
      </p>
      <p className="mt-1 text-xs text-white/50">
        Supports MP3, WAV, OGG (max 20MB)
      </p>
    </div>
  );
};
