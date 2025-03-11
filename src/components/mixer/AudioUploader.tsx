
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface AudioUploaderProps {
  trackNumber: 1 | 2;
  onUploadComplete: (url: string, fileName: string) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ trackNumber, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    
    // Validate file type
    if (!selectedFile.type.startsWith('audio/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, etc).",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (20MB max)
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an audio file smaller than 20MB.",
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
    },
    maxFiles: 1,
  });

  const uploadFile = async () => {
    if (!file) return;

    try {
      setUploading(true);
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `tracks/${fileName}`;
      
      // Track upload progress
      let lastProgress = 0;
      const progressHandler = (progress: { loaded: number; total: number }) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        if (percent > lastProgress) {
          setProgress(percent);
          lastProgress = percent;
        }
      };
      
      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('audio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('audio')
        .getPublicUrl(filePath);
      
      // Notify parent component
      onUploadComplete(urlData.publicUrl, file.name);
      
      toast({
        title: "Upload complete",
        description: `Track ${trackNumber} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="space-y-4">
      {!file ? (
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
      ) : (
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
              onClick={removeFile}
              disabled={uploading}
              className="h-7 w-7 text-white/70 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {uploading ? (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-white/70">
                Uploading... {progress}%
              </p>
            </div>
          ) : (
            <Button 
              onClick={uploadFile} 
              className="w-full bg-mixify-purple hover:bg-mixify-purple-dark"
              size="sm"
            >
              Upload Track {trackNumber}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
