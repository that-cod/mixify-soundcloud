
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { 
  AUDIO_BUCKET, 
  checkBucketStatus,
  type BucketStatus,
  uploadAudioFile
} from '@/services/storage-service';
import { API, AUDIO_SETTINGS } from '@/config';

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check storage bucket status when component mounts
  useEffect(() => {
    const verifyBucketAccess = async () => {
      try {
        console.log(`AudioUploader ${trackNumber}: Checking storage bucket...`);
        setBucketCheckInProgress(true);
        
        const status = await checkBucketStatus();
        console.log(`Bucket status check result:`, status);
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
    
    // Clear any previous upload errors
    setUploadError(null);
    
    // Validate file type
    if (!AUDIO_SETTINGS.supportedFormats.includes(selectedFile.type)) {
      console.warn(`Invalid file type:`, selectedFile.type);
      toast({
        title: "Invalid file type",
        description: "Please upload an audio file (MP3, WAV, etc).",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size 
    if (selectedFile.size > AUDIO_SETTINGS.maxUploadSizeMB * 1024 * 1024) {
      console.warn(`File too large:`, (selectedFile.size / (1024 * 1024)).toFixed(2) + 'MB');
      toast({
        title: "File too large",
        description: `Please upload an audio file smaller than ${AUDIO_SETTINGS.maxUploadSizeMB}MB.`,
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

  // Try Supabase upload method
  const trySupabaseUpload = async (file: File): Promise<{success: boolean, url?: string}> => {
    if (!(bucketStatus?.exists && bucketStatus?.canUpload)) {
      return { success: false };
    }
    
    try {
      console.log("Attempting Supabase storage upload...");
      const result = await uploadAudioFile(
        file, 
        trackNumber,
        (progress) => setProgress(progress)
      );
      
      console.log(`Supabase upload completed:`, result);
      return { success: true, url: result.publicUrl };
    } catch (error: any) {
      console.error("Supabase upload failed:", error);
      return { success: false };
    }
  };

  // Try backend API upload method
  const tryBackendUpload = async (file: File): Promise<{success: boolean, url?: string}> => {
    try {
      console.log("Attempting backend API upload...");
      const formData = new FormData();
      formData.append('track', file);
      
      const response = await axios.post(API.endpoints.upload, formData, {
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
      
      console.log(`Backend upload completed:`, response.data);
      return { success: true, url: response.data.filePath };
    } catch (error: any) {
      console.error("Backend upload failed:", error?.response?.data || error.message);
      return { success: false };
    }
  };

  // Handle file upload
  const uploadFile = async () => {
    if (!file) {
      console.warn(`Cannot upload - no file selected`);
      return;
    }

    try {
      setUploading(true);
      setProgress(5); // Start with some initial progress
      setUploadError(null);
      
      // Try both upload methods
      let uploadResult;
      
      // First try backend upload (default method)
      uploadResult = await tryBackendUpload(file);
      
      // If backend upload fails, try Supabase upload as fallback
      if (!uploadResult.success) {
        console.log("Backend upload failed, trying Supabase fallback...");
        uploadResult = await trySupabaseUpload(file);
      }
      
      // Check if any upload method succeeded
      if (uploadResult.success && uploadResult.url) {
        setProgress(100);
        onUploadComplete(uploadResult.url, file.name);
        
        toast({
          title: "Upload complete",
          description: `Track ${trackNumber} uploaded successfully.`,
        });
      } else {
        throw new Error("All upload methods failed");
      }
      
    } catch (error: any) {
      console.error(`Upload failed:`, error);
      
      const errorMessage = error.message || "Upload failed. Please try again.";
      setUploadError(errorMessage);
      
      toast({
        title: "Upload failed",
        description: "Could not upload file. Check console for details.",
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
    setUploadError(null);
  };

  return {
    file,
    uploading,
    progress,
    bucketStatus,
    bucketCheckInProgress,
    uploadError,
    onDrop,
    uploadFile,
    removeFile,
  };
};
