
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase, STORAGE_BUCKET, createBucketIfNotExists } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface AudioUploaderProps {
  trackNumber: 1 | 2;
  onUploadComplete: (url: string, fileName: string) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ trackNumber, onUploadComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bucketReady, setBucketReady] = useState(false);
  const { toast } = useToast();

  // Check if our storage bucket exists when component mounts
  useEffect(() => {
    const checkBucket = async () => {
      console.log(`Initializing AudioUploader for track ${trackNumber}...`);
      try {
        const created = await createBucketIfNotExists(STORAGE_BUCKET, true);
        setBucketReady(created);
        
        if (!created) {
          console.error(`Failed to ensure bucket "${STORAGE_BUCKET}" exists`);
          toast({
            title: "Storage Setup Issue",
            description: `Please make sure you've created a bucket named "${STORAGE_BUCKET}" in your Supabase project.`,
            variant: "destructive",
          });
        } else {
          console.log(`Bucket "${STORAGE_BUCKET}" is ready for use`);
        }
      } catch (err) {
        console.error('Error setting up storage bucket:', err);
        setBucketReady(false);
      }
    };
    
    checkBucket();
  }, [toast, trackNumber]);

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
    
    console.log(`File selected for track ${trackNumber}:`, {
      name: selectedFile.name,
      type: selectedFile.type,
      size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
    });
    
    setFile(selectedFile);
  }, [toast, trackNumber]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
    },
    maxFiles: 1,
  });

  const uploadFile = async () => {
    if (!file) return;
    if (!bucketReady) {
      toast({
        title: "Storage not ready",
        description: `Please make sure you've created a bucket named "${STORAGE_BUCKET}" in your Supabase project.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(10); // Show some initial progress to the user
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `track-${trackNumber}/${fileName}`;
      
      console.log(`Starting upload for track ${trackNumber}:`, { 
        bucketName: STORAGE_BUCKET,
        filePath,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileType: file.type 
      });
      
      // Track upload progress through intervals
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          // Simulate upload progress until we reach 90%
          if (prev < 90) {
            return prev + 10;
          }
          return prev;
        });
      }, 500);
      
      // Upload to Supabase storage bucket
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Set to true to replace existing files
        });
      
      // Clear the progress interval
      clearInterval(progressInterval);
      
      if (error) {
        console.error(`Supabase upload error for track ${trackNumber}:`, error);
        throw error;
      }
      
      console.log(`Upload successful for track ${trackNumber}:`, data);
      setProgress(95);
      
      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
      
      console.log(`Public URL obtained for track ${trackNumber}:`, urlData);
      setProgress(100);
      
      // Notify parent component
      onUploadComplete(urlData.publicUrl, file.name);
      
      toast({
        title: "Upload complete",
        description: `Track ${trackNumber} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error(`Error uploading file for track ${trackNumber}:`, error);
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => {
        setProgress(0);
      }, 1000);
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
              disabled={!bucketReady}
            >
              Upload Track {trackNumber}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
