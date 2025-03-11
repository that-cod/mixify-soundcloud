
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  supabase, 
  STORAGE_BUCKET, 
  createBucketIfNotExists,
  uploadFileToBucket 
} from '@/lib/supabase';
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
  const [bucketCheckInProgress, setBucketCheckInProgress] = useState(true);
  const { toast } = useToast();

  // Check if our storage bucket exists when component mounts
  useEffect(() => {
    const checkBucket = async () => {
      console.log(`AudioUploader ${trackNumber}: Initializing and checking for bucket "${STORAGE_BUCKET}"...`);
      try {
        setBucketCheckInProgress(true);
        
        // Attempt to create the bucket if it doesn't exist
        const created = await createBucketIfNotExists(STORAGE_BUCKET, true);
        
        setBucketReady(created);
        
        if (!created) {
          console.error(`AudioUploader ${trackNumber}: Failed to ensure bucket "${STORAGE_BUCKET}" exists`);
          toast({
            title: "Storage Setup Issue",
            description: `Please make sure you've created a bucket named "${STORAGE_BUCKET}" in your Supabase project with public access.`,
            variant: "destructive",
          });
        } else {
          console.log(`AudioUploader ${trackNumber}: Bucket "${STORAGE_BUCKET}" is ready for use`);
        }
      } catch (err) {
        console.error(`AudioUploader ${trackNumber}: Error setting up storage bucket:`, err);
        setBucketReady(false);
        toast({
          title: "Storage Setup Error",
          description: `Could not connect to storage bucket "${STORAGE_BUCKET}". Please check console for details.`,
          variant: "destructive",
        });
      } finally {
        setBucketCheckInProgress(false);
      }
    };
    
    checkBucket();
  }, [toast, trackNumber]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    
    if (!selectedFile) {
      console.log(`AudioUploader ${trackNumber}: No file selected`);
      return;
    }
    
    // Validate file type
    if (!selectedFile.type.startsWith('audio/')) {
      console.warn(`AudioUploader ${trackNumber}: Invalid file type:`, selectedFile.type);
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, etc).",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (20MB max)
    if (selectedFile.size > 20 * 1024 * 1024) {
      console.warn(`AudioUploader ${trackNumber}: File too large:`, (selectedFile.size / (1024 * 1024)).toFixed(2) + 'MB');
      toast({
        title: "File too large",
        description: "Please upload an audio file smaller than 20MB.",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`AudioUploader ${trackNumber}: File selected:`, {
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
    if (!file) {
      console.warn(`AudioUploader ${trackNumber}: Cannot upload - no file selected`);
      return;
    }
    
    if (!bucketReady) {
      console.error(`AudioUploader ${trackNumber}: Cannot upload - bucket "${STORAGE_BUCKET}" not ready`);
      toast({
        title: "Storage not ready",
        description: `Please make sure you've created a bucket named "${STORAGE_BUCKET}" in your Supabase project with public access.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setProgress(5); // Show some initial progress to the user
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `track-${trackNumber}/${fileName}`;
      
      console.log(`AudioUploader ${trackNumber}: Starting upload...`, { 
        bucketName: STORAGE_BUCKET,
        filePath,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      });
      
      // Use the improved upload function
      const result = await uploadFileToBucket(
        file, 
        filePath, 
        (progress) => setProgress(progress)
      );
      
      console.log(`AudioUploader ${trackNumber}: Upload completed`, result);
      
      // Notify parent component
      onUploadComplete(result.publicUrl, file.name);
      
      toast({
        title: "Upload complete",
        description: `Track ${trackNumber} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error(`AudioUploader ${trackNumber}: Error uploading file:`, error);
      
      // Show more specific error messages
      let errorMessage = "An error occurred during upload.";
      
      if (error.message) {
        if (error.message.includes('permission') || error.message.includes('authorized')) {
          errorMessage = "Permission denied. Check Supabase storage settings.";
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = `Bucket "${STORAGE_BUCKET}" not found. Check Supabase storage.`;
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = "Network error. Check your internet connection.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
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
      {bucketCheckInProgress && (
        <div className="flex items-center justify-center p-4 bg-black/20 rounded-lg">
          <Loader2 className="h-5 w-5 text-mixify-purple animate-spin mr-2" />
          <p className="text-sm text-white/70">Checking storage configuration...</p>
        </div>
      )}
      
      {!bucketCheckInProgress && !bucketReady && (
        <div className="p-4 border border-red-500/50 bg-red-500/10 rounded-lg">
          <p className="text-sm text-red-400">
            Storage bucket "{STORAGE_BUCKET}" is not available. Please create it in your Supabase project with public access.
          </p>
        </div>
      )}
      
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
                Uploading... {Math.round(progress)}%
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
