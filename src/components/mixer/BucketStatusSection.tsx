
import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BucketStatus, AUDIO_BUCKET } from '@/services/storage-service';
import { useAuth } from '@/contexts/AuthContext';

interface BucketStatusSectionProps {
  bucketStatus: BucketStatus | null;
  storageBucketChecking: boolean;
}

export const BucketStatusSection: React.FC<BucketStatusSectionProps> = ({
  bucketStatus,
  storageBucketChecking,
}) => {
  const { user } = useAuth();

  // Hide all bucket status messages if user is logged in or not in development mode
  if (!import.meta.env.DEV || user) {
    return null;
  }

  // When checking bucket status, show loading indicator only in development mode
  if (storageBucketChecking) {
    return (
      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
        <div className="flex items-center">
          <Loader2 className="h-5 w-5 text-mixify-purple animate-spin mr-2" />
          <p className="text-sm text-white/70">Verifying storage access...</p>
        </div>
      </div>
    );
  }
  
  // Check for critical conditions: if bucket status is null or canUpload is true, don't show warnings
  if (!bucketStatus || bucketStatus.canUpload) {
    return null;
  }

  // At this point, we only show warnings if there are actual problems
  if (bucketStatus && !bucketStatus.exists) {
    return (
      <div className="mb-6 p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
          <div>
            <h3 className="text-md text-yellow-400 font-medium">Storage Notice</h3>
            <p className="text-sm text-yellow-300/80">
              {bucketStatus.errorMessage || `The storage bucket "${AUDIO_BUCKET}" was not found. You can still try uploading.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (bucketStatus && bucketStatus.exists && !bucketStatus.canUpload) {
    return (
      <div className="mb-6 p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
          <div>
            <h3 className="text-md text-yellow-400 font-medium">Permission Notice</h3>
            <p className="text-sm text-yellow-300/80">
              {bucketStatus.errorMessage || `Permission issues detected. You can still try uploading.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
