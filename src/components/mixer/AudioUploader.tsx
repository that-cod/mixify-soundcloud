
import React from 'react';
import { useAudioUpload } from './uploader/useAudioUpload';
import { BucketCheckLoader } from './uploader/BucketCheckLoader';
import { BucketStatusAlert } from './uploader/BucketStatusAlert';
import { DropZone } from './uploader/DropZone';
import { FilePreview } from './uploader/FilePreview';
import { AUDIO_BUCKET } from '@/services/storage-service';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

interface AudioUploaderProps {
  trackNumber: 1 | 2;
  onUploadComplete: (url: string, fileName: string) => void;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ trackNumber, onUploadComplete }) => {
  const { user } = useAuth();
  
  const {
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
  } = useAudioUpload({ trackNumber, onUploadComplete });

  return (
    <div className="space-y-4 w-full">
      {/* Network status warning */}
      {networkStatus === 'offline' && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            You appear to be offline. Please check your internet connection.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Bucket check loader - Only show to admin users or in development */}
      {import.meta.env.DEV && (
        <BucketCheckLoader isLoading={bucketCheckInProgress} />
      )}
      
      {/* Bucket status alerts - Only show to admin users or in development */}
      {import.meta.env.DEV && !bucketCheckInProgress && bucketStatus && (
        <BucketStatusAlert 
          bucketStatus={bucketStatus}
          bucketName={AUDIO_BUCKET}
        />
      )}
      
      {/* File upload area */}
      {!file ? (
        <DropZone 
          onDrop={onDrop}
          acceptedFileTypes={{
            'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
          }}
        />
      ) : (
        <FilePreview
          file={file}
          uploading={uploading}
          progress={progress}
          onRemove={removeFile}
          onUpload={uploadFile}
          trackNumber={trackNumber}
          uploadError={uploadError}
          networkStatus={networkStatus}
        />
      )}
    </div>
  );
};
