
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { BucketStatus } from '@/services/storage-service';

interface BucketStatusAlertProps {
  bucketStatus: BucketStatus;
  bucketName: string;
}

export const BucketStatusAlert: React.FC<BucketStatusAlertProps> = ({ 
  bucketStatus, 
  bucketName 
}) => {
  // Only render if there's an issue with the bucket
  if (!bucketStatus || (bucketStatus.exists && bucketStatus.canUpload)) {
    return null;
  }

  // Handle bucket doesn't exist case
  if (!bucketStatus.exists) {
    return (
      <div className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-400">
              {bucketStatus.errorMessage || `Storage bucket "${bucketName}" not found. You can still try uploading.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle cannot upload case
  if (bucketStatus.exists && !bucketStatus.canUpload) {
    return (
      <div className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-400">
              {bucketStatus.errorMessage || `Permission issues detected, but you can still try uploading.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
