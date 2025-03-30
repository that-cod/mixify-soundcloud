
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
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const { toast } = useToast();

  // Check network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };

    // Initialize status
    updateNetworkStatus();

    // Add event listeners
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Check if API server is reachable
    const checkApiServer = async () => {
      try {
        // Use a HEAD request to minimize data transfer
        await axios.head(`${API.baseUrl}/api/status`, { timeout: 5000 });
      } catch (error) {
        console.warn('API server might be unreachable:', error);
      }
    };

    if (navigator.onLine) {
      checkApiServer();
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

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
    
    if (networkStatus !== 'offline') {
      verifyBucketAccess();
    } else {
      setBucketCheckInProgress(false);
    }
  }, [toast, trackNumber, networkStatus]);

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
  const trySupabaseUpload = async (file: File): Promise<{success: boolean, url?: string, error?: string}> => {
    if (!(bucketStatus?.exists && bucketStatus?.canUpload)) {
      return { success: false, error: "Supabase storage not available" };
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
      return { success: false, error: error.message || "Supabase upload failed" };
    }
  };

  // Try backend API upload method
  const tryBackendUpload = async (file: File): Promise<{success: boolean, url?: string, error?: string}> => {
    if (networkStatus === 'offline') {
      return { success: false, error: "You are currently offline" };
    }
    
    try {
      console.log("Attempting backend API upload...");
      const formData = new FormData();
      formData.append('track', file);
      
      // Add a longer timeout for large files
      const timeoutMs = Math.max(30000, file.size / 10000); // At least 30 seconds
      
      const response = await axios.post(API.endpoints.upload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: timeoutMs,
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
      // Handle different axios error types
      let errorMsg = "Backend upload failed";
      
      if (error.code === 'ECONNABORTED') {
        errorMsg = "Upload timeout - server took too long to respond";
      } else if (error.code === 'ERR_NETWORK') {
        errorMsg = "Network error - please check your connection and try again";
      } else if (error.response) {
        // The server responded with a status code outside of 2xx range
        errorMsg = error?.response?.data?.error || 
                   error?.response?.data?.details || 
                   `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMsg = "No response from server - please try again later";
      } else {
        // Something happened in setting up the request
        errorMsg = error.message || "Unknown upload error";
      }
      
      return { success: false, error: errorMsg };
    }
  };

  // Handle mock upload for testing (only when all else fails)
  const mockUpload = async (file: File): Promise<{success: boolean, url?: string}> => {
    // Only use in development environment
    if (import.meta.env.DEV) {
      return new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            const mockUrl = `/mocks/track-${trackNumber}/${encodeURIComponent(file.name)}`;
            resolve({ success: true, url: mockUrl });
          }
        }, 300);
      });
    }
    return { success: false };
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
      
      // First try backend upload (default method)
      const backendResult = await tryBackendUpload(file);
      
      // If backend upload succeeds, use that result
      if (backendResult.success && backendResult.url) {
        setProgress(100);
        onUploadComplete(backendResult.url, file.name);
        
        toast({
          title: "Upload complete",
          description: `Track ${trackNumber} uploaded successfully.`,
        });
        return;
      }
      
      // If backend upload fails, try Supabase as fallback
      console.log("Backend upload failed, trying Supabase fallback...");
      const supabaseResult = await trySupabaseUpload(file);
      
      // If Supabase upload succeeds, use that result
      if (supabaseResult.success && supabaseResult.url) {
        setProgress(100);
        onUploadComplete(supabaseResult.url, file.name);
        
        toast({
          title: "Upload complete",
          description: `Track ${trackNumber} uploaded successfully (via storage fallback).`,
        });
        return;
      }
      
      // If both real methods fail, try mock in development
      if (import.meta.env.DEV) {
        console.log("All real upload methods failed, using mock for development...");
        const mockResult = await mockUpload(file);
        
        if (mockResult.success && mockResult.url) {
          setProgress(100);
          onUploadComplete(mockResult.url, file.name);
          
          toast({
            title: "Mock Upload",
            description: `Track ${trackNumber} mock-uploaded for development.`,
            variant: "warning",
          });
          return;
        }
      }
      
      // If all methods fail, throw an error with details
      const errorDetails = [
        backendResult.error && `Backend: ${backendResult.error}`,
        supabaseResult.error && `Storage: ${supabaseResult.error}`
      ].filter(Boolean).join('. ');
      
      throw new Error(`All upload methods failed. ${errorDetails}`);
      
    } catch (error: any) {
      console.error(`Upload failed:`, error);
      
      const errorMessage = error.message || "Upload failed. Please try again.";
      setUploadError(errorMessage);
      
      toast({
        title: "Upload failed",
        description: "Could not upload file. Please try again later.",
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
    networkStatus,
    onDrop,
    uploadFile,
    removeFile,
  };
};
