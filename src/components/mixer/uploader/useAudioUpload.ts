
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  AUDIO_BUCKET, 
  checkBucketStatus,
  uploadAudioFile,
  type BucketStatus
} from '@/services/storage-service';

interface UseAudioUploadProps {
  trackNumber: 1 | 2;
  onUploadComplete: (url: string, fileName: string) => void;
}

export const useAudioUpload = ({ trackNumber, onUploadComplete }: UseAudioUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bucketStatus, setBucketStatus] = useState<BucketStatus | null>(null);
  const [bucketCheckInProgress, setBucketCheckInProgress] = useState(true);
  const { toast } = useToast();

  // Check storage bucket status when component mounts
  useEffect(() => {
    const verifyBucketAccess = async () => {
      try {
        console.log(`AudioUploader ${trackNumber}: Checking storage bucket...`);
        setBucketCheckInProgress(true);
        
        const status = await checkBucketStatus();
        setBucketStatus(status);
        
        // Show appropriate notifications based on bucket status
        if (!status.exists) {
          console.error(`Bucket "${AUDIO_BUCKET}" doesn't exist`);
          toast({
            title: "Storage Bucket Issue",
            description: `Bucket "${AUDIO_BUCKET}" not found. You can still try uploading.`,
            variant: "warning",
          });
        } else if (!status.canUpload) {
          console.error(`Cannot upload to bucket "${AUDIO_BUCKET}"`);
          toast({
            title: "Upload Permission Issue",
            description: "Permission issues detected, but you can still try uploading.",
            variant: "warning",
          });
        } else if (!status.isPublic) {
          console.warn(`Bucket "${AUDIO_BUCKET}" is not public`);
          toast({
            title: "Storage Warning",
            description: "The storage bucket is not set to public. Files might not be accessible.",
            variant: "warning",
          });
        } else {
          console.log(`Bucket "${AUDIO_BUCKET}" is ready for uploads`);
        }
      } catch (err: any) {
        console.error(`Error verifying bucket:`, err);
        setBucketStatus({
          exists: false,
          canUpload: false,
          isPublic: false,
          errorMessage: err.message || 'Unknown error checking storage'
        });
        toast({
          title: "Storage Check Failed",
          description: "Storage verification failed, but you can still try uploading.",
          variant: "warning",
        });
      } finally {
        setBucketCheckInProgress(false);
      }
    };
    
    verifyBucketAccess();
  }, [toast, trackNumber]);

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    
    if (!selectedFile) {
      console.log(`No file selected`);
      return;
    }
    
    // Validate file type
    if (!selectedFile.type.startsWith('audio/')) {
      console.warn(`Invalid file type:`, selectedFile.type);
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, etc).",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (20MB max)
    if (selectedFile.size > 20 * 1024 * 1024) {
      console.warn(`File too large:`, (selectedFile.size / (1024 * 1024)).toFixed(2) + 'MB');
      toast({
        title: "File too large",
        description: "Please upload an audio file smaller than 20MB.",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`File selected:`, {
      name: selectedFile.name,
      type: selectedFile.type,
      size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
    });
    
    setFile(selectedFile);
  }, [toast]);

  // Handle file upload
  const uploadFile = async () => {
    if (!file) {
      console.warn(`Cannot upload - no file selected`);
      return;
    }

    try {
      setUploading(true);
      setProgress(5); // Start with some initial progress
      
      // Use our upload service - always attempt, even if bucket check failed
      const result = await uploadAudioFile(
        file, 
        trackNumber,
        (progress) => setProgress(progress)
      );
      
      console.log(`Upload completed:`, result);
      
      // Notify parent component
      onUploadComplete(result.publicUrl, file.name);
      
      toast({
        title: "Upload complete",
        description: `Track ${trackNumber} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error(`Error uploading file:`, error);
      
      // Show user-friendly error message
      let errorMessage = "An error occurred during upload.";
      
      if (error.message) {
        if (error.message.includes('permission') || error.message.includes('authorized')) {
          errorMessage = "Permission denied. Check Supabase storage settings.";
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = `Storage bucket "${AUDIO_BUCKET}" not found. Check Supabase storage.`;
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
      
      // Reset progress after a brief delay
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return {
    file,
    uploading,
    progress,
    bucketStatus,
    bucketCheckInProgress,
    onDrop,
    uploadFile,
    removeFile,
  };
};
