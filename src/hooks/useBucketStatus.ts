
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AUDIO_BUCKET, checkBucketStatus, BucketStatus } from '@/services/storage-service';
import { useAuth } from '@/contexts/AuthContext';

export const useBucketStatus = () => {
  const [bucketStatus, setBucketStatus] = useState<BucketStatus | null>(null);
  const [storageBucketChecking, setStorageBucketChecking] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    const verifyStorage = async () => {
      try {
        console.log("Verifying storage bucket status...");
        setStorageBucketChecking(true);
        const status = await checkBucketStatus();
        console.log("Bucket status check result:", status);
        
        // If we can successfully upload, consider the bucket functional
        // regardless of other checks
        if (status.canUpload) {
          console.log("Upload capability detected, setting bucket as functional");
          setBucketStatus({
            ...status,
            exists: true // Override exists flag if we can upload
          });
          return;
        }
        
        setBucketStatus(status);
        
        // Only show toast messages in development mode and when user is not logged in
        if (import.meta.env.DEV && !user) {
          if (!status.exists) {
            console.error(`Bucket "${AUDIO_BUCKET}" doesn't exist`);
            toast({
              title: "Storage Notice",
              description: `Bucket "${AUDIO_BUCKET}" not found. You can still try uploading.`,
              variant: "warning",
            });
          } else if (!status.canUpload) {
            console.error(`Cannot upload to bucket "${AUDIO_BUCKET}"`);
            toast({
              title: "Permission Notice",
              description: "Permission issues detected, but you can still try uploading.",
              variant: "warning",
            });
          } else if (!status.isPublic) {
            console.warn(`Bucket "${AUDIO_BUCKET}" is not public`);
            toast({
              title: "Storage Notice", 
              description: "The storage bucket is not set to public. Your files might not be accessible.",
              variant: "warning",
            });
          } else {
            console.log(`Bucket "${AUDIO_BUCKET}" is ready for use`);
          }
        }
      } catch (err: any) {
        console.error("Error verifying storage bucket:", err);
        setBucketStatus({
          exists: false,
          canUpload: false,
          isPublic: false,
          errorMessage: err.message || 'Unknown error checking storage bucket'
        });
        
        // Only show toast in development mode and when user is not logged in
        if (import.meta.env.DEV && !user) {
          toast({
            title: "Storage Notice",
            description: "Could not verify storage bucket. You can still try uploading.",
            variant: "warning",
          });
        }
      } finally {
        setStorageBucketChecking(false);
      }
    };
    
    verifyStorage();
  }, [toast, user]);

  return { bucketStatus, storageBucketChecking };
};
