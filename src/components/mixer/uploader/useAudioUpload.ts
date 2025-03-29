
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { 
  AUDIO_BUCKET, 
  checkBucketStatus,
  type BucketStatus
} from '@/services/storage-service';

// Backend API URL
const API_URL = 'http://localhost:5000/api';

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
        
        if (!status.exists) {
          console.log("Storage bucket doesn't exist, will use backend upload instead");
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
          description: "Using backend upload system instead.",
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
      
      // Backend upload using API
      const formData = new FormData();
      formData.append('track', file);
      
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 95) / progressEvent.total);
            setProgress(percentCompleted);
          }
        }
      });
      
      console.log(`Upload completed:`, response.data);
      setProgress(100);
      
      // Construct file URL for frontend use
      const fileUrl = response.data.filePath;
      
      // Notify parent component
      onUploadComplete(fileUrl, file.name);
      
      toast({
        title: "Upload complete",
        description: `Track ${trackNumber} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error(`Error uploading file:`, error);
      
      // Try fallback to Supabase if backend upload fails
      if (bucketStatus?.exists && bucketStatus?.canUpload) {
        // Import the upload function dynamically to avoid circular dependencies
        const { uploadAudioFile } = await import('@/services/storage-service');
        
        try {
          toast({
            title: "Trying fallback upload",
            description: "Backend upload failed. Trying alternative upload method...",
          });
          
          const result = await uploadAudioFile(
            file, 
            trackNumber,
            (progress) => setProgress(progress)
          );
          
          console.log(`Fallback upload completed:`, result);
          
          // Notify parent component
          onUploadComplete(result.publicUrl, file.name);
          
          toast({
            title: "Upload complete (fallback)",
            description: `Track ${trackNumber} uploaded successfully.`,
          });
        } catch (fallbackError: any) {
          console.error(`Fallback upload failed:`, fallbackError);
          
          toast({
            title: "Upload failed",
            description: "Both upload methods failed. Please try again later.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Upload failed",
          description: error.response?.data?.error || "Failed to upload file. Please try again.",
          variant: "destructive",
        });
      }
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
